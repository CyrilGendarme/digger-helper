#!/usr/bin/env bash
# Started by digger-expo.service — resolves the backend URL the phone should use,
# then runs the Expo dev server (and the Cloudflare tunnel when API_MODE=cloudflare).
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$DEPLOY_DIR/../.." && pwd)"
STATE_DIR="$DEPLOY_DIR/state"
# shellcheck source=config.env.example
source "$DEPLOY_DIR/config.env"
mkdir -p "$STATE_DIR"

lan_ip() {
  ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i < NF; i++) if ($i == "src") { print $(i + 1); exit }}'
}

tunnel_pid=""
case "$API_MODE" in
  lan)
    ip_addr="$(lan_ip)"
    if [[ -z "$ip_addr" ]]; then
      echo "Could not detect the LAN IP address" >&2
      exit 1
    fi
    api_url="http://$ip_addr:$BACKEND_PORT/api/v1"
    ;;
  url)
    if [[ -z "$API_PUBLIC_URL" ]]; then
      echo "API_MODE=url but API_PUBLIC_URL is empty in $DEPLOY_DIR/config.env" >&2
      exit 1
    fi
    api_url="$API_PUBLIC_URL"
    ;;
  cloudflare)
    tunnel_log="$STATE_DIR/cloudflared.log"
    : >"$tunnel_log"
    cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$BACKEND_PORT" >"$tunnel_log" 2>&1 &
    tunnel_pid=$!
    api_url=""
    for _ in $(seq 1 60); do
      api_url="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$tunnel_log" | head -n 1 || true)"
      [[ -n "$api_url" ]] && break
      if ! kill -0 "$tunnel_pid" 2>/dev/null; then
        echo "cloudflared exited early:" >&2
        cat "$tunnel_log" >&2
        exit 1
      fi
      sleep 1
    done
    if [[ -z "$api_url" ]]; then
      echo "Timed out waiting for the Cloudflare tunnel URL" >&2
      exit 1
    fi
    ;;
  *)
    echo "Unknown API_MODE '$API_MODE' (expected lan, cloudflare or url)" >&2
    exit 1
    ;;
esac

echo "$api_url" >"$STATE_DIR/api-url"
echo "Backend URL for the app: $api_url"

EXPO_LOG="$STATE_DIR/expo.log"
rm -f "$STATE_DIR/expo-url"
: >"$EXPO_LOG"

# Work out the Expo Go link, publish it, then keep checking Metro through it: a
# tunnel can drop while Expo keeps running, leaving the app unreachable.
watchdog() {
  local link="" base_url="" failures=0
  if [[ "$EXPO_HOST" == "lan" ]]; then
    base_url="http://$(lan_ip):$EXPO_PORT"
  else
    # Non-interactive Expo only prints its local address; the ngrok debug logger
    # (enabled via DEBUG below) prints "Tunnel URL: https://<id>.exp.direct".
    for _ in $(seq 1 180); do
      base_url="$(sed 's/\x1b\[[0-9;]*m//g' "$EXPO_LOG" | grep -o 'Tunnel URL: https\?://[^ ]*' | tail -n 1 | cut -d' ' -f3 || true)"
      [[ -n "$base_url" ]] && break
      sleep 1
    done
    if [[ -z "$base_url" ]]; then
      echo "Expo tunnel did not come up within 3 minutes" >&2
      return 1
    fi
  fi
  link="exp://${base_url#*://}"
  echo "$link" >"$STATE_DIR/expo-url"
  echo "Expo Go link: $link"

  while sleep 60; do
    if [[ "$(curl -fsS -m 15 "$base_url/status" 2>/dev/null || true)" == *packager-status:running* ]]; then
      failures=0
    else
      failures=$((failures + 1))
      echo "Expo health check failed ($failures/3): $base_url/status" >&2
      if ((failures >= 3)); then
        return 1
      fi
    fi
  done
}

# A real environment variable takes precedence over mobile/.env, so the
# developer's .env is left untouched.
export EXPO_PUBLIC_API_URL="$api_url"
if [[ "$EXPO_HOST" == "lan" ]]; then
  # Make the manifest point the phone at this machine instead of localhost.
  REACT_NATIVE_PACKAGER_HOSTNAME="$(lan_ip)"
  export REACT_NATIVE_PACKAGER_HOSTNAME
else
  export DEBUG="${DEBUG:+$DEBUG,}expo:start:server:ngrok"
fi
cd "$ROOT_DIR/mobile"
npx expo start "--$EXPO_HOST" --port "$EXPO_PORT" > >(tee -a "$EXPO_LOG") 2>&1 &
expo_pid=$!
watchdog &
watchdog_pid=$!

# Whichever of Expo, the health check or the Cloudflare tunnel stops first ends
# the service; systemd then restarts everything (a new tunnel URL needs a fresh
# Expo bundle anyway).
# shellcheck disable=SC2086  # tunnel_pid is empty unless API_MODE=cloudflare
wait -n "$expo_pid" "$watchdog_pid" $tunnel_pid || true
echo "Expo, its health check or the API tunnel stopped — exiting so systemd restarts the service" >&2
exit 1
