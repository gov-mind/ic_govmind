use crate::{
    signer::signing,
    utils::{account_id, owner_wallet_pid},
};
use base58::ToBase58;
use bitcoin_hashes::{ripemd160, sha256, Hash as BitcoinHash};
use candid::{CandidType, Deserialize};
use ic_govmind_types::{chain::BlockchainConfig, dao::ChainType};
use ic_ledger_types::Subaccount;
use libsecp256k1::{PublicKey, PublicKeyFormat};
use serde::Serialize;

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