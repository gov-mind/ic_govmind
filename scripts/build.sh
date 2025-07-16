cargo build --release --target wasm32-unknown-unknown --package ic_govmind_backend
ic-wasm target/wasm32-unknown-unknown/release/ic_govmind_backend.wasm -o target/wasm32-unknown-unknown/release/ic_govmind_backend.wasm shrink
gzip -f -c target/wasm32-unknown-unknown/release/ic_govmind_backend.wasm > wasm/ic_govmind_backend.wasm.gz