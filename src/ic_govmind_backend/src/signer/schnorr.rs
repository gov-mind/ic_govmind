use crate::store::STATE;
use ic_cdk::management_canister::{
    schnorr_public_key, sign_with_schnorr, SchnorrKeyId, SchnorrPublicKeyArgs,
    SchnorrPublicKeyResult, SignWithSchnorrArgs, SignWithSchnorrResult,
};

fn get_schnorr_key_id() -> Result<SchnorrKeyId, String> {
    STATE
        .with_borrow(|state| state.schnorr_key.clone())
        .ok_or_else(|| "Schnorr key not set in state".to_string())
}

fn build_schnorr_public_key_args(
    derivation_path: Vec<Vec<u8>>,
    key_id: SchnorrKeyId,
) -> SchnorrPublicKeyArgs {
    SchnorrPublicKeyArgs {
        canister_id: None,
        derivation_path,
        key_id,
    }
}

fn build_schnorr_sign_args(
    message: Vec<u8>,
    derivation_path: Vec<Vec<u8>>,
    key_id: SchnorrKeyId,
) -> SignWithSchnorrArgs {
    SignWithSchnorrArgs {
        message,
        derivation_path,
        key_id,
        aux: None,
    }
}

pub async fn get_schnorr_public_key(derivation_path: Vec<Vec<u8>>) -> Result<Vec<u8>, String> {
    let key_id = get_schnorr_key_id()?;
    let args = build_schnorr_public_key_args(derivation_path, key_id);

    let response: SchnorrPublicKeyResult = schnorr_public_key(&args)
        .await
        .map_err(|e| format!("schnorr_public_key failed: {:?}", e))?;

    Ok(response.public_key)
}

pub async fn get_schnorr_public_key_result(
    derivation_path: Vec<Vec<u8>>,
) -> Result<SchnorrPublicKeyResult, String> {
    let key_id = get_schnorr_key_id()?;
    let args = build_schnorr_public_key_args(derivation_path, key_id);

    let response = schnorr_public_key(&args)
        .await
        .map_err(|e| format!("schnorr_public_key failed: {:?}", e))?;

    Ok(response)
}

pub async fn schnorr_sign(
    message: Vec<u8>,
    derivation_path: Vec<Vec<u8>>,
) -> Result<Vec<u8>, String> {
    let key_id = get_schnorr_key_id()?;
    let args = build_schnorr_sign_args(message, derivation_path, key_id);

    let response: SignWithSchnorrResult = sign_with_schnorr(&args)
        .await
        .map_err(|e| format!("sign_with_schnorr failed: {:?}", e))?;

    Ok(response.signature)
}
