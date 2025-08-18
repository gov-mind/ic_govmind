use candid::{CandidType, Deserialize, Principal};
use evm_rpc_types::{EthMainnetService, RpcServices};
use std::{collections::HashMap, time::Duration};

use crate::{
    signer::ecdsa::get_ecdsa_public_key_result,
    store::{self},
    types::{EcdsaKeyIds, KeyEnvironment, SchnorrKeyIds},
};
use ic_cdk::{init, post_upgrade, pre_upgrade};
use ic_govmind_types::{
    chain::{BlockchainConfig, RpcConfig, SignatureType, TokenConfig, TokenStandard},
    constants::{ETH_DEFAULT_GAS_PRICE, ETH_USDT_ADDRESS, ETH_WRAPPED_ETHER},
    dao::{ChainType, Dao},
};

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

#[init]
fn init(args: Option<CanisterArgs>) {
    match args {
        Some(CanisterArgs::Init(init_args)) => {
            // Initialize the state with provided values or defaults where not provided
            let ecdsa_key = EcdsaKeyIds::from_env(&init_args.env).to_key_id();
            let schnorr_key = SchnorrKeyIds::from_env(&init_args.env).to_key_id();

            store::state::with_mut(|state_ref| {
                state_ref.root = Some(init_args.root);
                state_ref.admins = init_args.admins;
                state_ref.org_info = init_args.org_info;
                state_ref.ecdsa_key = Some(ecdsa_key);
                state_ref.schnorr_key = Some(schnorr_key);
                // init data
                state_ref.chain_config = init_chain_config();
                state_ref.next_ids = HashMap::new();
                state_ref.next_ids.insert("distribution".to_string(), 1);
                state_ref.next_ids.insert("proposal".to_string(), 1);
            });
            store::state::save();

            ic_cdk_timers::set_timer(Duration::from_secs(0), || {
                ic_cdk::futures::spawn(job_ecdsa_setup())
            });
        }
        Some(CanisterArgs::Upgrade(_)) => {
            ic_cdk::trap(
                "Cannot initialize the canister with an Upgrade args. Please provide an Init args.",
            );
        }
        None => {
            ic_cdk::trap("No initialization arguments provided. Use default initialization.");
        }
    }
}

#[pre_upgrade]
fn pre_upgrade() {
    store::state::save();
}

#[post_upgrade]
fn post_upgrade(args: Option<CanisterArgs>) {
    let mut should_setup_ecdsa = false;

    match args {
        Some(CanisterArgs::Upgrade(upgrade_args)) => {
            store::state::with_mut(|state_ref| {
                if let Some(root) = upgrade_args.root {
                    state_ref.root = Some(root);
                }

                if let Some(env) = upgrade_args.env.clone() {
                    let ecdsa_key = EcdsaKeyIds::from_env(&env).to_key_id();
                    let schnorr_key = SchnorrKeyIds::from_env(&env).to_key_id();
                    state_ref.ecdsa_key = Some(ecdsa_key);
                    state_ref.schnorr_key = Some(schnorr_key);
                    should_setup_ecdsa = true;
                }
            });

            store::state::save();

            if should_setup_ecdsa {
                ic_cdk_timers::set_timer(Duration::from_secs(0), || {
                    ic_cdk::futures::spawn(job_ecdsa_setup())
                });
            }
        }
        Some(CanisterArgs::Init(_)) => {
            ic_cdk::trap(
                "Cannot upgrade the canister with Init args. Please provide Upgrade args.",
            );
        }
        None => {
            // No arguments provided; do nothing
        }
    }
}

async fn job_ecdsa_setup() {
    let ecdsa_response = get_ecdsa_public_key_result(vec![])
        .await
        .expect("Failed to get ecdsa key");

    store::state::with_mut(|state| {
        state.ecdsa_public_key = Some(ecdsa_response);
    });
    store::state::save();
}

