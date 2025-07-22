use crate::guards::owner_guard;
use crate::store::gov;
use crate::types::CanisterArgs;
use crate::utils::{format_error, sha256};
use crate::{ADMIN_PID, CYCLEOPS_PID, DEPLOY_THRESHOLD};
use candid::{CandidType, Encode, Principal};
use ic_cdk::api::debug_print;
use ic_cdk::management_canister::{
    canister_status, create_canister_with_extra_cycles, install_code, CanisterInstallMode,
    CanisterSettings, CanisterStatusArgs, CreateCanisterArgs, InstallCodeArgs,
};
use ic_cdk::update;
use serde_bytes::ByteArray;

pub const DAO_WASM: &[u8] = std::include_bytes!("./../../../wasm/ic_govmind_backend.wasm.gz");

async fn check_cycles() -> Result<(), String> {
    let arg = CanisterStatusArgs {
        canister_id: ic_cdk::api::canister_self(),
    };
    let status = canister_status(&arg).await.map_err(format_error)?;

    if status.cycles <= DEPLOY_THRESHOLD {
        return Err("InsufficientCycles".to_string());
    }
    Ok(())
}

async fn validate_deploy() -> Result<(), String> {
    check_cycles().await?;
    Ok(())
}

async fn create_canister_with_settings(caller: Principal) -> Result<Principal, String> {
    if caller == Principal::anonymous() {
        return Err("Anonymous Caller".into());
    }

    let admin_user = Principal::from_text(ADMIN_PID).unwrap();
    let cycleops = Principal::from_text(CYCLEOPS_PID).unwrap();

    let result = create_canister_with_extra_cycles(
        &CreateCanisterArgs {
            settings: Some(CanisterSettings {
                controllers: Some(vec![
                    ic_cdk::api::canister_self(),
                    caller,
                    admin_user,
                    cycleops,
                ]),
                compute_allocation: None,
                memory_allocation: None,
                freezing_threshold: None,
                reserved_cycles_limit: None,
                log_visibility: None,
                wasm_memory_limit: None,
                wasm_memory_threshold: None,
            }),
        },
        1_500_000_000_000,
    )
    .await
    .map_err(|err| format!("Failed to create canister. Err: {:?}", err.to_string()))?;

    Ok(result.canister_id)
}

async fn install_canister_code(
    canister_id: Principal,
    wasm_module: &[u8],
    arg: &[u8],
    mode: CanisterInstallMode,
) -> Result<(), String> {
    let install_result = install_code(&InstallCodeArgs {
        mode,
        canister_id,
        wasm_module: wasm_module.to_vec(),
        arg: arg.to_vec(),
    })
    .await;

    match install_result {
        Ok(()) => Ok(()),
        Err(err) => Err(format!("Install failed. Error: {:?}", err.to_string())),
    }
}

async fn create_and_install_canister(
    caller: Principal,
    wasm_name: &str,
    wasm_module: &[u8],
    init_arg: &[u8],
) -> Result<Principal, String> {
    let hash: ByteArray<32> = sha256(wasm_module).into();
    let principal = create_canister_with_settings(caller).await?;

    // save deploy info
    gov::add_canister(principal, wasm_name.to_string(), hash);

    install_canister_code(
        principal,
        wasm_module,
        &init_arg,
        CanisterInstallMode::Install,
    )
    .await?;

    Ok(principal)
}

async fn upgrade_canister<T: CandidType>(
    canister_id: Principal,
    wasm_module: &[u8],
    upgrade_arg: T,
) -> Result<(), String> {
    let encoded_arg =
        Encode!(&upgrade_arg).map_err(|_| "ErrorCode::FailedEncodeArgs".to_string())?;
    install_canister_code(
        canister_id,
        wasm_module,
        &encoded_arg,
        CanisterInstallMode::Upgrade(None),
    )
    .await?;

    Ok(())
}

#[update(guard = "owner_guard")]
pub async fn create_dao_canister(arg: Option<CanisterArgs>) -> Result<Principal, String> {
    validate_deploy().await?;
    let init_arg = Encode!(&arg).map_err(|_| "ErrorCode::FailedEncodeArgs".to_string())?;

    match create_and_install_canister(ic_cdk::api::msg_caller(), "DAO_WASM", DAO_WASM, &init_arg).await {
        Ok(principal) => Ok(principal),
        Err(err) => {
            debug_print(&format!("create_dao_canister error: {:?}", err));
            Err(err)
        }
    }
}

#[update(guard = "owner_guard")]
pub async fn upgrade_dao_canister(
    canister_id: Principal,
    arg: Option<CanisterArgs>,
) -> Result<(), String> {
    upgrade_canister(canister_id, DAO_WASM, arg).await
}
