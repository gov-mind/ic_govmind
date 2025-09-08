use crate::{
    services::{evm_abi::generate_create_token, evm_service::EvmService, token_icrc1::TokenICRC1},
    signer::signing,
    store::state,
    utils::{account_id, convert_subaccount, nat_to_u128, owner_wallet_pid},
    ETH_CREATE_TOKEN_CONTRACT, ETH_CREATE_TOKEN_GAS, ETH_DEFAULT_GAS_PRICE,
};
use base58::ToBase58;
use bitcoin_hashes::{ripemd160, sha256, Hash as BitcoinHash};
use candid::{CandidType, Deserialize, Principal};
use ethers_core::types::H160;
use evm_rpc_types::{MultiRpcResult, SendRawTransactionStatus};
use ic_govmind_types::{
    chain::{BlockchainConfig, TokenConfig, TokenStandard},
    constants::{EVM_RPC_CANISTER_ID, LEDGER_CANISTER_ID},
    dao::ChainType,
};
use ic_ledger_types::{account_balance, AccountBalanceArgs, Subaccount};
use ic_web3_rs::{
    ethabi::ethereum_types::Address,
    ic::KeyInfo,
    transports::ICHttp,
    types::{TransactionParameters, U256},
    Web3,
};
use icrc_ledger_types::icrc1::account::Account;
use libsecp256k1::{PublicKey, PublicKeyFormat};
use serde::{de::Error as DeError, Serialize};
use serde_json::{self, Value};
use std::str::FromStr;

#[derive(CandidType, Clone, Deserialize, Serialize, Debug, Default)]
pub struct WalletConfig {
    pub wallet_id: u64,
    pub chain_name: String,    // Name of the blockchain
    pub chain_type: ChainType, // The type of the blockchain
    pub nonce: Option<u128>,
    pub gas_price: Option<u64>,
    pub wallet_address: String,
    pub subaccount: Option<Subaccount>,
}

impl WalletConfig {
    pub fn new(chain_type: ChainType) -> Self {
        WalletConfig {
            chain_type,
            ..Default::default()
        }
    }

    pub fn get_wallet_address(
        &self,
        public_key: &[u8],
        subaccount: &Option<Subaccount>,
    ) -> Result<String, String> {
        match self.chain_type {
            ChainType::InternetComputer => {
                // For ICP, use the provided canister_id or return an error if not available
                Ok(account_id(owner_wallet_pid(), subaccount.clone()).to_hex())
            }
            ChainType::BNBChain | ChainType::Ethereum => {
                // For Ethereum, derive the Ethereum address
                Self::derive_eth_address(public_key)
            }
            ChainType::Bitcoin => {
                // For Bitcoin, derive the Bitcoin address
                Self::derive_btc_address(public_key)
            }
            ChainType::Solana => {
                // For Solana, derive the Solana address
                Self::derive_solana_address(public_key)
            }
            ChainType::TON => todo!(),
            ChainType::Other(_) => todo!(),
        }
    }

    pub fn derive_eth_address(public_key: &[u8]) -> Result<String, String> {
        // Parse the compressed public key
        let uncompressed_pubkey =
            match PublicKey::parse_slice(public_key, Some(PublicKeyFormat::Compressed)) {
                Ok(key) => key.serialize(),
                Err(_) => {
                    return Err("Failed to uncompress the public key.".to_string());
                }
            };

        // Perform Keccak256 hash of the uncompressed public key (skip the first byte)
        let hash = signing::keccak256(&uncompressed_pubkey[1..]);

        // Extract the last 20 bytes of the hash as the Ethereum address
        let eth_address = &hash[12..];

        // Convert the address to a hexadecimal string and return
        Ok(format!("0x{}", hex::encode(eth_address)))
    }

    // Function to derive Bitcoin address (P2PKH) from the ECDSA public key
    fn derive_btc_address(public_key: &[u8]) -> Result<String, String> {
        // Perform SHA-256 on the public key
        let sha256_hash = sha256::Hash::hash(public_key);

        // Perform RIPEMD-160 on the result of SHA-256
        let ripemd160_hash = ripemd160::Hash::hash(sha256_hash.as_ref());

        // Add version byte (0x00 for Bitcoin mainnet) to the beginning
        let mut address_bytes = vec![0x00]; // Version byte for Bitcoin mainnet
        address_bytes.extend_from_slice(ripemd160_hash.as_ref()); // Extract bytes from ripemd160::Hash

        // Perform checksum by hashing the address twice with SHA-256
        let sha256_once = sha256::Hash::hash(&address_bytes); // First SHA-256
        let checksum = sha256::Hash::hash(sha256_once.as_ref()); // Second SHA-256
        address_bytes.extend_from_slice(&checksum[0..4]); // Add the first 4 bytes of the checksum

        // Base58 encode the result and return
        Ok(address_bytes.to_base58())
    }

