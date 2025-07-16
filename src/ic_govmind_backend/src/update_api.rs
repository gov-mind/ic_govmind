use candid::Principal;

use ic_cdk::update;

use crate::store;

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
