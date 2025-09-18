#!/usr/bin/env bash

dfx wallet send uxrrr-q7777-77774-qaaaq-cai 50000000000000

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
          record {
            0 = "p4zdu-eo2az-bkta3-djjqn-hkiuk-qoc7z-v2ery-76kwx-s4gmb-utjfe-xqe";
            1 = 5000;
          };
          record {
            0 = "kjmyi-ld67r-fhb37-tztjx-huazh-ziaav-3maym-yze5a-rjv5t-3c62i-3ae";
            1 = 5000;
          };
        };
        unlock_schedule = opt vec {
          record {
            addr = "p4zdu-eo2az-bkta3-djjqn-hkiuk-qoc7z-v2ery-76kwx-s4gmb-utjfe-xqe";
            timestamp = 1723075200;
            amount = 2500;
            executed = false;
          };
          record {
            addr = "kjmyi-ld67r-fhb37-tztjx-huazh-ziaav-3maym-yze5a-rjv5t-3c62i-3ae";
            timestamp = 1725753600;
            amount = 2600;
            executed = false;
          };
        };
        emission_rate = opt 1000000;
        last_emission_time = null;
        initial_executed_at = null;
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
    committees = vec {};
  }
)'
