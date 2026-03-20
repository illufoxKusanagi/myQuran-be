# Quran Backend API

A complete, self-hosted backend solving the common issues of integrating Quranic data into modern web applications built on Elysia.JS

## Project Background & Features

This project was built to provide a reliable, fast, and feature-complete backend for a Quran app. It tackles several challenges:

1. **Bypassing Kemenag API Restrictions**: The official Indonesian Ministry of Religion (Kemenag) API blocks direct terminal and cross-origin browser requests (CORS/403 errors). This project includes a custom proxy scraper (`src/scraper-server.ts`) that successfully masks requests, scraping all 114 surahs, 6,236 ayahs, and Indonesian Tafsir (Wajiz & Tahlili).
2. **Audio Integration (`everyayah.com`)**: Storing thousands of audio files in a database is inefficient. This backend stores metadata for 15+ popular reciters and provides a simple, deterministic approach for frontends to construct EveryAyah audio URLs on the fly for both partial (per-ayah) and complete (full surah) playback.
3. **High-Performance Stack**: Built with ElysiaJS (one of the fastest Bun frameworks) and Drizzle ORM on PostgreSQL for type-safe, sub-millisecond database queries.

## Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com)

## Quick Start

```bash
# 1. Start PostgreSQL Database
docker compose up -d

# 2. Install dependencies
bun install

# 3. Push schema to database
bun run db:push

# 4. Seed all Quran data (114 surahs, 6236 ayahs, tafsir, 15 reciters)
bun run seed

# 5. Start dev server
bun run dev
```

The API will be running at `http://localhost:3000`.

## API Documentation

### Surah Endpoints

#### 1. List All Surahs

- **Method**: `GET`
- **Path**: `/surah`
- **Response**:

```json
[
  {
    "id": 1,
    "surahName": "Al-Fātiḥah",
    "arabic": "الفاتحة",
    "latin": "Al-Fātiḥah",
    "transliteration": "Al-Fatihah",
    "translation": "Pembuka",
    "numAyah": 7,
    "page": 1,
    "location": "Makkiyah",
    "createdAt": "2026-03-17T03:09:37.193Z",
    "updatedAt": "2026-03-17T03:09:37.193Z"
  }
]
```

#### 2. Get Single Surah

- **Method**: `GET`
- **Path**: `/surah/:id`
- **Response**: Single surah object.

### Ayah & Tafsir Endpoints

#### 3. Get All Ayahs in a Surah

- **Method**: `GET`
- **Path**: `/ayah/:surahId`
- **Response**:

```json
[
  {
    "id": 1,
    "surahId": 1,
    "ayahNumber": 1,
    "page": 1,
    "juz": 1,
    "arabic": "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ",
    "latin": "Bismillāhir-raḥmānir-raḥīm(i). ",
    "translation": "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang.",
    "wajizTafsir": "Aku memulai bacaan Al-Qur'an...",
    "tahliliTafsir": "Surah al-Fātiḥah dimulai dengan...",
    "createdAt": "2026-03-17T03:09:37.260Z",
    "updatedAt": "2026-03-17T03:09:37.260Z"
  }
]
```

#### 4. Get Tafsir for Specific Ayah

- **Method**: `GET`
- **Path**: `/ayah/:surahId/:ayahNumber/tafsir`
- **Response**:

```json
{
  "ayahNumber": 1,
  "wajizTafsir": "Aku memulai bacaan Al-Qur'an...",
  "tahliliTafsir": "Surah al-Fātiḥah dimulai dengan..."
}
```

### Reciter & Audio Endpoints

> **Note**: Audio files are not stored in the database. The backend constructs the MP3 URL using the EveryAyah CDN format. You can use the `/audio` endpoints to get the correct URLs for streaming.

#### 5. Get Audio for Full Surah (Playlist)

- **Method**: `GET`
- **Path**: `/audio/surah/:surahId?reciterId=3`
- **Query Params**: `reciterId` (optional, defaults to 3 for Alafasy)
- **Response**: Array of audio URLs for the entire surah.

```json
{
  "surahId": 1,
  "reciterId": 3,
  "audioUrls": [
    "https://everyayah.com/data/Alafasy_128kbps/001001.mp3",
    "https://everyayah.com/data/Alafasy_128kbps/001002.mp3"
    // ...
  ]
}
```

#### 6. Get Audio for Single Ayah

- **Method**: `GET`
- **Path**: `/audio/ayah/:surahId/:ayahNumber?reciterId=3`
- **Query Params**: `reciterId` (optional, defaults to 3 for Alafasy)
- **Response**:

```json
{
  "surahId": 1,
  "ayahNumber": 1,
  "reciterId": 3,
  "audioUrl": "https://everyayah.com/data/Alafasy_128kbps/001001.mp3"
}
```

### Reciter Endpoints

#### 7. List All Reciters

- **Method**: `GET`
- **Path**: `/reciter`
- **Response**:

```json
[
  {
    "id": 1,
    "name": "Abdul Basit Murattal",
    "subfolder": "Abdul_Basit_Murattal_192kbps",
    "bitrate": "192kbps",
    "style": "murattal",
    "createdAt": "2026-03-17T03:09:38.466Z",
    "updatedAt": "2026-03-17T03:09:38.466Z"
  }
]
```

#### 8. Get Single Reciter

- **Method**: `GET`
- **Path**: `/reciter/:id`
- **Response**: Single reciter object.

## Database Scripts

- `bun run db:push` - Sync schema changes to PostgreSQL
- `bun run db:generate` - Generate SQL migration files
- `bun run db:studio` - Open Drizzle Studio UI to view database

## API Reference

Base URL: `http://localhost:3000`

| Method | Endpoint                            | Description                                        |
| ------ | ----------------------------------- | -------------------------------------------------- |
| `GET`  | `/surah`                            | List all 114 Surahs                                |
| `GET`  | `/surah/:id`                        | Get a single Surah by ID                           |
| `GET`  | `/ayah/:surahId`                    | Get all Ayahs for a Surah (ordered by ayah number) |
| `GET`  | `/ayah/:surahId/:ayahNumber/tafsir` | Get Tafsir for a specific Ayah                     |

---

## How It Works

```
User opens HomeView
  └─> Fetches GET /surah → renders 114 surah cards
      └─> User clicks a Surah → navigates to /surah/:id
          └─> SurahView fetches GET /ayah/:surahId
              └─> PageFlip renders each Ayah as a page
                  ├─ Desktop: 2-page spread (left + right)
                  └─ Mobile (<768px): single-page mode

Audio (everyayah.com CDN):
  └─> Play button → plays left page ayah
      └─> On end (two-page mode): plays right page ayah (no flip)
          └─> On end (continuous): flips to next spread → repeats

Tafsir:
  └─> Book icon in bottom bar → opens drawer
      └─> Separate button per page in two-page mode
          └─> Always shows the correct ayah (validated by index)
```

---
