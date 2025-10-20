use candid::CandidType;
use serde::{Deserialize, Serialize};

pub const ICRC1_LEDGER_DEFAULT_CYCLES: u128 = 1_000_000_000_000;
pub const ICRC1_LEDGER_DEFAULT_DECIMAL: u8 = 8;
pub const ICRC1_LEDGER_DEFAULT_FEE: u128 = 10_000;

pub const ETH_DEFAULT_GAS_PRICE: u64 = 30_000_000_000;
pub const ETH_WRAPPED_ETHER: &str = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH
pub const ETH_USDT_ADDRESS: &str = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT
pub const ETH_USDC_ADDRESS: &str = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
pub const EVM_CALL_DEFAULT_CYCLES: u128 = 2_000_000_000;
pub const ETH_TEST_USDT_ADDRESS: &str = "0x707b6ee872d2C7DA369200405CB3DBA4Cfe6332d"; // test USDT

pub const TEST_LEDGER_CANISTER_ID: &str = "s57im-oyaaa-aaaas-akwma-cai";
pub const TEST_CKBTC_LEDGER_CANISTER_ID: &str = "s57im-oyaaa-aaaas-akwma-cai";
pub const TEST_FACTORY_CANISTER_PID: &str = "3ja73-kyaaa-aaaaj-qnrta-cai";
pub const TEST_HUB_CANISTER_PID: &str = "3ja73-kyaaa-aaaaj-qnrta-cai";

pub const FACTORY_CANISTER_PID: &str = "3ja73-kyaaa-aaaaj-qnrta-cai";
pub const HUB_CANISTER_PID: &str = "3ja73-kyaaa-aaaaj-qnrta-cai";
pub const LEDGER_CANISTER_ID: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai";
pub const CKBTC_LEDGER_CANISTER_ID: &str = "mxzaz-hqaaa-aaaar-qaada-cai";
pub const EVM_RPC_CANISTER_ID: &str = "myniu-wqaaa-aaaah-advna-cai";
pub const EVM_RPC_OFFICIAL_CANISTER_ID: &str = "7hfb6-caaaa-aaaar-qadga-cai";

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub enum CanisterType {
    Factory,
    Hub,
    Ledger,
    CkBTCLedger,
}

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub enum Environment {
    Test,
    Production,
}

impl Environment {
    pub fn get_canister_pid(&self, canister_type: CanisterType) -> &'static str {
        match self {
            Environment::Test => match canister_type {
                CanisterType::Factory => TEST_FACTORY_CANISTER_PID,
                CanisterType::Hub => TEST_HUB_CANISTER_PID,
                CanisterType::Ledger => TEST_LEDGER_CANISTER_ID,
                CanisterType::CkBTCLedger => TEST_CKBTC_LEDGER_CANISTER_ID,
            },
            Environment::Production => match canister_type {
                CanisterType::Factory => FACTORY_CANISTER_PID,
                CanisterType::Hub => HUB_CANISTER_PID,
                CanisterType::Ledger => LEDGER_CANISTER_ID,
                CanisterType::CkBTCLedger => CKBTC_LEDGER_CANISTER_ID,
            },
        }
    }
}
