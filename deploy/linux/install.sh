#!/usr/bin/env bash
# Install Digger Helper as two systemd services (backend + Expo dev server) that
# start at boot and restart on failure. Safe to re-run: it updates in place.
#
# Run as the user that should own the services (not root); sudo is used for the
# system-level steps.
#
#   deploy/linux/install.sh [--api-mode lan|cloudflare|url] [--api-url URL] [--expo-host tunnel|lan]
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$DEPLOY_DIR/../.." && pwd)"
CONFIG="$DEPLOY_DIR/config.env"
BACKEND_ENV="$ROOT_DIR/backend/.env"

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m%s\033[0m\n' "$*" >&2; }
die() { printf '\033[1;31mError: %s\033[0m\n' "$*" >&2; exit 1; }

usage() { sed -n '2,8p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

# Set KEY=VALUE in an env file, replacing an existing KEY line or appending one.
set_var() {
  local file="$1" key="$2" value="$3"
  if grep -q "^$key=" "$file"; then
    sed -i "s|^$key=.*|$key=$value|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >>"$file"
  fi
}

get_var() {
  grep -m1 "^$2=" "$1" 2>/dev/null | cut -d= -f2- | sed 's/[[:space:]]*#.*$//; s/[[:space:]]*$//' || true
}

# ── Arguments ────────────────────────────────────────────────────────────────
opt_api_mode="" opt_api_url="" opt_expo_host=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-mode) opt_api_mode="${2:?}"; shift 2 ;;
    --api-url) opt_api_url="${2:?}"; opt_api_mode="${opt_api_mode:-url}"; shift 2 ;;
    --expo-host) opt_expo_host="${2:?}"; shift 2 ;;
    -h | --help) usage; exit 0 ;;
    *) usage; die "unknown option: $1" ;;
  esac
done
case "$opt_api_mode" in "" | lan | cloudflare | url) ;; *) die "--api-mode must be lan, cloudflare or url" ;; esac
case "$opt_expo_host" in "" | tunnel | lan) ;; *) die "--expo-host must be tunnel or lan" ;; esac

# ── Preconditions ────────────────────────────────────────────────────────────
step "Checking requirements"
[[ $EUID -ne 0 ]] || die "run as your normal user, not root (sudo is used where needed)"
command -v systemctl >/dev/null || die "systemd is required"
command -v sudo >/dev/null || die "sudo is required"

if command -v apt-get >/dev/null; then
  missing=()
  command -v tesseract >/dev/null || missing+=(tesseract-ocr tesseract-ocr-eng)
  python3 -c 'import ensurepip' 2>/dev/null || missing+=(python3-venv)
  command -v curl >/dev/null || missing+=(curl)
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "Installing system packages: ${missing[*]}"
    sudo apt-get update -qq
    sudo apt-get install -y --no-install-recommends "${missing[@]}"
  fi
else
  command -v tesseract >/dev/null || warn "tesseract not found — install tesseract-ocr with your package manager (OCR won't work without it)"
fi

python3 -c 'import sys; sys.exit(sys.version_info < (3, 11))' ||
  die "Python 3.11+ is required (found $(python3 --version 2>&1))"
command -v node >/dev/null || die "Node.js 20+ is required (https://nodejs.org)"
node -e 'process.exit(+process.versions.node.split(".")[0] < 20)' ||
  die "Node.js 20+ is required (found $(node --version))"
NODE_BIN="$(dirname "$(command -v node)")"
echo "python $(python3 --version | cut -d' ' -f2), node $(node --version), tesseract $(command -v tesseract >/dev/null && tesseract --version 2>&1 | head -n1 | cut -d' ' -f2)"

# ── Deployment config ────────────────────────────────────────────────────────
step "Deployment config ($CONFIG)"
[[ -f "$CONFIG" ]] || cp "$DEPLOY_DIR/config.env.example" "$CONFIG"
[[ -n "$opt_api_mode" ]] && set_var "$CONFIG" API_MODE "$opt_api_mode"
[[ -n "$opt_api_url" ]] && set_var "$CONFIG" API_PUBLIC_URL "$opt_api_url"
[[ -n "$opt_expo_host" ]] && set_var "$CONFIG" EXPO_HOST "$opt_expo_host"
# shellcheck source=config.env.example
source "$CONFIG"
[[ "$API_MODE" != "url" || -n "$API_PUBLIC_URL" ]] || die "API_MODE=url needs --api-url (or API_PUBLIC_URL in $CONFIG)"
echo "API_MODE=$API_MODE  EXPO_HOST=$EXPO_HOST  BACKEND_PORT=$BACKEND_PORT  EXPO_PORT=$EXPO_PORT"

