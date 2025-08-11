use crate::store;
use crate::{services::token_icrc1::TokenICRC1, store::TIMER_IDS, utils::icrc1_account_from_str};
use candid::{Nat, Principal};
use ic_cdk::futures::spawn;
use ic_cdk_timers::set_timer_interval;
use ic_govmind_types::dao::{
    DistributionModel, DistributionRecord, DistributionType, HOLDER_SUBACCOUNT,
};
use std::{collections::HashMap, time::Duration};

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

    // Initial Distribution
    if !model.initial_distribution.is_empty() {
        distribute_to_all(
            &token_service,
            &model.initial_distribution,
            model.emission_rate.map(Nat::from),
            DistributionType::Initial,
            now,
        )
        .await;
    }

    // Emission
    if let Some(rate) = model.emission_rate {
        let amount = Nat::from(rate);
        distribute_to_all(
            &token_service,
            &model.initial_distribution,
            Some(amount),
            DistributionType::Emission,
            now,
        )
        .await;
    }

    // Unlock Schedule
    if let Some(schedule) = &model.unlock_schedule {
        for (ts_sec, amt) in schedule {
            let scheduled_time_ns = ts_sec * 1_000_000_000;
            if scheduled_time_ns <= now {
                let amount_nat = Nat::from(*amt);
                distribute_to_all(
                    &token_service,
                    &model.initial_distribution,
                    Some(amount_nat),
                    DistributionType::Scheduled,
                    now,
                )
                .await;
            }
        }
    }
}

async fn distribute_to_all(
    token_service: &TokenICRC1,
    distribution_map: &HashMap<String, u128>,
    amount: Option<Nat>,
    dist_type: DistributionType,
    now: u64,
) {
    if let Some(amount) = amount {
        for (addr, _) in distribution_map.iter() {
            let account = icrc1_account_from_str(addr);
            let result = token_service
                .icrc1_transfer(
                    Some(HOLDER_SUBACCOUNT),
                    account,
                    amount.clone(),
                    None,
                    None,
                    None,
                )
                .await;

            match &result {
                Ok(res) => ic_cdk::println!(
                    "[{:?}] Distributed {} tokens to {} at time {}: {:?}",
                    dist_type,
                    amount,
                    addr,
                    now,
                    res
                ),
                Err(e) => ic_cdk::println!(
                    "[{:?}] Failed to distribute {} tokens to {}: {:?}",
                    dist_type,
                    amount,
                    addr,
                    e
                ),
            }

            store::distribution::add_distribution_record(DistributionRecord {
                timestamp: now,
                distribution_type: dist_type.clone(),
                recipient: addr.clone(),
                amount: amount.clone(),
                tx_result: match &result {
                    Ok(res) => format!("Success: {:?}", res),
                    Err(e) => format!("Error: {:?}", e),
                },
            });
        }
    }
}
