use crate::ByteN;
use candid::{CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};
use serde_bytes::ByteBuf;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct NFT {
    pub canister_id: Principal,
    pub standard: String,
    pub token_index: String,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Attribute {
    pub key: String,
    pub value: String,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct QueryCommonReq {
    pub page: Nat,
    pub size: Nat,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum UserType {
    Regular,       // Standard user, only participates
    Creator,       // DAO creator / initiator
    Delegate,      // Authorized delegate for governance rights
    AgentOperator, // Has permission to trigger AI Agent execution
    SystemAdmin,   // Platform admin / system maintenance
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DaoRoleRecord {
    pub dao_canister: Principal,
    pub role: String, // Owner / Member / Voter / Delegate / TreasurySigner ...
    pub joined_at: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct User {
    pub avatar: String,
    pub artist_name: String,
    pub location: String,
    pub genre: String,
    pub website: String,
    pub bio: String,
    pub handler: String,
    pub born: Option<u64>,
    pub nft: Option<NFT>,
    pub email: String,
    pub subscribes: Vec<Principal>,
    pub attributes: Vec<Attribute>,
    pub confirm_agreement: bool,
    pub trusted_ecdsa_pub_key: Option<ByteBuf>,
    pub trusted_eddsa_pub_key: Option<ByteN<32>>,

    pub user_type: UserType,
    pub dao_roles: Vec<DaoRoleRecord>,
    pub identity_score: u32,
    pub system_tags: Vec<String>,
    pub last_login_at: u64,

    pub created: u64,
    pub updated_at: u64,
}

impl User {
    pub fn to_user_info(&self, pid: Principal) -> UserInfo {
        UserInfo {
            pid,
            avatar: self.avatar.clone(),
            nft: self.nft.clone(),
            email: self.email.clone(),
            location: self.location.clone(),
            genre: self.genre.clone(),
            website: self.website.clone(),
            bio: self.bio.clone(),
            handler: self.handler.clone(),
            born: self.born,
            confirm_agreement: self.confirm_agreement,
            trusted_ecdsa_pub_key: self.trusted_ecdsa_pub_key.clone(),
            trusted_eddsa_pub_key: self.trusted_eddsa_pub_key.clone(),
            created: self.created,
            updated_at: self.updated_at,
        }
    }

    pub fn new() -> Self {
        let now = ic_cdk::api::time();
        Self {
            avatar: String::from(""),
            artist_name: String::from(""),
            location: String::from(""),
            genre: String::from(""),
            website: String::from(""),
            bio: String::from(""),
            handler: String::from(""),
            born: None,
            nft: None,
            email: String::from(""),
            subscribes: vec![],
            attributes: vec![],
            confirm_agreement: false,
            trusted_ecdsa_pub_key: None,
            trusted_eddsa_pub_key: None,
            user_type: UserType::Regular,
            dao_roles: vec![],
            identity_score: 0,
            system_tags: vec![],
            last_login_at: now,
            created: now,
            updated_at: now,
        }
    }

    pub fn update_user_info(&mut self, update: UpdateUserInfo) {
        if let Some(avatar) = update.avatar {
            self.avatar = avatar;
        }
        if let Some(location) = update.location {
            self.location = location;
        }
        if let Some(genre) = update.genre {
            self.genre = genre;
        }
        if let Some(website) = update.website {
            self.website = website;
        }
        if let Some(bio) = update.bio {
            self.bio = bio;
        }
        if let Some(handler) = update.handler {
            self.handler = handler;
        }
        if let Some(born) = update.born {
            self.born = Some(born);
        }
        if let Some(confirm) = update.confirm_agreement {
            self.confirm_agreement = confirm;
        }

        self.updated_at = ic_cdk::api::time();
    }

    pub fn update_login_timestamp(&mut self) {
        self.last_login_at = ic_cdk::api::time();
    }

    pub fn add_dao_role(&mut self, dao: Principal, role: String) {
        self.dao_roles.push(DaoRoleRecord {
            dao_canister: dao,
            role,
            joined_at: ic_cdk::api::time(),
        });
    }

    pub fn add_system_tag(&mut self, tag: &str) {
        if !self.system_tags.contains(&tag.to_string()) {
            self.system_tags.push(tag.to_string());
        }
    }
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UserInfo {
    pub pid: Principal,
    pub avatar: String,
    pub nft: Option<NFT>,
    pub email: String,
    pub location: String,
    pub genre: String,
    pub website: String,
    pub bio: String,
    pub handler: String,
    pub born: Option<u64>,
    pub confirm_agreement: bool,
    pub trusted_ecdsa_pub_key: Option<ByteBuf>,
    pub trusted_eddsa_pub_key: Option<ByteN<32>>,
    pub created: u64,
    pub updated_at: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UpdateUserInfo {
    pub avatar: Option<String>,
    pub location: Option<String>,
    pub genre: Option<String>,
    pub website: Option<String>,
    pub bio: Option<String>,
    pub handler: Option<String>,
    pub born: Option<u64>,
    pub confirm_agreement: Option<bool>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UserInfoData {
    pub pid: Principal,
    pub avatar: String,
    pub nft: Option<NFT>,
    pub email: String,
    pub created: u64,
    pub subscribes: Vec<Principal>,
}
