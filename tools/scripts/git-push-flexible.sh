#!/bin/bash
# Git Push with Flexible Network Handling
# 灵活处理网络问题的 Git 推送脚本

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default proxy settings
DEFAULT_PROXY="http://127.0.0.1:7897"

echo -e "${YELLOW}=== Git Push with Flexible Network Handling ===${NC}\n"

# Function to get current proxy settings
get_proxy() {
    local http_proxy=$(git config --global --get http.proxy 2>/dev/null || echo "")
    local https_proxy=$(git config --global --get https.proxy 2>/dev/null || echo "")
    echo "$http_proxy|$https_proxy"
}

# Function to set proxy
set_proxy() {
    local proxy=$1
    git config --global http.proxy "$proxy"
    git config --global https.proxy "$proxy"
    echo -e "${GREEN}✓ Proxy set to: $proxy${NC}"
}

# Function to unset proxy
unset_proxy() {
    git config --global --unset http.proxy 2>/dev/null || true
    git config --global --unset https.proxy 2>/dev/null || true
    echo -e "${GREEN}✓ Proxy disabled (using direct connection)${NC}"
}

# Function to restore proxy
restore_proxy() {
    local proxy=$1
    if [ -n "$proxy" ] && [ "$proxy" != "|" ]; then
        local http_proxy=$(echo "$proxy" | cut -d'|' -f1)
        local https_proxy=$(echo "$proxy" | cut -d'|' -f2)
        [ -n "$http_proxy" ] && git config --global http.proxy "$http_proxy"
        [ -n "$https_proxy" ] && git config --global https.proxy "$https_proxy"
        echo -e "${GREEN}✓ Proxy restored${NC}"
    fi
}

# Function to test connectivity
test_connectivity() {
    local use_proxy=$1
    local test_url="https://github.com"

    if [ "$use_proxy" = "true" ]; then
        echo -e "${YELLOW}Testing connectivity with proxy...${NC}"
        if curl -I --connect-timeout 5 --proxy "$DEFAULT_PROXY" "$test_url" &>/dev/null; then
            echo -e "${GREEN}✓ Proxy connection works${NC}"
            return 0
        else
            echo -e "${RED}✗ Proxy connection failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}Testing direct connectivity...${NC}"
        if curl -I --connect-timeout 5 "$test_url" &>/dev/null; then
            echo -e "${GREEN}✓ Direct connection works${NC}"
            return 0
        else
            echo -e "${RED}✗ Direct connection failed${NC}"
            return 1
        fi
    fi
}

# Function to attempt git push
try_push() {
    local method=$1
    echo -e "\n${YELLOW}Attempting push with $method...${NC}"

    if git push "$@" 2>&1; then
        echo -e "${GREEN}✓ Push successful!${NC}"
        return 0
    else
        echo -e "${RED}✗ Push failed${NC}"
        return 1
    fi
}

# Main logic
main() {
    # Save original proxy settings
    ORIGINAL_PROXY=$(get_proxy)
    echo -e "Original proxy: ${ORIGINAL_PROXY:-none}\n"

    # Check if there's anything to push
    if ! git status | grep -q "Your branch is ahead"; then
        echo -e "${YELLOW}Nothing to push. Working tree is clean.${NC}"
        exit 0
    fi

    # Strategy 1: Try with current settings
    echo -e "${YELLOW}Strategy 1: Using current settings${NC}"
    if try_push "current settings"; then
        exit 0
    fi

    # Strategy 2: Try with proxy
    echo -e "\n${YELLOW}Strategy 2: Using proxy${NC}"
    set_proxy "$DEFAULT_PROXY"
    if try_push "proxy"; then
        exit 0
    fi

    # Strategy 3: Try without proxy (direct connection)
    echo -e "\n${YELLOW}Strategy 3: Using direct connection${NC}"
    unset_proxy
    if try_push "direct connection"; then
        # Restore original proxy settings
        restore_proxy "$ORIGINAL_PROXY"
        exit 0
    fi

    # All strategies failed
    echo -e "\n${RED}=== All push strategies failed ===${NC}"
    echo -e "${YELLOW}Your commits are safe locally. Try again later when network is stable.${NC}"
    echo -e "${YELLOW}You can manually push with: git push${NC}"

    # Restore original proxy settings
    restore_proxy "$ORIGINAL_PROXY"
    exit 1
}

# Run main function
main "$@"
