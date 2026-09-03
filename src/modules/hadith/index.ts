import { Elysia, t } from 'elysia';
import { getDatabase } from '../../database';
import { table } from '../../database/schema';
import { and, eq, asc, sql, ilike, or, inArray, type SQL } from 'drizzle-orm';

const database = getDatabase();

export const hadithRoutes = new Elysia({ prefix: '/hadith' })
  .get(
    '/books',
    async () => {
      const books = await database
        .select()
        .from(table.hadithBook)
        .orderBy(asc(table.hadithBook.id));

      const hadithCounts = await database
        .select({
          bookId: table.hadith.bookId,
          count: sql<number>`count(${table.hadith.id})::int`,
        })
        .from(table.hadith)
        .groupBy(table.hadith.bookId);

      const countMap = new Map(hadithCounts.map((c) => [c.bookId, c.count]));

      return books.map((b) => ({
        ...b,
        availableHadiths: countMap.get(b.id) || 0,
      }));
    },
    {
      response: t.Any(),
    }
  )
  .get(
    '/random',
    async ({ query, set }) => {
      const conditions: SQL[] = [];
      if (query.book) {
        conditions.push(eq(table.hadithBook.slug, query.book.toLowerCase()));
      }

      const queryBuilder = database
        .select({
          id: table.hadith.id,
          bookSlug: table.hadithBook.slug,
          bookName: table.hadithBook.name,
          number: table.hadith.number,
          kitabNo: table.hadith.kitabNo,
          kitabName: table.hadith.kitabName,
          babNo: table.hadith.babNo,
          babName: table.hadith.babName,
          grade: table.hadith.grade,
          arabic: table.hadith.arabic,
          latin: table.hadith.latin,
          translation: table.hadith.translation,
        })
        .from(table.hadith)
        .innerJoin(
          table.hadithBook,
          eq(table.hadith.bookId, table.hadithBook.id)
        );

      const result = conditions.length > 0
        ? await queryBuilder.where(and(...conditions)).orderBy(sql`RANDOM()`).limit(1)
        : await queryBuilder.orderBy(sql`RANDOM()`).limit(1);

      if (result.length === 0) {
        set.status = 404;
        return { error: 'No hadiths found' };
      }

      return result[0];
    },
    {
      query: t.Object({
        book: t.Optional(t.String()),
      }),
      response: t.Any(),
    }
  )
  .get(
    '/search',
    async ({ query, set }) => {
      const trimmedQuery = query.q.trim();
      if (trimmedQuery.length === 0) {
        set.status = 400;
        return { error: 'Search query cannot be empty or only whitespace' };
      }

      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const offset = (page - 1) * limit;

      const searchTerm = `%${trimmedQuery}%`;
      const conditions: SQL[] = [];

      const searchFilter = or(
        ilike(table.hadith.translation, searchTerm),
        ilike(table.hadith.arabic, searchTerm)
      );
      if (searchFilter) {
        conditions.push(searchFilter);
      }

      if (query.book) {
        const bookSlugs = query.book
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        if (bookSlugs.length > 0) {
          conditions.push(inArray(table.hadithBook.slug, bookSlugs));
        }
      }

      const where = conditions.length > 1 ? and(...conditions) : conditions[0];

      const [totalResult, hadiths] = await Promise.all([
        database
          .select({ count: sql<number>`count(*)::int` })
          .from(table.hadith)
          .innerJoin(
            table.hadithBook,
            eq(table.hadith.bookId, table.hadithBook.id)
          )
          .where(where),
        database
          .select({
            id: table.hadith.id,
            bookId: table.hadith.bookId,
            bookSlug: table.hadithBook.slug,
            bookName: table.hadithBook.name,
            number: table.hadith.number,
            kitabNo: table.hadith.kitabNo,
            kitabName: table.hadith.kitabName,
            babNo: table.hadith.babNo,
            babName: table.hadith.babName,
            grade: table.hadith.grade,
            arabic: table.hadith.arabic,
            latin: table.hadith.latin,
            translation: table.hadith.translation,
          })
          .from(table.hadith)
          .innerJoin(
            table.hadithBook,
            eq(table.hadith.bookId, table.hadithBook.id)
          )
          .where(where)
          .orderBy(asc(table.hadith.bookId), asc(table.hadith.number))
          .limit(limit)
          .offset(offset),
      ]);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        query: trimmedQuery,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        results: hadiths,
      };
    },
    {
      query: t.Object({
        q: t.String({ minLength: 1, maxLength: 200 }),
        book: t.Optional(t.String()),
        page: t.Optional(t.Number({ minimum: 1, default: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
      }),
      response: t.Any(),
    }
  )
  .get(
    '/:bookSlug',
    async ({ params, query, set }) => {
      const book = await database
        .select()
        .from(table.hadithBook)
        .where(eq(table.hadithBook.slug, params.bookSlug.toLowerCase()))
        .limit(1);

      if (book.length === 0) {
        set.status = 404;
        return {
          error: `Hadith book '${params.bookSlug}' not found`,
        };
      }

      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const offset = (page - 1) * limit;

      const conditions: SQL[] = [eq(table.hadith.bookId, book[0].id)];
      if (query.kitab) {
        conditions.push(eq(table.hadith.kitabNo, query.kitab));
      }
      if (query.search) {
        const trimmed = query.search.trim();
        if (trimmed.length > 0) {
          const searchTerm = `%${trimmed}%`;
          const searchFilter = or(
            ilike(table.hadith.translation, searchTerm),
            ilike(table.hadith.arabic, searchTerm)
          );
          if (searchFilter) {
            conditions.push(searchFilter);
          }
        }
      }

      const where = conditions.length > 1 ? and(...conditions) : conditions[0];

      const [totalResult, hadiths] = await Promise.all([
        database
          .select({ count: sql<number>`count(*)::int` })
          .from(table.hadith)
          .where(where),
        database
          .select()
          .from(table.hadith)
          .where(where)
          .orderBy(asc(table.hadith.number))
          .limit(limit)
          .offset(offset),
      ]);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        book: book[0],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        hadiths,
      };
    },
    {
      params: t.Object({
        bookSlug: t.String({ minLength: 1 }),
      }),
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1, default: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
        kitab: t.Optional(t.Number({ minimum: 1 })),
        search: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
      }),
      response: t.Any(),
    }
  )
  .get(
    '/:bookSlug/:number',
    async ({ params, set }) => {
      const book = await database
        .select()
        .from(table.hadithBook)
        .where(eq(table.hadithBook.slug, params.bookSlug.toLowerCase()))
        .limit(1);

      if (book.length === 0) {
        set.status = 404;
        return {
          error: `Hadith book '${params.bookSlug}' not found`,
        };
      }

      const hadiths = await database
        .select()
        .from(table.hadith)
        .where(
          and(
            eq(table.hadith.bookId, book[0].id),
            eq(table.hadith.number, params.number)
          )
        )
        .limit(1);

      if (hadiths.length === 0) {
        set.status = 404;
        return {
          error: `Hadith #${params.number} not found in ${book[0].name}`,
        };
      }

      return {
        book: book[0],
        hadith: hadiths[0],
      };
    },
    {
      params: t.Object({
        bookSlug: t.String({ minLength: 1 }),
        number: t.Number({ minimum: 1 }),
      }),
      response: t.Any(),
    }
  );
