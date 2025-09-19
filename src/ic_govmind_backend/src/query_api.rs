use ic_cdk::query;

use crate::{
    store::{self, proposals, state, State},
    types::Addresses,
};
use ic_govmind_types::{
    chain::BlockchainConfig,
    dao::{ChainType, Committee, Dao, DistributionRecord, Proposal},
};

#[query]
pub fn get_state() -> State {
    state::with(|s| s.clone())
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
pub fn get_chain_configs() -> Vec<BlockchainConfig> {
    store::state::with(|state| state.chain_config.clone())
}

#[query]
pub fn get_chain_config_by_type(chain_type: ChainType) -> Option<BlockchainConfig> {
    store::state::get_chain_config(&chain_type)
}

#[query]
pub fn list_distribution_records(start: u64, limit: u64) -> Vec<(u64, DistributionRecord)> {
    store::distribution::list_distribution_records(start, limit as usize)
}

#[query]
pub fn get_active_committees() -> Vec<Committee> {
    state::with(|s| {
        if let Some(dao) = &s.org_info {
            dao.committees
                .iter()
                .filter(|c| c.active.unwrap_or(true))
                .cloned()
                .collect()
        } else {
            vec![]
        }
    })
}

#[query(hidden = true)]
fn http_request(req: ic_http_types::HttpRequest) -> ic_http_types::HttpResponse {
    if ic_cdk::api::data_certificate().is_none() {
        ic_cdk::trap("update call rejected");
    }
    if req.path() == "/logs" {
        crate::ic_log::do_reply(req)
    } else {
        ic_http_types::HttpResponseBuilder::not_found().build()
    }
}