pub fn init_chain_config() -> Vec<BlockchainConfig> {
    let mut chains = Vec::new();

    // 1. Initialize Internet Computer Chain
    let icp_chain = BlockchainConfig {
        chain_type: ChainType::InternetComputer,
        signature_type: SignatureType::Ed25519,
        nonce: None,
        gas_price: None,
        rpc_config: Some(RpcConfig {
            rpc_url: "https://icp.network.rpc".to_string(),
            chain_id: None,
            rpc_services: None,
        }),
        supported_tokens: vec![
            TokenConfig {
                token_name: "ICP".to_string(),
                symbol: "ICP".to_string(),
                contract_address: Some(String::from("ryjl3-tyaaa-aaaaa-aaaba-cai")),
                decimal: 8,
                chain_name: "Internet Computer".to_string(),
                standard: TokenStandard::Native,
                fee: 10_000,
                ..Default::default()
            },
            TokenConfig {
                token_name: "ckETH".to_string(),
                symbol: "ckETH".to_string(),
                contract_address: Some(String::from("ss2fx-dyaaa-aaaar-qacoq-cai")),
                decimal: 18,
                chain_name: "Internet Computer".to_string(),
                standard: TokenStandard::ICRC2,
                fee: 2_000_000_000_000,
                ..Default::default()
            },
            TokenConfig {
                token_name: "ckUSDT".to_string(),
                symbol: "ckUSDT".to_string(),
                contract_address: Some(String::from("cngnf-vqaaa-aaaar-qag4q-cai")),
                decimal: 6,
                chain_name: "Internet Computer".to_string(),
                standard: TokenStandard::ICRC1,
                fee: 10_000,
                ..Default::default()
            },
            TokenConfig {
                token_name: "ckUSDC".to_string(),
                symbol: "ckUSDC".to_string(),
                contract_address: Some(String::from("xevnm-gaaaa-aaaar-qafnq-cai")),
                decimal: 6,
                chain_name: "Internet Computer".to_string(),
                standard: TokenStandard::ICRC1,
                fee: 10_000,
                ..Default::default()
            },
        ],
        ..Default::default()
    };

    // 2. Initialize Ethereum Chain
    let eth_chain = BlockchainConfig::new_eth_config(
        "https://mainnet.infura.io/v3/862ac423417a4a4a728e181a0e4206f3c7".to_string(),
        Some(1), // Ethereum mainnet chain ID
        Some(RpcServices::EthMainnet(Some(vec![
            EthMainnetService::PublicNode,
        ]))),
        Some(ETH_DEFAULT_GAS_PRICE),
        vec![
            TokenConfig {
                token_name: "ETH".to_string(),
                symbol: "ETH".to_string(),
                contract_address: None,
                wrapped_address: Some(ETH_WRAPPED_ETHER.to_string()),
                decimal: 18,
                chain_name: "Ethereum".to_string(),
                standard: TokenStandard::Native,
                ..Default::default()
            },
            TokenConfig {
                token_name: "USDT".to_string(),
                symbol: "USDT".to_string(),
                contract_address: Some(ETH_USDT_ADDRESS.to_string()),
                decimal: 6,
                chain_name: "Ethereum".to_string(),
                standard: TokenStandard::ERC20,
                ..Default::default()
            },
        ],
    );

    // 3. Initialize Bitcoin Chain
    let btc_chain = BlockchainConfig {
        chain_type: ChainType::Bitcoin,
        signature_type: SignatureType::Secp256k1,
        nonce: None,
        gas_price: None,
        rpc_config: Some(RpcConfig {
            rpc_url: "https://blockstream.info/api/".to_string(),
            chain_id: None,
            rpc_services: None,
        }),
        supported_tokens: vec![TokenConfig {
            token_name: "BTC".to_string(),
            symbol: "BTC".to_string(),
            contract_address: None,
            decimal: 8,
            chain_name: "Bitcoin".to_string(),
            standard: TokenStandard::Native,
            ..Default::default()
        }],
        ..Default::default()
    };

    chains.push(icp_chain);
    chains.push(eth_chain);
    chains.push(btc_chain);

    chains
}
