use icrc_ledger_types::icrc1::account::Account;

use crate::{
    store,
    utils::{
        account_to_derivation_path_buf, convert_network, derive_public_key, ripemd160, sha256,
    },
};
use bitcoin::{Address, CompressedPublicKey, PublicKey};
use ic_cdk::bitcoin_canister::Network as IcBitcoinNetwork;

pub fn account_to_p2pkh_address(account: &Account, network: IcBitcoinNetwork) -> String {
    let prefix = match network {
        IcBitcoinNetwork::Mainnet => 0x00,
        _ => 0x6f, // Regtest | Testnet
    };
    let ecdsa_public_key = store::state::get_ecdsa_public_key();
    let path = account_to_derivation_path_buf(account);
    let derived_public_key = derive_public_key(&ecdsa_public_key, &path).public_key;
    let ripemd_pk = ripemd160(&sha256(&derived_public_key));
    let mut raw_address = vec![prefix];
    raw_address.extend(ripemd_pk);
    let checksum = &sha256(&sha256(&raw_address.clone()))[..4];
    raw_address.extend(checksum);
    bs58::encode(raw_address).into_string()
}

pub fn get_p2pkh_address(network: IcBitcoinNetwork) -> String {
    let btc_network = convert_network(network);
    let ecdsa_public_key = store::state::get_ecdsa_public_key();
    let public_key = ecdsa_public_key.public_key;
    let public_key = PublicKey::from_slice(&public_key).unwrap();

    // Generate a legacy P2PKH address from the public key.
    // The address encoding (Base58) depends on the network type.
    Address::p2pkh(public_key, btc_network).to_string()
}

pub fn get_p2wpkh_address(network: IcBitcoinNetwork) -> String {
    let btc_network = convert_network(network);
    let ecdsa_public_key = store::state::get_ecdsa_public_key();
    let public_key = ecdsa_public_key.public_key;
    // Create a CompressedPublicKey from the raw public key bytes
    let public_key = CompressedPublicKey::from_slice(&public_key).unwrap();

    // Generate a P2WPKH Bech32 address.
    // The network (mainnet, testnet, regtest) determines the HRP (e.g., "bc1" or "tb1").
    Address::p2wpkh(&public_key, btc_network).to_string()
}
