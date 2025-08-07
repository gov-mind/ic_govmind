#!/bin/bash

CANISTER_ID=$(dfx canister id ic_govmind_backend)

dfx canister call "$CANISTER_ID" create_dao_base_token \
  --argument-file ./files/create_token.json
