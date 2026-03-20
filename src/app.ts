import { table } from "./database/schema";
import { Elysia, t } from "elysia";
import { getDatabase } from "./database";
import { db } from "./database/model";
import { and, eq, asc } from "drizzle-orm";
import { cors } from "@elysiajs/cors";

// Timeout helper for serverless functions (25s limit for Vercel)
const withTimeout = async <T>(
  promise: Promise<T>,
  ms: number = 25000,
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Database query timeout")), ms),
  );
  return Promise.race([promise, timeout]);
};

const database = getDatabase();

export const app = new Elysia()
  .use(cors())
  .get("/", () => {
    return {
      message: "Quran API is running",
      endpoints: ["/surah", "/surah/:id", "/ayah/:surahId"],
    };
  })
  .get("/favicon.ico", () => new Response(null, { status: 204 }))
  .get(
    "/surah",
    async () => {
      try {
        return await withTimeout(database.select().from(table.surah));
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Database error",
        };
      }
    },
    { response: t.Any() },
  )
  .get(
    "/surah/:id",
    async ({ params }) => {
      try {
        const result = await withTimeout(
          database
            .select()
            .from(table.surah)
            .where(eq(table.surah.id, params.id)),
        );
        return result[0];
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Database error",
        };
      }
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      response: t.Any(),
    },
  )
  .get(
    "/ayah/:surahId",
    async ({ params }) => {
      try {
        return await withTimeout(
          database
            .select()
            .from(table.ayah)
            .where(eq(table.ayah.surahId, params.surahId))
            .orderBy(asc(table.ayah.ayahNumber)),
        );
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Database error",
        };
      }
    },
    {
      params: t.Object({ surahId: t.Number() }),
      response: t.Any(),
    },
  )
  .get(
    "/ayah/:surahId/:ayahNumber/tafsir",
    async ({ params }) => {
      try {
        const result = await withTimeout(
          database
            .select({
              ayahNumber: table.ayah.ayahNumber,
              wajizTafsir: table.ayah.wajizTafsir,
              tahliliTafsir: table.ayah.tahliliTafsir,
            })
            .from(table.ayah)
            .where(
              and(
                eq(table.ayah.surahId, params.surahId),
                eq(table.ayah.ayahNumber, params.ayahNumber),
              ),
            ),
        );
        return result[0];
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Database error",
        };
      }
    },
    {
      params: t.Object({
        surahId: t.Number(),
        ayahNumber: t.Number(),
      }),
      response: t.Any(),
    },
  )
  .get(
    "/reciter",
    async () => {
      try {
        return await withTimeout(database.select().from(table.reciter));
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Database error",
        };
      }
    },
    {
      response: t.Any(),
    },
  )
  .get(
    "/reciter/:id",
    async ({ params }) => {
      try {
        const result = await withTimeout(
          database
            .select()
            .from(table.reciter)
            .where(eq(table.reciter.id, params.id)),
        );
        return result[0];
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Database error",
        };
      }
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      response: t.Any(),
    },
  )
  .get(
    "/audio/surah/:surahId",
    async ({ params, query }) => {
      try {
        const surahResult = await withTimeout(
          database
            .select({ numAyah: table.surah.numAyah })
            .from(table.surah)
            .where(eq(table.surah.id, params.surahId)),
        );

        if (surahResult.length === 0) return { error: "Surah not found" };

        const reciterId = query.reciterId ? parseInt(query.reciterId) : 3;
        const reciterResult = await withTimeout(
          database
            .select({ subfolder: table.reciter.subfolder })
            .from(table.reciter)
            .where(eq(table.reciter.id, reciterId)),
        );

        if (reciterResult.length === 0) return { error: "Reciter not found" };

        const subfolder = reciterResult[0].subfolder;
        const surahNumPadded = String(params.surahId).padStart(3, "0");

        const urls = Array.from({ length: surahResult[0].numAyah }, (_, i) => {
          const ayahNumPadded = String(i + 1).padStart(3, "0");
          return `https://everyayah.com/data/${subfolder}/${surahNumPadded}${ayahNumPadded}.mp3`;
        });

        return {
          surahId: params.surahId,
          reciterId,
          audioUrls: urls,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Database error",
        };
      }
    },
    {
      params: t.Object({
        surahId: t.Number(),
      }),
      query: t.Object({
        reciterId: t.Optional(t.String()),
      }),
      response: t.Any(),
    },
  )
  .get(
    "/audio/surah/:surahId/:ayahNumber",
    async ({ params, query }) => {
      try {
        const reciterId = query.reciterId ? parseInt(query.reciterId) : 3;
        const reciterResult = await withTimeout(
          database
            .select({ subfolder: table.reciter.subfolder })
            .from(table.reciter)
            .where(eq(table.reciter.id, reciterId)),
        );

        if (reciterResult.length === 0) return { error: "Reciter not found" };

        const subfolder = reciterResult[0].subfolder;
        const surahNumPadded = String(params.surahId).padStart(3, "0");
        const ayahNumPadded = String(params.ayahNumber).padStart(3, "0");

        return {
          surahId: params.surahId,
          ayahNumber: params.ayahNumber,
          reciterId,
          audioUrl: `https://everyayah.com/data/${subfolder}/${surahNumPadded}${ayahNumPadded}.mp3`,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Database error",
        };
      }
    },
    {
      params: t.Object({
        surahId: t.Number(),
        ayahNumber: t.Number(),
      }),
      query: t.Object({
        reciterId: t.Optional(t.String()),
      }),
      response: t.Any(),
    },
  );

export default app;
