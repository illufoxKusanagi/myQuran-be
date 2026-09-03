import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { table } from "./schema";

export const db = {
  insert: {
    surah: createInsertSchema(table.surah),
    ayah: createInsertSchema(table.ayah),
    reciter: createInsertSchema(table.reciter),
    hadithBook: createInsertSchema(table.hadithBook),
    hadith: createInsertSchema(table.hadith),
  },
  select: {
    surah: createSelectSchema(table.surah),
    ayah: createSelectSchema(table.ayah),
    reciter: createSelectSchema(table.reciter),
    hadithBook: createSelectSchema(table.hadithBook),
    hadith: createSelectSchema(table.hadith),
  },
} as const;
