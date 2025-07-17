dfx canister call ic_govmind_backend create_dao_token '(
  record {
    controllers = opt vec {
      principal "uxrrr-q7777-77774-qaaaq-cai";
      principal "lpeju-wvbhd-g2fqh-av4yi-fjgiz-hfcm2-5pja4-t6ubj-kr2qd-jwpih-jqe";
    };
    token_symbol = "DAO";
    minting_account = record {
      owner = principal "lpeju-wvbhd-g2fqh-av4yi-fjgiz-hfcm2-5pja4-t6ubj-kr2qd-jwpih-jqe";
      subaccount = null;
    };
    logo = variant { Text = "https://example.com/logo.png" };
    initial_balances = vec {
      record {
        record {
          owner = principal "lpeju-wvbhd-g2fqh-av4yi-fjgiz-hfcm2-5pja4-t6ubj-kr2qd-jwpih-jqe";
          subaccount = null;
        };
        1000000000000 : nat;
      };
    };
    token_name = "DAO Governance Token";
  }
)'
