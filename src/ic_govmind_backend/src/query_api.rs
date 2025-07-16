use ic_cdk::query;

use crate::{store::state, types::Dao};

#[query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[query]
fn dao_info() -> Option<Dao> {
    state::get_dao_info()
}
