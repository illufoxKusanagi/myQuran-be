import { Elysia, t } from 'elysia';
import { getDatabase } from '../../database';
import { table } from '../../database/schema';
import { db } from '../../database/model';
import { eq, ilike, asc } from 'drizzle-orm';

const database = getDatabase();

async function resolveReciter(reciterId?: number) {
  if (reciterId) {
    const result = await database
      .select({ id: table.reciter.id, subfolder: table.reciter.subfolder })
      .from(table.reciter)
      .where(eq(table.reciter.id, reciterId))
      .limit(1);
    return result[0] ?? null;
  }

  // Default to Alafasy, or fallback to the first available reciter
  const alafasy = await database
    .select({ id: table.reciter.id, subfolder: table.reciter.subfolder })
    .from(table.reciter)
    .where(ilike(table.reciter.name, '%alafasy%'))
    .orderBy(asc(table.reciter.id))
    .limit(1);

  if (alafasy.length > 0) return alafasy[0];

  const first = await database
    .select({ id: table.reciter.id, subfolder: table.reciter.subfolder })
    .from(table.reciter)
    .orderBy(asc(table.reciter.id))
    .limit(1);

  return first[0] ?? null;
}

export const audioRoutes = new Elysia()
  .get(
    '/reciter',
    async () => {
      return database.select().from(table.reciter);
    },
    {
      response: t.Array(db.select.reciter),
    }
  )
  .get(
    '/reciter/:id',
    async ({ params, set }) => {
      const result = await database
        .select()
        .from(table.reciter)
        .where(eq(table.reciter.id, params.id));

      if (result.length === 0) {
        set.status = 404;
        return { error: `Reciter with ID ${params.id} not found` };
      }

      return result[0];
    },
    {
      params: t.Object({
        id: t.Number({ minimum: 1 }),
      }),
      response: {
        200: db.select.reciter,
        404: t.Object({ error: t.String() }),
      },
    }
  )
  .get(
    '/audio/surah/:surahId',
    async ({ params, query, set }) => {
      const surahResult = await database
        .select({ numAyah: table.surah.numAyah })
        .from(table.surah)
        .where(eq(table.surah.id, params.surahId));

      if (surahResult.length === 0) {
        set.status = 404;
        return { error: `Surah with ID ${params.surahId} not found` };
      }

      const reciter = await resolveReciter(query.reciterId);
      if (!reciter) {
        set.status = 404;
        return {
          error: query.reciterId
            ? `Reciter with ID ${query.reciterId} not found`
            : 'No reciters found in database',
        };
      }

      const startAyah = Math.max(1, query.from ?? 1);
      const endAyah = Math.min(
        surahResult[0].numAyah,
        query.to ?? surahResult[0].numAyah
      );

      if (startAyah > endAyah) {
        set.status = 400;
        return {
          error: `'from' (${startAyah}) cannot be greater than 'to' (${endAyah})`,
        };
      }

      const subfolder = reciter.subfolder;
      const surahNumPadded = String(params.surahId).padStart(3, '0');

      const urls = Array.from(
        { length: endAyah - startAyah + 1 },
        (_, i) => {
          const ayahNum = startAyah + i;
          const ayahNumPadded = String(ayahNum).padStart(3, '0');
          return `https://everyayah.com/data/${subfolder}/${surahNumPadded}${ayahNumPadded}.mp3`;
        }
      );

      return {
        surahId: params.surahId,
        reciterId: reciter.id,
        from: startAyah,
        to: endAyah,
        totalAyahs: urls.length,
        audioUrls: urls,
      };
    },
    {
      params: t.Object({
        surahId: t.Number({ minimum: 1, maximum: 114 }),
      }),
      query: t.Object({
        reciterId: t.Optional(t.Number({ minimum: 1 })),
        from: t.Optional(t.Number({ minimum: 1 })),
        to: t.Optional(t.Number({ minimum: 1 })),
      }),
    }
  )
  .get(
    '/audio/surah/:surahId/:ayahNumber',
    async ({ params, query, set }) => {
      const reciter = await resolveReciter(query.reciterId);
      if (!reciter) {
        set.status = 404;
        return {
          error: query.reciterId
            ? `Reciter with ID ${query.reciterId} not found`
            : 'No reciters found in database',
        };
      }

      const surahResult = await database
        .select({ numAyah: table.surah.numAyah })
        .from(table.surah)
        .where(eq(table.surah.id, params.surahId));

      if (surahResult.length === 0) {
        set.status = 404;
        return { error: `Surah with ID ${params.surahId} not found` };
      }

      if (params.ayahNumber < 1 || params.ayahNumber > surahResult[0].numAyah) {
        set.status = 400;
        return {
          error: `Ayah #${params.ayahNumber} does not exist in Surah #${params.surahId} (has ${surahResult[0].numAyah} ayahs)`,
        };
      }

      const subfolder = reciter.subfolder;
      const surahNumPadded = String(params.surahId).padStart(3, '0');
      const ayahNumPadded = String(params.ayahNumber).padStart(3, '0');

      return {
        surahId: params.surahId,
        ayahNumber: params.ayahNumber,
        reciterId: reciter.id,
        audioUrl: `https://everyayah.com/data/${subfolder}/${surahNumPadded}${ayahNumPadded}.mp3`,
      };
    },
    {
      params: t.Object({
        surahId: t.Number({ minimum: 1, maximum: 114 }),
        ayahNumber: t.Number({ minimum: 1 }),
      }),
      query: t.Object({
        reciterId: t.Optional(t.Number({ minimum: 1 })),
      }),
    }
  );
