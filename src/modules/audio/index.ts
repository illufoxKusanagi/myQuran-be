import { Elysia, t } from 'elysia';
import { getDatabase } from '../../database';
import { table } from '../../database/schema';
import { db } from '../../database/model';
import { eq, asc } from 'drizzle-orm';

const database = getDatabase();

export const audioRoutes = new Elysia()
  .get(
    '/reciter',
    async () => {
      return await database.select().from(table.reciter).orderBy(asc(table.reciter.id));
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

      const reciterId = query.reciterId ?? 3;
      const reciterResult = await database
        .select({ subfolder: table.reciter.subfolder })
        .from(table.reciter)
        .where(eq(table.reciter.id, reciterId));

      if (reciterResult.length === 0) {
        set.status = 404;
        return { error: `Reciter with ID ${reciterId} not found` };
      }

      const subfolder = reciterResult[0].subfolder;
      const surahNumPadded = String(params.surahId).padStart(3, '0');

      const urls = Array.from({ length: surahResult[0].numAyah }, (_, i) => {
        const ayahNumPadded = String(i + 1).padStart(3, '0');
        return `https://everyayah.com/data/${subfolder}/${surahNumPadded}${ayahNumPadded}.mp3`;
      });

      return {
        surahId: params.surahId,
        reciterId,
        totalAyahs: surahResult[0].numAyah,
        audioUrls: urls,
      };
    },
    {
      params: t.Object({
        surahId: t.Number({ minimum: 1, maximum: 114 }),
      }),
      query: t.Object({
        reciterId: t.Optional(t.Number({ minimum: 1 })),
      }),
      response: t.Any(),
    }
  )
  .get(
    '/audio/surah/:surahId/:ayahNumber',
    async ({ params, query, set }) => {
      const reciterId = query.reciterId ?? 3;
      const reciterResult = await database
        .select({ subfolder: table.reciter.subfolder })
        .from(table.reciter)
        .where(eq(table.reciter.id, reciterId));

      if (reciterResult.length === 0) {
        set.status = 404;
        return { error: `Reciter with ID ${reciterId} not found` };
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

      const subfolder = reciterResult[0].subfolder;
      const surahNumPadded = String(params.surahId).padStart(3, '0');
      const ayahNumPadded = String(params.ayahNumber).padStart(3, '0');

      return {
        surahId: params.surahId,
        ayahNumber: params.ayahNumber,
        reciterId,
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
      response: t.Any(),
    }
  );
