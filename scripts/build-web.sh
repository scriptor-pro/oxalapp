#!/usr/bin/env bash
# Builds the production web bundle and deploys it to the VPS, where nginx
# serves it directly from ~/oxalapp-web on oxa.bvh.fyi (PocketBase itself
# stays reachable under /api/ and /_/ — see the nginx config in
# /etc/nginx/conf.d/oxa.bvh.fyi.d/ on the VPS, set up 2026-08-21).
#
# Uses .env.production (VITE_POCKETBASE_URL=https://oxa.bvh.fyi) since that
# is Vite's default file for a plain `vite build`.
#
# Usage: scripts/build-web.sh [user@host] [remote-dir]
#   Defaults to baudouin@83.138.55.83 and ~/oxalapp-web if not given.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${1:-baudouin@83.138.55.83}"
REMOTE_DIR="${2:-oxalapp-web}"

cd "$REPO_ROOT"

echo "==> Building web bundle (production)"
npm run build

echo "==> Deploying dist/ to $REMOTE:~/$REMOTE_DIR"
scp -r dist/. "$REMOTE:~/$REMOTE_DIR"

echo "==> Deployed. Verifying..."
curl -sf "https://oxa.bvh.fyi/api/health" >/dev/null && echo "PocketBase API OK"
curl -sf -o /dev/null "https://oxa.bvh.fyi/" && echo "Web app OK"
