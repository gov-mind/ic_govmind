use crate::{
    guards::{anonymous_guard, owner_guard},
    pay::default_account_id,
};
use candid::Principal;
use ic_cdk::query;
use ic_govmind_types::{
    payment::{QueryCommonReq, QueryOrderResp},
    user::UserInfo,
};

use crate::store::{self};

#[query]
fn profile() -> Option<UserInfo> {
    let caller = ic_cdk::api::msg_caller();

    match store::user::get_user(caller) {
        Some(user_wrapper) => Some(user_wrapper.into_inner().to_user_info(caller)),
        None => None,
    }
}

#[query]
fn get_user_info(user_pid: Principal) -> Option<UserInfo> {
    match store::user::get_user(user_pid) {
        Some(user_wrapper) => Some(user_wrapper.into_inner().to_user_info(user_pid)),
        None => None,
    }
}

#[query]
fn get_user_infos(user_pids: Vec<Principal>) -> Vec<UserInfo> {
    store::user::get_user_infos(user_pids)
}

#[query]
fn get_user_count() -> u64 {
    store::user::get_user_count()
}

#[query]
fn get_user_pids() -> Vec<Principal> {
    store::user::get_user_pids()
}

#[query]
fn get_avatar(user: Option<Principal>) -> String {
    let uid = user.unwrap_or_else(ic_cdk::api::msg_caller);

    match store::user::get_user(uid) {
        Some(user_wrapper) => {
            let user = user_wrapper.into_inner();
            user.avatar.clone()
        }
        None => "".to_string(),
    }
}

#[query]
fn get_email(user: Option<Principal>) -> String {
    let uid = user.unwrap_or_else(ic_cdk::api::msg_caller);

    match store::user::get_user(uid) {
        Some(user_wrapper) => {
            let user = user_wrapper.into_inner();
            user.email.clone()
        }
        None => "".to_string(),
    }
}

#[query(guard = "anonymous_guard")]
pub fn query_orders(req: QueryCommonReq) -> QueryOrderResp {
    let caller = ic_cdk::api::msg_caller();
    // Call limit_orders function
    let (total, has_more, data) = store::payment::limit_orders(caller, &req);

    QueryOrderResp {
        page: req.page,
        total,
        has_more,
        data,
    }
}

#[query]
pub fn canister_account() -> (String, Vec<u8>) {
    let account_id = default_account_id();
    let account_vec = account_id.as_ref().to_vec();
    (account_id.to_hex(), account_vec)
}

#[query(guard = "owner_guard")]
pub fn get_invite_codes() -> Vec<String> {
    store::state::with(|r| r.invite_codes.clone())
}
