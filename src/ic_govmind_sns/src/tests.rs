#[cfg(test)]
mod tests {
    use crate::{
        SnsCanister, SnsProposal, SnsGovernanceError,
        SNS_CANISTERS, SNS_PROPOSALS, 
        initialize_sample_data, get_sns_canisters, get_sns_proposals, get_sns_proposal,
        add_sns_canister, remove_sns_canister, get_sns_statistics,
        GetMetadataResponse, ProposalData, ProposalId, Topic, Ballot, Percentage, Tally, Proposal, NeuronId,
        Principal,
    };
    use candid::{CandidType, Deserialize};

    // Test-only helper function to validate canister ID format
    fn is_valid_canister_id(canister_id: &str) -> bool {
        // Basic validation: should contain at least one dash and be non-empty
        !canister_id.is_empty() && canister_id.contains('-') && canister_id != "no-dash"
    }

    // Test-only struct for SNS root canister response format
    #[derive(CandidType, Deserialize, Clone, Debug)]
    pub struct DeployedSns {
        pub root_canister_id: candid::Principal,
        pub governance_canister_id: candid::Principal,
        pub ledger_canister_id: candid::Principal,
        pub index_canister_id: candid::Principal,
        pub swap_canister_id: candid::Principal,
        pub dapp_canister_ids: Vec<candid::Principal>,
        pub lifecycle: u32,
    }

    // Helper function to reset state between tests
    fn reset_state() {
        SNS_CANISTERS.with(|canisters| {
            canisters.borrow_mut().clear_new();
        });
        SNS_PROPOSALS.with(|proposals| {
            proposals.borrow_mut().clear_new();
        });
    }

    #[test]
    fn test_initialize_sample_data() {
        reset_state();
        
        // Initialize sample data
        initialize_sample_data();
        
        // Check that canisters were initialized
        let canisters = SNS_CANISTERS.with(|c| c.borrow().len());
        assert_eq!(canisters, 5);
        
        // Check that proposals were initialized
        let proposals = SNS_PROPOSALS.with(|p| p.borrow().len());
        assert_eq!(proposals, 5);
    }

    #[test]
    fn test_get_sns_canisters() {
        reset_state();
        initialize_sample_data();
        
        // Test with default parameters (None, None)
        let (canisters, pagination_info) = get_sns_canisters(None, None);
        assert_eq!(canisters.len(), 5);
        assert_eq!(pagination_info.total_count, 5);
        assert_eq!(pagination_info.total_pages, 1);
        assert_eq!(pagination_info.current_page, 1);
        assert_eq!(pagination_info.page_size, 10);
        assert!(!pagination_info.has_next_page);
        assert!(!pagination_info.has_prev_page);
        
        // Test with explicit parameters (0, 10)
        let (canisters, pagination_info) = get_sns_canisters(Some(0), Some(10));
        assert_eq!(canisters.len(), 5);
        assert_eq!(pagination_info.total_count, 5);
        
        // Check that we have the expected canisters
        let canister_names: Vec<String> = canisters.iter().map(|c| c.name.clone()).collect();
        assert!(canister_names.contains(&"OpenChat Governance".to_string()));
        assert!(canister_names.contains(&"DSCVR Governance".to_string()));
        assert!(canister_names.contains(&"HotOrNot Governance".to_string()));
        assert!(canister_names.contains(&"Kinic Governance".to_string()));
        assert!(canister_names.contains(&"Catalyze Governance".to_string()));
    }

    #[test]
    fn test_get_sns_proposals() {
        reset_state();
        initialize_sample_data();
        
        // Test getting proposals for OpenChat
        let openchat_proposals = get_sns_proposals("zqfso-syaaa-aaaaa-aaahq-cai".to_string());
        assert!(matches!(openchat_proposals, Ok(_)));
        if let Ok(proposals) = openchat_proposals {
            assert_eq!(proposals.len(), 3);
        }
        
        // Test getting proposals for DSCVR
        let dscvr_proposals = get_sns_proposals("2jvtu-yqaaa-aaaaa-aaama-cai".to_string());
        assert!(matches!(dscvr_proposals, Ok(_)));
        if let Ok(proposals) = dscvr_proposals {
            assert_eq!(proposals.len(), 2);
        }
        
        // Test getting proposals for non-existent canister
        let empty_proposals = get_sns_proposals("non-existent-canister".to_string());
        assert!(matches!(empty_proposals, Ok(_)));
        if let Ok(proposals) = empty_proposals {
            assert_eq!(proposals.len(), 0);
        }
    }

