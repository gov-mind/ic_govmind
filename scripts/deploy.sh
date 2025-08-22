#!/bin/bash

# Unified Deploy Script for GovMind
# Usage: 
#   ./scripts/deploy.sh                                    # Deploy all canisters to local
#   ./scripts/deploy.sh <canister_name>                    # Deploy specific canister to local
#   ./scripts/deploy.sh <canister_name> --network <network> # Deploy to specific network
#   ./scripts/deploy.sh --network <network>                # Deploy all canisters to specific network

set -e  # Exit on any error

# Parse command line arguments
CANISTER="all"
NETWORK="local"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --network)
            NETWORK="$2"
            shift 2
            ;;
        --help|-h)
            echo "Unified Deploy Script for GovMind"
            echo ""
            echo "Usage:"
            echo "  ./scripts/deploy.sh                                    # Deploy all canisters to local"
            echo "  ./scripts/deploy.sh <canister_name>                    # Deploy specific canister to local"
            echo "  ./scripts/deploy.sh <canister_name> --network <network> # Deploy to specific network"
            echo "  ./scripts/deploy.sh --network <network>                # Deploy all canisters to specific network"
            echo ""
            echo "Networks:"
            echo "  local     - Local development network (default)"
            echo "  ic        - Internet Computer mainnet"
            echo "  ic_test   - Internet Computer testnet"
            echo ""
            echo "Examples:"
            echo "  ./scripts/deploy.sh                                    # Deploy all to local"
            echo "  ./scripts/deploy.sh ic_govmind_backend                 # Deploy backend to local"
            echo "  ./scripts/deploy.sh ic_govmind_backend --network ic    # Deploy backend to mainnet"
            echo "  ./scripts/deploy.sh --network ic_test                  # Deploy all to testnet"
            echo ""
            echo "Special behavior:"
            echo "  • When deploying 'all' or 'ic_govmind_backend': adds initialization arguments"
            exit 0
            ;;
        *)
            if [[ "$CANISTER" == "all" && "$1" != "--network" ]]; then
                CANISTER="$1"
            fi
            shift
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 GovMind Deployment Script${NC}"
echo -e "${BLUE}==============================${NC}"

# Validate network
case $NETWORK in
    "local"|"ic"|"ic_test")
        echo -e "${BLUE}🌐 Deploying to network: ${NETWORK}${NC}"
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid network '${NETWORK}'${NC}"
        echo -e "${YELLOW}Valid networks: local, ic, ic_test${NC}"
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

# Function to deploy other canisters normally
deploy_canister() {
    local canister_name=$1
    local network_flag=$(get_network_flag)
    echo -e "${YELLOW}📦 Deploying ${canister_name}...${NC}"
    dfx deploy "$canister_name" $network_flag
    echo -e "${GREEN}✅ ${canister_name} deployed successfully!${NC}"
}

# Main deployment logic
case $CANISTER in
    "all")
        echo -e "${BLUE}Deploying all canisters...${NC}"
        
        network_flag=$(get_network_flag)
        dfx deploy internet_identity $network_flag
        
        # Deploy other canisters
        echo -e "${YELLOW}📦 Deploying remaining canisters...${NC}"
        dfx deploy icrc1_ledger $network_flag
        dfx deploy ic_govmind_frontend $network_flag
        
        echo -e "${GREEN}🎉 All canisters deployed successfully!${NC}"
        ;;
        
    "ic_govmind_backend")
        deploy_backend
        ;;
        
    *)
        deploy_canister "$CANISTER"
        ;;
esac

echo -e "${GREEN}🚀 Deployment completed on ${NETWORK}!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
if [[ "$NETWORK" == "local" ]]; then
    echo "• Check canister status: dfx canister status --all"
    echo "• View frontend: http://localhost:4943/?canisterId=\$(dfx canister id ic_govmind_frontend)"
    echo "• Test proposals: Navigate to /proposals and submit a test proposal"
else
    echo "• Check canister status: dfx canister status --all $network_flag"
    echo "• View frontend: Check your dfx.json for frontend configuration"
    echo "• Test proposals: Navigate to /proposals and submit a test proposal"
fi
