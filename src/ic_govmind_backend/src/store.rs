use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_cdk_timers::TimerId;
use ic_management_canister_types::{
    EcdsaKeyId, EcdsaPublicKeyResult, SchnorrKeyId, SchnorrPublicKeyResult,
};
use std::{cell::RefCell, collections::HashMap};

use ciborium::{from_reader, into_writer};
use ic_govmind_types::{
    chain::BlockchainConfig,
    dao::{ChainType, Committee, Dao, DaoAsset, DaoMember, DistributionRecord, Proposal},
};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::Bound,
    DefaultMemoryImpl, StableBTreeMap, StableCell, Storable,
};
use ic_web3_rs::ic::KeyInfo;
use serde::Serialize;
use std::borrow::Cow;

use crate::{
    types::{KeyEnvironment, NextIdType},
    ECDSA_SIGN_CYCLES,
};

#[derive(CandidType, Default, Debug, Serialize, Deserialize, Clone)]
pub struct State {
    pub root: Option<Principal>,
    pub admins: Vec<Principal>,
    pub org_info: Option<Dao>,
    pub members: HashMap<String, DaoMember>, // user_id → DaoMember
    pub assets: HashMap<String, DaoAsset>,
    pub ecdsa_key: Option<EcdsaKeyId>,
    pub schnorr_key: Option<SchnorrKeyId>,
    pub derivation_path: Vec<Vec<u8>>,
    pub ecdsa_public_key: Option<EcdsaPublicKeyResult>,
    pub schnorr_public_key: Option<SchnorrPublicKeyResult>,

    pub key_env: KeyEnvironment,
    pub chain_config: Vec<BlockchainConfig>,
    pub next_ids: HashMap<String, u64>,
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

impl State {
    pub fn get_next_id(&mut self, key: NextIdType) -> u64 {
        let k = key.to_string();
        let next_id = self.next_ids.entry(k).or_insert(1);
        let id = *next_id;
        *next_id += 1;
        id
    }

    pub fn peek_next_id(&self, key: NextIdType) -> u64 {
        let k = key.to_string();
        *self.next_ids.get(&k).unwrap_or(&1)
    }

    pub fn get_chain_config_by_type(&self, chain_type: &ChainType) -> Option<BlockchainConfig> {
        self.chain_config
            .iter()
            .find(|cfg| &cfg.chain_type == chain_type)
            .cloned()
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

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub struct DistributionRecordWrapper(pub DistributionRecord);

impl Storable for DistributionRecordWrapper {
    const BOUND: Bound = Bound::Unbounded;

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn to_bytes(&self) -> std::borrow::Cow<'_, [u8]> {
        std::borrow::Cow::Owned(Encode!(self).unwrap())
    }
}

impl DistributionRecordWrapper {
    pub fn into_inner(self) -> DistributionRecord {
        self.0
    }
}

pub type Memory = VirtualMemory<DefaultMemoryImpl>;
pub const STATE_MEMORY_ID: MemoryId = MemoryId::new(0);
pub const PROPOSALS_MEMORY_ID: MemoryId = MemoryId::new(1);
pub const DISTRIBUTION_MEMORY_ID: MemoryId = MemoryId::new(2);

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

