# Digger Helper

A mobile app for vinyl record diggers. Point your phone at a record sleeve or label, let the app read the reference, and instantly get the full Discogs catalog entry plus listening links from YouTube, SoundCloud, and Bandcamp — all in one screen.

---

## How it works

```
📷 Scan  →  ✏️ Review  →  🔍 Look up  →  🎵 Listen
```

1. **Scan** — photograph the record sleeve or label. EasyOCR extracts the text automatically.
2. **Review** — confirm or edit the detected catalog reference and fields.
3. **Look up** — the backend queries Discogs for release details (tracklist, label, format, market price).
4. **Listen** — results from YouTube, SoundCloud, and Bandcamp appear below. Tap any link to open a built-in player.

---

## Features

| Feature | Detail |
|---|---|
| Camera OCR | Powered by [EasyOCR](https://github.com/JaidedAI/EasyOCR) — no cloud subscription needed |
| Discogs lookup | Catalog data, tracklist, label, format, and lowest market price |
| YouTube | Video results via the Data API or web scraping fallback |
| SoundCloud | Track search via the public API |
| Bandcamp | Album search via Selenium/Chrome — includes buy price when available |
| Built-in player | Watch/listen without leaving the app |
| Passcode lock | Simple PIN screen keeps the app private |

---

## Project structure

```
digger-helper/
├── backend/          # FastAPI API + OCR + media services
│   ├── app/
│   │   ├── api/      # Route handlers (/ocr, /discogs, /media)
│   │   ├── services/ # OCR, Discogs, YouTube, SoundCloud, Bandcamp
│   │   └── models/   # Pydantic response models
│   └── tests/        # pytest unit tests (82 tests)
│
├── mobile/           # Expo / React Native app (TypeScript)
│   ├── src/
│   │   ├── screens/  # Login, Capture, Label, Info, PlayerModal
│   │   ├── store/    # Redux slices (capture, label, record)
│   │   └── hooks/    # fetchAll — chains Discogs → media lookup
│   └── __tests__/    # Jest slice tests (33 tests)
│
└── docker-compose.yml
```

---

## Quick start

### 1 — Backend

**With Docker (recommended)**

```bash
cp backend/.env.example backend/.env
# Fill in your Discogs token and optional YouTube API key (see Configuration below)
docker compose up --build
```

The API is available at `http://localhost:8000`.

**Without Docker**

```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then edit .env
uvicorn main:app --reload
```

### 2 — Mobile app

```bash
cd mobile
npm install --legacy-peer-deps
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to the local IP of the machine running the backend
# e.g. EXPO_PUBLIC_API_URL=http://192.168.1.42:8000/api/v1

npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (iOS or Android).

---

## Configuration

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DISCOGS_TOKEN` | Yes | Personal access token from [discogs.com/settings/developers](https://www.discogs.com/settings/developers) |
| `DISCOGS_CONSUMER_KEY` | No | OAuth key (fallback if no token) |
| `DISCOGS_CONSUMER_SECRET` | No | OAuth secret (fallback if no token) |
| `YOUTUBE_API_KEY` | No | [YouTube Data API v3](https://console.cloud.google.com/) key — the app falls back to web scraping without it |
| `ALLOWED_ORIGINS` | No | CORS origins (default: `http://localhost:8081,exp://localhost:8081`) |

### Mobile — `mobile/.env`

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Full URL to the backend API, e.g. `http://192.168.1.42:8000/api/v1` |
| `EXPO_PUBLIC_PASSCODE` | PIN code used to unlock the app (default: `1234`) |

---

## Running the tests

**Backend** (82 tests)

```bash
cd backend
.\.venv\Scripts\pytest.exe -v tests\   # Windows
# or
pytest -v tests/                        # macOS / Linux
```

**Mobile** (33 tests)

```bash
cd mobile
npm test
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | [Expo](https://expo.dev) ~54 · React Native · TypeScript · Redux Toolkit |
| Backend | [FastAPI](https://fastapi.tiangolo.com) · Python 3.13 · Uvicorn |
| OCR | [EasyOCR](https://github.com/JaidedAI/EasyOCR) |
| Bandcamp scraping | Selenium + Chrome |
| Containerisation | Docker + Docker Compose |
| Backend tests | pytest + pytest-asyncio · httpx |
| Mobile tests | Jest · jest-expo |
