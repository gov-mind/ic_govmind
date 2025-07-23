use ic_cdk::query;

use crate::store::{state, proposals};
use ic_govmind_types::dao::{Dao, Proposal};

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
