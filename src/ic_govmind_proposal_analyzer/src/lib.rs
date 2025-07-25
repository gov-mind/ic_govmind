use candid::{CandidType, Deserialize, Principal};
use ic_cdk::management_canister::{
    http_request, HttpRequestArgs, HttpHeader, HttpMethod, HttpRequestResult, TransformArgs,
    TransformContext, TransformFunc,
};
use ic_cdk::management_canister::{canister_status, CanisterStatusArgs};
use ic_cdk::{query, update};
use ic_cdk::api::{debug_print, msg_caller};
use ic_cdk::futures::spawn_017_compat;
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



// DeepSeek API types (Serde types)
#[derive(SerdeSerialize)]
struct DeepSeekRequest {
    model: String,
    messages: Vec<Message>,
    temperature: f64,
    max_tokens: u32,
    stream: bool,
    // CF worker cache keys
    proposal_id: String,
    timestamp: String,
}

#[derive(SerdeSerialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(SerdeDeserialize, Debug)]
struct DeepSeekResponse {
    choices: Vec<Choice>,
}

#[derive(SerdeDeserialize, Debug)]
struct Choice {
    message: MessageResponse,
}

#[derive(SerdeDeserialize, Debug)]
struct MessageResponse {
    content: String,
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

// HTTP Transform function for DeepSeek API calls
#[ic_cdk::query]
fn transform(response: TransformArgs) -> HttpRequestResult {
    response.response
}

// Submit a new proposal
#[update]
async fn submit_proposal(proposal_id_opt: Option<String>, title: String, description: String) -> String {
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

    // Start analysis in background
    spawn_017_compat(analyze_proposal(proposal_id.clone()));

    proposal_id
}

// Analyze proposal using DeepSeek API
async fn analyze_proposal(proposal_id: String) {
    // Update status to analyzing
    update_proposal_status(&proposal_id, ProposalStatus::Analyzing);

    let proposal = get_proposal_internal(&proposal_id);

    ic_cdk::println!("proposal: {:?}", proposal);
    if proposal.is_none() {
        ic_cdk::println!("proposal not found");
        return;
    }

    let proposal = proposal.unwrap();

    // Prepare the analysis prompt
    let analysis_prompt = format!(
        r#"Please analyze the following DAO proposal and provide a detailed analysis report:

Proposal Title: {}
Proposal Description: {}

Please analyze from the following perspectives:

1. Summary: Summarize the core content of the proposal in simple and understandable language

2. Risk Assessment: Analyze the potential risks and challenges. Format as numbered points (1. First risk, 2. Second risk, etc.)

3. Recommendations: Provide specific improvement suggestions or precautions. Format as numbered points (1. First recommendation, 2. Second recommendation, etc.)

4. Complexity Analysis: Provide a comprehensive complexity assessment:
   - Overall Complexity Score (1-10): Average of all complexity dimensions
   - Technical Complexity (1-10): How technically challenging is implementation? Consider:
     * Code changes required, smart contract complexity, integration challenges
     * 1-3: Simple parameter changes, basic operations
     * 4-6: Moderate development work, standard integrations  
     * 7-10: Complex architecture changes, novel technical solutions
   - Financial Complexity (1-10): How complex are the financial/economic aspects? Consider:
     * Budget size, funding mechanisms, tokenomics changes
     * 1-3: Simple budget allocations, standard payments
     * 4-6: Multi-phase funding, moderate economic impact
     * 7-10: Complex tokenomics, major economic restructuring
   - Governance Complexity (1-10): How complex are the governance/legal aspects? Consider:
     * Voting mechanisms, legal implications, regulatory considerations
     * 1-3: Standard proposals within existing framework
     * 4-6: Minor governance changes, moderate legal review needed
     * 7-10: Major governance restructuring, complex legal implications
   - Timeline Complexity (1-10): How complex is coordination and execution timeline? Consider:
     * Dependencies, coordination requirements, milestone complexity
     * 1-3: Single-step execution, minimal coordination
     * 4-6: Multi-phase execution, moderate dependencies
     * 7-10: Complex multi-stakeholder coordination, long-term execution

5. Estimated Impact: Evaluate the potential impact of the proposal on the DAO

Please return the result in JSON format without wrapping it in Markdown formatting:
{{
    "summary": "Summary of the proposal",
    "risk_assessment": "1. First risk point 2. Second risk point 3. Third risk point",
    "recommendations": "1. First recommendation 2. Second recommendation 3. Third recommendation",
    "complexity_score": 5.5,
    "complexity_breakdown": {{
        "technical_complexity": 6.0,
        "financial_complexity": 4.0,
        "governance_complexity": 7.0,
        "timeline_complexity": 5.0,
        "explanation": "This proposal has high governance complexity due to required policy changes, moderate technical requirements for implementation, manageable financial aspects, and standard timeline coordination needs.",
        "comparison": "More complex than typical budget proposals (3-4/10) but less complex than major protocol upgrades (8-9/10). Similar complexity to governance framework updates."
    }},
    "estimated_impact": "Estimated impact on the DAO"
}}"#,
        proposal.title, proposal.description
    );

    // Prepare DeepSeek API request
    let request = DeepSeekRequest {
        model: "deepseek-chat".to_string(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: "You are a professional DAO governance analyst who specializes in analyzing proposals and providing valuable recommendations.".to_string(),
            },
            Message {
                role: "user".to_string(),
                content: analysis_prompt,
            },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
        proposal_id: proposal.id.clone(),
        timestamp: ic_cdk::api::time().to_string(),
    };
    debug_print(&format!("proposal_id: {:?}", request.proposal_id));
    debug_print(&format!("timestamp: {:?}", request.timestamp));

    let request_body = serde_json::to_string(&request).unwrap();

    // Prepare HTTP request
    let request = HttpRequestArgs {
        url: "https://idempotent-proxy-cf-worker.tuminfei1981.workers.dev/proxy".to_string(),
        method: HttpMethod::POST,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
        ],
        body: Some(request_body.into_bytes()),
        transform: Some(TransformContext {
            function: TransformFunc(candid::Func {
                principal: ic_cdk::api::canister_self(),
                method: "transform".to_string(),
            }),
            context: vec![],
        }),
        max_response_bytes: Some(10000),
    };

