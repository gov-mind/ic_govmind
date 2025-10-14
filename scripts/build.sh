#!/usr/bin/env bash
set -euo pipefail

TARGET="wasm32-unknown-unknown"
PACKAGE="ic_govmind_backend"
OUTPUT_DIR="../target/wasm32-unknown-unknown/release"
FINAL_WASM="${OUTPUT_DIR}/${PACKAGE}.wasm"
COMPRESSED_WASM_DIR="wasm"
COMPRESSED_WASM="../${COMPRESSED_WASM_DIR}/${PACKAGE}.wasm.gz"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
cd "$SCRIPT_DIR"

# Ensure output dir exists
mkdir -p "$COMPRESSED_WASM_DIR"

echo "Building package: $PACKAGE for target: $TARGET"

if [ "$(uname)" == "Darwin" ]; then
  LLVM_PATH=$(brew --prefix llvm)
  echo "Using LLVM clang from: $LLVM_PATH"
  AR="${LLVM_PATH}/bin/llvm-ar" CC="${LLVM_PATH}/bin/clang" cargo build --release --target $TARGET --package $PACKAGE
else
  cargo build --release --target $TARGET --package $PACKAGE
fi

echo "Shrinking WASM using ic-wasm..."
ic-wasm $FINAL_WASM -o $FINAL_WASM shrink

echo "Compressing with gzip..."
gzip -f -c $FINAL_WASM > $COMPRESSED_WASM

echo "Done ✅"
echo "Optimized WASM: $FINAL_WASM"
echo "Compressed GZIP: $COMPRESSED_WASM"
