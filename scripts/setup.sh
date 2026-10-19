#!/usr/bin/env bash
# One-time local setup. Safe to re-run: existing .env files and data are kept.
#
#   ./scripts/setup.sh
#   OPENAI_API_KEY=sk-... ./scripts/setup.sh   # also enables OpenAI
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() { printf '\n==> %s\n' "$1"; }
fail() { printf 'Error: %s\n' "$1" >&2; exit 1; }

step "Checking prerequisites"
command -v node >/dev/null || fail "Node.js is not installed (need 22.12 or later)"
command -v docker >/dev/null || fail "Docker is not installed"
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is not available"
docker info >/dev/null 2>&1 || fail "Docker is not running"

node -e '
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12)) process.exit(1);
' || fail "Node.js $(node -v) is too old (need 22.12 or later)"
echo "node $(node -v), $(docker --version)"

# Sets KEY=value in an env file, adding the line if it is missing.
set_env() {
  node -e '
    const fs = require("fs");
    const [file, key, value] = process.argv.slice(1);
    const lines = fs.readFileSync(file, "utf8").split("\n");
    const i = lines.findIndex((l) => l.startsWith(key + "="));
    if (i >= 0) lines[i] = `${key}=${value}`;
    else lines.splice(lines.length - 1, 0, `${key}=${value}`);
    fs.writeFileSync(file, lines.join("\n"));
  ' "$1" "$2" "$3"
}

step "Preparing .env files"
for file in .env backend/.env; do
  if [ -f "$file" ]; then
    echo "$file already exists, leaving it as is"
  else
    cp "$file.example" "$file"
    echo "created $file"
  fi
done

if [ -n "${OPENAI_API_KEY:-}" ]; then
  for file in .env backend/.env; do
    set_env "$file" OPENAI_API_KEY "$OPENAI_API_KEY"
    set_env "$file" LLM_PROVIDER openai
  done
  echo "OpenAI enabled in both .env files"
fi

step "Starting PostgreSQL"
docker compose up -d db
printf 'waiting for the database'
for _ in $(seq 1 30); do
  status="$(docker inspect -f '{{.State.Health.Status}}' claims-db 2>/dev/null || true)"
  [ "$status" = "healthy" ] && break
  printf '.'
  sleep 1
done
echo
[ "$status" = "healthy" ] || fail "the database did not become healthy, see: docker compose logs db"

step "Installing backend dependencies"
(cd backend && npm ci)

step "Applying database migrations"
(cd backend && npx prisma migrate deploy)

step "Loading demo data (skipped if the database already has claims)"
(cd backend && SEED_ONLY_IF_EMPTY=true npm run db:seed)

step "Installing frontend dependencies"
(cd frontend && npm ci)

cat <<'EOF'

Setup complete.

  Start everything:   ./scripts/dev.sh
  Then open:          http://localhost:5173

  Reset demo data:    cd backend && npm run db:seed
  Browse the DB:      docker exec -it claims-db psql -U claims -d claims
EOF
