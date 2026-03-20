import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { table } from "./schema";

export const db = {
  insert: {
    surah: createInsertSchema(table.surah),
    ayah: createInsertSchema(table.ayah),
    reciter: createInsertSchema(table.reciter),
  },
  select: {
    surah: createSelectSchema(table.surah),
    ayah: createSelectSchema(table.ayah),
    reciter: createSelectSchema(table.reciter),
  },
} as const;
