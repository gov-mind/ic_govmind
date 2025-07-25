use crate::{
    api_canister::{create_dao_canister, upgrade_dao_canister},
    guards::anonymous_guard,
    types::{CanisterArgs, KeyEnvironment, StateInitArgs, StateUpgradeArgs},
};
use candid::Principal;
use ic_cdk::{
    api::{debug_print, time},
    update,
};
use ic_govmind_types::dao::Dao;

use crate::store::{self};

async fn create_gov_dao_core(mut dao: Dao) -> Result<Principal, String> {
    let caller = ic_cdk::api::msg_caller();

    let init_args = CanisterArgs::Init(StateInitArgs {
        env: KeyEnvironment::Production,
        root: caller,
        admins: vec![caller],
        org_info: Some(dao.clone()),
    });
    debug_print(&format!("init_args: {:?}", init_args));

    let result: Result<Principal, String> = create_dao_canister(Some(init_args)).await;

    match result {
        Ok(new_wallet_id) => {
            dao.id = new_wallet_id.to_text();
            dao.created_at = time();
            store::gov::add_dao(caller, dao);
            Ok(new_wallet_id)
        }
        Err(err_msg) => Err(err_msg),
    }
}

#[update(guard = "anonymous_guard")]
async fn create_gov_dao(dao: Dao) -> Result<Principal, String> {
    let caller = ic_cdk::api::msg_caller();

    if let Some(_) = store::gov::get_dao(caller) {
        return Err("User has already created a DAO".to_string());
    }

    create_gov_dao_core(dao).await
}

#[update(guard = "anonymous_guard")]
async fn upgrade_gov_dao() -> Result<(), String> {
    let caller = ic_cdk::api::msg_caller();

    let dao = store::gov::get_dao(caller)
        .ok_or_else(|| "DAO not found for this caller".to_string())?
        .into_inner();

    let canister_id = Principal::from_text(&dao.id)
        .map_err(|e| format!("Invalid canister_id '{}': {}", dao.id, e))?;

    let upgrade_arg = CanisterArgs::Upgrade(StateUpgradeArgs {
        root: Some(caller),
        env: None,
    });

    upgrade_dao_canister(canister_id, Some(upgrade_arg)).await
}
