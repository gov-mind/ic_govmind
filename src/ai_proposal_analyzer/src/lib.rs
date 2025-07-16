use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs, TransformContext, TransformFunc
};
use ic_cdk::{query, update};
use serde::{Deserialize as SerdeDeserialize, Serialize as SerdeSerialize};
use std::cell::RefCell;
use std::collections::HashMap;

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

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ProposalAnalysis {
    pub summary: String,
    pub risk_assessment: String,
    pub recommendations: String,
    pub complexity_score: f64,
    pub estimated_impact: String,
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

// State management
thread_local! {
    static PROPOSALS: RefCell<HashMap<String, Proposal>> = RefCell::new(HashMap::new());
    static PROPOSAL_COUNTER: RefCell<u64> = RefCell::new(0);
    static API_KEY: RefCell<Option<String>> = RefCell::new(None);
}

// HTTP Transform function for DeepSeek API calls
#[ic_cdk::query]
fn transform(response: TransformArgs) -> HttpResponse {
    response.response
}

// Set API key (only controller can call this)
#[update]
async fn set_api_key(api_key: String) -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    // Check if caller is controller
    let controllers = ic_cdk::api::management_canister::main::canister_status(
        ic_cdk::api::management_canister::main::CanisterIdRecord {
            canister_id: ic_cdk::id(),
        }
    )
        .await
        .map_err(|e| format!("Failed to get canister status: {:?}", e))?
        .0
        .settings
        .controllers;
    
    if !controllers.contains(&caller) {
        return Err("Only canister controllers can set the API key".to_string());
    }
    
    API_KEY.with(|key| {
        *key.borrow_mut() = Some(api_key);
    });
    
    Ok("API key set successfully".to_string())
}

// Get API key from storage
fn get_deepseek_api_key() -> Result<String, String> {
    API_KEY.with(|key| {
        key.borrow()
            .clone()
            .ok_or_else(|| "API key not configured. Please set it using set_api_key()".to_string())
    })
}

