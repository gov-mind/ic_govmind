use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_management_canister_types::{
    EcdsaKeyId, EcdsaPublicKeyResult, SchnorrKeyId, SchnorrPublicKeyResult,
};
use std::{cell::RefCell, collections::HashMap};

use ciborium::{from_reader, into_writer};
use ic_govmind_types::dao::{Dao, DaoAsset, DaoMember, Proposal};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::Bound,
    DefaultMemoryImpl, StableBTreeMap, StableCell, Storable,
};
use serde::Serialize;
use std::borrow::Cow;

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct State {
    pub root: Option<Principal>,
    pub admins: Vec<Principal>,
    pub org_info: Option<Dao>,
    pub members: HashMap<String, DaoMember>, // user_id → DaoMember
    pub assets: HashMap<String, DaoAsset>,
    pub next_proposal_id: u64,
    pub ecdsa_key: Option<EcdsaKeyId>,
    pub schnorr_key: Option<SchnorrKeyId>,
    pub derivation_path: Vec<Vec<u8>>,
    pub ecdsa_public_key: Option<EcdsaPublicKeyResult>,
    pub schnorr_public_key: Option<SchnorrPublicKeyResult>,
}

impl Storable for State {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut buf = vec![];
        into_writer(self, &mut buf).expect("failed to encode State data");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        from_reader(&bytes[..]).expect("failed to decode State data")
    }
}

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub struct ProposalWrapper(pub Proposal);

impl Storable for ProposalWrapper {
    const BOUND: Bound = Bound::Unbounded;

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn to_bytes(&self) -> std::borrow::Cow<'_, [u8]> {
        std::borrow::Cow::Owned(Encode!(self).unwrap())
    }
}

impl ProposalWrapper {
    pub fn into_inner(self) -> Proposal {
        self.0
    }
}

pub type Memory = VirtualMemory<DefaultMemoryImpl>;
pub const STATE_MEMORY_ID: MemoryId = MemoryId::new(0);
pub const PROPOSALS_MEMORY_ID: MemoryId = MemoryId::new(1);

thread_local! {
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    pub static STATE: RefCell<State> = RefCell::default();

    static STATE_STORE: RefCell<StableCell<State, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(STATE_MEMORY_ID)),
            State::default()
        ).expect("failed to init STATE_STORE store")
    );

    static PROPOSALS_STORE: RefCell<StableBTreeMap<u64, ProposalWrapper, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(PROPOSALS_MEMORY_ID))
        )
    );
}

pub fn read_memory_manager<F, R>(f: F) -> R
where
    F: FnOnce(&MemoryManager<DefaultMemoryImpl>) -> R,
{
    MEMORY_MANAGER.with_borrow(|manager| f(manager))
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
                    .expect("failed to set STATE_STORE data");
            });
        });
    }

    pub fn add_admin(principal: Principal) -> Result<(), String> {
        state::with_mut(|s| {
            if s.admins.contains(&principal) {
                return Err("Admin already exists".to_string());
            }
            s.admins.push(principal);
            Ok(())
        })
    }

    pub fn remove_admin(principal: Principal) -> Result<(), String> {
        state::with_mut(|s| {
            let original_len = s.admins.len();
            s.admins.retain(|p| p != &principal);
            if s.admins.len() == original_len {
                return Err("Admin not found".to_string());
            }
            Ok(())
        })
    }

    pub fn get_dao_info() -> Option<Dao> {
        state::with(|r| r.org_info.clone())
    }

    pub fn get_ecdsa_key_id() -> EcdsaKeyId {
        state::with(|r| r.ecdsa_key.as_ref().expect("ecdsa_key not set").to_owned())
    }

    pub fn get_schnorr_key_id() -> SchnorrKeyId {
        state::with(|r| {
            r.schnorr_key
                .as_ref()
                .expect("schnorr_key not set")
                .to_owned()
        })
    }

    pub fn get_next_proposal_id() -> u64 {
        state::with_mut(|s| {
            let id = s.next_proposal_id;
            s.next_proposal_id += 1;
            id
        })
    }
}

pub mod proposals {
    use super::*;
    use ic_govmind_types::dao::{Proposal, ProposalStatus};
    use crate::utils::current_time_secs;

    pub fn create_proposal(
        title: String,
        content: String,
        proposer: String,
        voting_period_secs: u64,
    ) -> Result<u64, String> {
        let proposal_id = state::get_next_proposal_id();
        let now = current_time_secs();
        
        let proposal = Proposal {
            id: proposal_id,
            title,
            content,
            proposer,
            created_at: now,
            expires_at: now + voting_period_secs,
            status: ProposalStatus::Active,
            votes: Vec::new(),
            metadata: None,
        };

        PROPOSALS_STORE.with(|store| {
            store
                .borrow_mut()
                .insert(proposal_id, ProposalWrapper(proposal))
        });

        state::save();
        Ok(proposal_id)
    }

    pub fn get_proposal(proposal_id: u64) -> Option<Proposal> {
        PROPOSALS_STORE.with(|store| {
            store
                .borrow()
                .get(&proposal_id)
                .map(|wrapper| wrapper.into_inner())
        })
    }

    pub fn get_all_proposals() -> Vec<Proposal> {
        let mut proposals: Vec<Proposal> = PROPOSALS_STORE.with(|store| {
            store
                .borrow()
                .iter()
                .map(|(_, wrapper)| wrapper.into_inner())
                .collect()
        });
        proposals.reverse();
        proposals
    }

    pub fn update_proposal_status(proposal_id: u64, status: ProposalStatus) -> Result<(), String> {
        PROPOSALS_STORE.with(|store| {
            let mut store_mut = store.borrow_mut();
            if let Some(mut wrapper) = store_mut.get(&proposal_id) {
                wrapper.0.status = status;
                store_mut.insert(proposal_id, wrapper);
                Ok(())
            } else {
                Err("Proposal not found".to_string())
            }
        })
    }
}
