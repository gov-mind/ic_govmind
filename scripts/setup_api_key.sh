#!/bin/bash

# Script to set up DeepSeek API key for the AI Proposal Analyzer canister
# Usage: ./scripts/setup_api_key.sh

echo "Setting up DeepSeek API key for AI Proposal Analyzer..."

# Check if API key is provided as environment variable
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "Error: DEEPSEEK_API_KEY environment variable is not set"
    echo "Please export your API key: export DEEPSEEK_API_KEY='your-api-key-here'"
    exit 1
fi

# Check if canister is deployed
echo "Checking if ai_proposal_analyzer canister is deployed..."
if ! dfx canister id ai_proposal_analyzer > /dev/null 2>&1; then
    echo "Error: ai_proposal_analyzer canister is not deployed"
    echo "Please deploy first: dfx deploy ai_proposal_analyzer"
    exit 1
fi

# Set the API key
echo "Setting API key..."
dfx canister call ai_proposal_analyzer set_api_key "(\"$DEEPSEEK_API_KEY\")"

if [ $? -eq 0 ]; then
    echo "✅ API key set successfully!"
    echo ""
    echo "You can now submit proposals for analysis:"
    echo "dfx canister call ai_proposal_analyzer submit_proposal '(\"Your proposal text here\")'"
else
    echo "❌ Failed to set API key"
    exit 1
fi 