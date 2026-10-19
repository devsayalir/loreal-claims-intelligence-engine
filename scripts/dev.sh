#!/usr/bin/env bash
# Starts the database, the API (port 3000) and the web app (port 5173).
# Ctrl+C stops the API and the web app; the database container keeps running.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[ -d backend/node_modules ] && [ -d frontend/node_modules ] ||
  { echo "Dependencies are missing. Run ./scripts/setup.sh first." >&2; exit 1; }

docker compose up -d db

trap 'trap - INT TERM EXIT; kill 0' INT TERM EXIT

prefix() { awk -v p="$1" '{ print p $0; fflush() }'; }

(cd backend && npm run start:dev 2>&1 | prefix '[api] ') &
(cd frontend && npm run dev 2>&1 | prefix '[web] ') &

wait
