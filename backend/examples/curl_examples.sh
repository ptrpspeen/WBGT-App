#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

curl -s "${BASE_URL}/health"
printf "\n"

curl -s "${BASE_URL}/metadata"
printf "\n"

curl -s -X POST "${BASE_URL}/predict-wbgt" \
  -H "Content-Type: application/json" \
  --data @"${SCRIPT_DIR}/sample_request.json"
printf "\n"

curl -s -X POST "${BASE_URL}/predict-wbgt-batch" \
  -H "Content-Type: application/json" \
  --data @"${SCRIPT_DIR}/batch_request.json"
printf "\n"
