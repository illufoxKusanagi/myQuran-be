import { table } from "./database/schema";
import { Elysia, t } from "elysia";
import { database } from "./database";
import { db } from "./database/model";
import { and, eq, asc } from "drizzle-orm";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())
  .get(
    "/surah",
    async () => {
      return await database.select().from(table.surah);
    },
    { response: t.Array(db.select.surah) },
  )
  .get(
    "/surah/:id",
    async ({ params }) => {
      const result = await database
        .select()
        .from(table.surah)
        .where(eq(table.surah.id, params.id));
      return result[0];
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      response: db.select.surah,
    },
  )
  .get(
    "/ayah/:surahId",
    async ({ params }) => {
      return await database
        .select()
        .from(table.ayah)
        .where(eq(table.ayah.surahId, params.surahId))
        .orderBy(asc(table.ayah.ayahNumber));
    },
    {
      params: t.Object({ surahId: t.Number() }),
      response: t.Array(db.select.ayah),
    },
  )
  .get(
    "/ayah/:surahId/:ayahNumber/tafsir",
    async ({ params }) => {
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
            eq(table.ayah.ayahNumber, params.ayahNumber),
          ),
        );
      return result[0];
    },
    {
      params: t.Object({
        surahId: t.Number(),
        ayahNumber: t.Number(),
      }),
      response: t.Object({
        ayahNumber: t.Number(),
        tahliliTafsir: t.String(),
        wajizTafsir: t.String(),
      }),
    },
  )
  .get(
    "/reciter",
    async () => {
      return await database.select().from(table.reciter);
    },
    {
      response: t.Array(db.select.reciter),
    },
  )
  .get(
    "/reciter/:id",
    async ({ params }) => {
      const result = await database
        .select()
        .from(table.reciter)
        .where(eq(table.reciter.id, params.id));
      return result[0];
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      response: db.select.reciter,
    },
  )
  // ─── Audio Routes (EveryAyah URL Generation) ───────
  .get(
    "/audio/surah/:surahId",
    async ({ params, query }) => {
      // Get surah to know total ayahs
      const surahResult = await database
        .select({ numAyah: table.surah.numAyah })
        .from(table.surah)
        .where(eq(table.surah.id, params.surahId));

      if (surahResult.length === 0) return { error: "Surah not found" };

      // Default to Alafasy if no reciter ID provided
      const reciterId = query.reciterId ? parseInt(query.reciterId) : 3;
      const reciterResult = await database
        .select({ subfolder: table.reciter.subfolder })
        .from(table.reciter)
        .where(eq(table.reciter.id, reciterId));

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
      // Default to Alafasy if no reciter ID provided
      const reciterId = query.reciterId ? parseInt(query.reciterId) : 3;
      const reciterResult = await database
        .select({ subfolder: table.reciter.subfolder })
        .from(table.reciter)
        .where(eq(table.reciter.id, reciterId));

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
  )
  .listen({
    hostname: "0.0.0.0",
    port: process.env.PORT || 3000,
  });

console.log(`📖 Quran API running at http://localhost:${app.server?.port}`);

export default app;
