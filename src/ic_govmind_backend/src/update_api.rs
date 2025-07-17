use candid::Principal;

use ic_cdk::update;
use ic_govmind_types::icrc::CreateCanisterArg;

use crate::{store, utils::create_icrc1_canister, ICRC1_WASM};

#[update]
pub async fn add_admin(principal: Principal) -> Result<(), String> {
    let caller = ic_cdk::api::msg_caller();
    if !ic_cdk::api::is_controller(&caller) {
        return Err("Only the controller can add an admin".to_string());
    }

    store::state::add_admin(principal)
}

#[update]
pub async fn remove_admin(principal: Principal) -> Result<(), String> {
    let caller = ic_cdk::api::msg_caller();
    if !ic_cdk::api::is_controller(&caller) {
        return Err("Only the controller can add an admin".to_string());
    }

    store::state::remove_admin(principal)
}

#[update]
pub async fn create_dao_token(icrc_arg: CreateCanisterArg) -> Result<Principal, String> {
    let canister = create_icrc1_canister(icrc_arg, ICRC1_WASM.to_vec()).await?;
    Ok(canister)
}
