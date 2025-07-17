use candid::Principal;
use ic_cdk::query;
use ic_govmind_types::dao::Dao;

use crate::store::{self};

#[query]
fn get_dao_info(user_pid: Principal) -> Option<Dao> {
    match store::gov::get_dao(user_pid) {
        Some(dao_wrapper) => Some(dao_wrapper.into_inner()),
        None => None,
    }
}
