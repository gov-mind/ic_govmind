use candid::{Principal, export_service};
use ic_cdk::query;

use crate::api_cycles::WalletReceiveResult;
use crate::api_init::CanisterArgs;
use ic_govmind_types::{
    ByteN,
    payment::{PaymentInfo, QueryCommonReq, QueryOrderResp},
    status::{StatusRequest, StatusResponse},
    user::{Attribute, DaoRole, UpdateUserInfo, UserInfo},
};
use serde_bytes::ByteBuf;

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    export_service!();
    __export_service()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn save_candid() {
        use std::env;
        use std::fs::write;
        use std::path::PathBuf;

        let dir = PathBuf::from(env::current_dir().unwrap());
        write(dir.join("ic_govmind_hub.did"), export_candid()).expect("Write failed.");
    }
}
