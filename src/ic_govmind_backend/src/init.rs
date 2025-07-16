use candid::{CandidType, Deserialize, Principal};
use std::time::Duration;

use crate::{
    signer::ecdsa::get_ecdsa_public_key_result,
    store::{self},
    types::{Dao, EcdsaKeyIds, KeyEnvironment, SchnorrKeyIds},
};
use ic_cdk::{init, post_upgrade, pre_upgrade};

#[derive(CandidType, Clone, Debug, Deserialize)]
pub enum CanisterArgs {
    Init(StateInitArgs),
    Upgrade(StateUpgradeArgs),
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct StateInitArgs {
    pub env: KeyEnvironment,
    pub root: Principal,
    pub admins: Vec<Principal>,
    pub org_info: Option<Dao>,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct StateUpgradeArgs {
    pub root: Option<Principal>,
}

#[init]
fn init(args: Option<CanisterArgs>) {
    match args {
        Some(CanisterArgs::Init(init_args)) => {
            // Initialize the state with provided values or defaults where not provided
            let ecdsa_key = EcdsaKeyIds::from_env(&init_args.env).to_key_id();
            let schnorr_key = SchnorrKeyIds::from_env(&init_args.env).to_key_id();

            store::state::with_mut(|state_ref| {
                state_ref.root = Some(init_args.root);
                state_ref.admins = init_args.admins;
                state_ref.org_info = init_args.org_info;
                state_ref.ecdsa_key = Some(ecdsa_key);
                state_ref.schnorr_key = Some(schnorr_key);
            });
            store::state::save();
        }
        Some(CanisterArgs::Upgrade(_)) => {
            ic_cdk::trap(
                "Cannot initialize the canister with an Upgrade args. Please provide an Init args.",
            );
        }
        None => {
            ic_cdk::trap("No initialization arguments provided. Use default initialization.");
        }
    }
}

#[pre_upgrade]
fn pre_upgrade() {
    store::state::save();
}

#[post_upgrade]
fn post_upgrade(args: Option<CanisterArgs>) {
    match args {
        Some(CanisterArgs::Upgrade(upgrade_args)) => {
            store::state::with_mut(|state_ref| {
                if let Some(root) = upgrade_args.root {
                    state_ref.root = Some(root);
                }
            });
            store::state::save();

            ic_cdk_timers::set_timer(Duration::from_secs(0), || {
                ic_cdk::futures::spawn(job_ecdsa_setup())
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

async fn job_ecdsa_setup() {
    let ecdsa_response = get_ecdsa_public_key_result(vec![])
        .await
        .expect("Failed to get ecdsa key");

    store::state::with_mut(|state| {
        state.ecdsa_public_key = Some(ecdsa_response);
    });
    store::state::save();
}
