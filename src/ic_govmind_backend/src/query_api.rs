use ic_cdk::query;

use crate::{
    store::{self, proposals, state},
    types::Addresses,
};
use ic_govmind_types::dao::{Dao, DistributionRecord, Proposal};

#[query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[query]
fn dao_info() -> Option<Dao> {
    state::get_dao_info()
}

#[query]
fn get_all_proposals() -> Vec<Proposal> {
    proposals::get_all_proposals()
}

#[query]
fn get_proposal(proposal_id: u64) -> Option<Proposal> {
    proposals::get_proposal(proposal_id)
}

#[query]
pub fn get_dao_wallet_addresses() -> Addresses {
    let dao = ic_cdk::api::canister_self();
    Addresses::from(&dao)
}

#[query]
pub fn list_distribution_records(start: u64, limit: u64) -> Vec<(u64, DistributionRecord)> {
    store::distribution::list_distribution_records(start, limit as usize)
}
