import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  index,
} from 'drizzle-orm/pg-core';

export const surah = pgTable('surah', {
  id: serial('id').primaryKey(),
  surahName: varchar('surah_name').notNull(),
  arabic: varchar('arabic').notNull(),
  latin: varchar('latin').notNull(),
  transliteration: varchar('transliteration').notNull(),
  translation: varchar('translation').notNull(),
  numAyah: integer('num_ayah').notNull(),
  page: integer('page').notNull(),
  location: varchar('location').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const ayah = pgTable(
  'ayah',
  {
    id: serial('id').primaryKey(),
    surahId: integer('surah_id')
      .references(() => surah.id)
      .notNull(),
    ayahNumber: integer('ayah_number').notNull(),
    page: integer('page').default(1).notNull(),
    juz: integer('juz'),
    arabic: text('arabic').notNull(),
    latin: text('latin').notNull(),
    translation: text('translation').notNull(),
    footnote: text('footnote'),
    wajizTafsir: text('wajiz_tafsir').notNull(),
    tahliliTafsir: text('tahlili_tafsir').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    index('ayah_surah_id_idx').on(t.surahId),
    index('ayah_surah_number_idx').on(t.surahId, t.ayahNumber),
    index('ayah_page_idx').on(t.page),
  ]
);

export const reciter = pgTable('reciter', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  subfolder: varchar('subfolder').notNull(),
  bitrate: varchar('bitrate').notNull(),
  style: varchar('style'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const hadithBook = pgTable('hadith_book', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  arabicName: varchar('arabic_name', { length: 100 }),
  author: varchar('author', { length: 100 }).notNull(),
  totalHadith: integer('total_hadith').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const hadith = pgTable(
  'hadith',
  {
    id: serial('id').primaryKey(),
    bookId: integer('book_id')
      .references(() => hadithBook.id)
      .notNull(),
    number: integer('number').notNull(),
    kitabNo: integer('kitab_no'),
    kitabName: text('kitab_name'),
    babNo: integer('bab_no'),
    babName: text('bab_name'),
    grade: varchar('grade', { length: 100 }),
    arabic: text('arabic').notNull(),
    latin: text('latin'),
    translation: text('translation').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    index('hadith_book_id_idx').on(t.bookId),
    index('hadith_book_number_idx').on(t.bookId, t.number),
    index('hadith_book_kitab_idx').on(t.bookId, t.kitabNo),
  ]
);

export const table = {
  surah,
  ayah,
  reciter,
  hadithBook,
  hadith,
} as const;

export type Table = typeof table;
