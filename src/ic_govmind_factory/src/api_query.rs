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

#[query]
fn get_gov_dao_list(page: usize, page_size: usize) -> (Vec<(Principal, Dao)>, u64) {
    let (dao_wrappers, total_count) = store::gov::get_dao_list_paginated(page, page_size);

    let dao_list: Vec<(Principal, Dao)> = dao_wrappers
        .into_iter()
        .map(|(pid, wrapper)| (pid, wrapper.into_inner()))
        .collect();

    (dao_list, total_count)
}
