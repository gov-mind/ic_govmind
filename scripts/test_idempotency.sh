#!/bin/bash

# Test script to simulate concurrent calls to ic_govmind_proposal_analyzer
# to verify idempotency functionality on ICP mainnet

# Removed set -e to prevent silent exits on non-zero return codes

# Configuration
CANISTER_NAME="ic_govmind_proposal_analyzer"
NUM_REQUESTS=19
TEST_ID="idempotency-test-$(date +%s)"
TEST_TITLE="Idempotency Test Proposal"
TEST_DESCRIPTION="This is a test proposal to verify that multiple concurrent requests with the same parameters return identical responses due to idempotency header implementation."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ICP Mainnet Idempotency Test ===${NC}"
echo -e "${YELLOW}Testing canister: $CANISTER_NAME${NC}"
echo -e "${YELLOW}Number of concurrent requests: $NUM_REQUESTS${NC}"
echo -e "${YELLOW}Test ID: $TEST_ID${NC}"
echo ""

# Create temporary directory for results
TEMP_DIR="/tmp/idempotency_test_$(date +%s)"
mkdir -p "$TEMP_DIR"

echo -e "${BLUE}Starting concurrent requests...${NC}"

# Function to make a single request
make_request() {
    local request_id=$1
    local output_file="$TEMP_DIR/response_$request_id.txt"
    local error_file="$TEMP_DIR/error_$request_id.txt"
    
    echo -e "${YELLOW}[Request $request_id] Starting...${NC}"
    
    # Make the dfx call and capture both stdout and stderr
    if dfx canister call "$CANISTER_NAME" analyze_proposal "(\"$TEST_ID\")" > "$output_file" 2> "$error_file"; then
        echo -e "${GREEN}[Request $request_id] Completed successfully${NC}"
    else
        echo -e "${RED}[Request $request_id] Failed${NC}"
        cat "$error_file"
    fi
}

# Start all requests in parallel
for i in $(seq 1 $NUM_REQUESTS); do
    make_request $i &
done

# Wait for all background jobs to complete
echo -e "${BLUE}Waiting for all requests to complete...${NC}"
wait

echo -e "${BLUE}\nAnalyzing results...${NC}"
echo -e "${BLUE}===========================================${NC}"

# Count successful and failed requests
successful=0
failed=0

for i in $(seq 1 $NUM_REQUESTS); do
    if [ -s "$TEMP_DIR/response_$i.txt" ] && ! grep -q "Err =" "$TEMP_DIR/response_$i.txt"; then
        ((successful++))
    else
        ((failed++))
        echo -e "${RED}Request $i failed:${NC}"
        if grep -q "Err =" "$TEMP_DIR/response_$i.txt"; then
            echo -e "${RED}Error details:${NC}"
            grep "Err =" "$TEMP_DIR/response_$i.txt" | sed 's/^/   /'
        else
            cat "$TEMP_DIR/error_$i.txt" 2>/dev/null || echo "   No error details available"
        fi
    fi
done

echo -e "${BLUE}\n🔍 Content comparison:${NC}"

# Check if all response files have the same size
echo -e "${BLUE}📊 Response file sizes:${NC}"
if [ $successful -gt 0 ]; then
    file_sizes=$(ls -la "$TEMP_DIR"/response_*.txt 2>/dev/null | awk '{print $5}' | sort | uniq -c)
    echo "$file_sizes"
    
    # Count unique file sizes
    unique_sizes=$(echo "$file_sizes" | wc -l)
    if [ "$unique_sizes" -eq 1 ]; then
        echo -e "${GREEN}✅ All response files have the same size${NC}"
    else
        echo -e "${RED}❌ Response files have different sizes${NC}"
    fi
fi

# If we have successful responses, compare them for idempotency
if [ $successful -gt 1 ]; then
    # Get the first successful response as reference
    first_response=""
    for i in $(seq 1 $NUM_REQUESTS); do
        if [ -f "$TEMP_DIR/response_$i.txt" ] && [ -s "$TEMP_DIR/response_$i.txt" ]; then
            first_response="$TEMP_DIR/response_$i.txt"
            break
        fi
    done
    
    if [ -n "$first_response" ]; then
        identical_count=1
        different_count=0
        
        # Compare all other successful responses to the first one
        for i in $(seq 1 $NUM_REQUESTS); do
            response_file="$TEMP_DIR/response_$i.txt"
            if [ -f "$response_file" ] && [ -s "$response_file" ] && [ "$response_file" != "$first_response" ]; then
                if diff -q "$first_response" "$response_file" > /dev/null 2>&1; then
                    identical_count=$((identical_count + 1))
                else
                    different_count=$((different_count + 1))
                    echo -e "${RED}❌ Response $i differs from the reference response${NC}"
                fi
            fi
        done
        
        echo -e "${BLUE}\n📈 Results summary:${NC}"
        echo -e "   Total requests: $NUM_REQUESTS"
        echo -e "   Successful requests: ${GREEN}$successful${NC}"
        echo -e "   Failed requests: ${RED}$failed${NC}"
        echo -e "   Identical responses: ${GREEN}$identical_count${NC}"
        echo -e "   Different responses: ${RED}$different_count${NC}"
        if [ $successful -gt 0 ]; then
            success_rate=$((successful * 100 / NUM_REQUESTS))
            echo -e "   Success rate: ${GREEN}$success_rate%${NC}"
        fi
        
        echo ""
        if [ $different_count -eq 0 ] && [ $successful -gt 1 ]; then
            echo -e "${GREEN}🎉 IDEMPOTENCY TEST PASSED!${NC}"
            echo -e "${GREEN}   All $successful concurrent requests returned identical responses${NC}"
            echo -e "${GREEN}   The idempotency header implementation is working correctly${NC}"
        elif [ $successful -eq 1 ]; then
            echo -e "${YELLOW}⚠️  IDEMPOTENCY TEST INCONCLUSIVE${NC}"
            echo -e "${YELLOW}   Only 1 successful response - cannot verify idempotency${NC}"
        else
            echo -e "${RED}💥 IDEMPOTENCY TEST FAILED!${NC}"
            echo -e "${RED}   Some responses differ - check the implementation${NC}"
        fi
        
        # Show sample response preview
        echo -e "${BLUE}\n📄 Sample response preview (first 300 characters):${NC}"
        if [ -f "$first_response" ]; then
            head -c 300 "$first_response" | sed 's/^/   /'
            echo "   ..."
        else
            echo "   No response file found"
        fi
    fi
else
    echo -e "${BLUE}\n📈 Results summary:${NC}"
    echo -e "   Total requests: $NUM_REQUESTS"
    echo -e "   Successful requests: ${GREEN}$successful${NC}"
    echo -e "   Failed requests: ${RED}$failed${NC}"
    echo -e "${RED}\n💥 IDEMPOTENCY TEST FAILED!${NC}"
    echo -e "${RED}   Not enough successful responses to test idempotency${NC}"
fi

echo -e "${BLUE}\n🧹 Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"

echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Test completed at $(date)${NC}"

# Exit with appropriate code
if [ $successful -gt 1 ] && [ $different_count -eq 0 ]; then
    exit 0
else
    exit 1
fi