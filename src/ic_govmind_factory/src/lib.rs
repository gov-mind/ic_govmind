mod api_canister;
mod guards;
pub mod utils;
pub mod store;
pub mod types;
pub mod candid_file_generator;

const DEPLOY_THRESHOLD: u128 = 3_000_000_000_000;
const ADMIN_PID: &str = "lpeju-wvbhd-g2fqh-av4yi-fjgiz-hfcm2-5pja4-t6ubj-kr2qd-jwpih-jqe";
const CYCLEOPS_PID: &str = "cpbhu-5iaaa-aaaad-aalta-cai";

ic_cdk::export_candid!();
