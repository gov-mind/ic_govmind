use crate::{
    guards::{anonymous_guard, owner_guard},
    pay::{icrc1_transfer, token_balance, token_fee},
};
use candid::Principal;
use ic_cdk::update;
use ic_govmind_types::{
    ByteN,
    error::{CustomError, ErrorCode},
    payment::{PaymentInfo, PaymentType, TokenPrice},
    user::{Attribute, DaoRole, UpdateUserInfo, User, UserInfo},
};
use icrc_ledger_types::icrc1::account::Account;
use serde_bytes::ByteBuf;

use crate::store::{self};

#[update(guard = "anonymous_guard")]
fn user_login() -> Result<UserInfo, String> {
    let caller = ic_cdk::api::msg_caller();

    match store::user::get_user(caller) {
        Some(user) => Ok(user.into_inner().to_user_info(caller)),
        None => {
            let new_user = User::new();
            store::user::add_user(caller, new_user.clone());
            Ok(new_user.to_user_info(caller))
        }
    }
}

#[update(guard = "owner_guard")]
fn admin_login(user_pid: Principal) -> Result<UserInfo, String> {
    match store::user::get_user(user_pid) {
        Some(user) => Ok(user.into_inner().to_user_info(user_pid)),
        None => {
            let new_user = User::new();
            store::user::add_user(user_pid, new_user.clone());
            Ok(new_user.to_user_info(user_pid))
        }
    }
}

#[ic_cdk::update(guard = "anonymous_guard")]
fn set_avatar(new_avatar: String) -> Result<bool, String> {
    let caller = ic_cdk::api::msg_caller();
    let user_result = store::user::get_user(caller);

    match user_result {
        Some(_user_wrapper) => {
            store::user::update_user(caller, |user| {
                user.avatar = new_avatar.clone();
                user.updated_at = ic_cdk::api::time();
            })
            .map_err(|_| {
                CustomError::new(ErrorCode::DataUpdateError, Some("User Avatar")).to_string()
            })?;

            Ok(true)
        }
        None => Ok(false),
    }
}

#[ic_cdk::update(guard = "anonymous_guard")]
fn set_email(email: String) -> Result<bool, String> {
    let caller = ic_cdk::api::msg_caller();
    let user_result = store::user::get_user(caller);

    match user_result {
        Some(_user_wrapper) => {
            store::user::update_user(caller, |user| {
                user.email = email.clone();
                user.updated_at = ic_cdk::api::time();
            })
            .map_err(|_| {
                CustomError::new(ErrorCode::DataUpdateError, Some("User Email")).to_string()
            })?;

            Ok(true)
        }
        None => Ok(false),
    }
}

#[ic_cdk::update(guard = "anonymous_guard")]
fn set_public_key(
    trusted_ecdsa_pub_key: Option<ByteBuf>,
    trusted_eddsa_pub_key: Option<ByteN<32>>,
) -> Result<bool, String> {
    let caller = ic_cdk::api::msg_caller();
    let user_result = store::user::get_user(caller);

    match user_result {
        Some(_user_wrapper) => {
            store::user::update_user(caller, |user| {
                user.trusted_ecdsa_pub_key = trusted_ecdsa_pub_key.clone();
                user.trusted_eddsa_pub_key = trusted_eddsa_pub_key.clone();
                user.updated_at = ic_cdk::api::time();
            })
            .map_err(|_| {
                CustomError::new(ErrorCode::DataUpdateError, Some("User Public Key")).to_string()
            })?;

            Ok(true)
        }
        None => Ok(false),
    }
}

#[ic_cdk::update(guard = "anonymous_guard")]
fn add_user_attribute(new_attribute: Attribute) -> Result<bool, String> {
    let caller = ic_cdk::api::msg_caller();
    let user_wrapper = store::user::get_user(caller);

    match user_wrapper {
        Some(_user_wrapper) => {
            store::user::update_user(caller, |user| {
                user.attributes.retain(|attr| attr.key != new_attribute.key);
                user.attributes.push(new_attribute);
                user.updated_at = ic_cdk::api::time();
            })
            .map_err(|_| {
                CustomError::new(ErrorCode::DataUpdateError, Some("User Attribute")).to_string()
            })?;

            Ok(true)
        }
        None => Err("User not found".to_string()),
    }
}

