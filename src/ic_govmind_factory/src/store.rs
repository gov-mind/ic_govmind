use candid::{CandidType, Decode, Encode, Principal};
use ciborium::{from_reader, into_writer};
use ic_govmind_types::dao::Dao;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::Bound,
    DefaultMemoryImpl, StableBTreeMap, StableCell, Storable,
};
use serde::{Deserialize, Serialize};
use std::{borrow::Cow, cell::RefCell};

use crate::types::CanisterDeploy;

type Memory = VirtualMemory<DefaultMemoryImpl>;

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub struct State {
    pub name: String,
    pub owner: Principal,
    pub gov_count: u128,
    pub next_order_id: u64,
    pub total_orders: u64,
    pub invite_codes: Vec<String>,
    pub canister_list: Vec<CanisterDeploy>,
}

impl Default for State {
    fn default() -> Self {
        Self {
            name: String::from("Gov Mind Factory"),
            owner: Principal::anonymous(),
            gov_count: 0 as u128,
            next_order_id: 0,
            total_orders: 0,
            invite_codes: vec![],
            canister_list: vec![],
        }
    }
}

impl Storable for State {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut buf = vec![];
        into_writer(self, &mut buf).expect("failed to encode Factory data");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        from_reader(&bytes[..]).expect("failed to decode Factory data")
    }
}

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub struct DaoWrapper(pub Dao);

impl Storable for DaoWrapper {
    const BOUND: Bound = Bound::Unbounded;

    fn from_bytes(bytes: std::borrow::Cow<'_, [u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn to_bytes(&self) -> std::borrow::Cow<'_, [u8]> {
        std::borrow::Cow::Owned(Encode!(self).unwrap())
    }
}

impl DaoWrapper {
    pub fn into_inner(self) -> Dao {
        self.0
    }
}

const STATE_MEMORY_ID: MemoryId = MemoryId::new(0);
const DAO_MEMORY_ID: MemoryId = MemoryId::new(1);

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::default());

    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static STATE_STORE: RefCell<StableCell<State, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(STATE_MEMORY_ID)),
            State::default()
        ).expect("failed to init STATE_STORE")
    );

    static DAO_STORE: RefCell<StableBTreeMap<Principal, DaoWrapper, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(DAO_MEMORY_ID)),
        )
    );
}

pub mod state {
    use super::*;

    pub fn with<R>(f: impl FnOnce(&State) -> R) -> R {
        STATE.with(|r| f(&r.borrow()))
    }

    pub fn with_mut<R>(f: impl FnOnce(&mut State) -> R) -> R {
        STATE.with(|r| f(&mut r.borrow_mut()))
    }

    pub fn load() {
        STATE_STORE.with(|r| {
            let s = r.borrow().get().clone();
            STATE.with(|h| {
                *h.borrow_mut() = s;
            });
        });
    }

    pub fn save() {
        STATE.with(|h| {
            STATE_STORE.with(|r| {
                r.borrow_mut()
                    .set(h.borrow().clone())
                    .expect("failed to save User Center data");
            });
        });
    }

    pub fn add_invite_code(invite_code: String) -> Result<String, String> {
        state::with_mut(|r| {
            if r.invite_codes.contains(&invite_code) {
                return Ok(invite_code.clone());
            }

            if r.invite_codes.len() >= 20 {
                return Err(String::from("invite codes MaximumRecords"));
            }

            r.invite_codes.push(invite_code.clone());
            Ok(invite_code.clone())
        })
    }
}

pub mod gov {
    use ic_cdk::api::time;
    use serde_bytes::ByteArray;

    use super::*;

    pub fn get_dao(pid: Principal) -> Option<DaoWrapper> {
        DAO_STORE.with(|r| r.borrow().get(&pid))
    }

    pub fn get_dao_count() -> u64 {
        DAO_STORE.with(|r| r.borrow().len())
    }

    pub fn get_dao_pids() -> Vec<Principal> {
        DAO_STORE.with(|r| {
            let user_store = r.borrow();
            user_store.iter().map(|(principal, _)| principal).collect()
        })
    }

    pub fn add_dao(pid: Principal, dao: Dao) {
        DAO_STORE.with(|r| r.borrow_mut().insert(pid, DaoWrapper(dao)));
    }

    pub fn update_dao(pid: Principal, update_fn: impl FnOnce(&mut Dao)) -> Result<(), String> {
        DAO_STORE.with(|store| {
            let mut daos = store.borrow_mut();

            // Fetch the existing user
            if let Some(dao_wrapper) = daos.get(&pid) {
                let mut dao = dao_wrapper.into_inner();
                update_fn(&mut dao);
                daos.insert(pid, DaoWrapper(dao));
                Ok(())
            } else {
                Err(format!("Dao with principal {} not found", pid))
            }
        })
    }

    pub fn add_canister(canister_id: Principal, wasm_name: String, hash: ByteArray<32>) {
        STATE.with(|r| {
            let mut state = r.borrow_mut();
            state.canister_list.push(CanisterDeploy {
                deploy_at: time(),
                canister: canister_id,
                wasm_name,
                wasm_hash: hash,
            });
        });
    }

    pub fn get_dao_list_paginated(
        page: usize,
        page_size: usize,
    ) -> (Vec<(Principal, DaoWrapper)>, u64) {
        DAO_STORE.with(|r| {
            let daos = r.borrow();
            let total_count: usize = daos.len() as usize;

            if page_size == 0 || page * page_size >= total_count {
                return (vec![], total_count as u64);
            }

            let start = page * page_size;
            let end = (start + page_size).min(total_count);

            let dao_page: Vec<(Principal, DaoWrapper)> = daos
                .iter()
                .skip(start)
                .take(end - start)
                .map(|(pid, dao)| (pid.clone(), dao.clone()))
                .collect();

            (dao_page, total_count as u64)
        })
    }
}
