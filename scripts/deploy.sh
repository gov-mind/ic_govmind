dfx deploy ic_govmind_backend --argument '(opt variant {
  Init = record {
    env = variant { Local };
    root = principal "aaaaa-aa";
    org_info = opt record {
      id = "dao1";
      members = vec {};
      name = "My DAO";
      description = opt "A demo DAO";
      created_at = 0;
      icon_url = opt "https://example.com/icon.png";
      base_token = record {
        decimals = 8;
        name = "DemoToken";
        token_location = record {
          chain = variant { InternetComputer };
          canister_id = opt principal "aaaaa-aa";
          contract_address = null;
        };
        distribution_model = null;
        total_supply = 1000000;
        symbol = "DMT";
      };
      chains = vec { variant { InternetComputer }; variant { Ethereum } };
      governance = record {
        vote_weight_type = variant { TokenWeighted };
        approval_threshold = 50;
        voting_period_secs = 86400;
        quorum = 10;
      };
      proposals = vec {};
      treasury = vec {};
    };
    admins = vec { principal "aaaaa-aa" };
  }
})'
