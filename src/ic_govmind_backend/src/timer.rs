use crate::store;
use crate::{services::token_icrc1::TokenICRC1, store::TIMER_IDS, utils::icrc1_account_from_str};
use candid::{Nat, Principal};
use ic_cdk::futures::spawn;
use ic_cdk_timers::set_timer_interval;
use ic_govmind_types::dao::{
    DistributionModel, DistributionRecord, DistributionType, HOLDER_SUBACCOUNT,
};
use std::{
    cell::RefCell,
    rc::Rc,
    {collections::HashMap, time::Duration},
};

pub fn setup_token_distribution_timer(model: DistributionModel, token_canister_id: Principal) {
    let model = Rc::new(RefCell::new(model));
    let interval = Duration::from_secs(60);

    let model_clone = model.clone();
    let timer_id = set_timer_interval(interval, move || {
        let model_clone = model_clone.clone();
        let token_canister_id = token_canister_id;
        spawn(async move {
            distribute_tokens_shared(model_clone, token_canister_id).await;
        });
    });

    TIMER_IDS.with(|timer_ids| timer_ids.borrow_mut().push(timer_id));
}

async fn distribute_tokens_shared(
    model: Rc<RefCell<DistributionModel>>,
    token_canister_id: Principal,
) {
    let now = ic_cdk::api::time();
    let token_service = TokenICRC1 {
        principal: token_canister_id,
    };

    let mut m = model.borrow_mut();

    // ---- Initial Distribution ----
    if m.initial_executed_at.is_none() && !m.initial_distribution.is_empty() {
        distribute_to_all(
            &token_service,
            &m.initial_distribution,
            None,
            DistributionType::Initial,
            now,
        )
        .await;
        m.initial_executed_at = Some(now);
    }

    // ---- Emission ----
    if let Some(rate) = m.emission_rate {
        let should_emit = match m.last_emission_time {
            Some(last) => now.saturating_sub(last) >= 60,
            None => true,
        };
        if should_emit {
            let amount = Nat::from(rate);
            distribute_to_all(
                &token_service,
                &m.initial_distribution,
                Some(amount),
                DistributionType::Emission,
                now,
            )
            .await;
            m.last_emission_time = Some(now);
        }
    }

    // ---- Unlock Schedule ----
    if let Some(schedule) = &mut m.unlock_schedule {
        for item in schedule.iter_mut() {
            let scheduled_time_ns = item.timestamp * 1_000_000_000;
            if !item.executed && scheduled_time_ns <= now {
                let mut single_map = HashMap::new();
                single_map.insert(item.addr.clone(), item.amount);

                distribute_to_all(
                    &token_service,
                    &single_map,
                    Some(Nat::from(item.amount)),
                    DistributionType::Scheduled,
                    now,
                )
                .await;

                item.executed = true;
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
    for (addr, val) in distribution_map.iter() {
        let send_amount = match &amount {
            Some(a) => a.clone(),
            None => Nat::from(*val),
        };

        let account = icrc1_account_from_str(addr);
        let result = token_service
            .icrc1_transfer(
                Some(HOLDER_SUBACCOUNT),
                account,
                send_amount.clone(),
                None,
                None,
                None,
            )
            .await;

        match &result {
            Ok(res) => ic_cdk::println!(
                "[{:?}] Distributed {} tokens to {} at time {}: {:?}",
                dist_type,
                send_amount,
                addr,
                now,
                res
            ),
            Err(e) => ic_cdk::println!(
                "[{:?}] Failed to distribute {} tokens to {}: {:?}",
                dist_type,
                send_amount,
                addr,
                e
            ),
        }

        store::distribution::add_distribution_record(DistributionRecord {
            timestamp: now,
            distribution_type: dist_type.clone(),
            recipient: addr.clone(),
            amount: send_amount.clone(),
            tx_result: match &result {
                Ok(res) => format!("Success: {:?}", res),
                Err(e) => format!("Error: {:?}", e),
            },
        });
    }
}
