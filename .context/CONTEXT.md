# Workspace Context: myQuran Backend

## 1. Project Overview
- **Name**: myQuran Backend API
- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Database**: 
  - Local: PostgreSQL 16 (via Docker Compose on `localhost:5432`, db: `quran_db`)
  - Remote: Supabase PostgreSQL (`aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres`)
- **ORM**: Drizzle ORM + `drizzle-typebox`
- **Data Collections (Verified in Supabase & Local)**:
  - Quran: 114 Surahs, 6,236 Ayahs (Arabic text, Latin, Translation, Footnotes, Tafsir Wajiz & Tafsir Tahlili)
  - Mushaf: 604 Indonesian Standard page images (`data/pages/QK_XXX.webp`)
  - Hadiths: 7 collections (*Kutubut Tis'ah* — Bukhari, Muslim, Abu Dawud, At-Tirmidzi, An-Nasa'i, Ibnu Majah, Musnad Ahmad) totaling 29,187 records.
  - Audio: 40+ verified reciters streaming from `everyayah.com`.

## 2. Database Indexes & Performance
PostgreSQL indexes deployed via Drizzle Kit:
- `hadith`:
  - `hadith_book_id_idx` (`book_id`)
  - `hadith_book_number_idx` (`book_id`, `number`)
  - `hadith_book_kitab_idx` (`book_id`, `kitab_no`)
- `ayah`:
  - `ayah_surah_id_idx` (`surah_id`)
  - `ayah_surah_number_idx` (`surah_id`, `ayah_number`)
  - `ayah_page_idx` (`page`)

## 3. Architecture & Modular Topology (`src/modules/`)
- `src/modules/quran/`:
  - `GET /surah`: All 114 surahs
  - `GET /surah/:id`: Surah by ID
  - `GET /ayah/search`: Keyword search across all 6,236 verses (`?q=`, `?surah=`, `?page=`, `?limit=`, `?withTafsir=`) with whitespace defense
  - `GET /ayah/:surahId`: Surah verses with optional pagination (`?page=`, `?limit=`), range (`?from=`, `?to=`), Tafsir projection toggle (`?withTafsir=false`), and envelope wrapper (`?paginate=true`)
  - `GET /ayah/:surahId/:ayahNumber/tafsir`: Wajiz & Tahlili tafsir for single verse
- `src/modules/mushaf/`:
  - `GET /page/:pageNumber`: Page metadata and verse mappings (TypeBox 1-604 validation)
  - `GET /page/:pageNumber/image`: Local WebP image streaming / Kemenag CDN redirect
- `src/modules/hadith/`:
  - `GET /hadith/books`: All 7 Hadith collections with real-time available counts
  - `GET /hadith/random`: Random hadith quote (`?book=`)
  - `GET /hadith/search`: Global cross-collection search across all 29,187 hadiths (`?q=`, `?book=`, `?page=`, `?limit=`) with whitespace defense
  - `GET /hadith/:bookSlug`: Paginated collection browsing with keyword search (`?search=`, `?page=`, `?limit=`, `?kitab=`)
  - `GET /hadith/:bookSlug/:number`: Single hadith by book and number
- `src/modules/audio/`:
  - `GET /reciter`: List 40+ reciters
  - `GET /reciter/:id`: Single reciter
  - `GET /audio/surah/:surahId`: Playlist audio URLs for surah
  - `GET /audio/surah/:surahId/:ayahNumber`: Direct audio URL for single verse
- `src/index.ts`: Root app composing modules with CORS, centralized `onError` interceptor, and exporting `type App = typeof app`.

## 4. Documentation
- `API_FRONTEND_GUIDE.md`: Full frontend developer guide with copy-paste TypeScript types, Eden Treaty setup, search parameters, and payload reduction tips.
