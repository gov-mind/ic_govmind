#!/usr/bin/env bash

# Request parameters
URL="https://ai-proxy.govmind.info/proxy"
POST_DATA='{
  "proposal_id": "999999",
  "timestamp": "1633024800",
  "messages": [{"role": "user", "content": "Hello, world!"}],
  "model": "deepseek-chat"
}'

# Temporary directory to store response data
TMP_DIR=$(mktemp -d)
echo "Sending 20 requests..."

# Send the same POST request 20 times
for i in {1..20}; do
  curl -s -D "$TMP_DIR/headers_$i.txt" \
    -H "Content-Type: application/json" \
    -H "idempotency-key: fixed-key-001" \
    -X POST "$URL" \
    -d "$POST_DATA" \
    -o "$TMP_DIR/body_$i.json"
done

echo "Comparing responses..."

# Use response 1 as baseline
base_body=$(<"$TMP_DIR/body_1.json")
base_headers=$(grep -v -E '^Date:|^Server:|^X-' "$TMP_DIR/headers_1.txt")

for i in {2..20}; do
  current_body=$(<"$TMP_DIR/body_$i.json")
  current_headers=$(grep -v -E '^Date:|^Server:|^X-' "$TMP_DIR/headers_$i.txt")

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

# Optional cleanup
rm -rf "$TMP_DIR"
