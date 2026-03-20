import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const surah = pgTable("surah", {
  id: serial("id").primaryKey(),
  surahName: varchar("surah_name").notNull(),
  arabic: varchar("arabic").notNull(),
  latin: varchar("latin").notNull(),
  transliteration: varchar("transliteration").notNull(),
  translation: varchar("translation").notNull(),
  numAyah: integer("num_ayah").notNull(),
  page: integer("page").notNull(),
  location: varchar("location").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ayah = pgTable("ayah", {
  id: serial("id").primaryKey(),
  surahId: integer("surah_id")
    .references(() => surah.id)
    .notNull(),
  ayahNumber: integer("ayah_number").notNull(),
  page: integer("page").notNull(),
  juz: integer("juz"),
  arabic: text("arabic").notNull(),
  latin: text("latin").notNull(),
  translation: text("translation").notNull(),
  wajizTafsir: text("wajiz_tafsir").notNull(),
  tahliliTafsir: text("tahlili_tafsir").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reciter = pgTable("reciter", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  subfolder: varchar("subfolder").notNull(),
  bitrate: varchar("bitrate").notNull(),
  style: varchar("style"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const table = {
  surah,
  ayah,
  reciter,
} as const;

export type Table = typeof table;
