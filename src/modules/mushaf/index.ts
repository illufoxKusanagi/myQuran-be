import { Elysia, t, status } from 'elysia';
import { join } from 'node:path';
import { getDatabase } from '../../database';
import { table } from '../../database/schema';
import { eq, asc } from 'drizzle-orm';

const database = getDatabase();

export const mushafRoutes = new Elysia({ prefix: '/page' })
  .get(
    '/:pageNumber',
    async ({ params }) => {
      const pageNum = params.pageNumber;

      const ayahs = await database
        .select()
        .from(table.ayah)
        .where(eq(table.ayah.page, pageNum))
        .orderBy(asc(table.ayah.id));

      if (ayahs.length === 0) {
        return status(404, { error: `Page ${pageNum} not found` });
      }

      const pageNumPadded = String(pageNum).padStart(3, '0');
      const juz = ayahs[0]?.juz ?? null;
      const surahIds = [...new Set(ayahs.map((a) => a.surahId))];

      return {
        page: pageNum,
        juz,
        surahIds,
        imageUrl: `https://media.qurankemenag.net/khat2/QK_${pageNumPadded}.webp`,
        localImageUrl: `/page/${pageNum}/image`,
        totalAyahs: ayahs.length,
        ayahs,
      };
    },
    {
      params: t.Object({
        pageNumber: t.Number({ minimum: 1, maximum: 604 }),
      }),
      response: t.Any(),
    }
  )
  .get(
    '/:pageNumber/image',
    async ({ params }) => {
      const pageNum = params.pageNumber;
      const pageNumPadded = String(pageNum).padStart(3, '0');
      const localFilePath = join(
        import.meta.dir,
        '..',
        '..',
        '..',
        'data',
        'pages',
        `QK_${pageNumPadded}.webp`
      );
      const localFile = Bun.file(localFilePath);

      if (await localFile.exists()) {
        return new Response(localFile, {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }

      return Response.redirect(
        `https://media.qurankemenag.net/khat2/QK_${pageNumPadded}.webp`,
        302
      );
    },
    {
      params: t.Object({
        pageNumber: t.Number({ minimum: 1, maximum: 604 }),
      }),
    }
  );