// Submit a new proposal
#[update]
async fn submit_proposal(title: String, description: String) -> String {
    let caller = ic_cdk::caller();
    let proposal_id = generate_proposal_id();
    
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
    
    // Start analysis in background
    ic_cdk::spawn(analyze_proposal(proposal_id.clone()));
    
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
    
    // Get API key
    let api_key = match get_deepseek_api_key() {
        Ok(key) => key,
        Err(e) => {
            ic_cdk::println!("Failed to get API key: {}", e);
            update_proposal_status(&proposal_id, ProposalStatus::Failed);
            return;
        }
    };
    
    // Prepare the analysis prompt
    let analysis_prompt = format!(
        r#"Please analyze the following DAO proposal and provide a detailed analysis report:

Proposal Title: {}
Proposal Description: {}

Please analyze from the following perspectives:
1. Summary: Summarize the core content of the proposal in simple and understandable language
2. Risk Assessment: Analyze the potential risks and challenges. Format as numbered points (1. First risk, 2. Second risk, etc.)
3. Recommendations: Provide specific improvement suggestions or precautions. Format as numbered points (1. First recommendation, 2. Second recommendation, etc.)
4. Complexity Score: Give a complexity score from 1-10 (1 being the simplest, 10 being the most complex)
5. Estimated Impact: Evaluate the potential impact of the proposal on the DAO

Please return the result in JSON format without wrapping it in Markdown formatting:
{{
    "summary": "Summary of the proposal",
    "risk_assessment": "1. First risk point 2. Second risk point 3. Third risk point",
    "recommendations": "1. First recommendation 2. Second recommendation 3. Third recommendation",
    "complexity_score": 5.0,
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
    };
    
    let request_body = serde_json::to_string(&request).unwrap();
    ic_cdk::println!("request_body: {:?}", request_body);
    
    // Prepare HTTP request
    let request = CanisterHttpRequestArgument {
        url: "https://api.deepseek.com/chat/completions".to_string(),
        method: HttpMethod::POST,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "Authorization".to_string(),
                value: format!("Bearer {}", api_key),
            },
        ],
        body: Some(request_body.into_bytes()),
        transform: Some(TransformContext {
            function: TransformFunc(
                candid::Func {
                    principal: ic_cdk::id(),
                    method: "transform".to_string(),
                }
            ),
            context: vec![],
        }),
        max_response_bytes: Some(10000),
    };
    
    // Make HTTP request with sufficient cycles for mainnet
    // 1B cycles = ~0.01 ICP, sufficient for most HTTP outcalls
    match http_request(request, 1_000_000_000).await {
        Ok((response,)) => {
            let response_body = response.body;
            if let Ok(response_text) = String::from_utf8(response_body) {
                ic_cdk::println!("response_text: {:?}", response_text);

                if let Ok(deepseek_response) = serde_json::from_str::<DeepSeekResponse>(&response_text) {
                    ic_cdk::println!("deepseek_response: {:?}", deepseek_response);

                    if let Some(choice) = deepseek_response.choices.first() {
                        ic_cdk::println!("choice: {:?}", choice);

                        // Extract JSON from markdown if wrapped
                        let json_content = extract_json_from_markdown(&choice.message.content);
                        ic_cdk::println!("extracted json_content: {:?}", json_content);

                        if let Ok(analysis) = serde_json::from_str::<ProposalAnalysis>(&json_content) {
                            ic_cdk::println!("analysis: {:?}", analysis);

                            // Store the analysis
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
        Err((code, message)) => {
            ic_cdk::println!("HTTP request failed: code={:?}, message={}", code, message);
            update_proposal_status(&proposal_id, ProposalStatus::Failed);
        }
    }
}

// Get proposal by ID
#[query]
fn get_proposal(proposal_id: String) -> Option<Proposal> {
    PROPOSALS.with(|proposals| {
        proposals.borrow().get(&proposal_id).cloned()
    })
}

// Get all proposals
#[query]
fn get_all_proposals() -> Vec<Proposal> {
    PROPOSALS.with(|proposals| {
        proposals.borrow().values().cloned().collect()
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
            ic_cdk::spawn(analyze_proposal(proposal_id.clone()));
            Ok("Analysis retry started successfully".to_string())
        },
        _ => Err("Can only retry failed proposals".to_string())
    }
}

// Helper functions
fn generate_proposal_id() -> String {
    PROPOSAL_COUNTER.with(|counter| {
        let current = *counter.borrow();
        *counter.borrow_mut() = current + 1;
        format!("proposal_{}", current)
    })
}

fn extract_json_from_markdown(content: &str) -> String {
    // Look for JSON content between ```json and ``` markers
    if let Some(start) = content.find("```json") {
        if let Some(end) = content[start..].find("```") {
            if end > 7 { // "```json".len() = 7
                let json_start = start + 7; // Skip "```json"
                let json_end = start + end;
                return content[json_start..json_end].trim().to_string();
            }
        }
    }
    
    // If no markdown wrapper found, return the content as-is
    content.trim().to_string()
}

fn update_proposal_status(proposal_id: &str, status: ProposalStatus) {
    PROPOSALS.with(|proposals| {
        if let Some(proposal) = proposals.borrow_mut().get_mut(proposal_id) {
            proposal.status = status;
        }
    });
}

fn update_proposal_analysis(proposal_id: &str, analysis: ProposalAnalysis) {
    PROPOSALS.with(|proposals| {
        if let Some(proposal) = proposals.borrow_mut().get_mut(proposal_id) {
            proposal.analysis = Some(analysis);
        }
    });
}

fn get_proposal_internal(proposal_id: &str) -> Option<Proposal> {
    PROPOSALS.with(|proposals| {
        proposals.borrow().get(proposal_id).cloned()
    })
} 