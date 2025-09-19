use crate::{
    api_cycles::WalletReceiveResult,
    init::CanisterArgs,
    store::State,
    types::{
        Addresses, BalanceResult, QueryBalanceArg, StatusRequest, StatusResponse, TokenTransferArg,
    },
};
use candid::{export_service, Principal};
use ic_cdk::query;
use ic_govmind_types::{
    chain::BlockchainConfig,
    dao::{
        ChainType, CommitteeArg, Committee, CreateBaseTokenArg, Dao, DistributionRecord, Proposal,
        ProposalStatus,
    },
    icrc::CreateCanisterArg,
};
use icrc_ledger_types::icrc::generic_metadata_value::MetadataValue;

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    export_service!();
    __export_service()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn save_candid() {
        use std::env;
        use std::fs::write;
        use std::path::PathBuf;

        let dir = PathBuf::from(env::current_dir().unwrap());
        write(dir.join("ic_govmind_backend.did"), export_candid()).expect("Write failed.");
    }
}
