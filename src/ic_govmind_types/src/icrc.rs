use candid::{CandidType, Deserialize, Nat, Principal};
use icrc_ledger_types::{icrc::generic_metadata_value::MetadataValue, icrc1::account::Account};

use crate::constants::{ICRC1_LEDGER_DEFAULT_DECIMAL, ICRC1_LEDGER_DEFAULT_FEE};

#[derive(CandidType, Deserialize)]
pub struct ArchiveOptions {
    pub num_blocks_to_archive: u64,
    pub max_transactions_per_response: Option<u64>,
    pub trigger_threshold: u64,
    pub more_controller_ids: Option<Vec<Principal>>,
    pub max_message_size_bytes: Option<u64>,
    pub cycles_for_archive_creation: Option<u64>,
    pub node_max_memory_size_bytes: Option<u64>,
    pub controller_id: Principal,
}

#[derive(CandidType, Deserialize)]
pub struct FeatureFlags {
    pub icrc2: bool,
}

#[derive(CandidType, Deserialize)]
pub struct CreateCanisterArg {
    pub controllers: Option<Vec<Principal>>,
    pub token_name: String,
    pub token_symbol: String,
    pub minting_account: Account,
    pub initial_balances: Vec<(Account, Nat)>,
    pub logo: MetadataValue,
}
impl CreateCanisterArg {
    pub fn new(
        controllers: Option<Vec<Principal>>,
        token_name: String,
        token_symbol: String,
        minting_account: Account,
        initial_balances: Vec<(Account, Nat)>,
        logo: MetadataValue,
    ) -> Self {
        Self {
            controllers,
            token_name,
            token_symbol,
            minting_account,
            initial_balances,
            logo,
        }
    }
}
#[derive(CandidType, Deserialize)]
pub struct ICRC1InitArgs {
    pub decimals: Option<u8>,
    pub token_symbol: String,
    pub transfer_fee: Nat,
    pub metadata: Vec<(String, MetadataValue)>,
    pub minting_account: Account,
    pub initial_balances: Vec<(Account, Nat)>,
    pub maximum_number_of_accounts: Option<u64>,
    pub accounts_overflow_trim_quantity: Option<u64>,
    pub fee_collector_account: Option<Account>,
    pub archive_options: ArchiveOptions,
    pub max_memo_length: Option<u16>,
    pub token_name: String,
    pub feature_flags: Option<FeatureFlags>,
}

impl ICRC1InitArgs {
    pub fn new(
        token_symbol: String,
        minting_account: Account,
        initial_balances: Vec<(Account, Nat)>,
        token_name: String,
        metadata: Vec<(String, MetadataValue)>,
    ) -> Self {
        Self {
            decimals: Some(ICRC1_LEDGER_DEFAULT_DECIMAL),
            token_symbol,
            transfer_fee: Nat::from(ICRC1_LEDGER_DEFAULT_FEE),
            metadata,
            minting_account,
            initial_balances,
            maximum_number_of_accounts: None,
            accounts_overflow_trim_quantity: None,
            fee_collector_account: Some(Account {
                owner: ic_cdk::api::canister_self(),
                subaccount: None,
            }),
            archive_options: ArchiveOptions {
                num_blocks_to_archive: 2000,
                trigger_threshold: 1000,
                max_transactions_per_response: None,
                more_controller_ids: None,
                max_message_size_bytes: None,
                cycles_for_archive_creation: None,
                node_max_memory_size_bytes: None,
                controller_id: ic_cdk::api::canister_self(),
            },
            max_memo_length: None,
            token_name,
            feature_flags: Some(FeatureFlags { icrc2: true }),
        }
    }
}

#[derive(CandidType, Deserialize)]
pub enum ChangeFeeCollector {
    SetTo(Account),
    Unset,
}

#[derive(CandidType, Deserialize)]
pub struct UpgradeArgs {
    pub token_symbol: Option<String>,
    pub transfer_fee: Option<candid::Nat>,
    pub metadata: Option<Vec<(String, MetadataValue)>>,
    pub maximum_number_of_accounts: Option<u64>,
    pub accounts_overflow_trim_quantity: Option<u64>,
    pub change_fee_collector: Option<ChangeFeeCollector>,
    pub max_memo_length: Option<u16>,
    pub token_name: Option<String>,
    pub feature_flags: Option<FeatureFlags>,
}

#[derive(CandidType, Deserialize)]
pub enum LedgerArgument {
    Upgrade(Option<UpgradeArgs>),
    Init(ICRC1InitArgs),
}
