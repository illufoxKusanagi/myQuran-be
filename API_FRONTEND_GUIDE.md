# 📱 myQuran API — Frontend Integration Guide

This guide is designed for frontend developers building mobile (React Native / Flutter) or web (Next.js, React, Vue, Svelte) applications on top of the **myQuran Backend API**.

---

## 🌐 1. Connection & Overview

- **Base URL (Local)**: `http://localhost:3000`
- **CORS**: Fully enabled (`*`) for all origins, headers, and methods.
- **Content-Type**: `application/json` (except images at `/page/:pageNumber/image` which return `image/webp`).
- **Pagination Response Headers**: Available on endpoints returning paginated lists:
  - `X-Total-Count`: Total number of matching items.
  - `X-Total-Pages`: Total number of available pages.
  - `X-Current-Page`: Requested page number.
  - `X-Per-Page`: Number of items per page.

---

## ⚡ 2. End-to-End Type Safety with Eden Treaty (Recommended)

Because the backend exports `export type App = typeof app`, frontend TypeScript projects can install `@elysiajs/eden` for instant type safety, route autocomplete, and automatic response typing:

```bash
npm install @elysiajs/eden
```

```typescript
import { treaty } from '@elysiajs/eden';
import type { App } from 'myQuran-backend/src'; // Or shared type package

export const api = treaty<App>('http://localhost:3000');

// Fully typed with autocomplete for params, queries, and return types!
const { data, error } = await api.ayah({ surahId: 2 }).get({
  query: {
    page: 1,
    limit: 20,
    withTafsir: false,
    paginate: true,
  },
});
```

---

## 📦 3. TypeScript Interfaces

Copy and paste these definitions directly into your frontend codebase (e.g. `types/api.ts`):

```typescript
// ==========================================
// 1. Pagination Envelope
// ==========================================
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  pagination: PaginationMeta;
  results?: T[];
  ayahs?: T[];
  hadiths?: T[];
}

// ==========================================
// 2. Error Response
// ==========================================
export interface ApiErrorResponse {
  success?: false;
  code?: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR';
  message?: string;
  error?: string;
  errors?: Array<{
    path: string;
    message: string;
    summary?: string;
  }>;
}

// ==========================================
// 3. Quran & Ayah
// ==========================================
export interface Surah {
  id: number;
  surahName: string;
  arabic: string;
  latin: string;
  transliteration: string;
  translation: string;
  numAyah: number;
  page: number;
  location: 'Makkiyah' | 'Madaniyah' | string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Ayah {
  id: number;
  surahId: number;
  ayahNumber: number;
  page: number;
  juz: number | null;
  arabic: string;
  latin: string;
  translation: string;
  footnote: string | null;
  wajizTafsir?: string;
  tahliliTafsir?: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AyahSearchResult extends Ayah {
  surahName: string;
  surahLatin: string;
  surahArabic: string;
}

export interface AyahSearchResponse {
  query: string;
  pagination: PaginationMeta;
  results: AyahSearchResult[];
}

export interface PaginatedAyahResponse {
  surahId: number;
  pagination: PaginationMeta;
  ayahs: Ayah[];
}

export interface AyahTafsirResponse {
  ayahNumber: number;
  wajizTafsir: string;
  tahliliTafsir: string;
}

// ==========================================
// 4. Mushaf Pages
// ==========================================
export interface MushafPage {
  page: number;
  juz: number | null;
  surahIds: number[];
  imageUrl: string;
  localImageUrl: string;
  totalAyahs: number;
  ayahs: Ayah[];
}

// ==========================================
// 5. Hadith
// ==========================================
export interface HadithBook {
  id: number;
  slug: string;
  name: string;
  arabicName: string | null;
  author: string;
  totalHadith: number;
  availableHadiths: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Hadith {
  id: number;
  bookId: number;
  number: number;
  kitabNo: number | null;
  kitabName: string | null;
  babNo: number | null;
  babName: string | null;
  grade: string | null;
  arabic: string;
  latin: string | null;
  translation: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface HadithSearchResult extends Hadith {
  bookSlug: string;
  bookName: string;
}

export interface HadithSearchResponse {
  query: string;
  pagination: PaginationMeta;
  results: HadithSearchResult[];
}

export interface HadithBookResponse {
  book: HadithBook;
  pagination: PaginationMeta;
  hadiths: Hadith[];
}

// ==========================================
// 6. Audio
// ==========================================
export interface Reciter {
  id: number;
  name: string;
  subfolder: string;
  bitrate: string;
  style: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AudioPlaylistResponse {
  surahId: number;
  reciterId: number;
  totalAyahs: number;
  audioUrls: string[];
}

export interface AudioAyahResponse {
  surahId: number;
  ayahNumber: number;
  reciterId: number;
  audioUrl: string;
}
```

