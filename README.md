# Digger Helper

A mobile app for vinyl record diggers. Point your phone at a record sleeve or label, let the app read the reference, and instantly get the full Discogs catalog entry plus listening links from YouTube, SoundCloud, and Bandcamp — all in one screen.

---

## How it works

```
📷 Scan  →  ✏️ Review  →  🔍 Look up  →  🎵 Listen
```

1. **Scan** — photograph the record sleeve or label. Tesseract OCR extracts the text automatically.
2. **Review** — confirm or edit the detected catalog reference and fields.
3. **Look up** — the backend queries Discogs for release details (tracklist, label, format, market price).
4. **Listen** — results from YouTube, SoundCloud, and Bandcamp appear below. Tap any link to open a built-in player.

---

## Features

| Feature | Detail |
|---|---|
| Camera OCR | Powered by [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) — no cloud subscription needed |
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
│   └── tests/        # pytest unit tests (97 tests)
│
├── mobile/           # Expo / React Native app (TypeScript)
│   ├── src/
│   │   ├── screens/  # Login, Capture, Label, Info, PlayerModal
│   │   ├── store/    # Redux slices (capture, label, record)
│   │   └── hooks/    # fetchAll — chains Discogs → media lookup
│   └── __tests__/    # Jest slice + API client tests (42 tests)
│
├── deploy/linux/     # install.sh + systemd services for 24/7 hosting
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
sudo apt-get update && sudo apt-get install -y tesseract-ocr tesseract-ocr-eng

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
npx expo start --tunnel     # or: npx expo start  (phone on the same network)
```

Scan the QR code with the **Expo Go** app on your phone (iOS or Android).

No API URL to configure: the app sends its API calls to the Expo dev server it was
loaded from, and the dev server forwards `/api/*` to the backend on the same machine
(`mobile/metro.config.js`). Whatever URL opens the app — LAN or tunnel — also reaches
the backend. If the backend is not on `127.0.0.1:8000`, set `DIGGER_BACKEND_URL` in
`mobile/.env`.

### One command, any machine

```bash
scripts/dev.sh        # backend + Expo tunnel in the foreground; phone can be anywhere
scripts/dev.sh lan    # phone on the same network
```

It creates the virtualenv and `backend/.env` when missing, picks free ports if 8000 / 8081
are taken, and stops the backend when you press Ctrl-C.

---

## Deploy on a Linux server (24/7)

`deploy/linux/install.sh` installs the backend and the Expo dev server as two systemd
services that start at boot and restart on failure, so Expo Go can open the app at any time.

```bash
git clone https://github.com/CyrilGendarme/digger-helper.git && cd digger-helper
deploy/linux/install.sh                      # phone anywhere — API goes through the Expo tunnel
deploy/linux/install.sh --api-mode lan          # phone on the same network, backend on LAN_IP:8000
deploy/linux/install.sh --api-mode cloudflare   # API through a separate Cloudflare quick tunnel
deploy/linux/install.sh --api-url https://api.example.com   # your own domain / reverse proxy
```

The default (`API_MODE=expo`) works on any server or VPS, including behind NAT or a
firewall: only outgoing connections are needed, and the backend listens on `127.0.0.1` only.
If port 8000 or 8081 is already used by another program, the installer picks the next free one.

Run it as your normal user (it uses `sudo` where needed). It needs Python 3.11+, Node.js 20+
and systemd; on Debian/Ubuntu it installs Tesseract itself. It also:

- creates `backend/.venv` and installs the npm dependencies,
- creates `backend/.env` if missing and replaces the example `SECRET_KEY` / `APP_PASSCODE`
  with random values (the new passcode is printed at the end),
- prints the **Expo Go link and a QR code** (install `qrencode` for the QR code).

The Expo Go link goes through Expo's tunnel (`exp.direct`) and stays the same across
restarts. A watchdog restarts the Expo service if the link stops responding.

| Command | |
|---|---|
| `digger-helper url` | show the Expo Go link and the backend URL the app uses |
| `digger-helper status` | service status |
| `digger-helper logs [backend\|expo]` | follow the logs |
| `digger-helper restart` | restart both services (needed after editing a config file) |
| `digger-helper update` | `git pull`, reinstall dependencies, restart |
| `digger-helper uninstall` | remove the services (code and config are kept) |

Settings live in `deploy/linux/config.env` (API mode, ports, `EXPO_HOST=tunnel|lan`) and
`backend/.env` (passcode, Discogs token, …).

> With `--api-mode cloudflare` the backend URL changes whenever the tunnel restarts. The Expo
> service picks up the new URL automatically; close and reopen the app in Expo Go to reload it.

---

## Configuration

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DISCOGS_TOKEN` | Yes | Personal access token from [discogs.com/settings/developers](https://www.discogs.com/settings/developers) |
| `APP_PASSCODE` | Yes | 10-character alphanumeric passcode entered on the app's lock screen |
| `SECRET_KEY` | Yes | JWT signing key — generate with `openssl rand -hex 32` |
| `DISCOGS_CONSUMER_KEY` | No | OAuth key (fallback if no token) |
| `DISCOGS_CONSUMER_SECRET` | No | OAuth secret (fallback if no token) |
| `YOUTUBE_API_KEY` | No | [YouTube Data API v3](https://console.cloud.google.com/) key — the app falls back to web scraping without it |
| `ALLOWED_ORIGINS` | No | CORS origins (default: `http://localhost:8081,exp://localhost:8081`) |
| `TESSERACT_CMD` | No | Path to the `tesseract` binary if it is not on `PATH` |

### Mobile — `mobile/.env`

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Optional. Full backend URL, e.g. `https://api.example.com/api/v1`. When unset, the app uses the Expo dev server it was loaded from (recommended in development). |
| `DIGGER_BACKEND_URL` | Optional. Where the dev server's `/api/*` proxy finds the backend (default `http://127.0.0.1:8000`). |

---

## Running the tests

**Backend** (97 tests)

```bash
cd backend
.\.venv\Scripts\pytest.exe -v tests\   # Windows
# or
pytest -v tests/                        # macOS / Linux
```

**Mobile** (42 tests)

```bash
cd mobile
npm test
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | [Expo](https://expo.dev) ~58 · React Native · TypeScript · Redux Toolkit |
| Backend | [FastAPI](https://fastapi.tiangolo.com) · Python 3.11+ · Uvicorn |
| OCR | [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) |
| Bandcamp scraping | Selenium + Chrome/Chromium (bundled in the Docker image) |
| Containerisation | Docker + Docker Compose |
| Backend tests | pytest + pytest-asyncio · httpx |
| Mobile tests | Jest · jest-expo |