    static DISTRIBUTION_HISTORY: RefCell<StableBTreeMap<u64, DistributionRecordWrapper, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(DISTRIBUTION_MEMORY_ID))
        )
    );

    pub static TIMER_IDS: RefCell<Vec<TimerId>> = RefCell::new(Vec::new());
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

    pub fn update_org_info(updated: Dao) {
        state::with_mut(|s| {
            s.org_info = Some(updated);
        });
    }

    pub fn get_ecdsa_key_id() -> EcdsaKeyId {
        state::with(|r| r.ecdsa_key.as_ref().expect("ecdsa_key not set").to_owned())
    }

    pub fn get_ecdsa_public_key() -> EcdsaPublicKeyResult {
        state::with(|r| {
            r.ecdsa_public_key
                .as_ref()
                .expect("ecdsa_public_key not set")
                .to_owned()
        })
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
        state::with_mut(|s| s.get_next_id(NextIdType::Proposal))
    }

    pub fn get_next_committee_id() -> u64 {
        state::with_mut(|s| s.get_next_id(NextIdType::Committee))
    }

    pub fn get_env() -> KeyEnvironment {
        state::with(|r| r.key_env.clone())
    }

    pub fn get_chain_config(chain_type: &ChainType) -> Option<BlockchainConfig> {
        state::with(|r| r.get_chain_config_by_type(chain_type))
    }

    pub fn add_chain_config(new_chain: BlockchainConfig) -> Result<(), String> {
        state::with_mut(|s| {
            if s.chain_config
                .iter()
                .any(|c| c.chain_type == new_chain.chain_type)
            {
                return Err(format!("Chain {:?} already exists", new_chain.chain_type));
            }

            s.chain_config.push(new_chain);
            Ok(())
        })
    }

    pub fn update_chain_config(
        chain_type: ChainType,
        f: impl FnOnce(&mut BlockchainConfig),
    ) -> Result<(), String> {
        state::with_mut(|s| {
            if let Some(chain) = s
                .chain_config
                .iter_mut()
                .find(|c| c.chain_type == chain_type)
            {
                f(chain);
                Ok(())
            } else {
                Err(format!("Chain {:?} not found", chain_type))
            }
        })
    }

    pub fn get_nonce(chain_type: &ChainType) -> Option<u64> {
        let chain = get_chain_config(chain_type)?;
        chain.nonce.clone()
    }

    pub fn increment_nonce(chain_type: ChainType) -> Result<(), String> {
        update_chain_config(chain_type, |chain_config| {
            let next = chain_config.nonce.unwrap_or(0).saturating_add(1);
            chain_config.nonce = Some(next);
        })
    }

    pub fn set_nonce(chain_type: ChainType, nonce: Option<u64>) -> Result<(), String> {
        update_chain_config(chain_type, |chain_config| {
            chain_config.nonce = nonce;
        })
    }

    pub fn get_chain_id(chain_type: &ChainType) -> Option<u64> {
        let chain = get_chain_config(chain_type)?;
        chain.rpc_config.as_ref()?.chain_id
    }

    pub fn get_key_info() -> Result<KeyInfo, String> {
        let ecdsa_key = get_ecdsa_key_id();
        let derivation_path = state::with(|r| r.derivation_path.clone());

        let key_info = KeyInfo {
            derivation_path,
            key_name: ecdsa_key.name.clone(),
            ecdsa_sign_cycles: Some(ECDSA_SIGN_CYCLES),
        };

        Ok(key_info)
    }

    /// Add a new committee to the DAO
    pub fn add_committee(new_committee: Committee) -> Result<(), String> {
        let mut dao = get_dao_info().ok_or_else(|| "DAO not initialized".to_string())?;

        if dao
            .committees
            .iter()
            .any(|c| c.committee_type == new_committee.committee_type)
        {
            return Err(format!(
                "Committee of type {:?} already exists",
                new_committee.committee_type
            ));
        }

        dao.committees.push(new_committee);

        // update org_info
        update_org_info(dao);

        Ok(())
    }

    /// Update an existing committee (e.g. members, term, election timestamps)
    pub fn update_committee(
        committee_id: u16,
        updater: impl FnOnce(&mut Committee),
    ) -> Result<(), String> {
        let mut dao = get_dao_info().ok_or_else(|| "DAO not initialized".to_string())?;

        let committee = dao
            .committees
            .iter_mut()
            .find(|c| c.id == committee_id)
            .ok_or_else(|| format!("Committee {} not found", committee_id))?;

        updater(committee);

        // 更新 org_info
        update_org_info(dao);

        Ok(())
    }
}

pub mod proposals {
    use super::*;
    use crate::utils::current_time_secs;
    use ic_govmind_types::dao::{Proposal, ProposalStatus};

    pub fn create_proposal(
        title: String,
        content: String,
        proposer: String,
        voting_period_secs: u64,
        committee_id: Option<u16>,
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
            committee_id: committee_id
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

pub mod distribution {
    use super::*;

    pub fn add_distribution_record(record: DistributionRecord) {
        DISTRIBUTION_HISTORY.with(|map| {
            STATE.with(|s| {
                let mut st = s.borrow_mut();
                let id = st.get_next_id(NextIdType::Distribution);

                map.borrow_mut()
                    .insert(id, DistributionRecordWrapper(record));
            });
        });
    }

    pub fn get_distribution_record(id: u64) -> Option<DistributionRecord> {
        DISTRIBUTION_HISTORY.with(|map| map.borrow().get(&id).map(|w| w.into_inner()))
    }

    pub fn list_distribution_records(start: u64, limit: usize) -> Vec<(u64, DistributionRecord)> {
        DISTRIBUTION_HISTORY.with(|map| {
            map.borrow()
                .range(start..)
                .take(limit)
                .map(|(id, w)| (id, w.into_inner()))
                .collect()
        })
    }

    pub fn get_next_distribution_id() -> u64 {
        state::with_mut(|s| s.get_next_id(NextIdType::Distribution))
    }
}