#[ic_cdk::update(guard = "anonymous_guard")]
fn set_user_info(update_info: UpdateUserInfo) -> Result<bool, String> {
    let caller = ic_cdk::api::msg_caller();
    let user_result = store::user::get_user(caller);

    match user_result {
        Some(_user_wrapper) => {
            store::user::update_user(caller, |user| {
                if let Some(avatar) = &update_info.avatar {
                    user.avatar = avatar.clone();
                }
                if let Some(location) = &update_info.location {
                    user.location = location.clone();
                }
                if let Some(genre) = &update_info.genre {
                    user.genre = genre.clone();
                }
                if let Some(website) = &update_info.website {
                    user.website = website.clone();
                }
                if let Some(bio) = &update_info.bio {
                    user.bio = bio.clone();
                }
                if let Some(handler) = &update_info.handler {
                    user.handler = handler.clone();
                }
                if let Some(born) = update_info.born {
                    user.born = Some(born);
                }
                if let Some(confirm_agreement) = update_info.confirm_agreement {
                    user.confirm_agreement = confirm_agreement;
                }
                user.updated_at = ic_cdk::api::time();
            })
            .map_err(|_| {
                CustomError::new(ErrorCode::DataUpdateError, Some("User Info")).to_string()
            })?;

            Ok(true)
        }
        None => Ok(false),
    }
}

#[ic_cdk::update(guard = "anonymous_guard")]
fn create_payment_order(source: String) -> Result<Option<PaymentInfo>, String> {
    let payer = ic_cdk::api::msg_caller();
    let mut payment_info: Option<PaymentInfo> = None;

    store::state::load();
    store::state::with_mut(|state| {
        let new_order_id = state.next_order_id;
        let token_price = TokenPrice::new_for_creation_dao();
        let payment_type = PaymentType::CreationPrice(token_price.clone());

        payment_info = Some(store::payment::create_payment_order(
            new_order_id,
            payer,
            source,
            token_price.token_name,
            token_price.price,
            payment_type,
        ));

        state.total_orders += 1;
        state.next_order_id += 1;
    });
    store::state::save();

    Ok(payment_info)
}

#[ic_cdk::update(guard = "anonymous_guard")]
async fn confirm_payment_order(pay_id: u64) -> Result<bool, String> {
    let result = store::payment::confirm_payment_order(pay_id).await;
    result
}

#[ic_cdk::update(guard = "anonymous_guard")]
async fn refund_payment_order(pay_id: u64, to: Vec<u8>) -> Result<bool, String> {
    let from = ic_cdk::api::msg_caller();
    let result = store::payment::refund_payment_order(pay_id, from, to).await;
    result
}

#[ic_cdk::update(guard = "owner_guard")]
async fn add_invite_code(invite_code: String) -> Result<String, String> {
    store::state::load();
    store::state::add_invite_code(invite_code.clone())?;
    store::state::save();
    Ok(invite_code)
}

#[ic_cdk::update(guard = "owner_guard")]
async fn add_invite_codes(invite_codes: Vec<String>) -> Result<u8, String> {
    store::state::load();
    store::state::add_invite_codes(invite_codes.clone())?;
    store::state::save();
    Ok(invite_codes.len() as u8)
}

#[ic_cdk::update(guard = "owner_guard")]
pub async fn canister_balance() -> u64 {
    token_balance(
        "ICP",
        Account {
            owner: ic_cdk::api::canister_self(),
            subaccount: None,
        },
    )
    .await
}

#[ic_cdk::update(guard = "owner_guard")]
pub async fn canister_transfer(to_pid: Principal, amount: u64) -> Result<bool, String> {
    let balance = canister_balance().await;
    let to_account = Account {
        owner: to_pid,
        subaccount: None,
    };
    let fee = token_fee("ICP");

    if balance < amount + fee {
        return Err(format!(
            "Insufficient balance: available={}, required={}",
            balance,
            amount + fee
        ));
    }

    icrc1_transfer("ICP", None, to_account, amount)
        .await
        .map(|_| true)
        .map_err(|err| format!("Transfer failed: {}", err))
}

#[update]
fn link_user_to_dao(dao: Principal, role: DaoRole) -> bool {
    let caller = ic_cdk::api::msg_caller();
    match store::user::link_user_to_dao(caller, dao, role) {
        Ok(_) => true,
        Err(_) => false,
    }
}