if [[ "$API_MODE" == "cloudflare" ]] && ! command -v cloudflared >/dev/null; then
  case "$(uname -m)" in
    x86_64) cf_arch=amd64 ;;
    aarch64 | arm64) cf_arch=arm64 ;;
    armv7l) cf_arch=arm ;;
    *) die "no cloudflared build for $(uname -m) — install it manually" ;;
  esac
  echo "Installing cloudflared to /usr/local/bin"
  tmp="$(mktemp)"
  curl -fsSL -o "$tmp" "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$cf_arch"
  sudo install -m 0755 "$tmp" /usr/local/bin/cloudflared
  rm -f "$tmp"
fi

# ── Backend ──────────────────────────────────────────────────────────────────
step "Backend: virtualenv + dependencies"
cd "$ROOT_DIR/backend"
[[ -x .venv/bin/python ]] || python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

step "Backend: secrets ($BACKEND_ENV)"
[[ -f "$BACKEND_ENV" ]] || cp .env.example "$BACKEND_ENV"
chmod 600 "$BACKEND_ENV"
case "$(get_var "$BACKEND_ENV" SECRET_KEY)" in
  "" | change-me-in-production | some-long-random-string)
    set_var "$BACKEND_ENV" SECRET_KEY "$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
    echo "Generated a new SECRET_KEY."
    ;;
esac
new_passcode=""
case "$(get_var "$BACKEND_ENV" APP_PASSCODE)" in
  "" | A1B2C3D4E5)
    new_passcode="$(python3 -c 'import secrets, string; a = string.ascii_letters + string.digits; print("".join(secrets.choice(a) for _ in range(10)))')"
    set_var "$BACKEND_ENV" APP_PASSCODE "$new_passcode"
    echo "Generated a new APP_PASSCODE (shown at the end)."
    ;;
esac
[[ -n "$(get_var "$BACKEND_ENV" DISCOGS_TOKEN)" ]] ||
  warn "DISCOGS_TOKEN is empty in backend/.env — Discogs lookups are rate-limited without it."

# ── Mobile ───────────────────────────────────────────────────────────────────
step "Mobile: npm dependencies"
cd "$ROOT_DIR/mobile"
npm ci --no-audit --no-fund

# ── systemd services ─────────────────────────────────────────────────────────
step "Installing systemd services"
chmod +x "$DEPLOY_DIR"/run-*.sh "$DEPLOY_DIR/digger-helper"
for svc in digger-backend digger-expo; do
  sed -e "s|@USER@|$USER|g" -e "s|@ROOT@|$ROOT_DIR|g" -e "s|@NODE_BIN@|$NODE_BIN|g" \
    "$DEPLOY_DIR/$svc.service.in" | sudo tee "/etc/systemd/system/$svc.service" >/dev/null
done
sudo ln -sfn "$DEPLOY_DIR/digger-helper" /usr/local/bin/digger-helper
sudo systemctl daemon-reload
sudo systemctl enable digger-backend digger-expo >/dev/null
sudo systemctl restart digger-backend digger-expo

step "Waiting for the backend"
for _ in $(seq 1 30); do
  curl -sf "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null && break
  sleep 1
done
curl -sf "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null ||
  die "backend did not start — see: digger-helper logs backend"
echo "Backend is up on port $BACKEND_PORT."

step "Waiting for Expo (the first start can take a minute)"
"$DEPLOY_DIR/digger-helper" url || warn "Expo is still starting — run 'digger-helper url' in a moment."

if [[ -n "$new_passcode" ]]; then
  printf '\n\033[1;32mApp passcode: %s\033[0m  (stored in backend/.env as APP_PASSCODE)\n' "$new_passcode"
fi
cat <<EOF

Done. The services start at boot and restart automatically.
Open Expo Go on your phone and scan the QR code / enter the link above.
Manage with: digger-helper status | url | logs | restart | update | uninstall
EOF
