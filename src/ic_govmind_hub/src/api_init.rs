use candid::{CandidType, Principal};
use ic_cdk::{init, post_upgrade, pre_upgrade, trap};
use ic_govmind_types::constants::Environment;
use serde::Deserialize;

use crate::store;

#[derive(CandidType, Clone, Debug, Deserialize)]
pub enum CanisterArgs {
    Init(StateInitArgs),
    Upgrade(StateUpgradeArgs),
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct StateInitArgs {
    name: String,
    owner: Principal,
    env: Environment,
    factory_canister_id: Principal,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct StateUpgradeArgs {
    name: Option<String>,
    owner: Option<Principal>,
    env: Option<Environment>,
    factory_canister_id: Option<Principal>,
}

#[init]
fn init(args: Option<CanisterArgs>) {
    match args {
        Some(CanisterArgs::Init(init_args)) => {
            // Initialize the state with provided values or defaults where not provided
            store::state::with_mut(|state_ref| {
                state_ref.name = init_args.name;
                state_ref.owner = init_args.owner;
                state_ref.factory_canister_id = init_args.factory_canister_id;
                state_ref.env = init_args.env;
                state_ref.user_count = 0;
            });
            store::state::save();
        }
        Some(CanisterArgs::Upgrade(_)) => {
            ic_cdk::trap(
                "Cannot initialize the canister with an Upgrade args. Please provide an Init args.",
            );
        }
        None => {
            trap("No initialization arguments provided. Use default initialization.");
        }
    }
}

#[pre_upgrade]
fn pre_upgrade() {
    store::state::save();
}

#[post_upgrade]
fn post_upgrade(args: Option<CanisterArgs>) {
    store::state::load();

    match args {
        Some(CanisterArgs::Upgrade(upgrade_args)) => {
            store::state::with_mut(|state_ref| {
                if let Some(name) = upgrade_args.name {
                    state_ref.name = name;
                }
                if let Some(owner) = upgrade_args.owner {
                    state_ref.owner = owner;
                }
                if let Some(factory_canister_id) = upgrade_args.factory_canister_id {
                    state_ref.factory_canister_id = factory_canister_id;
                }
                if let Some(env) = upgrade_args.env {
                    state_ref.env = env;
                }
            });
        }
        Some(CanisterArgs::Init(_)) => {
            ic_cdk::trap(
                "Cannot upgrade the canister with Init args. Please provide Upgrade args.",
            );
        }
        None => {
            // No arguments provided; continue with the existing state
        }
    }
}
