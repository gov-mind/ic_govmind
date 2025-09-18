use candid::Principal;

use ic_cdk::update;
use ic_govmind_types::{
    chain::{TokenConfig, TokenStandard},
    dao::{
        BaseToken, ChainType, CommitteeArg, CreateBaseTokenArg, Dao, ProposalStatus, TokenLocation,
    },
    icrc::CreateCanisterArg,
};
use icrc_ledger_types::icrc::generic_metadata_value::MetadataValue;

use crate::{
    guards::not_anonymous,
    init::init_eth_local_chain,
    store,
    timer::setup_token_distribution_timer,
    types::{BalanceResult, QueryBalanceArg, TokenTransferArg},
    utils::create_icrc1_canister,
    wallet::WalletBlockchainConfig,
    ICRC1_WASM,
};

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

#[update]
pub async fn create_dao_token(icrc_arg: CreateCanisterArg) -> Result<Principal, String> {
    let canister = create_icrc1_canister(icrc_arg, ICRC1_WASM.to_vec()).await?;
    Ok(canister)
}

#[update]
pub async fn create_dao_base_token(
    arg: CreateBaseTokenArg,
    logo: MetadataValue,
) -> Result<Principal, String> {
    let icrc_arg = arg.to_create_canister_arg(logo, None);
    let token_canister_id = create_icrc1_canister(icrc_arg, ICRC1_WASM.to_vec()).await?;

    let base_token = BaseToken {
        name: arg.name.clone(),
        symbol: arg.symbol.clone(),
        decimals: arg.decimals,
        total_supply: arg.total_supply,
        distribution_model: arg.distribution_model.clone(),
        token_location: TokenLocation {
            chain: ChainType::InternetComputer,
            canister_id: Some(token_canister_id),
            contract_address: None,
        },
    };

    let old_dao = store::state::get_dao_info().ok_or("DAO not initialized")?;
    let new_dao = Dao {
        base_token,
        ..old_dao
    };
    store::state::update_org_info(new_dao);

    // Add token to the Internet Computer chain config
    let token_cfg = TokenConfig {
        token_name: arg.name,
        symbol: arg.symbol,
        contract_address: Some(token_canister_id.to_string()),
        decimal: arg.decimals,
        chain_name: "Internet Computer".to_string(),
        standard: TokenStandard::ICRC1,
        fee: 10_000,
        ..Default::default()
    };

    store::state::update_chain_config(ChainType::InternetComputer, |icp_chain| {
        icp_chain.add_token_config(token_cfg);
    })?;

    if let Some(ref model) = arg.distribution_model {
        if model.emission_rate.is_some() || model.unlock_schedule.is_some() {
            setup_token_distribution_timer(model.clone(), token_canister_id);
        }
    }

    Ok(token_canister_id)
}

#[update]
pub async fn create_proposal(title: String, content: String) -> Result<u64, String> {
    // Ensure caller is not anonymous
    not_anonymous()?;

    let caller = ic_cdk::api::msg_caller();
    let proposer = caller.to_text();

    // Get voting period from DAO governance config or use default
    let voting_period_secs = store::state::with(|state| {
        state
            .org_info
            .as_ref()
            .map(|dao| dao.governance.voting_period_secs)
            .unwrap_or(7 * 24 * 60 * 60) // Default: 7 days
    });

    // Validate inputs
    if title.trim().is_empty() {
        return Err("Title cannot be empty".to_string());
    }

    if content.trim().is_empty() {
        return Err("Content cannot be empty".to_string());
    }

    if title.len() > 200 {
        return Err("Title too long (max 200 characters)".to_string());
    }

    if content.len() > 5000 {
        return Err("Content too long (max 5000 characters)".to_string());
    }

    store::proposals::create_proposal(
        title.trim().to_string(),
        content.trim().to_string(),
        proposer,
        voting_period_secs,
    )
}

#[update]
pub async fn update_proposal_status(
    proposal_id: u64,
    status: ProposalStatus,
) -> Result<(), String> {
    // Only admins or controllers can update proposal status
    let caller = ic_cdk::api::msg_caller();
    if !ic_cdk::api::is_controller(&caller) {
        return Err("Only controllers can update proposal status".to_string());
    }

    store::proposals::update_proposal_status(proposal_id, status)
}

#[update]
pub async fn wallet_query_balance(arg: QueryBalanceArg) -> Result<BalanceResult, String> {
    let chain_config = store::state::get_chain_config(&arg.chain_type)
        .ok_or_else(|| format!("Chain config not found for {:?}", arg.chain_type))?;

    let wallet_chain = WalletBlockchainConfig(chain_config);

    let balance = wallet_chain
        .query_balance(&arg.token_name, &arg.wallet_address, &arg.subaccount)
        .await?;

    Ok(BalanceResult {
        token_name: arg.token_name,
        balance,
    })
}

#[update]
pub async fn wallet_token_transfer(arg: TokenTransferArg) -> Result<String, String> {
    let chain_config = store::state::get_chain_config(&arg.chain_type)
        .ok_or_else(|| format!("Chain config not found for {:?}", arg.chain_type))?;

    let wallet_chain = WalletBlockchainConfig(chain_config);

    // Call the token_transfer method for the chain and token
    let transfer_result = wallet_chain
        .token_transfer(
            &arg.token_name,
            &arg.wallet_address,
            &arg.wallet_subaccount,
            &arg.recipient_address,
            &arg.recipient_subaccount,
            arg.amount,
        )
        .await;

    // Return the result of the transfer
    match transfer_result {
        Ok(transfer_info) => Ok(transfer_info),
        Err(error) => Err(format!("Transfer failed: {}", error)),
    }
}

#[update]
pub async fn add_committee(arg: CommitteeArg) -> Result<String, String> {
    let id = store::state::get_next_committee_id();
    let committee = arg.to_committee(id as u16);
    store::state::add_committee(committee)?;
    Ok(format!("Committee {} added successfully", id))
}

#[update]
pub async fn update_committee_update(
    committee_id: u16,
    arg: CommitteeArg,
) -> Result<String, String> {
    store::state::update_committee(committee_id, |committee| {
        committee.members = arg.members;
        committee.term_duration_secs = arg.term_duration_secs;
        committee.elected_at = arg.elected_at;
        committee.next_election_at = arg.next_election_at;
    })?;

    Ok(format!("Committee {} updated successfully", committee_id))
}

#[update]
pub async fn update_eth_local_chain() -> Result<(), String> {
    let new_chain = init_eth_local_chain();
    store::state::add_chain_config(new_chain)?;
    Ok(())
}
