import { drizzle } from "drizzle-orm/node-postgres";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import * as schema from "./database/schema";

/**
 * Seed script — reads scraped JSON from data/ and inserts into PostgreSQL.
 * Usage: bun run seed
 */

const DATA_DIR = join(import.meta.dir, "..", "data");

const db = drizzle(process.env.DATABASE_URL!, { schema });

// We will fetch reciters dynamically from EveryAyah

async function readJSON<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

interface RawSurah {
  id: number;
  arabic: string;
  latin: string;
  transliteration: string;
  translation: string;
  num_ayah: number;
  page: number;
  location: string;
}

interface RawAyah {
  id: number;
  surah_id: number;
  ayah: number;
  page: number;
  juz: number;
  arabic: string;
  latin: string;
  translation: string;
}

interface RawTafsir {
  id: number;
  surah_id: number;
  ayah: number;
  tafsir: {
    wajiz: string;
    tahlili: string;
  };
}

async function seed() {
  console.log("🌱 Starting seed...\n");

  // ─── 1. Seed Surahs ────────────────────────────────
  console.log("📖 Seeding surahs...");
  const surahs = await readJSON<RawSurah[]>(join(DATA_DIR, "surahs.json"));

  const surahValues = surahs.map((s) => ({
    surahName: s.latin.trim(),
    arabic: s.arabic.trim(),
    latin: s.latin.trim(),
    transliteration: s.transliteration,
    translation: s.translation,
    numAyah: s.num_ayah,
    page: s.page,
    location: s.location,
  }));

  // await db.delete(schema.surah);
  // console.log(`  ✅ All surah has been cleared \n`);
  await db.insert(schema.surah).values(surahValues);
  console.log(`  ✅ ${surahs.length} surahs inserted\n`);

  // ─── 2. Seed Ayahs + Tafsir ────────────────────────
  console.log("📝 Seeding ayahs + tafsir...");
  let totalAyahs = 0;
  // await db.delete(schema.ayah);
  // console.log(`  ✅ All ayah has been cleared \n`);
  for (const s of surahs) {
    const ayahFile = join(DATA_DIR, "ayahs", `${s.id}.json`);
    const tafsirFile = join(DATA_DIR, "tafsir", `${s.id}.json`);

    const ayahs = await readJSON<RawAyah[]>(ayahFile);
    const tafsirs = await readJSON<RawTafsir[]>(tafsirFile);

    // Build tafsir lookup by ayah number
    const tafsirMap = new Map<number, RawTafsir>();
    for (const t of tafsirs) {
      tafsirMap.set(t.ayah, t);
    }

    const ayahValues = ayahs.map((a) => {
      const t = tafsirMap.get(a.ayah);
      return {
        surahId: s.id,
        ayahNumber: a.ayah,
        page: a.page,
        juz: a.juz,
        arabic: a.arabic,
        latin: a.latin || "",
        translation: a.translation || "",
        wajizTafsir: t?.tafsir?.wajiz || "",
        tahliliTafsir: t?.tafsir?.tahlili || "",
      };
    });

    // Insert in batches to avoid memory issues for large surahs
    const BATCH_SIZE = 50;
    for (let i = 0; i < ayahValues.length; i += BATCH_SIZE) {
      const batch = ayahValues.slice(i, i + BATCH_SIZE);
      await db.insert(schema.ayah).values(batch);
    }

    totalAyahs += ayahs.length;
    process.stdout.write(
      `  [${s.id}/114] ${s.latin.trim()} — ${ayahs.length} ayahs\n`,
    );
  }
  console.log(`\n  ✅ ${totalAyahs} ayahs inserted\n`);

  // ─── 3. Seed Reciters ──────────────────────────────
  console.log("🎙️  Seeding reciters...");

  // Fetch from EveryAyah config
  const res = await fetch("https://everyayah.com/data/recitations.js");
  const rawText = await res.text();

  let recitationsObj;
  try {
    // The response is a string literal containing JS object format, not strict JSON.
    // It looks like: { "ayahCount": [...], "1": { "subfolder": "..." }, ... }
    recitationsObj = JSON.parse(rawText);
  } catch (err) {
    console.error("Failed to parse EveryAyah recitations.js as JSON", err);
  }

  const recitersToInsert = [];

  if (recitationsObj) {
    for (const key in recitationsObj) {
      if (key === "ayahCount") continue; // Skip metadata array

      const reciter = recitationsObj[key];
      const bitrate = reciter.bitrate || "";

      // Filter for at least 128kbps
      // Includes 128kbps, 192kbps, etc.
      const bitrateNum = parseInt(bitrate.replace(/[^0-9]/g, "")) || 0;

      if (bitrateNum >= 128) {
        let style = "murattal";
        if (
          reciter.name.toLowerCase().includes("mujawwad") ||
          reciter.subfolder.toLowerCase().includes("mujawwad")
        ) {
          style = "mujawwad";
        }
        if (
          reciter.name.toLowerCase().includes("warsh") ||
          reciter.subfolder.toLowerCase().includes("warsh")
        ) {
          style = "warsh";
        }

        recitersToInsert.push({
          name: reciter.name,
          subfolder: reciter.subfolder,
          bitrate: bitrate,
          style: style,
        });
      }
    }
  }
  if (recitersToInsert.length > 0) {
    // Clean up existing reciters to avoid duplication during re-seed
    // await db.delete(schema.reciter);
    await db.insert(schema.reciter).values(recitersToInsert);
    console.log(
      `  ✅ ${recitersToInsert.length} reciters inserted (≥ 128kbps)`,
    );
  } else {
    console.log("  ⚠️  No reciters found matching criteria");
  }

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
