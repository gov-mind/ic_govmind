use candid::{CandidType, Deserialize};
use evm_rpc_types::RpcServices;
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
    ICRC2,
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

#[derive(CandidType, Clone, Deserialize, Debug, Default, Serialize)]
pub struct RpcConfig {
    pub rpc_url: String,
    pub chain_id: Option<u64>,
    pub rpc_services: Option<RpcServices>,
}

#[derive(CandidType, Debug, Clone, Deserialize, Default, Serialize)]
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
        rpc_services: Option<RpcServices>,
        gas_price: Option<u64>,
        supported_tokens: Vec<TokenConfig>,
    ) -> Self {
        BlockchainConfig {
            chain_type: ChainType::Ethereum,
            signature_type: SignatureType::Secp256k1,
            nonce: None,
            gas_price,
            rpc_config: Some(RpcConfig {
                rpc_url,
                chain_id,
                rpc_services,
            }),
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

    pub fn get_token_config(&self, token_name: &str) -> Result<&TokenConfig, String> {
        self.supported_tokens
            .iter()
            .find(|t| t.token_name == token_name)
            .ok_or_else(|| format!("Token {} not supported", token_name))
    }
}
