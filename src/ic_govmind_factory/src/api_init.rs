use crate::store;
use ic_cdk::{init, post_upgrade, pre_upgrade};

#[init]
fn init() {
    store::state::save();
}

#[pre_upgrade]
fn pre_upgrade() {
    store::state::save();
}

#[post_upgrade]
fn post_upgrade() {
    store::state::load();
}
