#!/usr/bin/env bash
# Ping Milady API canister to keep it warm (avoid cold starts).
# Run via cron every 5 min: */5 * * * * /path/to/scripts/milady-api-heartbeat.sh
set -e
API_URL="${MILADY_API_URL:-https://uf5nc-hyaaa-aaaau-afpua-cai.icp0.io}"
curl -sf --max-time 60 "${API_URL}/api/status" -H "Accept: application/json" -o /dev/null || true
