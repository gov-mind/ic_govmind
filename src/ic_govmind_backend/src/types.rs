use candid::{CandidType, Deserialize, Principal};
use ic_cdk::management_canister::{
    EcdsaCurve, EcdsaKeyId, SchnorrAlgorithm::Bip340secp256k1, SchnorrKeyId,
};
use serde::Serialize;
use std::collections::HashMap;

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
