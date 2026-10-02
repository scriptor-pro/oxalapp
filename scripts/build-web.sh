#!/usr/bin/env bash
# Builds the production web bundle and deploys it to the VPS, where nginx
# serves it directly from ~/oxalapp-web on oxa.bvh.fyi (PocketBase itself
# stays reachable under /api/ and /_/ — see the nginx config in
# /etc/nginx/conf.d/oxa.bvh.fyi.d/ on the VPS, set up 2026-08-21).
#
# Uses .env.production (VITE_POCKETBASE_URL=https://oxa.bvh.fyi) since that
# is Vite's default file for a plain `vite build`.
#
# Deploys over rsync with a dedicated key (~/.ssh/oxalapp-deploy, no
# passphrase) that the VPS restricts to rrsync on ~/oxalapp-web: no shell,
# write-only, so the script runs unattended. Remote paths are relative to
# that directory, hence the bare "$REMOTE:" destination.
#
# Usage: scripts/build-web.sh [user@host] [--dry-run]
#   Defaults to baudouin@83.138.55.83. --dry-run lists what would be
#   uploaded or deleted without touching the VPS.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="baudouin@83.138.55.83"
DRY_RUN=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=(--dry-run --itemize-changes) ;;
    *) REMOTE="$arg" ;;
  esac
done
DEPLOY_KEY="$HOME/.ssh/oxalapp-deploy"

cd "$REPO_ROOT"

echo "==> Building web bundle (production)"
npm run build

echo "==> Deploying dist/ to $REMOTE:~/oxalapp-web"
# --delete retire les anciens bundles (noms hachés par Vite).
rsync -rtz --delete "${DRY_RUN[@]}" \
  -e "ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o BatchMode=yes" \
  dist/ "$REMOTE:"
[[ ${#DRY_RUN[@]} -gt 0 ]] && exit 0

echo "==> Deployed. Verifying..."
curl -sf "https://oxa.bvh.fyi/api/health" >/dev/null && echo "PocketBase API OK"
curl -sf -o /dev/null "https://oxa.bvh.fyi/" && echo "Web app OK"
