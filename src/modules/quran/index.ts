import { Elysia, t } from 'elysia';
import { getDatabase } from '../../database';
import { table } from '../../database/schema';
import { db } from '../../database/model';
import { and, eq, asc, sql, ilike, or, gte, lte, type SQL } from 'drizzle-orm';

const database = getDatabase();

export const quranRoutes = new Elysia()
  .get(
    '/surah',
    async () => {
      return await database.select().from(table.surah).orderBy(asc(table.surah.id));
    },
    { response: t.Array(db.select.surah) }
  )
  .get(
    '/surah/:id',
    async ({ params, set }) => {
      const result = await database
        .select()
        .from(table.surah)
        .where(eq(table.surah.id, params.id));

      if (result.length === 0) {
        set.status = 404;
        return { error: `Surah with ID ${params.id} not found` };
      }

      return result[0];
    },
    {
      params: t.Object({
        id: t.Number({ minimum: 1, maximum: 114 }),
      }),
      response: {
        200: db.select.surah,
        404: t.Object({ error: t.String() }),
      },
    }
  )
  .get(
    '/ayah/search',
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

      const searchFilter = or(
        ilike(table.ayah.translation, searchTerm),
        ilike(table.ayah.latin, searchTerm),
        ilike(table.ayah.arabic, searchTerm)
      );

      const conditions: SQL[] = [];
      if (searchFilter) {
        conditions.push(searchFilter);
      }

      if (query.surah) {
        conditions.push(eq(table.ayah.surahId, query.surah));
      }

      const where = conditions.length > 1 ? and(...conditions) : conditions[0];

      const [totalResult, rawAyahs] = await Promise.all([
        database
          .select({ count: sql<number>`count(*)::int` })
          .from(table.ayah)
          .where(where),
        database
          .select({
            id: table.ayah.id,
            surahId: table.ayah.surahId,
            surahName: table.surah.surahName,
            surahLatin: table.surah.latin,
            surahArabic: table.surah.arabic,
            ayahNumber: table.ayah.ayahNumber,
            page: table.ayah.page,
            juz: table.ayah.juz,
            arabic: table.ayah.arabic,
            latin: table.ayah.latin,
            translation: table.ayah.translation,
            footnote: table.ayah.footnote,
            wajizTafsir: table.ayah.wajizTafsir,
            tahliliTafsir: table.ayah.tahliliTafsir,
          })
          .from(table.ayah)
          .innerJoin(table.surah, eq(table.ayah.surahId, table.surah.id))
          .where(where)
          .orderBy(asc(table.ayah.surahId), asc(table.ayah.ayahNumber))
          .limit(limit)
          .offset(offset),
      ]);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      const results = query.withTafsir
        ? rawAyahs
        : rawAyahs.map(({ wajizTafsir, tahliliTafsir, ...rest }) => rest);

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
        results,
      };
    },
    {
      query: t.Object({
        q: t.String({ minLength: 1, maxLength: 200 }),
        surah: t.Optional(t.Number({ minimum: 1, maximum: 114 })),
        page: t.Optional(t.Number({ minimum: 1, default: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
        withTafsir: t.Optional(t.Boolean({ default: false })),
      }),
      response: t.Any(),
    }
  )
  .get(
    '/ayah/:surahId',
    async ({ params, query, set }) => {
      const surahExists = await database
        .select({ id: table.surah.id, numAyah: table.surah.numAyah })
        .from(table.surah)
        .where(eq(table.surah.id, params.surahId))
        .limit(1);

      if (surahExists.length === 0) {
        set.status = 404;
        return { error: `Surah with ID ${params.surahId} not found` };
      }

      const totalAyahs = surahExists[0].numAyah;
      const conditions: SQL[] = [eq(table.ayah.surahId, params.surahId)];

      // Range filtering (?from=1&to=20)
      if (query.from) {
        conditions.push(gte(table.ayah.ayahNumber, query.from));
      }
      if (query.to) {
        conditions.push(lte(table.ayah.ayahNumber, query.to));
      }

      const where = conditions.length > 1 ? and(...conditions) : conditions[0];

      // Calculate exact total considering from/to range filters
      let filteredTotal = totalAyahs;
      if (query.from || query.to) {
        const [countResult] = await database
          .select({ count: sql<number>`count(*)::int` })
          .from(table.ayah)
          .where(where);
        filteredTotal = countResult?.count ?? 0;
      }

      let queryExec = database
        .select()
        .from(table.ayah)
        .where(where)
        .orderBy(asc(table.ayah.ayahNumber));

      const withTafsir = query.withTafsir ?? true;

      // Pagination support (?page=1&limit=20)
      if (query.limit) {
        const page = query.page ?? 1;
        const limit = query.limit;
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(filteredTotal / limit);

        set.headers['X-Total-Count'] = String(filteredTotal);
        set.headers['X-Total-Pages'] = String(totalPages);
        set.headers['X-Current-Page'] = String(page);
        set.headers['X-Per-Page'] = String(limit);

        const paginatedQuery = queryExec.limit(limit).offset(offset);
        const rawResults = await paginatedQuery;

        const ayahs = withTafsir
          ? rawResults
          : rawResults.map(({ wajizTafsir, tahliliTafsir, ...rest }) => rest);

        if (query.paginate) {
          return {
            surahId: params.surahId,
            pagination: {
              page,
              limit,
              total: filteredTotal,
              totalPages,
              hasNext: page < totalPages && filteredTotal > 0,
              hasPrev: page > 1,
            },
            ayahs,
          };
        }

        return ayahs;
      }

      const rawResults = await queryExec;
      const ayahs = withTafsir
        ? rawResults
        : rawResults.map(({ wajizTafsir, tahliliTafsir, ...rest }) => rest);

      return ayahs;
    },
    {
      params: t.Object({
        surahId: t.Number({ minimum: 1, maximum: 114 }),
      }),
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1, default: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        from: t.Optional(t.Number({ minimum: 1 })),
        to: t.Optional(t.Number({ minimum: 1 })),
        withTafsir: t.Optional(t.Boolean({ default: true })),
        paginate: t.Optional(t.Boolean({ default: false })),
      }),
      response: t.Any(),
    }
  )
  .get(
    '/ayah/:surahId/:ayahNumber/tafsir',
    async ({ params, set }) => {
      const result = await database
        .select({
          ayahNumber: table.ayah.ayahNumber,
          wajizTafsir: table.ayah.wajizTafsir,
          tahliliTafsir: table.ayah.tahliliTafsir,
        })
        .from(table.ayah)
        .where(
          and(
            eq(table.ayah.surahId, params.surahId),
            eq(table.ayah.ayahNumber, params.ayahNumber)
          )
        );

      if (result.length === 0) {
        set.status = 404;
        return {
          error: `Ayah #${params.ayahNumber} in Surah #${params.surahId} not found`,
        };
      }

      return {
        ayahNumber: result[0].ayahNumber,
        wajizTafsir: result[0].wajizTafsir ?? '',
        tahliliTafsir: result[0].tahliliTafsir ?? '',
      };
    },
    {
      params: t.Object({
        surahId: t.Number({ minimum: 1, maximum: 114 }),
        ayahNumber: t.Number({ minimum: 1 }),
      }),
      response: {
        200: t.Object({
          ayahNumber: t.Number(),
          tahliliTafsir: t.String(),
          wajizTafsir: t.String(),
        }),
        404: t.Object({ error: t.String() }),
      },
    }
  );