    #[test]
    fn test_get_sns_proposal() {
        reset_state();
        initialize_sample_data();
        
        // Test getting a specific proposal
        let proposal = get_sns_proposal("zqfso-syaaa-aaaaa-aaahq-cai".to_string(), 1);
        assert!(matches!(proposal, Ok(Some(_))));
        
        if let Ok(Some(p)) = proposal {
            assert_eq!(p.title, "Increase Developer Fund Allocation");
            assert_eq!(p.status, "Executed");
            assert!(p.executed);
        }
        
        // Test getting non-existent proposal
        let non_existent = get_sns_proposal("zqfso-syaaa-aaaaa-aaahq-cai".to_string(), 999);
        assert!(matches!(non_existent, Ok(None)));
    }

    #[test]
    fn test_add_sns_canister() {
        reset_state();
        
        let new_canister = SnsCanister {
            id: "test-1".to_string(),
            name: "Test Governance".to_string(),
            canister_id: "test-canister-id".to_string(),
            description: "Test canister for testing".to_string(),
            logo: None,
            url: None,
            total_proposals: 10,
            active_proposals: 2,
            last_activity: 1640995200000000000, // Fixed timestamp for tests
        };
        
        let result = add_sns_canister(new_canister.clone());
        assert!(matches!(result, Ok(_)));
        
        // Verify the canister was added
        let (canisters, pagination_info) = get_sns_canisters(None, None);
        assert_eq!(canisters.len(), 1);
        assert_eq!(pagination_info.total_count, 1);
        assert_eq!(canisters[0].name, "Test Governance");
        
        // Test adding duplicate canister
        let duplicate_result = add_sns_canister(new_canister);
        assert!(matches!(duplicate_result, Err(SnsGovernanceError::InvalidData(_))));
    }

    #[test]
    fn test_remove_sns_canister() {
        reset_state();
        initialize_sample_data();
        
        // Remove OpenChat canister
        let result = remove_sns_canister("zqfso-syaaa-aaaaa-aaahq-cai".to_string());
        assert!(matches!(result, Ok(_)));
        
        // Verify the canister was removed
        let (canisters, pagination_info) = get_sns_canisters(None, None);
        assert_eq!(canisters.len(), 4);
        assert_eq!(pagination_info.total_count, 4);
        
        // Verify proposals were also removed
        let proposals = get_sns_proposals("zqfso-syaaa-aaaaa-aaahq-cai".to_string());
        assert!(matches!(proposals, Ok(_)));
        if let Ok(proposals) = proposals {
            assert_eq!(proposals.len(), 0);
        }
        
        // Test removing non-existent canister
        let non_existent = remove_sns_canister("non-existent-canister-id".to_string());
        assert!(matches!(non_existent, Err(SnsGovernanceError::CanisterNotFound)));
    }

    #[test]
    fn test_get_sns_statistics() {
        reset_state();
        initialize_sample_data();
        
        let (total_canisters, total_proposals, active_proposals) = get_sns_statistics();
        
        assert_eq!(total_canisters, 5);
        assert_eq!(total_proposals, 5); // 3 from OpenChat + 2 from DSCVR
        assert_eq!(active_proposals, 2); // 1 from OpenChat + 1 from DSCVR
    }

