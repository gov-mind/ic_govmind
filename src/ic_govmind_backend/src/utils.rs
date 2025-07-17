use candid::{Encode, Principal};
use ic_cdk::management_canister::{
    create_canister_with_extra_cycles, install_code, CanisterInstallMode, CanisterSettings,
    CreateCanisterArgs, InstallCodeArgs,
};
use ic_govmind_types::{
    constants::ICRC1_LEDGER_DEFAULT_CYCLES,
    icrc::{CreateCanisterArg, ICRC1InitArgs, LedgerArgument},
};
use ic_ledger_types::{AccountIdentifier, Subaccount};

#[cfg(target_arch = "wasm32")]
const WASM_PAGE_SIZE: u64 = 64 * 1024;

pub fn get_cycles() -> u64 {
    #[cfg(target_arch = "wasm32")]
    {
        ic_cdk::api::canister_balance()
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        0
    }
}

pub fn get_stable_memory_size() -> u64 {
    #[cfg(target_arch = "wasm32")]
    {
        (ic_cdk::api::stable::stable_size() as u64) * WASM_PAGE_SIZE
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        0
    }
}

pub fn get_heap_memory_size() -> u64 {
    #[cfg(target_arch = "wasm32")]
    {
        (core::arch::wasm32::memory_size(0) as u64) * WASM_PAGE_SIZE
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        0
    }
}

pub fn current_time_secs() -> u64 {
    ic_cdk::api::time() / 1_000_000_000
}

// In the following, we register a custom getrandom implementation because
// otherwise getrandom (which is a dependency of k256) fails to compile.
// This is necessary because getrandom by default fails to compile for the
// wasm32-unknown-unknown target (which is required for deploying a canister).
// Our custom implementation always fails, which is sufficient here because
// we only use the k256 crate for verifying secp256k1 signatures, and such
// signature verification does not require any randomness.
pub fn always_fail(_buf: &mut [u8]) -> Result<(), getrandom::Error> {
    Err(getrandom::Error::UNSUPPORTED)
}

pub fn owner_wallet_pid() -> Principal {
    ic_cdk::api::canister_self()
}

pub fn account_id(principal: Principal, subaccount: Option<Subaccount>) -> AccountIdentifier {
    let subaccount = subaccount.unwrap_or_else(|| Subaccount([0; 32]));
    AccountIdentifier::new(&principal, &subaccount)
}

pub async fn create_icrc1_canister(
    arg: CreateCanisterArg,
    wasm_module: Vec<u8>,
) -> Result<Principal, String> {
    let mut icrc1_controllers = vec![ic_cdk::api::canister_self()];
    if let Some(controllers) = arg.controllers {
        if !controllers.is_empty() {
            icrc1_controllers.extend(controllers);
        }
    };

    let canister = match create_canister_with_extra_cycles(
        &CreateCanisterArgs {
            settings: Some(CanisterSettings {
                controllers: Some(icrc1_controllers),
                compute_allocation: None,
                memory_allocation: None,
                freezing_threshold: None,
                reserved_cycles_limit: None,
                log_visibility: None,
                wasm_memory_limit: None,
                wasm_memory_threshold: None,
            }),
        },
        ICRC1_LEDGER_DEFAULT_CYCLES,
    )
    .await
    {
        Err(err) => return Err(format!("Create canister error: {:?}", err)),
        Ok(record) => record.canister_id,
    };

    ic_cdk::println!("new icrc1 canister: {}", canister);

    let metadata = vec![("icrc1:logo".to_string(), arg.logo)];
    let init_arg = ICRC1InitArgs::new(
        arg.token_symbol,
        arg.minting_account,
        arg.initial_balances,
        arg.token_name,
        metadata,
    );
    let ledger_arg = LedgerArgument::Init(init_arg);

    let init_arg = Encode!(&ledger_arg).unwrap();

    install_code(&InstallCodeArgs {
        mode: CanisterInstallMode::Install,
        canister_id: canister,
        wasm_module,
        arg: init_arg,
    })
    .await
    .map(|()| canister)
    .map_err(|e| format!("Failed to create icrc1 canister: {:?}", e))
}
