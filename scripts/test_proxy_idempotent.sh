#!/usr/bin/env bash

# Request target URL
URL="https://idempotent-proxy-cf-worker.zensh.workers.dev/URL_HTTPBIN"

# Create a temporary directory to save responses
TMP_DIR=$(mktemp -d)
echo "Sending 20 requests..."

# Send 20 identical requests with the same idempotency key
for i in {1..20}; do
  curl -s -v -X GET "$URL" \
    -H "idempotency-key: idempotency_key_001" \
    -H "content-type: application/json" \
    -D "$TMP_DIR/headers_$i.txt" \
    -o "$TMP_DIR/body_$i.json"
done

echo "Comparing responses..."

# Use the first response as the base for comparison
base_body=$(<"$TMP_DIR/body_1.json")
# Exclude non-deterministic headers (like timestamps, CF-specific, etc.)
base_headers=$(grep -v -E '^(Date:|Server:|cf-ray:|report-to:|NEL:|X-|Alt-Svc:|Connection:|Via:)' "$TMP_DIR/headers_1.txt")

for i in {2..20}; do
  current_body=$(<"$TMP_DIR/body_$i.json")
  current_headers=$(grep -v -E '^(Date:|Server:|cf-ray:|report-to:|NEL:|X-|Alt-Svc:|Connection:|Via:)' "$TMP_DIR/headers_$i.txt")

  if [[ "$current_body" != "$base_body" ]]; then
    echo "❌ Body of response $i is different from response 1."
    diff <(echo "$base_body") <(echo "$current_body")
    exit 1
  fi

  if [[ "$current_headers" != "$base_headers" ]]; then
    echo "❌ Headers of response $i are different from response 1."
    diff <(echo "$base_headers") <(echo "$current_headers")
    exit 1
  fi
done

echo "✅ All 20 responses (body and headers) are identical."

# Optional: Clean up temporary files
rm -rf "$TMP_DIR"