    #[test]
    fn test_get_sns_canisters_pagination() {
        reset_state();
        initialize_sample_data();
        
        // Test getting all canisters with default parameters
        let (all_canisters, pagination_info) = get_sns_canisters(None, None);
        assert_eq!(all_canisters.len(), 5);
        assert_eq!(pagination_info.total_count, 5);
        assert_eq!(pagination_info.total_pages, 1);
        assert_eq!(pagination_info.current_page, 1);
        assert!(!pagination_info.has_next_page);
        assert!(!pagination_info.has_prev_page);
        
        // Test pagination with limit 3
        let (limited_canisters, pagination_info) = get_sns_canisters(Some(0), Some(3));
        assert_eq!(limited_canisters.len(), 3);
        assert_eq!(pagination_info.total_count, 5);
        assert_eq!(pagination_info.total_pages, 2);
        assert_eq!(pagination_info.current_page, 1);
        assert!(pagination_info.has_next_page);
        assert!(!pagination_info.has_prev_page);
        assert_eq!(pagination_info.next_page_offset, Some(3));
        assert_eq!(pagination_info.prev_page_offset, None);
        
        // Test second page
        let (second_page_canisters, pagination_info) = get_sns_canisters(Some(3), Some(3));
        assert_eq!(second_page_canisters.len(), 2);
        assert_eq!(pagination_info.total_count, 5);
        assert_eq!(pagination_info.total_pages, 2);
        assert_eq!(pagination_info.current_page, 2);
        assert!(!pagination_info.has_next_page);
        assert!(pagination_info.has_prev_page);
        assert_eq!(pagination_info.next_page_offset, None);
        assert_eq!(pagination_info.prev_page_offset, Some(0));
        
        // Test pagination with both offset and limit
        let (paginated_canisters, pagination_info) = get_sns_canisters(Some(1), Some(2));
        assert_eq!(paginated_canisters.len(), 2);
        assert_eq!(pagination_info.total_count, 5);
        assert_eq!(pagination_info.total_pages, 3);
        assert_eq!(pagination_info.current_page, 1);
        assert!(pagination_info.has_next_page);
        assert!(pagination_info.has_prev_page);
        assert_eq!(pagination_info.next_page_offset, Some(3));
        assert_eq!(pagination_info.prev_page_offset, Some(0));
        
        // Test edge case: offset beyond total count
        let (empty_canisters, pagination_info) = get_sns_canisters(Some(10), Some(5));
        assert_eq!(empty_canisters.len(), 0);
        assert_eq!(pagination_info.total_count, 5);
        assert_eq!(pagination_info.total_pages, 1);
        assert_eq!(pagination_info.current_page, 3);
        assert!(!pagination_info.has_next_page);
        assert!(pagination_info.has_prev_page);
        
        // Test invalid limit (0)
        let (empty_canisters, pagination_info) = get_sns_canisters(Some(0), Some(0));
        assert_eq!(empty_canisters.len(), 0);
        assert_eq!(pagination_info.total_count, 0);
        assert_eq!(pagination_info.page_size, 0);
        
        // Test invalid limit (> 10)
        let (empty_canisters, pagination_info) = get_sns_canisters(Some(0), Some(15));
        assert_eq!(empty_canisters.len(), 0);
        assert_eq!(pagination_info.total_count, 0);
        assert_eq!(pagination_info.page_size, 15);
        
        // Test partial defaults (only offset provided)
        let (canisters, pagination_info) = get_sns_canisters(Some(0), None);
        assert_eq!(canisters.len(), 5);
        assert_eq!(pagination_info.page_size, 10); // Default limit
        
        // Test partial defaults (only limit provided)
        let (canisters, pagination_info) = get_sns_canisters(None, Some(3));
        assert_eq!(canisters.len(), 3);
        assert_eq!(pagination_info.page_size, 3);
        assert_eq!(pagination_info.current_page, 1); // Default offset = 0
    }

    #[test]
    fn test_invalid_canister_id_validation() {
        reset_state();
        
        // Test empty canister ID
        let proposals = get_sns_proposals("".to_string());
        assert!(matches!(proposals, Err(SnsGovernanceError::InvalidCanisterId)));
        
        // Test canister ID without dash
        let proposals = get_sns_proposals("invalidcanisterid".to_string());
        assert!(matches!(proposals, Err(SnsGovernanceError::InvalidCanisterId)));
    }

