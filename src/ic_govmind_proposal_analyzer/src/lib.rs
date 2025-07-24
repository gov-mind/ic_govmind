use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{query, update};
use ic_cdk::api::{msg_caller};
use serde::{Deserialize as SerdeDeserialize, Serialize as SerdeSerialize};
use ic_stable_structures::{StableBTreeMap, StableCell, memory_manager::{MemoryManager, VirtualMemory, MemoryId}, DefaultMemoryImpl, storable::Storable};
use std::cell::RefCell;
use std::borrow::Cow;

// Types for proposal analysis (Candid types)
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Proposal {
    pub id: String,
    pub title: String,
    pub description: String,
    pub submitted_by: Principal,
    pub submitted_at: u64,
    pub analysis: Option<ProposalAnalysis>,
    pub status: ProposalStatus,
}

// Candid types for IC communication
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ProposalAnalysis {
    pub summary: String,
    pub risk_assessment: String,
    pub recommendations: String,
    pub complexity_score: f64,
    pub complexity_breakdown: ComplexityBreakdown,
    pub estimated_impact: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ComplexityBreakdown {
    pub technical_complexity: f64,    // 1-10: How technically challenging to implement
    pub financial_complexity: f64,    // 1-10: How complex the financial aspects are
    pub governance_complexity: f64,   // 1-10: How complex the governance/legal aspects are
    pub timeline_complexity: f64,     // 1-10: How complex the timeline and coordination is
    pub explanation: String,          // Why this complexity score was assigned
    pub comparison: String,           // How it compares to typical DAO proposals
}

// Serde types for JSON parsing (from AI API)
#[derive(SerdeDeserialize, Debug)]
struct JsonProposalAnalysis {
    pub summary: String,
    pub risk_assessment: String,
    pub recommendations: String,
    pub complexity_score: f64,
    pub complexity_breakdown: JsonComplexityBreakdown,
    pub estimated_impact: String,
}

#[derive(SerdeDeserialize, Debug)]
struct JsonComplexityBreakdown {
    pub technical_complexity: f64,
    pub financial_complexity: f64,
    pub governance_complexity: f64,
    pub timeline_complexity: f64,
    pub explanation: String,
    pub comparison: String,
}

// Conversion from JSON types to Candid types
impl From<JsonProposalAnalysis> for ProposalAnalysis {
    fn from(json: JsonProposalAnalysis) -> Self {
        ProposalAnalysis {
            summary: json.summary,
            risk_assessment: json.risk_assessment,
            recommendations: json.recommendations,
            complexity_score: json.complexity_score,
            complexity_breakdown: json.complexity_breakdown.into(),
            estimated_impact: json.estimated_impact,
        }
    }
}

impl From<JsonComplexityBreakdown> for ComplexityBreakdown {
    fn from(json: JsonComplexityBreakdown) -> Self {
        ComplexityBreakdown {
            technical_complexity: json.technical_complexity,
            financial_complexity: json.financial_complexity,
            governance_complexity: json.governance_complexity,
            timeline_complexity: json.timeline_complexity,
            explanation: json.explanation,
            comparison: json.comparison,
        }
    }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum ProposalStatus {
    Pending,
    Analyzing,
    Analyzed,
    Failed,
}





// Stable memory management
type Memory = VirtualMemory<DefaultMemoryImpl>;
type ProposalMap = StableBTreeMap<String, Proposal, Memory>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    static PROPOSALS: RefCell<ProposalMap> = RefCell::new(ProposalMap::new(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))));
    static PROPOSAL_COUNTER: RefCell<StableCell<u64, Memory>> = RefCell::new(StableCell::new(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))), 0u64).expect("Failed to init StableCell"));
}

// Implement Storable for Proposal
impl Storable for Proposal {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).expect("Proposal encode failed"))
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).expect("Proposal decode failed")
    }
    
    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Bounded { 
        max_size: 1024 * 1024 * 1, 
        is_fixed_size: false 
    };
}

// Submit a new proposal with optional AI analysis and status
// TODO: signature will be used to verify the request is signed by our API proxy
// This will prevent unauthorized frontend submissions and ensure analysis comes from trusted source
#[update]
async fn submit_proposal_with_analysis(
    proposal_id_opt: Option<String>,
    title: String,
    description: String,
    analysis: Option<ProposalAnalysis>,
    status: ProposalStatus,
    signature: Option<String>, // Optional signature from API proxy for verification
) -> String {
    let caller = msg_caller();
    let proposal_id = match proposal_id_opt {
        Some(id) if !id.is_empty() => id,
        _ => generate_proposal_id(),
    };

    let proposal = Proposal {
        id: proposal_id.clone(),
        title,
        description,
        submitted_by: caller,
        submitted_at: ic_cdk::api::time(),
        analysis,
        status,
    };

    PROPOSALS.with(|proposals| {
        proposals.borrow_mut().insert(proposal_id.clone(), proposal);
    });
    PROPOSAL_COUNTER.with(|counter| {
        let mut cell = counter.borrow_mut();
        let val = cell.get() + 1;
        cell.set(val).expect("Failed to update counter");
    });

    proposal_id
}

// Update analysis for an existing proposal (for retry scenarios)
// TODO: signature will be used to verify the request is signed by our API proxy
// This will prevent unauthorized frontend submissions and ensure analysis comes from trusted source
#[update]
async fn update_analysis(
    proposal_id: String,
    analysis: Option<ProposalAnalysis>,
    status: ProposalStatus,
    signature: Option<String>, // Optional signature from API proxy for verification
) -> Result<String, String> {
    let proposal_exists = PROPOSALS.with(|proposals| {
        proposals.borrow().contains_key(&proposal_id)
    });

    if !proposal_exists {
        return Err("Proposal not found".to_string());
    }

    PROPOSALS.with(|proposals| {
        let mut proposals_mut = proposals.borrow_mut();
        if let Some(mut proposal) = proposals_mut.get(&proposal_id).map(|x| x.clone()) {
            proposal.analysis = analysis;
            proposal.status = status;
            proposals_mut.insert(proposal_id.clone(), proposal);
        }
    });

    Ok("Analysis updated successfully".to_string())
}



// Get proposal by ID
#[query]
fn get_proposal(proposal_id: String) -> Option<Proposal> {
    PROPOSALS.with(|proposals| {
        let key = proposal_id;
        proposals.borrow().get(&key).map(|x| x.clone())
    })
}

// Get all proposals
#[query]
fn get_all_proposals() -> Vec<Proposal> {
    PROPOSALS.with(|proposals| {
        let mut proposals_vec: Vec<Proposal> = proposals.borrow().iter().map(|(_, v)| v.clone()).collect();
        // Sort by submitted_at timestamp in descending order (newest first)
        proposals_vec.sort_by(|a, b| b.submitted_at.cmp(&a.submitted_at));
        proposals_vec
    })
}

// Helper functions
fn generate_proposal_id() -> String {
    PROPOSAL_COUNTER.with(|counter| {
        let binding = counter.borrow();
        let current = binding.get();
        format!("proposal_{}", current)
    })
}