    fn derive_solana_address(public_key: &[u8]) -> Result<String, String> {
        let address = bs58::encode(public_key).into_string();
        return Ok(address);
    }
}

#[derive(Debug, Clone)]
pub struct WalletBlockchainConfig(pub BlockchainConfig);

impl WalletBlockchainConfig {
    pub async fn query_balance(
        &self,
        token_name: &str,
        wallet_address: &String,
        subaccount: &Option<Subaccount>,
    ) -> Result<u128, String> {
        // Find the token by name
        let token_config = self.0.get_token_config(token_name)?;

        // Match the blockchain type and query balance based on the token standard
        let balance = match self.0.chain_type {
            ChainType::InternetComputer => {
                self.query_balance_internet_computer(&token_config, wallet_address, subaccount)
                    .await
            }
            ChainType::Ethereum => {
                self.query_balance_ethereum(&token_config, wallet_address)
                    .await
            }
            _ => Err("Not supported".to_string()),
        }?;

        Ok(balance)
    }

    async fn query_balance_internet_computer(
        &self,
        token: &TokenConfig,
        wallet_address: &str,
        subaccount: &Option<Subaccount>,
    ) -> Result<u128, String> {
        let wallet_pid = if !wallet_address.is_empty() {
            Principal::from_text(wallet_address)
                .map_err(|_| "Invalid wallet_address Principal".to_string())?
        } else {
            owner_wallet_pid()
        };

        match token.standard {
            TokenStandard::Native => {
                let wallet_account_id = account_id(wallet_pid, subaccount.clone());
                let balance_arg = AccountBalanceArgs {
                    account: wallet_account_id,
                };

                match account_balance(
                    Principal::from_text(LEDGER_CANISTER_ID).unwrap(),
                    &balance_arg,
                )
                .await
                {
                    Ok(balance) => Ok(balance.e8s() as u128),
                    Err(_) => Err("Failed to query balance".to_string()),
                }
            }
            TokenStandard::ICRC1 | TokenStandard::ICRC2 => {
                let token_address = match token.contract_address.as_deref() {
                    Some(address) => address,
                    None => return Err("Invalid token contract address".to_string()),
                };
                let icrc1_subaccount = convert_subaccount(subaccount.clone());

                let wallet_account = Account {
                    owner: wallet_pid,
                    subaccount: icrc1_subaccount,
                };
                let canister_service = TokenICRC1::new(token_address)?;

                match canister_service.icrc1_balance_of(wallet_account).await {
                    Ok(balance) => match nat_to_u128(&balance) {
                        Some(value) => Ok(value),
                        None => Err("Balance is too large to fit in a u64".to_string()),
                    },
                    Err(e) => {
                        ic_cdk::println!("[query_balance_internet_computer] Failed to query ICRC1 balance, wallet_account={:?}, token_canister={:?}, err={:?}", wallet_account.to_string(), token.contract_address, e);
                        Err("Failed to query ICRC1 balance".to_string())
                    }
                }
            }
            _ => Err("Token standard not supported on Internet Computer".to_string()),
        }
    }

