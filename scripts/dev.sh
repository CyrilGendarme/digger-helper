#!/usr/bin/env bash
# Run the backend and the Expo dev server together in the foreground (Ctrl-C stops both).
# Works on any Linux/macOS machine or VPS — the phone only needs the Expo Go link:
# the app sends its API calls through the Expo dev server, which proxies them to
# the backend (mobile/metro.config.js).
#
#   scripts/dev.sh            Expo tunnel — phone can be anywhere (default)
#   scripts/dev.sh lan        phone on the same network as this machine
#
# BACKEND_PORT (default 8000) and EXPO_PORT (default 8081) move to the next free
# port if something else already listens there.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPO_HOST="${1:-tunnel}"
case "$EXPO_HOST" in tunnel | lan) ;; *) echo "usage: $0 [tunnel|lan]" >&2; exit 1 ;; esac

port_busy() {
  if command -v ss >/dev/null; then
    ss -Hltn "sport = :$1" 2>/dev/null | grep -q .
  else
    (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
  fi
}
free_port_from() {
  local p="$1"
  while port_busy "$p" || [[ "$p" == "${2:-}" ]]; do p=$((p + 1)); done
  echo "$p"
}

# ── Backend ──────────────────────────────────────────────────────────────────
cd "$ROOT_DIR/backend"
if [[ ! -x .venv/bin/python ]]; then
  echo "[backend] creating virtualenv"
  # Without python3-venv (ensurepip) a pip-less venv still works: the system pip
  # installs into it with --python.
  python3 -m venv .venv 2>/dev/null || { rm -rf .venv && python3 -m venv --without-pip .venv; } || {
    echo "python3 -m venv failed — on Debian/Ubuntu: sudo apt install python3-venv" >&2
    exit 1
  }
fi
pip_install() {
  if [[ -x .venv/bin/pip ]]; then
    .venv/bin/pip install -q "$@"
  else
    python3 -m pip --python .venv/bin/python install -q "$@"
  fi
}
if [[ ! -f .venv/.deps-installed || requirements.txt -nt .venv/.deps-installed ]]; then
  echo "[backend] installing dependencies"
  pip_install -r requirements.txt
  touch .venv/.deps-installed
fi
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "[backend] created backend/.env from .env.example — passcode is APP_PASSCODE in that file"
fi
command -v tesseract >/dev/null || echo "[backend] warning: tesseract not installed — OCR will fail" >&2

BACKEND_PORT="$(free_port_from "${BACKEND_PORT:-8000}")"
.venv/bin/uvicorn main:app --host 127.0.0.1 --port "$BACKEND_PORT" &
backend_pid=$!
trap 'kill "$backend_pid" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  curl -sf "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null 2>&1 && break
  kill -0 "$backend_pid" 2>/dev/null || { echo "[backend] failed to start" >&2; exit 1; }
  sleep 1
done
echo "[backend] running on 127.0.0.1:$BACKEND_PORT"

# ── Expo ─────────────────────────────────────────────────────────────────────
cd "$ROOT_DIR/mobile"
[[ -d node_modules ]] || npm ci --no-audit --no-fund
EXPO_PORT="$(free_port_from "${EXPO_PORT:-8081}" "$BACKEND_PORT")"
export DIGGER_BACKEND_URL="http://127.0.0.1:$BACKEND_PORT"
# Empty overrides any value in mobile/.env: the app then calls the dev server it
# was loaded from, which proxies to the backend above.
export EXPO_PUBLIC_API_URL=""
npx expo start "--$EXPO_HOST" --port "$EXPO_PORT" --clear
