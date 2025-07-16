use crate::store::STATE;
use ic_cdk::management_canister::{
    ecdsa_public_key, sign_with_ecdsa, EcdsaKeyId, EcdsaPublicKeyArgs, EcdsaPublicKeyResult,
    SignWithEcdsaArgs,
};

fn get_ecdsa_key_id() -> Result<EcdsaKeyId, String> {
    STATE
        .with_borrow(|state| state.ecdsa_key.clone())
        .ok_or("ECDSA key not set in state".to_string())
}

fn build_public_key_args(derivation_path: Vec<Vec<u8>>, key_id: EcdsaKeyId) -> EcdsaPublicKeyArgs {
    EcdsaPublicKeyArgs {
        canister_id: None,
        derivation_path,
        key_id,
    }
}

fn build_sign_args(
    message_hash: Vec<u8>,
    derivation_path: Vec<Vec<u8>>,
    key_id: EcdsaKeyId,
) -> SignWithEcdsaArgs {
    SignWithEcdsaArgs {
        message_hash,
        derivation_path,
        key_id,
    }
}

pub async fn get_ecdsa_public_key(derivation_path: Vec<Vec<u8>>) -> Result<Vec<u8>, String> {
    let key_id = get_ecdsa_key_id()?;
    let args = build_public_key_args(derivation_path, key_id);
    let result = ecdsa_public_key(&args)
        .await
        .map_err(|e| format!("ecdsa_public_key failed: {:?}", e))?;
    Ok(result.public_key)
}

pub async fn get_ecdsa_public_key_result(
    derivation_path: Vec<Vec<u8>>,
) -> Result<EcdsaPublicKeyResult, String> {
    let key_id = get_ecdsa_key_id()?;
    let args = build_public_key_args(derivation_path, key_id);
    let result = ecdsa_public_key(&args)
        .await
        .map_err(|e| format!("ecdsa_public_key failed: {:?}", e))?;
    Ok(result)
}

pub async fn ecdsa_sign(
    message_hash: Vec<u8>,
    derivation_path: Vec<Vec<u8>>,
) -> Result<Vec<u8>, String> {
    let key_id = get_ecdsa_key_id()?;
    let args = build_sign_args(message_hash, derivation_path, key_id);
    let result = sign_with_ecdsa(&args)
        .await
        .map_err(|e| format!("sign_with_ecdsa failed: {:?}", e))?;
    Ok(result.signature)
}
