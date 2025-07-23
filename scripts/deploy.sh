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
            echo "  • When deploying 'all' or 'ic_govmind_proposal_analyzer': runs setup_api_key"
            echo "  • DEEPSEEK_API_KEY required for analyzer deployments"
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

# Function to deploy ic_govmind_backend with initialization arguments
deploy_backend() {
    local network_flag=$(get_network_flag)
    echo -e "${YELLOW}📦 Deploying ic_govmind_backend...${NC}"
    dfx deploy ic_govmind_backend $network_flag --argument '(opt variant {
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
    echo -e "${GREEN}✅ ic_govmind_backend deployed successfully!${NC}"
}

# Function to deploy ic_govmind_proposal_analyzer and setup API key
deploy_analyzer() {
    # Check if DEEPSEEK_API_KEY is set
    if [[ -z "${DEEPSEEK_API_KEY}" ]]; then
        echo -e "${RED}❌ Error: DEEPSEEK_API_KEY environment variable is not set${NC}"
        echo -e "${YELLOW}Please set the DEEPSEEK_API_KEY environment variable before deploying ic_govmind_proposal_analyzer${NC}"
        echo -e "${BLUE}Example: export DEEPSEEK_API_KEY='your-api-key-here'${NC}"
        exit 1
    fi
    
    local network_flag=$(get_network_flag)
    echo -e "${YELLOW}📦 Deploying ic_govmind_proposal_analyzer...${NC}"
    dfx deploy ic_govmind_proposal_analyzer $network_flag
    echo -e "${GREEN}✅ ic_govmind_proposal_analyzer deployed successfully!${NC}"
    
    echo -e "${YELLOW}🔑 Setting up API key...${NC}"
    ./scripts/setup_api_key.sh --network "$NETWORK"
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
        
        # Check if DEEPSEEK_API_KEY is set for analyzer deployment
        if [[ -z "${DEEPSEEK_API_KEY}" ]]; then
            echo -e "${RED}❌ Error: DEEPSEEK_API_KEY environment variable is not set${NC}"
            echo -e "${YELLOW}Please set the DEEPSEEK_API_KEY environment variable before deploying all canisters${NC}"
            echo -e "${BLUE}Example: export DEEPSEEK_API_KEY='your-api-key-here'${NC}"
            exit 1
        fi

        local network_flag=$(get_network_flag)
        dfx deploy internet_identity $network_flag
        
        # Deploy backend with arguments
        deploy_backend
        
        # Deploy analyzer with API key setup
        deploy_analyzer
        
        # Deploy other canisters
        echo -e "${YELLOW}📦 Deploying remaining canisters...${NC}"
        dfx deploy icrc1_ledger $network_flag
        dfx deploy ic_govmind_frontend $network_flag
        dfx deploy ic_govmind_factory $network_flag
        dfx deploy ic_govmind_sns $network_flag
        
        echo -e "${GREEN}🎉 All canisters deployed successfully!${NC}"
        ;;
        
    "ic_govmind_backend")
        deploy_backend
        ;;
        
    "ic_govmind_proposal_analyzer")
        deploy_analyzer
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
