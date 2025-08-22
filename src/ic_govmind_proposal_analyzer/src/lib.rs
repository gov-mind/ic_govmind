use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{query, update};
use ic_cdk::api::{canister_self, debug_print, msg_caller};
use ic_cdk::management_canister::{HttpRequestResult, TransformArgs, http_request, HttpRequestArgs, HttpMethod, HttpHeader, TransformContext, TransformFunc};
use serde::{Deserialize as SerdeDeserialize};
use ic_stable_structures::{StableBTreeMap, StableCell, memory_manager::{MemoryManager, VirtualMemory, MemoryId}, DefaultMemoryImpl, storable::Storable};
use std::cell::RefCell;
use std::borrow::Cow;
use std::collections::HashMap;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

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

// Submit a new proposal and automatically run AI analysis
#[update]
async fn submit_proposal_and_analyze(
    proposal_id_opt: Option<String>,
    title: String,
    description: String,
) -> Result<String, String> {
    let caller = msg_caller();
    let proposal_id = match proposal_id_opt {
        Some(id) if !id.is_empty() => id,
        _ => generate_proposal_id(),
    };

    // First, submit the proposal with Pending status
    let proposal = Proposal {
        id: proposal_id.clone(),
        title,
        description,
        submitted_by: caller,
        submitted_at: ic_cdk::api::time(),
        analysis: None,
        status: ProposalStatus::Pending,
    };

    PROPOSALS.with(|proposals| {
        proposals.borrow_mut().insert(proposal_id.clone(), proposal);
    });
    PROPOSAL_COUNTER.with(|counter| {
        let mut cell = counter.borrow_mut();
        let val = cell.get() + 1;
        cell.set(val).expect("Failed to update counter");
    });

    // Then automatically run analysis
    match analyze_proposal(proposal_id.clone()).await {
        Ok(_) => Ok(proposal_id),
        Err(e) => {
            // Even if analysis fails, we still return the proposal_id since the proposal was created
            // The status will be set to Failed by the analyze_proposal function
            debug_print(e);

            Ok(proposal_id)
        }
    }
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
        let mut counter = counter.borrow_mut();
        let current = counter.get();
        let new_id = current + 1;
        let _ = counter.set(new_id);
        format!("proposal_{}", new_id)
    })
}

// Simplified AI Analysis function - only takes proposal_id
#[update]
async fn analyze_proposal(proposal_id: String) -> Result<ProposalAnalysis, String> {
    // Get the proposal from storage
    let (title, description) = PROPOSALS.with(|proposals| {
        let mut proposals = proposals.borrow_mut();
        if let Some(mut proposal) = proposals.get(&proposal_id) {
            // Update status to Analyzing
            proposal.status = ProposalStatus::Analyzing;
            proposals.insert(proposal_id.clone(), proposal.clone());
            Ok((proposal.title.clone(), proposal.description.clone()))
        } else {
            Err(format!("Proposal with ID '{}' not found", proposal_id))
        }
    })?;

    // Call AI API through idempotent proxy
    match call_ai_api(&title, &description).await {
        Ok(analysis) => {
            // Update proposal with analysis
            PROPOSALS.with(|proposals| {
                let mut proposals = proposals.borrow_mut();
                if let Some(mut proposal) = proposals.get(&proposal_id) {
                    proposal.analysis = Some(analysis.clone());
                    proposal.status = ProposalStatus::Analyzed;
                    proposals.insert(proposal_id.clone(), proposal);
                }
            });
            Ok(analysis)
        }
        Err(e) => {
            // Update proposal status to Failed
            PROPOSALS.with(|proposals| {
                let mut proposals = proposals.borrow_mut();
                if let Some(mut proposal) = proposals.get(&proposal_id) {
                    proposal.status = ProposalStatus::Failed;
                    proposals.insert(proposal_id.clone(), proposal);
                }
            });
            Err(format!("AI analysis failed: {}", e))
        }
    }
}

// HTTP outcall to AI API through idempotent proxy
async fn call_ai_api(title: &str, description: &str) -> Result<ProposalAnalysis, String> {
    const MAX_RETRIES: u32 = 3;
    let mut last_error = String::new();
    
    for attempt in 0..MAX_RETRIES {
        match call_ai_api_single_attempt(title, description).await {
            Ok(analysis) => return Ok(analysis),
            Err(error) => {
                last_error = error.clone();
                
                // Check if error is retryable (connection timeout or DNS failure)
                let is_retryable = error.contains("TimedOut") || 
                                 error.contains("dns error") || 
                                 error.contains("failed to lookup address information") ||
                                 error.contains("Connecting to") ||
                                 error.contains("tcp connect error");
                
                if !is_retryable || attempt == MAX_RETRIES - 1 {
                    break;
                }
                
                // Log retry attempt (in a real implementation, you might want proper logging)
                // For now, we'll just continue to the next attempt
            }
        }
    }
    
    Err(format!("Failed after {} attempts: {}", MAX_RETRIES, last_error))
}

async fn call_ai_api_single_attempt(title: &str, description: &str) -> Result<ProposalAnalysis, String> {
    let mut request_body = HashMap::new();
    request_body.insert("title".to_string(), title.to_string());
    request_body.insert("description".to_string(), description.to_string());
    
    let request_body_json = serde_json::to_string(&request_body)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;
    
    // Generate idempotent key from title and description hash
    let idempotency_key = generate_idempotency_key(title, description);
    
    let request_headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
        HttpHeader {
            name: "Accept".to_string(),
            value: "application/json".to_string(),
        },
        HttpHeader {
            name: "idempotency-key".to_string(),
            value: idempotency_key,
        },
    ];
    
    let request = HttpRequestArgs {
        url: "https://ai-api.govmind.info/URL_AI_PROPOSAL_ANALYSIS".to_string(),
        method: HttpMethod::POST,
        body: Some(request_body_json.into_bytes()),
        max_response_bytes: Some(10_000),
        transform: Some(TransformContext {
            function: TransformFunc(candid::Func {
                principal: canister_self(),
                method: "transform_response".to_string(),
            }),
            context: vec![],
        }),
        headers: request_headers,
    };
    
    match http_request(&request).await {
        Ok(response) => {
            let response_body = String::from_utf8(response.body)
                .map_err(|e| format!("Invalid UTF-8 response: {}", e))?;
            
            // Parse the direct JSON response from proxy server
            let json_analysis: JsonProposalAnalysis = serde_json::from_str(&response_body)
                .map_err(|e| format!("Failed to parse JSON response: {}", e))?;
            
            Ok(ProposalAnalysis::from(json_analysis))
        }
        Err(error) => {
            Err(format!("HTTP request failed: {:?}", error))
        }
    }
}

// Generate idempotent key from title and description hash
fn generate_idempotency_key(title: &str, description: &str) -> String {
    let mut hasher = DefaultHasher::new();
    title.hash(&mut hasher);
    description.hash(&mut hasher);
    let hash = hasher.finish();
    format!("govmind-{:x}", hash)
}

// Transform function for HTTP outcalls
#[query]
fn transform_response(raw: TransformArgs) -> HttpRequestResult {
    let headers = vec![];
    
    let mut sanitized_body = raw.response.body.clone();
    if sanitized_body.len() > 10_000 {
        sanitized_body.truncate(10_000);
    }
    
    HttpRequestResult {
        status: raw.response.status.clone(),
        body: sanitized_body,
        headers,
    }
}

