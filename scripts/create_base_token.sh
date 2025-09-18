#!/bin/bash

CANISTER_ID=$(dfx canister id ic_govmind_backend)

dfx canister call "uzt4z-lp777-77774-qaabq-cai" create_dao_base_token \
  --argument-file ./scripts/files/create_token.candid
