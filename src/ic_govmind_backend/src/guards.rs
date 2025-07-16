use candid::Principal;

use crate::store::state;

fn is_admin_or_controller(caller: &Principal) -> bool {
    ic_cdk::api::is_controller(caller)
        || state::with(|state| state.admins.iter().any(|admin| admin == caller))
}

#[inline(always)]
pub fn admin_guard() -> Result<(), String> {
    let caller = ic_cdk::api::msg_caller();

    if state::with(|state| state.admins.iter().any(|admin| admin == &caller)) {
        Ok(())
    } else {
        Err("Error: Only the admin can call this action.".to_string())
    }
}

#[inline(always)]
pub fn admin_or_controller_guard() -> Result<(), String> {
    let caller = ic_cdk::api::msg_caller();

    if is_admin_or_controller(&caller) {
        Ok(())
    } else {
        Err("Error: Only an admin or the controller can call this action.".to_string())
    }
}

#[inline(always)]
pub fn admin_or_self_guard() -> Result<(), String> {
    let caller = ic_cdk::api::msg_caller();
    let self_id = ic_cdk::api::canister_self();

    if caller == self_id || state::with(|state| state.admins.iter().any(|admin| admin == &caller)) {
        Ok(())
    } else {
        Err("Error: Only an admin or the canister itself can call this action.".to_string())
    }
}

#[inline(always)]
pub fn not_anonymous() -> Result<(), String> {
    let caller = ic_cdk::api::msg_caller();
    if caller == Principal::anonymous() {
        return Err("Anonymous caller not allowed".to_string());
    }
    Ok(())
}
