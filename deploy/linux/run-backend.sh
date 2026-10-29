#!/usr/bin/env bash
# Started by digger-backend.service — runs the FastAPI backend.
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$DEPLOY_DIR/../.." && pwd)"
# shellcheck source=config.env.example
source "$DEPLOY_DIR/config.env"

# Behind a tunnel or proxy the API only needs to be reachable locally.
HOST=0.0.0.0
if [[ "$API_MODE" == "cloudflare" ]]; then
  HOST=127.0.0.1
fi

cd "$ROOT_DIR/backend"
exec .venv/bin/uvicorn main:app --host "$HOST" --port "$BACKEND_PORT" --proxy-headers
