#!/bin/bash
# Git Push with Flexible Network Handling
# 灵活处理网络问题的 Git 推送脚本

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
        echo -e "${YELLOW}Testing proxy connection...${NC}"
        if timeout 5 curl -I --connect-timeout 5 --proxy "$DEFAULT_PROXY" "$test_url" &>/dev/null; then
            echo -e "${GREEN}✓ Proxy works${NC}"
            return 0
        else
            echo -e "${RED}✗ Proxy failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}Testing direct connection...${NC}"
        if timeout 5 curl -I --connect-timeout 5 "$test_url" &>/dev/null; then
            echo -e "${GREEN}✓ Direct connection works${NC}"
            return 0
        else
            echo -e "${RED}✗ Direct connection failed${NC}"
            return 1
        fi
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

    # Test which connection method works
    echo -e "${YELLOW}Step 1: Testing network connectivity${NC}\n"

    PROXY_WORKS=false
    DIRECT_WORKS=false

    if test_connectivity "true"; then
        PROXY_WORKS=true
    fi

    if test_connectivity "false"; then
        DIRECT_WORKS=true
    fi

    echo ""

    # Decide which method to use
    if [ "$PROXY_WORKS" = "true" ]; then
        echo -e "${YELLOW}Step 2: Using proxy to push${NC}"
        set_proxy "$DEFAULT_PROXY"
        if git push; then
            echo -e "\n${GREEN}✓ Push successful with proxy!${NC}"
            exit 0
        else
            echo -e "\n${RED}✗ Push failed with proxy${NC}"
        fi
    fi

    if [ "$DIRECT_WORKS" = "true" ]; then
        echo -e "${YELLOW}Step 2: Using direct connection to push${NC}"
        unset_proxy
        if git push; then
            echo -e "\n${GREEN}✓ Push successful with direct connection!${NC}"
            restore_proxy "$ORIGINAL_PROXY"
            exit 0
        else
            echo -e "\n${RED}✗ Push failed with direct connection${NC}"
        fi
    fi

    # Both failed
    echo -e "\n${RED}=== Push failed ===${NC}"
    echo -e "${YELLOW}Network is unstable. Your commits are safe locally.${NC}"
    echo -e "${YELLOW}Try again later with: npm run push${NC}"

    # Restore original proxy settings
    restore_proxy "$ORIGINAL_PROXY"
    exit 1
}

# Run main function
main "$@"
