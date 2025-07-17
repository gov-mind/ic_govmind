use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;
use std::collections::HashMap;

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct Dao {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub chains: Vec<ChainType>,
    pub base_token: BaseToken, // e.g. ICP, ETH, etc.
    pub members: Vec<DaoMember>,
    pub governance: GovernanceConfig,
    pub proposals: Vec<Proposal>,
    pub treasury: Vec<DaoAsset>,
    pub created_at: u64,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize, Default)]
pub enum ChainType {
    #[default]
    InternetComputer,
    Ethereum,
    Bitcoin,
    Solana,
    BNBChain,
    TON,
    Other(String),
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct BaseToken {
    pub name: String,   // e.g. "GovMind Token"
    pub symbol: String, // e.g. "GOV"
    pub decimals: u8,   // e.g. 8
    pub total_supply: u128,
    pub distribution_model: Option<DistributionModel>,
    pub token_location: TokenLocation,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct TokenLocation {
    pub chain: ChainType,
    pub canister_id: Option<Principal>,   // for ICP
    pub contract_address: Option<String>, // for EVM chains
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct DistributionModel {
    pub initial_distribution: HashMap<String, u128>, // Initial allocation: address → token amount
    pub emission_rate: Option<u128>, // Optional: number of tokens emitted per period (e.g., per day/week)
    pub unlock_schedule: Option<Vec<(u64, u128)>>, // Optional: unlock schedule as a list of (timestamp, amount) pairs
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct DaoMember {
    pub user_id: String, // e.g. user DID
    pub icp_principal: Option<Principal>,
    pub eth_address: Option<String>,
    pub sol_address: Option<String>,
    pub role: MemberRole,
    pub reputation: u64,
    pub joined_at: u64,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub enum MemberRole {
    Founder,
    Council,
    Contributor,
    Voter,
    Observer,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct DaoAsset {
    pub chain: ChainType,
    pub symbol: String, // e.g. "ckBTC"
    pub amount: u128,
    pub asset_type: AssetType,
    pub canister_id: Option<Principal>,   // for ICP assets
    pub external_address: Option<String>, // for ETH, Solana, etc.
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub enum AssetType {
    Fungible,
    NonFungible,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct Proposal {
    pub id: u64,
    pub title: String,
    pub content: String,
    pub proposer: String,
    pub created_at: u64,
    pub expires_at: u64,
    pub status: ProposalStatus,
    pub votes: Vec<Vote>,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub enum ProposalStatus {
    Draft,
    Active,
    Passed,
    Rejected,
    Executed,
    Expired,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct Vote {
    pub voter_id: String, // DAO Member ID
    pub vote_choice: VoteChoice,
    pub weight: u64,
    pub voted_at: u64,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceConfig {
    pub voting_period_secs: u64,
    pub quorum: u64,             // e.g. 20 => 20%
    pub approval_threshold: u64, // e.g. 50 => 50%
    pub vote_weight_type: VoteWeightType,
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub enum VoteWeightType {
    OnePersonOneVote,
    TokenWeighted,
    ReputationWeighted,
}