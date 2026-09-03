import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { quranRoutes } from './modules/quran';
import { mushafRoutes } from './modules/mushaf';
import { hadithRoutes } from './modules/hadith';
import { audioRoutes } from './modules/audio';

export const app = new Elysia({
  serve: {
    idleTimeout: 10,
  },
})
  .use(cors())
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        errors: error.all.map((err) => ({
          path: err.path,
          message: err.message,
          summary: err.summary,
        })),
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        success: false,
        code: 'NOT_FOUND',
        message: 'Endpoint or resource not found',
      };
    }

    console.error('Unhandled API Error:', error);
    set.status = 500;
    return {
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred',
    };
  })
  .get('/', () => {
    return {
      message: 'myQuran API is running',
      endpoints: [
        '/surah',
        '/surah/:id',
        '/ayah/search',
        '/ayah/:surahId',
        '/ayah/:surahId/:ayahNumber/tafsir',
        '/page/:pageNumber',
        '/page/:pageNumber/image',
        '/hadith/books',
        '/hadith/random',
        '/hadith/search',
        '/hadith/:bookSlug',
        '/hadith/:bookSlug/:number',
        '/reciter',
        '/reciter/:id',
        '/audio/surah/:surahId',
        '/audio/surah/:surahId/:ayahNumber',
      ],
    };
  })
  .get('/favicon.ico', () => new Response(null, { status: 204 }))
  .use(quranRoutes)
  .use(mushafRoutes)
  .use(hadithRoutes)
  .use(audioRoutes);

export type App = typeof app;

export default app;
