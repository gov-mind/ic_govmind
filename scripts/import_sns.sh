#!/bin/bash

set -e

echo "Importing canisters..."
canister_files=(export_canisters_*.did)

if [ ! -e "${canister_files[0]}" ]; then
    echo "No canister export files found."
else
    for canister_file in "${canister_files[@]}"; do
        echo "  Importing $canister_file..."
        dfx canister call ic_govmind_sns import_canisters --argument-file "$canister_file"
        if [ $? -ne 0 ]; then
            echo "Error importing $canister_file"
            exit 1
        fi
    done
fi

echo "Importing proposals..."
proposal_files=(export_proposals_*.did)

if [ ! -e "${proposal_files[0]}" ]; then
    echo "No proposal export files found."
else
    for proposal_file in "${proposal_files[@]}"; do
        echo "  Importing $proposal_file..."
        dfx canister call ic_govmind_sns import_proposals --argument-file "$proposal_file"
        if [ $? -ne 0 ]; then
            echo "Error importing $proposal_file"
            exit 1
        fi
    done
fi

echo "Import completed successfully!"