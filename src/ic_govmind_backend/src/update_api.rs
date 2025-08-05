use candid::Principal;

use ic_cdk::update;
use ic_govmind_types::{
    dao::{BaseToken, ChainType, CreateBaseTokenArg, Dao, ProposalStatus, TokenLocation},
    icrc::CreateCanisterArg,
};
use icrc_ledger_types::icrc::generic_metadata_value::MetadataValue;

use crate::{guards::not_anonymous, store, utils::create_icrc1_canister, ICRC1_WASM};

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
    let icrc_arg = arg.clone().to_create_canister_arg(logo, None);

    let token_canister_id = create_icrc1_canister(icrc_arg, ICRC1_WASM.to_vec()).await?;

    let base_token = BaseToken {
        name: arg.name,
        symbol: arg.symbol,
        decimals: arg.decimals,
        total_supply: arg.total_supply,
        distribution_model: arg.distribution_model,
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
