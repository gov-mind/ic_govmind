pub mod api_cycles;
pub mod chain;
pub mod guards;
pub mod init;
pub mod query_api;
pub mod services;
pub mod signer;
pub mod store;
pub mod timer;
pub mod types;
pub mod update_api;
pub mod utils;
pub mod wallet;
pub mod candid_file_generator;

pub const ICRC1_WASM: &[u8] = std::include_bytes!("../../icrc1_ledger/icrc1-ledger.wasm.gz");
pub const BITCOIN_NETWORK: ic_cdk::bitcoin_canister::Network =
    ic_cdk::bitcoin_canister::Network::Testnet;

ic_cdk::export_candid!();
