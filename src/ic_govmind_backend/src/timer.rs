use crate::{services::token_icrc1::TokenICRC1, store::TIMER_IDS, utils::icrc1_account_from_str};
use candid::{Nat, Principal};
use ic_cdk::futures::spawn;
use ic_cdk_timers::set_timer_interval;
use ic_govmind_types::dao::{DistributionModel, HOLDER_SUBACCOUNT};
use std::time::Duration;

pub fn setup_token_distribution_timer(model: DistributionModel, token_canister_id: Principal) {
    let interval = Duration::from_secs(60);

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

    // Immediate emission distribution
    if let Some(rate) = model.emission_rate {
        let amount = Nat::from(rate);
        for (addr, _) in model.initial_distribution.iter() {
            let account = icrc1_account_from_str(addr);
            match token_service
                .icrc1_transfer(
                    Some(HOLDER_SUBACCOUNT),
                    account,
                    amount.clone(),
                    None,
                    None,
                    None,
                )
                .await
            {
                Ok(res) => ic_cdk::println!(
                    "Distributed {} tokens to {} at time {}: {:?}",
                    &amount,
                    &addr,
                    &now,
                    res
                ),
                Err(e) => ic_cdk::println!(
                    "Failed to distribute {} tokens to {}: {:?}",
                    &amount,
                    &addr,
                    e
                ),
            }
        }
    }

    // Unlock schedule distribution
    if let Some(schedule) = &model.unlock_schedule {
        for (ts_sec, amt) in schedule {
            let scheduled_time_ns = ts_sec * 1_000_000_000;
            if scheduled_time_ns <= now {
                let amount_nat = Nat::from(*amt);
                for (addr, _) in model.initial_distribution.iter() {
                    let account = icrc1_account_from_str(addr);
                    match token_service
                        .icrc1_transfer(
                            Some(HOLDER_SUBACCOUNT),
                            account,
                            amount_nat.clone(),
                            None,
                            None,
                            None,
                        )
                        .await
                    {
                        Ok(res) => ic_cdk::println!(
                            "Unlocked {} tokens to {} at time {}: {:?}",
                            &amount_nat,
                            &addr,
                            &now,
                            res
                        ),
                        Err(e) => ic_cdk::println!(
                            "Failed to unlock {} tokens to {}: {:?}",
                            &amount_nat,
                            &addr,
                            e
                        ),
                    }
                }
            }
        }
    }
}
