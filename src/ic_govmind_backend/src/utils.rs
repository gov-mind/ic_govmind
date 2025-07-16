use candid::Principal;
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