---

## 🔍 4. Quran Search & Reader Implementation

### A. Quran Keyword Search
Search across translation, Latin transliteration, and Arabic text in all 6,236 verses.

```http
GET /ayah/search?q={query}&surah={surahId}&page={page}&limit={limit}&withTafsir={boolean}
```

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `q` | `string` | **Yes** | — | Search term (min 1 non-whitespace char). |
| `surah` | `number` | No | — | Filter search to specific Surah (1–114). |
| `page` | `number` | No | `1` | Page number (min 1). |
| `limit` | `number` | No | `20` | Results per page (min 1, max 100). |
| `withTafsir` | `boolean`| No | `false` | Set `true` to include full tafsirs in search results. |

**Example Frontend Call**:
```typescript
async function searchQuran(query: string, page = 1) {
  const params = new URLSearchParams({
    q: query.trim(),
    page: String(page),
    limit: '20',
  });
  const res = await fetch(`http://localhost:3000/ayah/search?${params}`);
  if (!res.ok) throw await res.json();
  return (await res.json()) as AyahSearchResponse;
}
```

---

### B. Surah Verse Reading & Pagination
Fetch verses for a surah. Offers two modes: **Direct Array** (legacy compatible) or **Paginated Envelope**.

```http
GET /ayah/:surahId?page={page}&limit={limit}&from={from}&to={to}&withTafsir={boolean}&paginate={boolean}
```

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No | `1` | Page number (requires `limit`). |
| `limit` | `number` | No | — | Page size (min 1, max 300). Supports fetching all 286 ayahs of Al-Baqarah in one request. |
| `from` | `number` | No | — | Start verse number (e.g. `?from=1`). |
| `to` | `number` | No | — | End verse number (e.g. `?to=20`). |
| `withTafsir` | `boolean`| No | `true` | **Set `false` in reading views to cut payload by ~70%!** |
| `paginate` | `boolean`| No | `false` | Set `true` to return `{ pagination, ayahs }` envelope. |

> [!TIP]
> **Performance Recommendation**: When building reader views, always pass `?withTafsir=false`. If the user taps a specific verse to read its Tafsir, fetch on-demand using `/ayah/:surahId/:ayahNumber/tafsir`.

**Example: Infinite Scroll / Paginated Reader**:
```typescript
async function fetchSurahPage(surahId: number, page: number, pageSize = 20) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
    withTafsir: 'false', // Light payload (~30KB vs ~150KB)
    paginate: 'true',
  });

  const res = await fetch(`http://localhost:3000/ayah/${surahId}?${params}`);
  return (await res.json()) as PaginatedAyahResponse;
}
```

**Example: Verse Range (e.g. Juz Amma daily target)**:
```typescript
// Fetch verses 1 to 10 of Surah 2 without Tafsir
const res = await fetch('http://localhost:3000/ayah/2?from=1&to=10&withTafsir=false');
const ayahs: Ayah[] = await res.json();
```

---

### C. On-Demand Tafsir Fetching
Fetch concise (*Wajiz*) and comprehensive (*Tahlili*) Tafsir when the user expands a verse.

```http
GET /ayah/:surahId/:ayahNumber/tafsir
```

**Response**:
```json
{
  "ayahNumber": 1,
  "wajizTafsir": "Aku memulai bacaan Al-Qur'an dengan menyebut nama Allah...",
  "tahliliTafsir": "Surah al-Fātiḥah dimulai dengan basmalah..."
}
```

---

## 📜 5. Hadith Search & Browsing Implementation

### A. Global Cross-Collection Search
Search through all **29,187 hadiths** across all 7 books (Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa'i, Ibnu Majah, Ahmad).

```http
GET /hadith/search?q={query}&book={slugs}&page={page}&limit={limit}
```

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `q` | `string` | **Yes** | — | Keyword (searches Indonesian translation & Arabic). |
| `book` | `string` | No | — | Filter by book slugs (comma-separated, e.g. `bukhari,muslim`). |
| `page` | `number` | No | `1` | Page number. |
| `limit` | `number` | No | `20` | Limit (max 100). |

**Example Frontend Call**:
```typescript
async function searchHadith(query: string, bookSlugs?: string[], page = 1) {
  const params = new URLSearchParams({
    q: query.trim(),
    page: String(page),
    limit: '20',
  });
  if (bookSlugs && bookSlugs.length > 0) {
    params.set('book', bookSlugs.join(','));
  }

  const res = await fetch(`http://localhost:3000/hadith/search?${params}`);
  if (!res.ok) throw await res.json();
  return (await res.json()) as HadithSearchResponse;
}
```

---

### B. Browsing Within a Hadith Book
Browse a collection with chapter filtering and search.

```http
GET /hadith/:bookSlug?page={page}&limit={limit}&kitab={kitabNo}&search={keyword}
```

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `bookSlug` | `string` | **Path** | — | `bukhari`, `muslim`, `abudawud`, `tirmidzi`, `nasai`, `ibnumajah`, `ahmad`. |
| `page` | `number` | No | `1` | Page number. |
| `limit` | `number` | No | `20` | Items per page (max 100). |
| `kitab` | `number` | No | — | Filter by Kitab / chapter ID (e.g. `?kitab=1`). |
| `search` | `string` | No | — | Keyword search within this specific book. |

**Example Frontend Call**:
```typescript
async function getHadithBookPage(bookSlug: string, page = 1, searchQuery?: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: '20',
  });
  if (searchQuery) {
    params.set('search', searchQuery.trim());
  }

  const res = await fetch(`http://localhost:3000/hadith/${bookSlug}?${params}`);
  return (await res.json()) as HadithBookResponse;
}
```

---

### C. Single Hadith & Hadith of the Day
- **Single Hadith**: `GET /hadith/:bookSlug/:number`
  - Example: `/hadith/bukhari/1`
- **Random Hadith of the Day**: `GET /hadith/random`
  - Filter by book: `GET /hadith/random?book=bukhari`

---

## 📖 6. Mushaf 604-Page Reader Implementation

### A. Page Metadata & Verse Mapping
```http
GET /page/:pageNumber
```
- `pageNumber`: `1` to `604`

**Response Highlights**:
```json
{
  "page": 1,
  "juz": 1,
  "surahIds": [1],
  "imageUrl": "https://media.qurankemenag.net/khat2/QK_001.webp",
  "localImageUrl": "/page/1/image",
  "totalAyahs": 7,
  "ayahs": [...]
}
```

### B. High-Resolution Page Image Serving
```http
GET /page/:pageNumber/image
```
- Returns the local cached WebP image (`image/webp`) with `Cache-Control: public, max-age=31536000, immutable`.
- If the local file is not found, automatically responds with a `302 Redirect` to the official Kemenag CDN.

---

## 🎧 7. Audio Recitation Engine

### A. Reciter Catalog
```http
GET /reciter
```
Returns list of 40+ verified reciters with `subfolder` and `bitrate`. Default reciter ID is `3` (Mishary Rashid Al-Afasy).

### B. Surah Playlist & Range Batching
```http
GET /audio/surah/:surahId?reciterId={reciterId}&from={from}&to={to}
```
Returns an array of direct `.mp3` streaming URLs for the surah. Supports range batching (e.g. `?from=1&to=20` for flipbook or batch players).

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `reciterId` | `number` | No | Alafasy | Reciter ID from `/reciter`. |
| `from` | `number` | No | `1` | Start verse number. |
| `to` | `number` | No | `numAyah` | End verse number. |

**Response**:
```json
{
  "surahId": 2,
  "reciterId": 47,
  "from": 1,
  "to": 20,
  "totalAyahs": 20,
  "audioUrls": [
    "https://everyayah.com/data/Alafasy_128kbps/002001.mp3",
    "https://everyayah.com/data/Alafasy_128kbps/002002.mp3",
    "..."
  ]
}
```

### C. Single Verse Audio
```http
GET /audio/surah/:surahId/:ayahNumber?reciterId={reciterId}
```
Returns direct URL to play the specific ayah in audio players (e.g. Howler.js, Expo Audio, HTML5 `<audio>`).

---

## ⚠️ 8. Error Handling Reference

All backend validation, 404, and runtime errors follow a predictable envelope:

### Validation Error (`400 Bad Request`)
Triggered when parameters violate limits, boundaries, or types:
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid request parameters",
  "errors": [
    {
      "path": "/page",
      "message": "Expected number to be greater or equal to 1",
      "summary": "Expected number to be greater or equal to 1"
    }
  ]
}
```

### Empty Whitespace Search Error (`400 Bad Request`)
```json
{
  "error": "Search query cannot be empty or only whitespace"
}
```

### Not Found Error (`404 Not Found`)
```json
{
  "error": "Surah with ID 115 not found"
}
```

### Frontend Safe Fetch Wrapper Example
```typescript
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `http://localhost:3000${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.message ||
      errorBody.error ||
      errorBody.errors?.[0]?.message ||
      `HTTP Error ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
```
