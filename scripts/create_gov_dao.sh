#!/usr/bin/env bash

dfx canister call ic_govmind_factory create_gov_dao '(
  record {
    id = "my-dao-id";
    name = "My DAO";
    description = opt "This is a demo DAO.";
    icon_url = opt "https://example.com/icon.png";
    created_at = 0 : nat64;
    base_token = record {
      decimals = 8 : nat8;
      name = "Internet Computer";
      symbol = "ICP";
      total_supply = 100000000000 : nat;
      token_location = record {
        chain = variant { InternetComputer };
        canister_id = null;
        contract_address = null;
      };
      distribution_model = opt record {
        initial_distribution = vec {
          record { "user1"; 1000 : nat };
          record { "user2"; 500 : nat };
        };
        unlock_schedule = opt vec {
          record { 1721123200 : nat64; 250 : nat };
        };
        emission_rate = opt 10;
      };
    };
    chains = vec {
      variant { InternetComputer };
      variant { Ethereum };
    };
    members = vec {};
    governance = record {
      vote_weight_type = variant { OnePersonOneVote };
      approval_threshold = 51 : nat64;
      voting_period_secs = 3600 : nat64;
      quorum = 1 : nat64;
    };
    proposals = vec {};
    treasury = vec {};
  }
)'
