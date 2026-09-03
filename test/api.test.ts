import { describe, expect, it } from 'bun:test';
import { app } from '../src';

describe('myQuran Backend API Test Suite', () => {
  describe('Root Info', () => {
    it('GET / should return 200 with service information and endpoints', async () => {
      const res = await app.handle(new Request('http://localhost/'));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.message).toBe('myQuran API is running');
      expect(Array.isArray(data.endpoints)).toBe(true);
      expect(data.endpoints.length).toBeGreaterThan(0);
    });
  });

  describe('Quran - Surahs', () => {
    it('GET /surah should return all 114 surahs', async () => {
      const res = await app.handle(new Request('http://localhost/surah'));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(114);
      expect(data[0].surahName).toBe('Al-Fātiḥah');
    });

    it('GET /surah/1 should return Al-Fatihah details', async () => {
      const res = await app.handle(new Request('http://localhost/surah/1'));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.id).toBe(1);
      expect(data.surahName).toBe('Al-Fātiḥah');
      expect(data.numAyah).toBe(7);
    });

    it('GET /surah/999 should return 400 validation error (max 114)', async () => {
      const res = await app.handle(new Request('http://localhost/surah/999'));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Quran - Ayahs & Search', () => {
    it('GET /ayah/1 should return 7 ayahs without forced pagination', async () => {
      const res = await app.handle(new Request('http://localhost/ayah/1'));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.length).toBe(7);
      expect(data[0].ayahNumber).toBe(1);
    });

    it('GET /ayah/2?from=1&to=120 should return exactly 120 ayahs without truncation', async () => {
      const res = await app.handle(
        new Request('http://localhost/ayah/2?from=1&to=120')
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.length).toBe(120);
      expect(data[0].ayahNumber).toBe(1);
      expect(data[119].ayahNumber).toBe(120);
    });

    it('GET /ayah/2?limit=286 should return all 286 ayahs (Semua)', async () => {
      const res = await app.handle(
        new Request('http://localhost/ayah/2?limit=286')
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.length).toBe(286);
    });

    it('GET /ayah/2?page=1&limit=20&paginate=true should return paginated envelope', async () => {
      const res = await app.handle(
        new Request('http://localhost/ayah/2?page=1&limit=20&paginate=true')
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.surahId).toBe(2);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
      expect(data.pagination.total).toBe(286);
      expect(data.ayahs.length).toBe(20);
    });

    it('GET /ayah/search?q=sedekah should return keyword matches', async () => {
      const res = await app.handle(
        new Request('http://localhost/ayah/search?q=sedekah&limit=5')
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.query).toBe('sedekah');
      expect(data.pagination).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBeGreaterThan(0);
    });

    it('GET /ayah/search with only whitespace should return 400', async () => {
      const res = await app.handle(
        new Request('http://localhost/ayah/search?q=%20%20%20')
      );
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('GET /ayah/1/1/tafsir should return Tafsir Wajiz and Tahlili', async () => {
      const res = await app.handle(
        new Request('http://localhost/ayah/1/1/tafsir')
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.ayahNumber).toBe(1);
      expect(data.wajizTafsir).toBeDefined();
      expect(data.tahliliTafsir).toBeDefined();
    });
  });

  describe('Hadith', () => {
    it('GET /hadith/books should return 7 collections with count > 0', async () => {
      const res = await app.handle(new Request('http://localhost/hadith/books'));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(7);
      expect(data[0].availableHadiths).toBeGreaterThan(0);
    });

    it('GET /hadith/random should return a valid hadith object', async () => {
      const res = await app.handle(
        new Request('http://localhost/hadith/random')
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.bookSlug).toBeDefined();
      expect(data.arabic).toBeDefined();
      expect(data.translation).toBeDefined();
    });

    it('GET /hadith/search?q=puasa should return search results and pagination headers', async () => {
      const res = await app.handle(
        new Request('http://localhost/hadith/search?q=puasa&limit=5')
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('x-total-count')).not.toBeNull();

      const data = await res.json();
      expect(data.query).toBe('puasa');
      expect(data.results.length).toBeGreaterThan(0);
    });

    it('GET /hadith/bukhari/1 should return Hadith #1 of Bukhari', async () => {
      const res = await app.handle(
        new Request('http://localhost/hadith/bukhari/1')
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.book.slug).toBe('bukhari');
      expect(data.hadith.number).toBe(1);
    });
  });

  describe('Mushaf Pages', () => {
    it('GET /page/1 should return page 1 metadata', async () => {
      const res = await app.handle(new Request('http://localhost/page/1'));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.page).toBe(1);
      expect(data.imageUrl).toBeDefined();
    });

    it('GET /page/700 should return 400 validation error (max 604)', async () => {
      const res = await app.handle(new Request('http://localhost/page/700'));
      expect(res.status).toBe(400);
    });
  });

  describe('Audio & Reciters', () => {
    it('GET /reciter should return list of reciters', async () => {
      const res = await app.handle(new Request('http://localhost/reciter'));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('GET /audio/surah/2?from=1&to=5 should return batch of 5 audio URLs', async () => {
      const res = await app.handle(
        new Request('http://localhost/audio/surah/2?from=1&to=5')
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.surahId).toBe(2);
      expect(data.from).toBe(1);
      expect(data.to).toBe(5);
      expect(data.totalAyahs).toBe(5);
      expect(data.audioUrls.length).toBe(5);
    });

    it('GET /audio/surah/1/1 should return single verse audio URL', async () => {
      const res = await app.handle(
        new Request('http://localhost/audio/surah/1/1')
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.surahId).toBe(1);
      expect(data.ayahNumber).toBe(1);
      expect(data.audioUrl).toContain('001001.mp3');
    });
  });
});
