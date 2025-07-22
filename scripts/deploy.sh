#!/bin/bash

# Unified Deploy Script for GovMind
# Usage: 
#   ./scripts/deploy.sh                    # Deploy all canisters
#   ./scripts/deploy.sh <canister_name>    # Deploy specific canister

set -e  # Exit on any error

# Show help if requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Unified Deploy Script for GovMind"
    echo ""
    echo "Usage:"
    echo "  ./scripts/deploy.sh                    # Deploy all canisters"
    echo "  ./scripts/deploy.sh <canister_name>    # Deploy specific canister"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy.sh                    # Deploy all"
    echo "  ./scripts/deploy.sh ic_govmind_backend # Deploy backend only"
    echo "  ./scripts/deploy.sh ic_govmind_proposal_analyzer # Deploy analyzer only"
    echo ""
    echo "Special behavior:"
    echo "  • When deploying 'all' or 'ic_govmind_backend': adds initialization arguments"
    echo "  • When deploying 'all' or 'ic_govmind_proposal_analyzer': runs setup_api_key"
    exit 0
fi

CANISTER=${1:-"all"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 GovMind Deployment Script${NC}"
echo -e "${BLUE}==============================${NC}"

# Function to deploy ic_govmind_backend with initialization arguments
deploy_backend() {
    echo -e "${YELLOW}📦 Deploying ic_govmind_backend...${NC}"
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
    echo -e "${GREEN}✅ ic_govmind_backend deployed successfully!${NC}"
}

# Function to deploy ic_govmind_proposal_analyzer and setup API key
deploy_analyzer() {
    echo -e "${YELLOW}📦 Deploying ic_govmind_proposal_analyzer...${NC}"
    dfx deploy ic_govmind_proposal_analyzer
    echo -e "${GREEN}✅ ic_govmind_proposal_analyzer deployed successfully!${NC}"
    
    echo -e "${YELLOW}🔑 Setting up API key...${NC}"
    ./scripts/setup_api_key.sh
}

# Function to deploy other canisters normally
deploy_canister() {
    local canister_name=$1
    echo -e "${YELLOW}📦 Deploying ${canister_name}...${NC}"
    dfx deploy "$canister_name"
    echo -e "${GREEN}✅ ${canister_name} deployed successfully!${NC}"
}

# Main deployment logic
case $CANISTER in
    "all")
        echo -e "${BLUE}Deploying all canisters...${NC}"

        dfx deploy internet_identity
        
        # Deploy backend with arguments
        deploy_backend
        
        # Deploy analyzer with API key setup
        deploy_analyzer
        
        # Deploy other canisters
        echo -e "${YELLOW}📦 Deploying remaining canisters...${NC}"
        dfx deploy icrc1_ledger
        dfx deploy ic_govmind_frontend
        dfx deploy ic_govmind_factory
        dfx deploy ic_govmind_sns
        
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

echo -e "${GREEN}🚀 Deployment completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "• Check canister status: dfx canister status --all"
echo "• View frontend: http://localhost:4943/?canisterId=\$(dfx canister id ic_govmind_frontend)"
echo "• Test proposals: Navigate to /proposals and submit a test proposal"
