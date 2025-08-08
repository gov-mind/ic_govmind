use candid::{CandidType, Deserialize};
use ic_cdk::management_canister::{
    EcdsaCurve, EcdsaKeyId, SchnorrAlgorithm::Bip340secp256k1, SchnorrKeyId,
};
use ic_ledger_types::AccountIdentifier;
use icrc_ledger_types::icrc1::account::Account;
use serde::Serialize;

use crate::{
    chain::{bitcoin::account_to_p2pkh_address, ethereum::account_to_eth_address},
    BITCOIN_NETWORK,
};

#[allow(non_snake_case)]
#[derive(Debug, CandidType, Deserialize)]
pub struct StatusRequest {
    pub cycles: bool,
    pub memory_size: bool,
    pub heap_memory_size: bool,
}

#[allow(non_snake_case)]
#[derive(Debug, CandidType)]
pub struct StatusResponse {
    pub cycles: Option<u64>,
    pub memory_size: Option<u64>,
    pub heap_memory_size: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub enum KeyEnvironment {
    Local,
    Staging,
    Production,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub enum EcdsaKeyIds {
    TestKey1,
    ProductionKey,
    TestKeyLocalDevelopment,
}

impl EcdsaKeyIds {
    pub fn to_key_id(&self) -> EcdsaKeyId {
        EcdsaKeyId {
            curve: EcdsaCurve::Secp256k1,
            name: match self {
                Self::TestKey1 => "test_key_1".into(),
                Self::ProductionKey => "key_1".into(),
                Self::TestKeyLocalDevelopment => "dfx_test_key".into(),
            },
        }
    }

    pub fn from_env(env: &KeyEnvironment) -> Self {
        match env {
            KeyEnvironment::Production => EcdsaKeyIds::ProductionKey,
            KeyEnvironment::Staging => EcdsaKeyIds::TestKey1,
            KeyEnvironment::Local => EcdsaKeyIds::TestKeyLocalDevelopment,
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub enum SchnorrKeyIds {
    TestKey1,
    ProductionKey,
    TestKeyLocalDevelopment,
}

impl SchnorrKeyIds {
    pub fn to_key_id(&self) -> SchnorrKeyId {
        SchnorrKeyId {
            algorithm: Bip340secp256k1,
            name: match self {
                Self::TestKey1 => "test_key_1".into(),
                Self::ProductionKey => "key_1".into(),
                Self::TestKeyLocalDevelopment => "dfx_test_key".into(),
            },
        }
    }

    pub fn from_env(env: &KeyEnvironment) -> Self {
        match env {
            KeyEnvironment::Production => SchnorrKeyIds::ProductionKey,
            KeyEnvironment::Staging => SchnorrKeyIds::TestKey1,
            KeyEnvironment::Local => SchnorrKeyIds::TestKeyLocalDevelopment,
        }
    }
}

#[derive(CandidType, Deserialize, Debug)]
pub struct Addresses {
    pub icrc1: Account,
    pub icrc1_string: String,
    pub account_identifier: AccountIdentifier,
    pub account_identifier_string: String,
    pub bitcoin: String,
    pub ethereum: String,
    pub solana: String,
}

impl From<[u8; 32]> for Addresses {
    fn from(subaccount: [u8; 32]) -> Self {
        let id = ic_cdk::api::canister_self();
        let account_identifier =
            AccountIdentifier::new(&id, &ic_ledger_types::Subaccount(subaccount));
        let account = Account {
            owner: id,
            subaccount: Some(subaccount),
        };
        let bitcoin = account_to_p2pkh_address(&account, BITCOIN_NETWORK);
        let ethereum = account_to_eth_address().unwrap();
        Addresses {
            icrc1: account,
            icrc1_string: account.to_string(),
            account_identifier,
            account_identifier_string: account_identifier.to_string(),
            bitcoin,
            ethereum,
            solana: String::from(""),
        }
    }
}