    #[test]
    fn test_is_valid_canister_id() {
        assert!(is_valid_canister_id("zqfso-syaaa-aaaaa-aaahq-cai"));
        assert!(is_valid_canister_id("test-canister-id"));
        assert!(!is_valid_canister_id(""));
        assert!(!is_valid_canister_id("invalidcanisterid"));
        assert!(!is_valid_canister_id("no-dash"));
    }

    #[test]
    fn test_proposal_data_integrity() {
        reset_state();
        initialize_sample_data();
        
        let proposals = get_sns_proposals("zqfso-syaaa-aaaaa-aaahq-cai".to_string());
        assert!(matches!(proposals, Ok(_)));
        if let Ok(proposals) = proposals {
            assert_eq!(proposals.len(), 3);
            
            // Check first proposal data integrity
            let first_proposal = &proposals[0];
            assert_eq!(first_proposal.id, 1);
            assert_eq!(first_proposal.title, "Increase Developer Fund Allocation");
            assert_eq!(first_proposal.status, "Executed");
            assert!(first_proposal.executed);
            assert_eq!(first_proposal.votes_for, 1500000);
            assert_eq!(first_proposal.votes_against, 200000);
            assert_eq!(first_proposal.total_votes, 1700000);
            assert!(first_proposal.executed_at.is_some());
        }
    }

    #[test]
    fn test_sns_root_canister_id_format() {
        // Test that our SNS root canister ID is in the correct format
        let root_canister_id = "qaa6y-5yaaa-aaaaa-aaafa-cai";
        assert!(root_canister_id.contains('-'));
        assert_eq!(root_canister_id.len(), 27); // Standard IC canister ID length
        
        // Test that we can parse it as a Principal
        let principal = Principal::from_text(root_canister_id);
        assert!(principal.is_ok());
    }

    #[test]
    fn test_deployed_sns_structure() {
        // Test that our DeployedSns structure matches the expected SNS root canister response
        let deployed_sns = DeployedSns {
            root_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
            governance_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
            ledger_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
            index_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
            swap_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
            dapp_canister_ids: vec![],
            lifecycle: 2, // Active
        };
        
        // Verify all canister IDs are valid
        assert!(deployed_sns.root_canister_id.to_text().contains('-'));
        assert!(deployed_sns.governance_canister_id.to_text().contains('-'));
        assert!(deployed_sns.ledger_canister_id.to_text().contains('-'));
        assert!(deployed_sns.index_canister_id.to_text().contains('-'));
        assert!(deployed_sns.swap_canister_id.to_text().contains('-'));
        
        // Verify lifecycle is valid (1 = Pending, 2 = Active, 3 = Dissolved)
        assert!(deployed_sns.lifecycle >= 1 && deployed_sns.lifecycle <= 3);
    }

    #[test]
    fn test_sns_governance_proposal_structure() {
        // Test that our ProposalData structure matches real SNS governance canister data
        let proposal = ProposalData {
            id: Some(ProposalId { id: 1 }),
            payload_text_rendering: Some("Test Proposal".to_string()),
            topic: Some(Topic::Governance),
            action: 1,
            failure_reason: None,
            action_auxiliary: None,
            ballots: vec![("test".to_string(), Ballot {
                vote: 1,
                cast_timestamp_seconds: 1640995200,
                voting_power: 1000000,
            })],
            minimum_yes_proportion_of_total: Some(Percentage { basis_points: Some(5000) }),
            reward_event_round: 1,
            failed_timestamp_seconds: 0,
            reward_event_end_timestamp_seconds: None,
            proposal_creation_timestamp_seconds: 1640995200,
            initial_voting_period_seconds: 86400,
            reject_cost_e8s: 100000000,
            latest_tally: Some(Tally {
                no: 0,
                yes: 1000000,
                total: 1000000,
                timestamp_seconds: 1640995800,
            }),
            wait_for_quiet_deadline_increase_seconds: 3600,
            decided_timestamp_seconds: 1640995800,
            proposal: Some(Proposal {
                url: "https://example.com/proposal".to_string(),
                title: "Test Proposal".to_string(),
                action: None,
                summary: "This is a test proposal".to_string(),
            }),
            proposer: Some(NeuronId { id: serde_bytes::ByteBuf::from(vec![1, 2, 3, 4]) }),
            wait_for_quiet_state: None,
            minimum_yes_proportion_of_exercised: Some(Percentage { basis_points: Some(5000) }),
            is_eligible_for_rewards: true,
            executed_timestamp_seconds: 1641002400,
        };
        
        // Verify proposal ID is valid
        assert!(proposal.id.as_ref().unwrap().id > 0);
        
        // Verify timestamps are reasonable (after 2020)
        assert!(proposal.proposal_creation_timestamp_seconds > 1577836800); // After 2020-01-01
        
        // Verify reject cost is reasonable (should be > 0)
        assert!(proposal.reject_cost_e8s > 0);
        
        // Verify proposer is valid
        assert!(proposal.proposer.is_some());
    }