    match http_request(&request).await {
        Ok(response) => {
            if response.status != 200u32 {
                ic_cdk::println!("HTTP request failed! Status: {:?}, Body: {:?}", response.status, response.body);
                update_proposal_status(&proposal_id, ProposalStatus::Failed);
                return;
            }

            let response_body = response.body;
            if let Ok(response_text) = String::from_utf8(response_body) {
                ic_cdk::println!("response_text: {:?}", response_text);

                if let Ok(deepseek_response) =
                    serde_json::from_str::<DeepSeekResponse>(&response_text)
                {
                    ic_cdk::println!("deepseek_response: {:?}", deepseek_response);

                    if let Some(choice) = deepseek_response.choices.first() {
                        ic_cdk::println!("choice: {:?}", choice);

                        // Extract JSON from markdown if wrapped
                        let json_content = extract_json_from_markdown(&choice.message.content);
                        ic_cdk::println!("extracted json_content: {:?}", json_content);

                        if let Ok(json_analysis) = serde_json::from_str::<JsonProposalAnalysis>(&json_content) {
                            ic_cdk::println!("json_analysis: {:?}", json_analysis);

                            // Convert JSON to Candid format and store the analysis
                            let analysis: ProposalAnalysis = json_analysis.into();
                            update_proposal_analysis(&proposal_id, analysis);
                            update_proposal_status(&proposal_id, ProposalStatus::Analyzed);
                            return;
                        } else {
                            ic_cdk::println!("Failed to parse JSON content: {}", json_content);
                        }
                    }
                }
            }
            update_proposal_status(&proposal_id, ProposalStatus::Failed);
        }
        Err(e) => {
            ic_cdk::println!("HTTP request failed: {:?}", e);
            update_proposal_status(&proposal_id, ProposalStatus::Failed);
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

// Retry analysis for a failed proposal
#[update]
async fn retry_proposal_analysis(proposal_id: String) -> Result<String, String> {
    let proposal = get_proposal_internal(&proposal_id);

    if proposal.is_none() {
        return Err("Proposal not found".to_string());
    }

    let proposal = proposal.unwrap();

    // Check if proposal is in Failed status
    match proposal.status {
        ProposalStatus::Failed => {
            // Reset status to Pending and restart analysis
            update_proposal_status(&proposal_id, ProposalStatus::Pending);
            spawn_017_compat(analyze_proposal(proposal_id.clone()));
            Ok("Analysis retry started successfully".to_string())
        }
        _ => Err("Can only retry failed proposals".to_string()),
    }
}

// Helper functions
fn generate_proposal_id() -> String {
    PROPOSAL_COUNTER.with(|counter| {
        let binding = counter.borrow();
        let current = binding.get();
        format!("proposal_{}", current)
    })
}

fn extract_json_from_markdown(content: &str) -> String {
    // Look for JSON content between ```json and ``` markers
    if let Some(start) = content.find("```json") {
        let json_start = start + 7; // Skip "```json"
        // Look for closing ``` after the opening ```json
        if let Some(end_relative) = content[json_start..].find("```") {
            let json_end = json_start + end_relative;
            return content[json_start..json_end].trim().to_string();
        }
    }
    
    // Also try to handle cases with just ``` (without "json")
    if let Some(start) = content.find("```") {
        let json_start = start + 3; // Skip "```"
        // Look for closing ``` after the opening ```
        if let Some(end_relative) = content[json_start..].find("```") {
            let json_end = json_start + end_relative;
            let extracted = content[json_start..json_end].trim();
            // Only return if it looks like JSON (starts with { or [)
            if extracted.starts_with('{') || extracted.starts_with('[') {
                return extracted.to_string();
            }
        }
    }

    // If no markdown wrapper found, return the content as-is
    content.trim().to_string()
}

fn update_proposal_status(proposal_id: &str, status: ProposalStatus) {
    PROPOSALS.with(|proposals| {
        let key = proposal_id.to_string();
        let mut proposals_mut = proposals.borrow_mut();
        if let Some(mut proposal) = proposals_mut.get(&key).map(|x| x.clone()) {
            proposal.status = status;
            proposals_mut.insert(key, proposal);
        }
    });
}

fn update_proposal_analysis(proposal_id: &str, analysis: ProposalAnalysis) {
    PROPOSALS.with(|proposals| {
        let key = proposal_id.to_string();
        let mut proposals_mut = proposals.borrow_mut();
        if let Some(mut proposal) = proposals_mut.get(&key).map(|x| x.clone()) {
            proposal.analysis = Some(analysis);
            proposals_mut.insert(key, proposal);
        }
    });
}

fn get_proposal_internal(proposal_id: &str) -> Option<Proposal> {
    PROPOSALS.with(|proposals| {
        let key = proposal_id.to_string();
        proposals.borrow().get(&key).map(|x| x.clone())
    })
}
