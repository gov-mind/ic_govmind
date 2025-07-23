#!/bin/bash

# Script to set up DeepSeek API key for the AI Proposal Analyzer canister
# Usage: 
#   ./scripts/setup_api_key.sh                    # Setup API key on local network
#   ./scripts/setup_api_key.sh --network <network> # Setup API key on specific network

# Parse command line arguments
NETWORK="local"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --network)
            NETWORK="$2"
            shift 2
            ;;
        --help|-h)
            echo "Script to set up DeepSeek API key for the AI Proposal Analyzer canister"
            echo ""
            echo "Usage:"
            echo "  ./scripts/setup_api_key.sh                    # Setup API key on local network"
            echo "  ./scripts/setup_api_key.sh --network <network> # Setup API key on specific network"
            echo ""
            echo "Networks:"
            echo "  local     - Local development network (default)"
            echo "  ic        - Internet Computer mainnet"
            echo "  ic_test   - Internet Computer testnet"
            echo ""
            echo "Examples:"
            echo "  ./scripts/setup_api_key.sh                    # Setup on local"
            echo "  ./scripts/setup_api_key.sh --network ic       # Setup on mainnet"
            echo "  ./scripts/setup_api_key.sh --network ic_test  # Setup on testnet"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Validate network
case $NETWORK in
    "local"|"ic"|"ic_test")
        echo "Setting up DeepSeek API key for AI Proposal Analyzer on ${NETWORK}..."
        ;;
    *)
        echo "Error: Invalid network '${NETWORK}'"
        echo "Valid networks: local, ic, ic_test"
        exit 1
        ;;
esac

# Function to get dfx network flag
get_network_flag() {
    case $NETWORK in
        "local")
            echo ""
            ;;
        "ic")
            echo "--network ic"
            ;;
        "ic_test")
            echo "--network ic_test"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Check if API key is provided as environment variable
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "Error: DEEPSEEK_API_KEY environment variable is not set"
    echo "Please export your API key: export DEEPSEEK_API_KEY='your-api-key-here'"
    exit 1
fi

# Check if canister is deployed
local network_flag=$(get_network_flag)
echo "Checking if ic_govmind_proposal_analyzer canister is deployed on ${NETWORK}..."
if ! dfx canister id ic_govmind_proposal_analyzer $network_flag > /dev/null 2>&1; then
    echo "Error: ic_govmind_proposal_analyzer canister is not deployed on ${NETWORK}"
    echo "Please deploy first: dfx deploy ic_govmind_proposal_analyzer $network_flag"
    exit 1
fi

# Set the API key
echo "Setting API key on ${NETWORK}..."
dfx canister call ic_govmind_proposal_analyzer $network_flag set_api_key "(\"$DEEPSEEK_API_KEY\")"

if [ $? -eq 0 ]; then
    echo "✅ API key set successfully on ${NETWORK}!"
    echo ""
    echo "You can now submit proposals for analysis:"
    if [[ "$NETWORK" == "local" ]]; then
        echo "dfx canister call ic_govmind_proposal_analyzer submit_proposal '(\"Your proposal text here\")'"
    else
        echo "dfx canister call ic_govmind_proposal_analyzer $network_flag submit_proposal '(\"Your proposal text here\")'"
    fi
else
    echo "❌ Failed to set API key on ${NETWORK}"
    exit 1
fi 