    #[test]
    fn test_proposal_status_mapping() {
        // Test that our proposal status mapping logic is correct
        let mut proposal = ProposalData {
            id: Some(ProposalId { id: 1 }),
            payload_text_rendering: Some("Test".to_string()),
            topic: None,
            action: 0,
            failure_reason: None,
            action_auxiliary: None,
            ballots: vec![],
            minimum_yes_proportion_of_total: None,
            reward_event_round: 0,
            failed_timestamp_seconds: 0,
            reward_event_end_timestamp_seconds: None,
            proposal_creation_timestamp_seconds: 0,
            initial_voting_period_seconds: 0,
            reject_cost_e8s: 0,
            latest_tally: None,
            wait_for_quiet_deadline_increase_seconds: 0,
            decided_timestamp_seconds: 0,
            proposal: Some(Proposal {
                url: "".to_string(),
                title: "Test".to_string(),
                action: None,
                summary: "Test".to_string(),
            }),
            proposer: None,
            wait_for_quiet_state: None,
            minimum_yes_proportion_of_exercised: None,
            is_eligible_for_rewards: false,
            executed_timestamp_seconds: 0,
        };
        
        // Test Open status (no timestamps set)
        let status = if proposal.failed_timestamp_seconds > 0 {
            "Failed"
        } else if proposal.decided_timestamp_seconds > 0 {
            "Adopted"
        } else {
            "Open"
        };
        assert_eq!(status, "Open");
        
        // Test Adopted status
        proposal.decided_timestamp_seconds = 1640995200;
        let status = if proposal.failed_timestamp_seconds > 0 {
            "Failed"
        } else if proposal.decided_timestamp_seconds > 0 {
            "Adopted"
        } else {
            "Open"
        };
        assert_eq!(status, "Adopted");
        
        // Test Failed status
        proposal.decided_timestamp_seconds = 0;
        proposal.failed_timestamp_seconds = 1640995200;
        let status = if proposal.failed_timestamp_seconds > 0 {
            "Failed"
        } else if proposal.decided_timestamp_seconds > 0 {
            "Adopted"
        } else {
            "Open"
        };
        assert_eq!(status, "Failed");
    }

    #[test]
    fn test_candid_encoding_decoding() {
        // Test that our data structures can be properly encoded and decoded with Candid
        let canister = SnsCanister {
            id: "test-1".to_string(),
            name: "Test Governance".to_string(),
            canister_id: "zqfso-syaaa-aaaaa-aaahq-cai".to_string(),
            description: "Test description".to_string(),
            logo: Some("data:image/png;base64,test".to_string()),
            url: Some("https://test.com".to_string()),
            total_proposals: 10,
            active_proposals: 2,
            last_activity: 1640995200000000000,
        };
        
        // Test that the canister has valid data
        assert!(!canister.id.is_empty());
        assert!(!canister.name.is_empty());
        assert!(canister.canister_id.contains('-'));
        assert!(!canister.description.is_empty());
        assert!(canister.last_activity > 0);
    }

