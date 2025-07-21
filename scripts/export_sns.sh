#!/bin/bash

set -e

# Export canisters in chunks as Candid
canister_chunk_size=20
canister_offset=0
canister_chunk_number=0

echo "Exporting canisters in chunks..."

while true; do
    values=()
    while IFS= read -r line; do
        values+=("$line")
    done < <(dfx canister call ic_govmind_sns get_canisters_pagination_info "($canister_offset : nat32, $canister_chunk_size : nat32)" --output json --ic)
    offset=${values[0]}
    limit=${values[1]}
    total=${values[2]}
    has_more=${values[3]}
    echo "  [canisters] offset=$offset limit=$limit total=$total has_more=$has_more"
    echo "  Exporting canisters chunk $canister_chunk_number (offset: $canister_offset)..."
    dfx canister call ic_govmind_sns export_canisters_chunk "($canister_offset : nat32, $canister_chunk_size : nat32)" --ic > "export_canisters_${canister_chunk_number}.did"
    canister_offset=$((canister_offset + canister_chunk_size))
    canister_chunk_number=$((canister_chunk_number + 1))
    if [ "$has_more" = "false" ]; then
        break
    fi
done

echo "Exported $canister_chunk_number canister chunks."

# Export proposals in chunks as Candid
proposal_chunk_size=50
proposal_offset=0
proposal_chunk_number=0

echo "Exporting proposals in chunks..."

while true; do
    values=()
    while IFS= read -r line; do
        values+=("$line")
    done < <(dfx canister call ic_govmind_sns get_proposals_pagination_info "($proposal_offset : nat32, $proposal_chunk_size : nat32)" --output json --ic)
    offset=${values[0]}
    limit=${values[1]}
    total=${values[2]}
    has_more=${values[3]}
    echo "  [proposals] offset=$offset limit=$limit total=$total has_more=$has_more"
    echo "  Exporting proposals chunk $proposal_chunk_number (offset: $proposal_offset)..."
    dfx canister call ic_govmind_sns export_proposals_chunk "($proposal_offset : nat32, $proposal_chunk_size : nat32)" --ic > "export_proposals_${proposal_chunk_number}.did"
    proposal_offset=$((proposal_offset + proposal_chunk_size))
    proposal_chunk_number=$((proposal_chunk_number + 1))
    if [ "$has_more" = "false" ]; then
        break
    fi
done

echo "Exported $proposal_chunk_number proposal chunks."

echo "Export complete."