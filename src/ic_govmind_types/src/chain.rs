use std::collections::HashMap;

use candid::{CandidType, Deserialize};

use serde::Serialize;

use crate::dao::ChainType;

#[derive(CandidType, Debug, Clone, Serialize, Deserialize, Default)]
pub enum Network {
    Mainnet,
    #[default]
    Testnet,
    Regtest,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize, Default)]
pub enum SignatureType {
    #[default]
    Secp256k1,
    Ed25519,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize, Default)]
pub enum TokenStandard {
    #[default]
    Native,
    ERC20,
    ICRC1,
    SPL,
    BEP20,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize, Default)]
pub struct TokenConfig {
    pub token_name: String,
    pub symbol: String,
    pub contract_address: Option<String>,
    pub wrapped_address: Option<String>,
    pub decimal: u8,
    pub chain_name: String,
    pub standard: TokenStandard,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize, Default)]
pub struct RpcConfig {
    pub rpc_url: String,
    pub chain_id: Option<u64>,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize, Default)]
pub struct BlockchainConfig {
    pub chain_type: ChainType,
    pub signature_type: SignatureType,
    pub nonce: Option<u64>,
    pub gas_price: Option<u64>,
    pub rpc_config: Option<RpcConfig>,
    pub supported_tokens: Vec<TokenConfig>,
}

impl BlockchainConfig {
    pub fn new_eth_config(
        rpc_url: String,
        chain_id: Option<u64>,
        gas_price: Option<u64>,
        supported_tokens: Vec<TokenConfig>,
    ) -> Self {
        BlockchainConfig {
            chain_type: ChainType::Ethereum,
            signature_type: SignatureType::Secp256k1,
            nonce: None,
            gas_price,
            rpc_config: Some(RpcConfig { rpc_url, chain_id }),
            supported_tokens,
        }
    }

    pub fn new_official_config(
        chain_type: ChainType,
        signature_type: SignatureType,
        supported_tokens: Vec<TokenConfig>,
    ) -> Self {
        BlockchainConfig {
            chain_type,
            signature_type,
            nonce: None,
            gas_price: None,
            rpc_config: None,
            supported_tokens,
        }
    }
}
