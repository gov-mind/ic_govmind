use candid::{CandidType, Deserialize, Principal};
use ic_govmind_types::dao::Dao;
use serde::Serialize;
use serde_bytes::ByteArray;

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub struct CanisterDeploy {
    pub deploy_at: u64,
    pub canister: Principal,
    pub wasm_name: String,
    pub wasm_hash: ByteArray<32>,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub enum CanisterArgs {
    Init(StateInitArgs),
    Upgrade(StateUpgradeArgs),
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct StateInitArgs {
    pub env: KeyEnvironment,
    pub root: Principal,
    pub admins: Vec<Principal>,
    pub org_info: Option<Dao>,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct StateUpgradeArgs {
    pub root: Option<Principal>,
    pub env: Option<KeyEnvironment>,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone, Default)]
pub enum KeyEnvironment {
    Local,
    Staging,
    #[default]
    Production,
}
