use candid::{CandidType, Deserialize, Principal};
use evm_rpc_types::{EthMainnetService, EthSepoliaService, RpcApi, RpcService};
use ic_cdk::management_canister::{
    EcdsaCurve, EcdsaKeyId, SchnorrAlgorithm::Bip340secp256k1, SchnorrKeyId,
};
use ic_govmind_types::dao::ChainType;
use ic_ledger_types::{AccountIdentifier, Subaccount};
use icrc_ledger_types::icrc1::account::Account;
use serde::Serialize;
use std::str::FromStr;
use tiny_keccak::{Hasher, Sha3};

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

#[derive(CandidType, Serialize, Deserialize, Debug, Clone, Default)]
pub enum KeyEnvironment {
    #[default]
    Local,
    Staging,
    Production,
}

impl KeyEnvironment {
    pub fn get_rpc_service(&self) -> RpcService {
        match self {
            KeyEnvironment::Staging => RpcService::EthSepolia(EthSepoliaService::PublicNode),
            KeyEnvironment::Local => RpcService::Custom(RpcApi {
                url: "http://127.0.0.1:8545".to_string(),
                headers: None,
            }),
            KeyEnvironment::Production => RpcService::EthMainnet(EthMainnetService::PublicNode),
        }
    }
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

impl From<&Principal> for Addresses {
    fn from(value: &Principal) -> Self {
        let mut hash = [0u8; 32];
        let mut hasher = Sha3::v256();
        hasher.update(value.as_slice());
        hasher.finalize(&mut hash);
        Self::from(hash)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum NextIdType {
    Distribution,
    Proposal,
    Order,
    Payment,
}

impl ToString for NextIdType {
    fn to_string(&self) -> String {
        match self {
            NextIdType::Distribution => "distribution",
            NextIdType::Proposal => "proposal",
            NextIdType::Order => "order",
            NextIdType::Payment => "payment",
        }
        .to_string()
    }
}

impl FromStr for NextIdType {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "distribution" => Ok(NextIdType::Distribution),
            "proposal" => Ok(NextIdType::Proposal),
            "order" => Ok(NextIdType::Order),
            "payment" => Ok(NextIdType::Payment),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct QueryBalanceArg {
    pub chain_type: ChainType,
    pub token_name: String,
    pub wallet_address: String,
    pub subaccount: Option<Subaccount>,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct BalanceResult {
    pub token_name: String,
    pub balance: u128,
}
