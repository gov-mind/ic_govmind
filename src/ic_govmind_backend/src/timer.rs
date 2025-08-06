use crate::{services::token_icrc1::TokenICRC1, store::TIMER_IDS, utils::icrc1_account_from_str};
use candid::{Nat, Principal};
use ic_cdk::futures::spawn;
use ic_cdk_timers::set_timer_interval;
use ic_govmind_types::dao::DistributionModel;
use std::time::Duration;

pub fn setup_token_distribution_timer(model: DistributionModel, token_canister_id: Principal) {
    let interval = Duration::from_secs(60 * 60 * 24);

    let timer_id = set_timer_interval(interval, move || {
        spawn(distribute_tokens(model.clone(), token_canister_id));
    });

    TIMER_IDS.with(|timer_ids| timer_ids.borrow_mut().push(timer_id));
}

async fn distribute_tokens(model: DistributionModel, token_canister_id: Principal) {
    let token_service = TokenICRC1 {
        principal: token_canister_id,
    };
    let now = ic_cdk::api::time();

    if let Some(rate) = model.emission_rate {
        for (addr, _) in model.initial_distribution.iter() {
            let account = icrc1_account_from_str(addr);
            let amount = Nat::from(rate);

            let _ = token_service
                .icrc1_transfer(None, account, amount, None, None, None)
                .await;
        }
    }

    if let Some(schedule) = &model.unlock_schedule {
        for (ts, amount) in schedule {
            if *ts * 1_000_000_000 <= now {
                for (addr, _) in model.initial_distribution.iter() {
                    let account = icrc1_account_from_str(addr);
                    let amount_nat = Nat::from(*amount);
                    let _ = token_service
                        .icrc1_transfer(None, account, amount_nat, None, None, None)
                        .await;
                }
            }
        }
    }
}