    // Query balance method for Ethereum
    async fn query_balance_ethereum(
        &self,
        token: &TokenConfig,
        wallet_address: &str,
    ) -> Result<u128, String> {
        let evm_service = EvmService::new(EVM_RPC_CANISTER_ID)?;
        let env = state::get_env();
        let rpc_service = env.get_rpc_service();

        match token.standard {
            TokenStandard::Native => {
                match evm_service
                    .get_eth_balance(rpc_service, wallet_address)
                    .await
                {
                    Ok((Ok(balance_json),)) => {
                        let balance_hex = match serde_json::from_str::<Value>(&balance_json) {
                            Ok(json) => {
                                match json.get("result").and_then(|result| result.as_str()) {
                                    Some(hex) => Ok(hex.to_string()),
                                    None => Err(serde_json::Error::custom(
                                        "Failed to extract 'result' from JSON",
                                    )),
                                }
                            }
                            Err(e) => Err(e),
                        };

                        let balance = match balance_hex {
                            Ok(hex) => {
                                // Convert the hex string to u64
                                u128::from_str_radix(hex.trim_start_matches("0x"), 16)
                                    .map_err(|_| "Failed to parse balance".to_string())?
                            }
                            Err(e) => {
                                return Err(format!("Error parsing balance JSON: {:?}", e));
                            }
                        };

                        Ok(balance)
                    }
                    Ok((Err(e),)) => Err(format!("Error querying balance: {:?}", e)),
                    Err(e) => Err(format!("Failed to call get_eth_balance: {:?}", e)),
                }
            }
            TokenStandard::ERC20 => {
                let token_address = match token.contract_address.as_deref() {
                    Some(address) => address,
                    None => return Err("Invalid token contract address".to_string()),
                };

                let wallet_address = H160::from_str(wallet_address)
                    .map_err(|_| "Invalid wallet_address".to_string())?;

                match evm_service
                    .get_erc20_balance(
                        rpc_service,
                        token_address.to_string(),
                        wallet_address,
                        "latest",
                    )
                    .await
                {
                    Ok((Ok(balance_json),)) => {
                        let balance_hex = match serde_json::from_str::<Value>(&balance_json) {
                            Ok(json) => {
                                match json.get("result").and_then(|result| result.as_str()) {
                                    Some(hex) => Ok(hex.to_string()),
                                    None => Err(serde_json::Error::custom(
                                        "Failed to extract 'result' from JSON",
                                    )),
                                }
                            }
                            Err(e) => Err(e),
                        };

                        let balance = match balance_hex {
                            Ok(hex) => {
                                // Convert the hex string to u64
                                u128::from_str_radix(hex.trim_start_matches("0x"), 16)
                                    .map_err(|_| "Failed to parse balance".to_string())?
                            }
                            Err(e) => {
                                return Err(format!("Error parsing balance JSON: {:?}", e));
                            }
                        };

                        Ok(balance)
                    }
                    Ok((Err(e),)) => Err(format!("Error querying balance: {:?}", e)),
                    Err(e) => Err(format!("Failed to call get_erc20_balance: {:?}", e)),
                }
            }
            _ => Err("Token standard not supported on Ethereum".to_string()),
        }
    }

    pub async fn create_token_ethereum(
        &self,
        w3: Web3<ICHttp>,
        token: &TokenConfig,
        name: String,
        symbol: String,
        supply: u64,
        owner: String,
        wallet_nonce: u128,
        chain_id: u64,
        key_info: KeyInfo,
    ) -> Result<String, String> {
        // Encode the function call with ethers ABI encode for `createToken` method
        let data = generate_create_token(name, symbol, supply, owner.clone())?;

        // Set up transaction parameters
        let tx = TransactionParameters {
            to: Some(
                Address::from_str(ETH_CREATE_TOKEN_CONTRACT)
                    .map_err(|e| format!("Invalid contract address: {:?}", e))?,
            ),
            nonce: Some(U256::from(wallet_nonce)),
            value: U256::zero(),
            gas_price: Some(U256::from(ETH_DEFAULT_GAS_PRICE)),
            gas: U256::from(ETH_CREATE_TOKEN_GAS),
            data: data.into(),
            ..Default::default()
        };

        // Sign the transaction
        let signed_tx = w3
            .accounts()
            .sign_transaction(tx, owner.to_string(), key_info, chain_id)
            .await
            .map_err(|e| format!("sign tx error: {}", e))?;

        let signed_tx_hash = hex::encode(signed_tx.raw_transaction.0);

        let evm_service = EvmService::new(EVM_RPC_CANISTER_ID)?;
        let env = state::get_env();
        let rpc_service = env.get_rpc_service();
        let rpc_services = rpc_service.to_rpc_services();

        match evm_service
            .eth_send_raw_transaction(&rpc_services, None, signed_tx_hash.clone())
            .await
        {
            Ok((multi_rpc_result,)) => match multi_rpc_result {
                MultiRpcResult::Consistent(Ok(status)) => match status {
                    SendRawTransactionStatus::Ok(Some(tx_hash)) => Ok(tx_hash.to_string()),
                    SendRawTransactionStatus::Ok(None) => {
                        Ok("Transaction sent, but hash is unavailable.".to_string())
                    }
                    _ => Err("Transaction failed".to_string()),
                },
                MultiRpcResult::Consistent(Err(rpc_error)) => {
                    ic_cdk::println!("Transaction failed with error: {:?}", rpc_error);
                    Err(format!("Transaction failed with error: {:?}", rpc_error))
                }
                MultiRpcResult::Inconsistent(_) => {
                    ic_cdk::println!(
                        "Transaction failed due to inconsistent results across services."
                    );
                    Err(
                        "Transaction failed due to inconsistent results across services."
                            .to_string(),
                    )
                }
            },
            Err(e) => {
                ic_cdk::println!("Error sending Ethereum transaction: {:?}", e);
                Err(format!("Transaction failed: {:?}", e))
            }
        }
    }
}
