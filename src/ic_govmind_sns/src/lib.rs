use candid::{CandidType, Deserialize, Principal};
use ic_cdk::call::{Call};
use ic_cdk::api::{debug_print};
use ic_cdk_macros::*;
use std::borrow::Cow;
use std::cell::RefCell;
use serde::Serialize;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap, Storable,
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Core SNS Types
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct SnsCanister {
    pub id: String,
    pub name: String,
    pub canister_id: String,
    pub description: String,
    pub logo: Option<String>, // base64 image data
    pub url: Option<String>,
    pub total_proposals: u32,
    pub active_proposals: u32,
    pub last_activity: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct SnsProposal {
    pub id: u64,
    pub title: String,
    pub summary: String,
    pub status: String,
    pub executed: bool,
    pub executed_at: Option<u64>,
    pub proposer: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub total_votes: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum SnsGovernanceError {
    CanisterNotFound,
    InvalidCanisterId,
    CrossCanisterCallFailed(String),
    Unauthorized,
    InvalidData(String),
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PaginationInfo {
    pub total_count: u32,
    pub total_pages: u32,
    pub current_page: u32,
    pub page_size: u32,
    pub has_next_page: bool,
    pub has_prev_page: bool,
    pub next_page_offset: Option<u32>,
    pub prev_page_offset: Option<u32>,
}

// SNS Root canister types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ListDeployedSnsesResponse {
    pub instances: Vec<DeployedSnsInstance>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct DeployedSnsInstance {
    pub root_canister_id: Option<candid::Principal>,
    pub governance_canister_id: Option<candid::Principal>,
    pub index_canister_id: Option<candid::Principal>,
    pub swap_canister_id: Option<candid::Principal>,
    pub ledger_canister_id: Option<candid::Principal>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct EmptyRecord {}

// SNS Governance canister types - Using official interface (simplified)
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct GetMetadataResponse {
    pub url: Option<String>,
    pub logo: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ListProposals {
    pub include_reward_status: Vec<i32>,
    pub before_proposal: Option<ProposalId>,
    pub limit: u32,
    pub exclude_type: Vec<u64>,
    pub include_topics: Option<Vec<TopicSelector>>,
    pub include_status: Vec<i32>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TopicSelector {
    pub topic: Option<Topic>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum Topic {
    DappCanisterManagement,
    DaoCommunitySettings,
    ApplicationBusinessLogic,
    CriticalDappOperations,
    TreasuryAssetManagement,
    Governance,
    SnsFrameworkManagement,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ListProposalsResponse {
    pub include_ballots_by_caller: Option<bool>,
    pub proposals: Vec<ProposalData>,
    pub include_topic_filtering: Option<bool>,
}

// Using the official ProposalData structure (simplified - only fields we use)
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ProposalData {
    pub id: Option<ProposalId>,
    pub payload_text_rendering: Option<String>,
    pub topic: Option<Topic>,
    pub action: u64,
    pub failure_reason: Option<GovernanceError>,
    pub action_auxiliary: Option<ActionAuxiliary>,
    pub ballots: Vec<(String, Ballot)>,
    pub minimum_yes_proportion_of_total: Option<Percentage>,
    pub reward_event_round: u64,
    pub failed_timestamp_seconds: u64,
    pub reward_event_end_timestamp_seconds: Option<u64>,
    pub proposal_creation_timestamp_seconds: u64,
    pub initial_voting_period_seconds: u64,
    pub reject_cost_e8s: u64,
    pub latest_tally: Option<Tally>,
    pub wait_for_quiet_deadline_increase_seconds: u64,
    pub decided_timestamp_seconds: u64,
    pub proposal: Option<Proposal>,
    pub proposer: Option<NeuronId>,
    pub wait_for_quiet_state: Option<WaitForQuietState>,
    pub minimum_yes_proportion_of_exercised: Option<Percentage>,
    pub is_eligible_for_rewards: bool,
    pub executed_timestamp_seconds: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ProposalId {
    pub id: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct GovernanceError {
    pub error_message: String,
    pub error_type: i32,
}

// Simplified ActionAuxiliary - only what we need for candid compatibility
#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum ActionAuxiliary {
    TransferSnsTreasuryFunds(serde_bytes::ByteBuf),
    MintSnsTokens(serde_bytes::ByteBuf),
    AdvanceSnsTargetVersion(serde_bytes::ByteBuf),
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Ballot {
    pub vote: i32,
    pub cast_timestamp_seconds: u64,
    pub voting_power: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Percentage {
    pub basis_points: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Tally {
    pub no: u64,
    pub yes: u64,
    pub total: u64,
    pub timestamp_seconds: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Proposal {
    pub url: String,
    pub title: String,
    pub action: Option<serde_bytes::ByteBuf>, // Simplified to just bytes
    pub summary: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct NeuronId {
    pub id: serde_bytes::ByteBuf,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct WaitForQuietState {
    pub current_deadline_timestamp_seconds: u64,
}

// ============================================================================
// STORABLE IMPLEMENTATIONS
// ============================================================================

// Implement Storable for SnsCanister
impl Storable for SnsCanister {
    fn to_bytes(&self) -> Cow<[u8]> {
        let bytes = candid::encode_one(self).expect("Failed to encode SnsCanister");
        Cow::Owned(bytes)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).expect("Failed to decode SnsCanister")
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Bounded { 
        max_size: 1024 * 1024 * 1, 
        is_fixed_size: false 
    };
}

// Implement Storable for SnsProposal
impl Storable for SnsProposal {
    fn to_bytes(&self) -> Cow<[u8]> {
        let bytes = candid::encode_one(self).expect("Failed to encode SnsProposal");
        Cow::Owned(bytes)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).expect("Failed to decode SnsProposal")
    }
    
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Bounded { 
        max_size: 1024 * 1024 * 1, 
        is_fixed_size: false 
    };
}

// Composite key for proposals
#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize)]
pub struct ProposalKey {
    pub canister_id: String,
    pub proposal_id: u64,
}

impl ProposalKey {
    pub fn new(canister_id: String, proposal_id: u64) -> Self {
        Self { canister_id, proposal_id }
    }
}

// Implement Storable for ProposalKey
impl Storable for ProposalKey {
    fn to_bytes(&self) -> Cow<[u8]> {
        let bytes = candid::encode_args((&self.canister_id, self.proposal_id)).expect("Failed to encode ProposalKey");
        Cow::Owned(bytes)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        let (canister_id, proposal_id): (String, u64) = candid::decode_args(&bytes).expect("Failed to decode ProposalKey");
        ProposalKey { canister_id, proposal_id }
    }
    
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Bounded { 
        max_size: 256, // String canister_id (max ~50) + u64 (8 bytes) + encoding overhead
        is_fixed_size: false 
    };
}

// ============================================================================
// CONSTANTS
// ============================================================================

// SNS Root canister ID (mainnet)
const SNS_ROOT_CANISTER: &str = "qaa6y-5yaaa-aaaaa-aaafa-cai";

// ============================================================================
// STABLE MEMORY TYPES
// ============================================================================

// Memory IDs for stable memory management
const SNS_CANISTERS_MEMORY_ID: MemoryId = MemoryId::new(0);
const SNS_PROPOSALS_MEMORY_ID: MemoryId = MemoryId::new(1);

// Stable memory types
type Memory = VirtualMemory<DefaultMemoryImpl>;
type StableCanisters = StableBTreeMap<String, SnsCanister, Memory>;
type StableProposals = StableBTreeMap<ProposalKey, SnsProposal, Memory>; // Composite key: (canister_id, proposal_id)

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Memory manager for stable memory
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );
    
    // Stable memory storage
    static SNS_CANISTERS: RefCell<StableCanisters> = RefCell::new(
        StableCanisters::init(
            MEMORY_MANAGER.with(|mm| mm.borrow().get(SNS_CANISTERS_MEMORY_ID))
        )
    );
    
    static SNS_PROPOSALS: RefCell<StableProposals> = RefCell::new(
        StableProposals::init(
            MEMORY_MANAGER.with(|mm| mm.borrow().get(SNS_PROPOSALS_MEMORY_ID))
        )
    );
    

}

// Helper function to get current time (works in both canister and test environments)
fn get_current_time() -> u64 {
    #[cfg(test)]
    {
        // Use a fixed timestamp for tests
        1640995200000000000
    }
    #[cfg(not(test))]
    {
        ic_cdk::api::time()
    }
}

// ============================================================================
// PROPOSAL HELPER FUNCTIONS
// ============================================================================

// Get all proposals for a specific canister using range search
fn get_proposals_for_canister(canister_id: &str) -> Vec<SnsProposal> {
    SNS_PROPOSALS.with(|proposals| {
        let proposals_borrow = proposals.borrow();
        let mut result = Vec::new();
        
        // Create range bounds for the canister
        let start_key = ProposalKey::new(canister_id.to_string(), 0u64);
        let end_key = ProposalKey::new(canister_id.to_string(), u64::MAX);
        
        // Use range to get all proposals for this canister
        for (_key, proposal) in proposals_borrow.range(start_key..=end_key) {
            result.push(proposal.clone());
        }
        
        result
    })
}

// Get a specific proposal by canister ID and proposal ID
fn get_proposal(canister_id: &str, proposal_id: u64) -> Option<SnsProposal> {
    SNS_PROPOSALS.with(|proposals| {
        let proposals_borrow = proposals.borrow();
        let key = ProposalKey::new(canister_id.to_string(), proposal_id);
        proposals_borrow.get(&key)
    })
}

// Get proposal count for a specific canister
fn get_proposal_count_for_canister(canister_id: &str) -> u32 {
    SNS_PROPOSALS.with(|proposals| {
        let proposals_borrow = proposals.borrow();
        let start_key = ProposalKey::new(canister_id.to_string(), 0u64);
        let end_key = ProposalKey::new(canister_id.to_string(), u64::MAX);
        
        proposals_borrow.range(start_key..=end_key).count() as u32
    })
}

// Get active proposal count for a specific canister
fn get_active_proposal_count_for_canister(canister_id: &str) -> u32 {
    SNS_PROPOSALS.with(|proposals| {
        let proposals_borrow = proposals.borrow();
        let start_key = ProposalKey::new(canister_id.to_string(), 0u64);
        let end_key = ProposalKey::new(canister_id.to_string(), u64::MAX);
        
        proposals_borrow
            .range(start_key..=end_key)
            .filter(|(_, proposal)| proposal.status == "Open")
            .count() as u32
    })
}

// Convert SNS governance proposal to our format
pub fn convert_proposal(proposal: &ProposalData) -> SnsProposal {
    SnsProposal {
        id: proposal.id.as_ref().map(|id| id.id).unwrap_or(0),
        title: proposal.proposal.as_ref().map(|prop| prop.title.clone()).unwrap_or_default(),
        summary: proposal.proposal.as_ref().map(|prop| prop.summary.clone()).unwrap_or_default(),
        status: if proposal.failed_timestamp_seconds > 0 {
            "Failed".to_string()
        } else if proposal.decided_timestamp_seconds > 0 {
            "Adopted".to_string()
        } else {
            "Open".to_string()
        },
        executed: proposal.decided_timestamp_seconds > 0,
        executed_at: if proposal.decided_timestamp_seconds > 0 { 
            Some(proposal.decided_timestamp_seconds * 1_000_000_000) 
        } else { 
            None 
        }, // Convert to nanoseconds
        proposer: {
            // Try to get proposer from the proposer field first
            if let Some(neuron_id) = &proposal.proposer {
                // Convert NeuronId to a shorter, more readable format
                let hex_str = hex::encode(&neuron_id.id);
                if hex_str.len() > 16 {
                    format!("0x{}...{}", &hex_str[..8], &hex_str[hex_str.len()-8..])
                } else {
                    format!("0x{}", hex_str)
                }
            } else if !proposal.ballots.is_empty() {
                // Fallback: use the first voter as proposer (often the same person)
                let first_voter = &proposal.ballots[0].0;
                if first_voter.len() > 20 {
                    format!("{}...{}", &first_voter[..10], &first_voter[first_voter.len()-10..])
                } else {
                    first_voter.clone()
                }
            } else {
                "Unknown".to_string()
            }
        },
        votes_for: proposal.latest_tally.as_ref().map(|t| t.yes).unwrap_or(0),
        votes_against: proposal.latest_tally.as_ref().map(|t| t.no).unwrap_or(0),
        total_votes: proposal.latest_tally.as_ref().map(|t| t.total).unwrap_or(0),
    }
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

// Get SNS canisters with optional pagination (defaults: offset=0, limit=10, max limit=10)
#[query]
fn get_sns_canisters(offset: Option<u32>, limit: Option<u32>) -> (Vec<SnsCanister>, PaginationInfo) {
    // Set default values
    let offset = offset.unwrap_or(0);
    let limit = limit.unwrap_or(10);
    
    // Validate limit
    if limit == 0 || limit > 10 {
        return (Vec::new(), PaginationInfo {
            total_count: 0,
            total_pages: 0,
            current_page: 0,
            page_size: limit,
            has_next_page: false,
            has_prev_page: false,
            next_page_offset: None,
            prev_page_offset: None,
        });
    }
    
    let mut canisters: Vec<SnsCanister> = SNS_CANISTERS.with(|canisters| {
        canisters.borrow()
            .iter()
            .map(|(_, canister)| canister.clone())
            .collect()
    });
    // Sort by name (case-insensitive)
    canisters.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    
    let total_count = canisters.len() as u32;
    let total_pages = (total_count + limit - 1) / limit; // Ceiling division
    let current_page = (offset / limit) + 1;
    
    // Calculate pagination info
    let has_next_page = offset + limit < total_count;
    let has_prev_page = offset > 0;
    let next_page_offset = if has_next_page { Some(offset + limit) } else { None };
    let prev_page_offset = if has_prev_page { Some(offset.saturating_sub(limit)) } else { None };
    
    let pagination_info = PaginationInfo {
        total_count,
        total_pages,
        current_page,
        page_size: limit,
        has_next_page,
        has_prev_page,
        next_page_offset,
        prev_page_offset,
    };
    
    let paginated_canisters = canisters
        .into_iter()
        .skip(offset as usize)
        .take(limit as usize)
        .collect();
    
    (paginated_canisters, pagination_info)
}

// Get a single SNS canister by ID
#[query]
fn get_sns_canister(canister_id: String) -> Result<SnsCanister, SnsGovernanceError> {
    // Validate canister ID format
    if canister_id.is_empty() {
        return Err(SnsGovernanceError::InvalidCanisterId);
    }

    // Find the canister in stable memory
    let canister = SNS_CANISTERS.with(|canisters| {
        canisters.borrow()
            .values()
            .find(|c| c.canister_id == canister_id)
            .map(|c| c.clone())
    });

    match canister {
        Some(canister) => Ok(canister),
        None => Err(SnsGovernanceError::CanisterNotFound),
    }
}

// Get proposals for a specific SNS governance canister
#[query]
fn get_sns_proposals(canister_id: String) -> Result<Vec<SnsProposal>, SnsGovernanceError> {
    // Validate canister ID format
    if canister_id.is_empty() || !canister_id.contains('-') {
        return Err(SnsGovernanceError::InvalidCanisterId);
    }

    // Get proposals from stable memory using the helper function
    let proposals = get_proposals_for_canister(&canister_id);

    Ok(proposals)
}

// Fetch proposals for a specific canister (update function for on-demand loading)
#[update]
async fn fetch_sns_proposals(canister_id: String) -> Result<Vec<SnsProposal>, SnsGovernanceError> {
    // Validate canister ID format
    if canister_id.is_empty() || !canister_id.contains('-') {
        return Err(SnsGovernanceError::InvalidCanisterId);
    }

    // Check if canister exists in our list
    let canister_exists = SNS_CANISTERS.with(|canisters| {
        canisters.borrow().values().any(|c| c.canister_id == canister_id)
    });

    if !canister_exists {
        return Err(SnsGovernanceError::CanisterNotFound);
    }

    // Fetch proposals from governance canister (last 10)
    let proposals: Vec<ProposalData> = match call_sns_governance_canister::<ListProposalsResponse>(
        &canister_id,
        "list_proposals",
        candid::encode_args((ListProposals {
            include_reward_status: vec![], // 0 = false, 1 = true
            before_proposal: None,
            limit: 10,
            exclude_type: vec![],
            include_topics: None,
            include_status: vec![], // Include all statuses: Open, Adopted, Executed, Failed, etc.
        },)).map_err(|e| SnsGovernanceError::CrossCanisterCallFailed(e.to_string()))?
    ).await {
        Ok(response) => response.proposals,
        Err(e) => {
            debug_print(&format!("Failed to fetch proposals from {}: {}", canister_id, e));
            return Err(SnsGovernanceError::CrossCanisterCallFailed(e));
        }
    };

    // Convert governance proposals to our format
    let converted_proposals: Vec<SnsProposal> = proposals.iter().map(|p| convert_proposal(p)).collect();

    // Store in stable memory using composite keys
    SNS_PROPOSALS.with(|proposals| {
        let mut proposals_borrow = proposals.borrow_mut();
        for proposal in &converted_proposals {
            let key = ProposalKey::new(canister_id.clone(), proposal.id);
            proposals_borrow.insert(key, proposal.clone());
        }
    });

    // Update canister statistics in stable memory using helper functions
    SNS_CANISTERS.with(|canisters| {
        let mut canisters_borrow = canisters.borrow_mut();
        if let Some(mut canister) = canisters_borrow.get(&canister_id) {
            canister.total_proposals = get_proposal_count_for_canister(&canister_id);
            canister.active_proposals = get_active_proposal_count_for_canister(&canister_id);
            canister.last_activity = converted_proposals.iter()
                .map(|p| p.executed_at.unwrap_or(0))
                .max()
                .unwrap_or(get_current_time());
            
            // Insert the updated canister back
            canisters_borrow.insert(canister_id.clone(), canister);
        }
    });

    Ok(converted_proposals)
}

// Get a specific proposal by ID from a canister
#[query]
fn get_sns_proposal(canister_id: String, proposal_id: u64) -> Result<Option<SnsProposal>, SnsGovernanceError> {
    // Validate canister ID format
    if canister_id.is_empty() || !canister_id.contains('-') {
        return Err(SnsGovernanceError::InvalidCanisterId);
    }

    // Get proposal from stable memory using composite key
    let proposal = get_proposal(&canister_id, proposal_id);

    Ok(proposal)
}

// Refresh SNS canister list from SNS root with improved performance
#[update]
async fn refresh_sns_canisters(full_refresh: bool) -> Result<String, SnsGovernanceError> {
    // 1. Fetch deployed SNSes from root canister on mainnet
    let deployed_snses_result: ListDeployedSnsesResponse = match call_sns_root_canister(
        "list_deployed_snses",
        candid::encode_args((EmptyRecord {},)).map_err(|e| SnsGovernanceError::CrossCanisterCallFailed(e.to_string()))?
    ).await {
        Ok(response) => response,
        Err(e) => {
            debug_print(&format!("Failed to fetch from SNS root canister: {}", e));
            return Err(SnsGovernanceError::CrossCanisterCallFailed(e));
        }
    };

    // Clear existing data from stable memory only if full refresh is requested
    if full_refresh {
        SNS_CANISTERS.with(|canisters| canisters.borrow_mut().clear_new());
        SNS_PROPOSALS.with(|proposals| proposals.borrow_mut().clear_new());
        debug_print(&format!("Full refresh: cleared all existing data"));
    } else {
        debug_print(&format!("Incremental refresh: keeping existing data"));
    }

    let deployed_snses = deployed_snses_result.instances;
    
    debug_print(&format!("Processing {} SNS canisters", deployed_snses.len()));
    
    let mut updated_canisters = Vec::new();
    let mut canister_futures = Vec::new();

    // 2. Create futures for parallel processing (metadata only for now)
    for deployed_sns in deployed_snses.iter() {
        let governance_id = match &deployed_sns.governance_canister_id {
            Some(id) => id.to_text(),
            None => continue,
        };
        
        // Create a future for fetching metadata only
        let future = async move {
            let args = match candid::encode_args((EmptyRecord {},)) {
                Ok(args) => args,
                Err(e) => {
                    debug_print(&format!("Failed to encode args for {}: {}", governance_id, e));
                    return (governance_id.clone(), None);
                }
            };

            let metadata: GetMetadataResponse = match call_sns_governance_canister(
                &governance_id,
                "get_metadata",
                args
            ).await {
                Ok(metadata) => metadata,
                Err(e) => {
                    debug_print(&format!("Failed to fetch metadata from {}: {}", governance_id, e));
                    return (governance_id.clone(), None); // Don't add failed canisters
                }
            };

            // Create basic canister info without proposals for now
            let canister = SnsCanister {
                id: governance_id.clone(), // Use governance ID as unique identifier
                name: metadata.name.unwrap_or_else(|| format!("SNS {}", governance_id)),
                canister_id: governance_id.clone(),
                description: metadata.description.unwrap_or_default(),
                logo: metadata.logo,
                url: metadata.url,
                total_proposals: 0, // Will be updated later
                active_proposals: 0, // Will be updated later
                last_activity: get_current_time(),
            };

            (governance_id, Some(canister))
        };

        canister_futures.push(future);
    }

    // 3. Execute all futures in parallel
    let results = futures::future::join_all(canister_futures).await;
    
    // 4. Process results and store in state
    let mut success_count = 0;
    let mut error_count = 0;
    let mut new_count = 0;
    let mut updated_count = 0;
    
    for (governance_id, canister_opt) in results {
        match canister_opt {
            Some(canister) => {
                // Check if canister already exists
                let is_new = SNS_CANISTERS.with(|canisters| {
                    !canisters.borrow().contains_key(&canister.canister_id)
                });
                
                // Store in stable memory (insert will update if exists, add if new)
                SNS_CANISTERS.with(|canisters| {
                    canisters.borrow_mut().insert(canister.canister_id.clone(), canister.clone());
                });

                updated_canisters.push(canister);
                success_count += 1;
                
                if is_new {
                    new_count += 1;
                } else {
                    updated_count += 1;
                }
            }
            None => {
                error_count += 1;
                debug_print(&format!("Failed to process canister: {}", governance_id));
            }
        }
    }
    
    // Log results for monitoring
    if full_refresh {
        debug_print(&format!("Full refresh completed: {} successful, {} errors, {} total SNSes", 
            success_count, error_count, deployed_snses.len()));
    } else {
        debug_print(&format!("Incremental refresh completed: {} new, {} updated, {} errors, {} total SNSes", 
            new_count, updated_count, error_count, deployed_snses.len()));
    }
    // ic_cdk::println!("SNS refresh completed: {} successful, {} errors, {} total SNSes", 
    //     success_count, error_count, deployed_snses.len());
    
    // Return error if no canisters were successfully processed
    if success_count == 0 {
        return Err(SnsGovernanceError::CrossCanisterCallFailed(
            format!("Failed to fetch any SNS metadata. {} errors encountered.", error_count)
        ));
    }

    // Return appropriate message based on refresh mode
    if full_refresh {
        Ok(format!("Full refresh completed: {} SNS canisters processed. {} failed, {} total SNSes.", 
            success_count, error_count, deployed_snses.len()))
    } else {
        Ok(format!("Incremental refresh completed: {} new canisters, {} updated canisters. {} failed, {} total SNSes.", 
            new_count, updated_count, error_count, deployed_snses.len()))
    }
}

// Add a custom SNS canister to the list
#[update]
fn add_sns_canister(canister: SnsCanister) -> Result<String, SnsGovernanceError> {
    // Validate canister ID format
    if canister.canister_id.is_empty() || !canister.canister_id.contains('-') {
        return Err(SnsGovernanceError::InvalidCanisterId);
    }

    // Check if canister already exists in stable memory
    let exists = SNS_CANISTERS.with(|canisters| {
        canisters.borrow().contains_key(&canister.canister_id)
    });

    if exists {
        return Err(SnsGovernanceError::InvalidData("Canister already exists".to_string()));
    }

    // Add the canister to stable memory
    SNS_CANISTERS.with(|canisters| {
        canisters.borrow_mut().insert(canister.canister_id.clone(), canister);
    });

    Ok("Canister added successfully".to_string())
}

// Remove a SNS canister from the list
#[update]
fn remove_sns_canister(canister_id: String) -> Result<String, SnsGovernanceError> {
    // Validate canister ID format
    if canister_id.is_empty() || !canister_id.contains('-') {
        return Err(SnsGovernanceError::InvalidCanisterId);
    }

    // Check if canister exists in stable memory before removing
    let exists = SNS_CANISTERS.with(|canisters| {
        canisters.borrow().contains_key(&canister_id)
    });

    if !exists {
        return Err(SnsGovernanceError::CanisterNotFound);
    }

    // Remove the canister from stable memory
    SNS_CANISTERS.with(|canisters| {
        canisters.borrow_mut().remove(&canister_id);
    });

    // Also remove associated proposals from stable memory using range removal
    SNS_PROPOSALS.with(|proposals| {
        let mut proposals_borrow = proposals.borrow_mut();
        let start_key = ProposalKey::new(canister_id.clone(), 0u64);
        let end_key = ProposalKey::new(canister_id.clone(), u64::MAX);
        
        // Collect keys to remove (can't modify while iterating)
        let keys_to_remove: Vec<_> = proposals_borrow
            .range(start_key..=end_key)
            .map(|(key, _)| key.clone())
            .collect();
        
        // Remove all proposals for this canister
        for key in keys_to_remove {
            proposals_borrow.remove(&key);
        }
    });

    Ok("Canister removed successfully".to_string())
}

// Get count of SNS canisters from stable memory
#[query]
fn get_sns_canister_count() -> u32 {
    SNS_CANISTERS.with(|canisters| canisters.borrow().len() as u32)
}

// Get statistics about SNS governance from stable memory
#[query]
fn get_sns_statistics() -> (u32, u64, u64) {
    let total_canisters = SNS_CANISTERS.with(|canisters| canisters.borrow().len() as u32);
    
    let (total_proposals, active_proposals) = SNS_PROPOSALS.with(|proposals| {
        let mut total = 0u64;
        let mut active = 0u64;
        
        for (_, proposal) in proposals.borrow().iter() {
            total += 1;
            if proposal.status == "Open" {
                active += 1;
            }
        }
        
        (total, active)
    });

    (total_canisters, total_proposals, active_proposals)
}

// ============================================================================
// CHUNKED EXPORT/IMPORT FUNCTIONS (for large datasets)
// ============================================================================

// Export canisters in chunks (for large canister datasets)
#[query]
fn export_canisters_chunk(offset: u32, limit: u32) -> Vec<SnsCanister> {
    let chunk_limit = if limit > 20 { 20 } else { limit };
    SNS_CANISTERS.with(|canisters| {
        let canisters_borrow = canisters.borrow();
        let all_canisters: Vec<_> = canisters_borrow
            .iter()
            .map(|(_, canister)| canister.clone())
            .collect();
        let start_idx = offset as usize;
        let end_idx = std::cmp::min(start_idx + chunk_limit as usize, all_canisters.len());
        if start_idx < all_canisters.len() {
            all_canisters[start_idx..end_idx].to_vec()
        } else {
            Vec::new()
        }
    })
}

#[query]
fn get_canisters_pagination_info(offset: u32, limit: u32) -> (u32, u32, u32, bool) {
    SNS_CANISTERS.with(|canisters| {
        let canisters_borrow = canisters.borrow();
        let total = canisters_borrow.len() as u32;
        let chunk_limit = if limit > 20 { 20 } else { limit };
        let start_idx = offset as usize;
        let end_idx = std::cmp::min(start_idx + chunk_limit as usize, total as usize);
        let has_more = end_idx < total as usize;
        (offset, chunk_limit, total, has_more)
    })
}

// Export proposals in chunks
#[query]
fn export_proposals_chunk(offset: u32, limit: u32) -> Vec<(ProposalKey, SnsProposal)> {
    let chunk_limit = if limit > 50 { 50 } else { limit };
    SNS_PROPOSALS.with(|proposals| {
        let proposals_borrow = proposals.borrow();
        let all_proposals: Vec<_> = proposals_borrow
            .iter()
            .map(|(key, proposal)| (key.clone(), proposal.clone()))
            .collect();
        let start_idx = offset as usize;
        let end_idx = std::cmp::min(start_idx + chunk_limit as usize, all_proposals.len());
        if start_idx < all_proposals.len() {
            all_proposals[start_idx..end_idx].to_vec()
        } else {
            Vec::new()
        }
    })
}

#[query]
fn get_proposals_pagination_info(offset: u32, limit: u32) -> (u32, u32, u32, bool) {
    SNS_PROPOSALS.with(|proposals| {
        let proposals_borrow = proposals.borrow();
        let total = proposals_borrow.len() as u32;
        let chunk_limit = if limit > 50 { 50 } else { limit };
        let start_idx = offset as usize;
        let end_idx = std::cmp::min(start_idx + chunk_limit as usize, total as usize);
        let has_more = end_idx < total as usize;
        (offset, chunk_limit, total, has_more)
    })
}

#[update]
fn import_canisters(canisters: Vec<SnsCanister>) -> Result<String, SnsGovernanceError> {
    let mut imported_count = 0;
    SNS_CANISTERS.with(|canisters_store| {
        let mut canisters_borrow = canisters_store.borrow_mut();
        for canister in canisters {
            canisters_borrow.insert(canister.canister_id.clone(), canister);
            imported_count += 1;
        }
    });
    Ok(format!("Successfully imported {} canisters", imported_count))
}

#[update]
fn import_proposals(proposals: Vec<(ProposalKey, SnsProposal)>) -> Result<String, SnsGovernanceError> {
    let mut imported_count = 0;
    SNS_PROPOSALS.with(|proposals_store| {
        let mut proposals_borrow = proposals_store.borrow_mut();
        for (key, proposal) in proposals {
            proposals_borrow.insert(key, proposal);
            imported_count += 1;
        }
    });
    Ok(format!("Successfully imported {} proposals", imported_count))
}

// ============================================================================
// CROSS-CANISTER CALL FUNCTIONS
// ============================================================================

// Cross-canister call to SNS root canister
async fn call_sns_root_canister<T>(method: &str, args: Vec<u8>) -> std::result::Result<T, String>
where
    T: candid::CandidType + for<'a> candid::Deserialize<'a>,
{
    let result = Call::unbounded_wait(
        Principal::from_text(SNS_ROOT_CANISTER).unwrap(),
        method,
    ).with_raw_args(&args).await;
    
    match result {
        Ok(response) => {
            let decoded: T = response.candid().unwrap();
            Ok(decoded)
        }
        Err(e) => Err(format!("Cross-canister call failed: {}", e))
    }
}

// Cross-canister call to SNS governance canister
async fn call_sns_governance_canister<T>(canister_id: &str, method: &str, args: Vec<u8>) -> std::result::Result<T, String>
where
    T: candid::CandidType + for<'a> candid::Deserialize<'a>,
{
    let result = Call::unbounded_wait(
        Principal::from_text(canister_id).unwrap(),
        method,
    ).with_raw_args(&args).await;
    
    match result {
        Ok(response) => {
            let decoded: T = response.candid().unwrap();
            Ok(decoded)
        }
        Err(e) => Err(format!("Cross-canister call failed: {}", e))
    }
}

#[cfg(test)]
mod tests; 