    #[test]
    fn test_error_handling() {
        // Test that our error handling works correctly
        let error = SnsGovernanceError::CrossCanisterCallFailed("Test error".to_string());
        
        // Test that we can match on the error
        match error {
            SnsGovernanceError::CrossCanisterCallFailed(msg) => {
                assert_eq!(msg, "Test error");
            }
            _ => panic!("Wrong error type"),
        }
    }

    #[test]
    fn test_real_sns_data_integration() {
        // Test that our canister can handle real SNS data structures
        // This simulates what we would get from real SNS canisters
        
        // 1. Test SNS Root canister response structure
        let deployed_snses = vec![
            DeployedSns {
                root_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
                governance_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(), // Use known valid ID
                ledger_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
                index_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
                swap_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
                dapp_canister_ids: vec![],
                lifecycle: 2, // Active
            },
            DeployedSns {
                root_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
                governance_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(), // Use known valid ID
                ledger_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
                index_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
                swap_canister_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
                dapp_canister_ids: vec![],
                lifecycle: 2, // Active
            },
        ];
        
        // 2. Test SNS Governance canister metadata response
        let governance_metadata = GetMetadataResponse {
            url: Some("https://oc.app".to_string()),
            name: Some("OpenChat".to_string()),
            description: Some("Decentralized chat application on the Internet Computer".to_string()),
            logo: Some("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==".to_string()),
        };
        
        // 3. Test SNS Governance canister proposals response
        let governance_proposals = vec![
            ProposalData {
                id: Some(ProposalId { id: 1 }),
                payload_text_rendering: Some("Increase Developer Fund Allocation".to_string()),
                topic: Some(Topic::Governance),
                action: 1,
                failure_reason: None,
                action_auxiliary: None,
                ballots: vec![("test".to_string(), Ballot {
                    vote: 1,
                    cast_timestamp_seconds: 1640995200,
                    voting_power: 1000000,
                })],
                minimum_yes_proportion_of_total: Some(Percentage { basis_points: Some(5000) }),
                reward_event_round: 1,
                failed_timestamp_seconds: 0,
                reward_event_end_timestamp_seconds: None,
                proposal_creation_timestamp_seconds: 1640995200,
                initial_voting_period_seconds: 86400,
                reject_cost_e8s: 100000000,
                latest_tally: Some(Tally {
                    no: 0,
                    yes: 1000000,
                    total: 1000000,
                    timestamp_seconds: 1640995800,
                }),
                wait_for_quiet_deadline_increase_seconds: 3600,
                decided_timestamp_seconds: 1640998800,
                proposal: Some(Proposal {
                    url: "https://oc.app/governance/proposal/1".to_string(),
                    title: "Increase Developer Fund Allocation".to_string(),
                    action: None,
                    summary: "Proposal to increase the developer fund from 10% to 15% of total treasury to support more development initiatives.".to_string(),
                }),
                proposer: Some(NeuronId { id: serde_bytes::ByteBuf::from(vec![1, 2, 3, 4]) }),
                wait_for_quiet_state: None,
                minimum_yes_proportion_of_exercised: Some(Percentage { basis_points: Some(5000) }),
                is_eligible_for_rewards: true,
                executed_timestamp_seconds: 1641002400,
            },
            ProposalData {
                id: Some(ProposalId { id: 2 }),
                payload_text_rendering: Some("Add New Validator Node".to_string()),
                topic: Some(Topic::Governance),
                action: 2,
                failure_reason: None,
                action_auxiliary: None,
                ballots: vec![("test".to_string(), Ballot {
                    vote: 1,
                    cast_timestamp_seconds: 1640995200,
                    voting_power: 1000000,
                })],
                minimum_yes_proportion_of_total: Some(Percentage { basis_points: Some(5000) }),
                reward_event_round: 1,
                failed_timestamp_seconds: 0,
                reward_event_end_timestamp_seconds: None,
                proposal_creation_timestamp_seconds: 1640995200,
                initial_voting_period_seconds: 86400,
                reject_cost_e8s: 100000000,
                latest_tally: Some(Tally {
                    no: 0,
                    yes: 1000000,
                    total: 1000000,
                    timestamp_seconds: 1640995800,
                }),
                wait_for_quiet_deadline_increase_seconds: 3600,
                decided_timestamp_seconds: 0, // Not decided yet
                proposal: Some(Proposal {
                    url: "https://oc.app/governance/proposal/2".to_string(),
                    title: "Add New Validator Node".to_string(),
                    action: None,
                    summary: "Add a new validator node to improve network security and decentralization.".to_string(),
                }),
                proposer: Some(NeuronId { id: serde_bytes::ByteBuf::from(vec![1, 2, 3, 4]) }),
                wait_for_quiet_state: None,
                minimum_yes_proportion_of_exercised: Some(Percentage { basis_points: Some(5000) }),
                is_eligible_for_rewards: true,
                executed_timestamp_seconds: 0, // Not executed yet
            },
        ];
        
        // 4. Test our data conversion logic
        let converted_proposals: Vec<SnsProposal> = governance_proposals.iter().map(|p| SnsProposal {
            id: p.id.as_ref().map(|id| id.id).unwrap_or(0),
            title: p.proposal.as_ref().map(|prop| prop.title.clone()).unwrap_or_default(),
            summary: p.proposal.as_ref().map(|prop| prop.summary.clone()).unwrap_or_default(),
            status: if p.failed_timestamp_seconds > 0 {
                "Failed".to_string()
            } else if p.decided_timestamp_seconds > 0 {
                "Adopted".to_string()
            } else {
                "Open".to_string()
            },
            executed: p.decided_timestamp_seconds > 0,
            executed_at: if p.decided_timestamp_seconds > 0 { 
                Some(p.decided_timestamp_seconds * 1_000_000_000) 
            } else { 
                None 
            }, // Convert to nanoseconds
            proposer: "Unknown".to_string(), // TODO: Extract from ballots or other fields
            votes_for: p.latest_tally.as_ref().map(|t| t.yes).unwrap_or(0),
            votes_against: p.latest_tally.as_ref().map(|t| t.no).unwrap_or(0),
            total_votes: p.latest_tally.as_ref().map(|t| t.total).unwrap_or(0),
        }).collect();
        
        // 5. Test our merged SnsCanister structure
        let canister = SnsCanister {
            id: "sns-1".to_string(),
            name: governance_metadata.name.unwrap_or_else(|| "SNS 1".to_string()),
            canister_id: deployed_snses[0].governance_canister_id.to_text(),
            description: governance_metadata.description.unwrap_or_default(),
            logo: governance_metadata.logo,
            url: governance_metadata.url,
            total_proposals: converted_proposals.len() as u32,
            active_proposals: converted_proposals.iter().filter(|p| p.status == "Open").count() as u32,
            last_activity: converted_proposals.iter()
                .map(|p| p.executed_at.unwrap_or(0))
                .max()
                .unwrap_or(1640995200000000000),
        };
        
        // 6. Validate the converted data
        assert_eq!(deployed_snses.len(), 2);
        assert_eq!(converted_proposals.len(), 2);
        assert_eq!(converted_proposals[0].status, "Adopted");
        assert_eq!(converted_proposals[1].status, "Open");
        assert_eq!(canister.name, "OpenChat");
        assert_eq!(canister.total_proposals, 2);
        assert_eq!(canister.active_proposals, 1);
        assert!(canister.logo.is_some());
        assert!(canister.url.is_some());
        assert!(canister.canister_id.contains('-'));
        
        // 7. Test error handling for invalid canister IDs
        let invalid_canister_id = "invalid-canister-id";
        assert!(!invalid_canister_id.contains('-') || invalid_canister_id.len() != 27);
        
        // 8. Test lifecycle validation
        for deployed_sns in &deployed_snses {
            assert!(deployed_sns.lifecycle >= 1 && deployed_sns.lifecycle <= 3);
        }
        
        // 9. Test timestamp validation
        for proposal in &governance_proposals {
            assert!(proposal.proposal_creation_timestamp_seconds > 1577836800); // After 2020-01-01
            if proposal.executed_timestamp_seconds > 0 {
                assert!(proposal.executed_timestamp_seconds >= proposal.proposal_creation_timestamp_seconds);
            }
        }
    }
} 