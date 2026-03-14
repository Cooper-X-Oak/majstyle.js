#!/bin/bash
# Git Push with Flexible Network Handling
# 灵活处理网络问题的 Git 推送脚本
# Enhanced with network quality detection, retry mechanism, and SSH fallback

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_PROXY="http://127.0.0.1:7897"
MAX_RETRIES=3
RETRY_BASE_DELAY=2  # seconds

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

# Function to test network quality
test_network_quality() {
    echo -e "${BLUE}Testing network quality to GitHub...${NC}"

    # Detect OS and use appropriate ping command
    local ping_output=""
    local is_windows=false

    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]] || command -v ping.exe &>/dev/null; then
        # Windows ping (via Git Bash)
        ping_output=$(ping -n 3 github.com 2>&1)
        is_windows=true
    else
        # Unix/Linux/Mac ping
        ping_output=$(ping -c 3 github.com 2>&1)
    fi

    # Check for complete failure
    if echo "$ping_output" | grep -qi "unreachable\|timed out\|could not find host"; then
        echo -e "${RED}✗ Network unreachable${NC}"
        return 2  # poor
    fi

    # Extract packet loss percentage
    local packet_loss=""

    if [ "$is_windows" = true ]; then
        # Windows format: Extract from the statistics line (3rd line from bottom)
        # This avoids matching "32 bytes" and gets the actual packet loss percentage
        packet_loss=$(echo "$ping_output" | tail -3 | head -1 | grep -o '[0-9]\+%' | grep -o '[0-9]\+')
    else
        # Unix format: "X% packet loss"
        packet_loss=$(echo "$ping_output" | grep -o '[0-9]\+% packet loss' | grep -o '[0-9]\+' | head -1)
    fi

    # Extract average latency
    local avg_latency=""

    if [ "$is_windows" = true ]; then
        # Windows format: Look for "= XXXms" pattern (average is usually the last one)
        avg_latency=$(echo "$ping_output" | grep -o '= [0-9]\+ms' | tail -1 | grep -o '[0-9]\+')
    else
        # Unix formats
        if echo "$ping_output" | grep -q "avg = "; then
            avg_latency=$(echo "$ping_output" | grep -o 'avg = [0-9.]\+' | grep -o '[0-9.]\+' | head -1)
        elif echo "$ping_output" | grep -q "rtt min/avg/max"; then
            avg_latency=$(echo "$ping_output" | grep -o 'rtt min/avg/max[^=]*= [0-9.]\+/[0-9.]\+' | grep -o '/[0-9.]\+' | head -1 | tr -d '/')
        fi
    fi

    if [ -z "$packet_loss" ]; then
        echo -e "${YELLOW}⚠ Cannot determine network quality (ping output format unknown)${NC}"
        return 1  # fair (unknown)
    fi

    echo -e "  Packet loss: ${packet_loss}%"
    [ -n "$avg_latency" ] && echo -e "  Average latency: ${avg_latency}ms"

    # Evaluate quality
    if [ "$packet_loss" -eq 0 ] && [ -n "$avg_latency" ] && [ "${avg_latency%.*}" -lt 200 ]; then
        echo -e "${GREEN}✓ Network quality: Good${NC}"
        return 0  # good
    elif [ "$packet_loss" -lt 30 ]; then
        echo -e "${YELLOW}⚠ Network quality: Fair (some packet loss)${NC}"
        return 1  # fair
    else
        echo -e "${RED}✗ Network quality: Poor (high packet loss)${NC}"
        return 2  # poor
    fi
}

# Function to optimize git timeout settings
optimize_git_timeout() {
    echo -e "${BLUE}Optimizing Git timeout settings...${NC}"

    # Save original settings
    ORIGINAL_LOW_SPEED_LIMIT=$(git config --global --get http.lowSpeedLimit 2>/dev/null || echo "")
    ORIGINAL_LOW_SPEED_TIME=$(git config --global --get http.lowSpeedTime 2>/dev/null || echo "")

    # Set reasonable timeout parameters
    git config --global http.lowSpeedLimit 1000    # 1KB/s minimum speed
    git config --global http.lowSpeedTime 30       # 30 seconds timeout

    echo -e "${GREEN}✓ Timeout optimized (1KB/s for 30s)${NC}"
}

# Function to restore git timeout settings
restore_git_timeout() {
    echo -e "${BLUE}Restoring Git timeout settings...${NC}"

    if [ -n "$ORIGINAL_LOW_SPEED_LIMIT" ]; then
        git config --global http.lowSpeedLimit "$ORIGINAL_LOW_SPEED_LIMIT"
    else
        git config --global --unset http.lowSpeedLimit 2>/dev/null || true
    fi

    if [ -n "$ORIGINAL_LOW_SPEED_TIME" ]; then
        git config --global http.lowSpeedTime "$ORIGINAL_LOW_SPEED_TIME"
    else
        git config --global --unset http.lowSpeedTime 2>/dev/null || true
    fi

    echo -e "${GREEN}✓ Timeout settings restored${NC}"
}

# Function to check if SSH is available
check_ssh_available() {
    # Check if SSH keys exist
    if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ] && [ ! -f ~/.ssh/id_ecdsa ]; then
        return 1
    fi

    # Check if remote supports SSH
    local remote_url=$(git remote get-url origin 2>/dev/null)
    if [ -z "$remote_url" ]; then
        return 1
    fi

    # If already using SSH, return success
    if echo "$remote_url" | grep -q "^git@"; then
        return 0
    fi

    # If using HTTPS, check if we can convert to SSH
    if echo "$remote_url" | grep -q "^https://github.com"; then
        return 0
    fi

    return 1
}

# Function to suggest SSH switch
suggest_ssh_switch() {
    echo -e "\n${YELLOW}=== Alternative: Try SSH instead of HTTPS ===${NC}"

    local remote_url=$(git remote get-url origin 2>/dev/null)

    if echo "$remote_url" | grep -q "^https://github.com"; then
        # Convert HTTPS URL to SSH
        local ssh_url=$(echo "$remote_url" | sed 's|https://github.com/|git@github.com:|')
        echo -e "${BLUE}You can switch to SSH with:${NC}"
        echo -e "  git remote set-url origin $ssh_url"
        echo -e "  git push"
    elif [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ] || [ -f ~/.ssh/id_ecdsa ]; then
        echo -e "${BLUE}SSH keys detected. Consider using SSH remote URL.${NC}"
    else
        echo -e "${BLUE}To use SSH, first generate an SSH key:${NC}"
        echo -e "  ssh-keygen -t ed25519 -C \"your_email@example.com\""
        echo -e "  # Add the key to GitHub: https://github.com/settings/keys"
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

# Function to try push with retry
try_push_with_retry() {
    local method=$1  # "proxy" or "direct"
    local retry_count=0

    while [ $retry_count -lt $MAX_RETRIES ]; do
        retry_count=$((retry_count + 1))

        if [ $retry_count -gt 1 ]; then
            local delay=$((RETRY_BASE_DELAY * retry_count))
            echo -e "${YELLOW}Retry $retry_count/$MAX_RETRIES after ${delay}s...${NC}"
            sleep $delay
        else
            echo -e "${BLUE}Attempt $retry_count/$MAX_RETRIES${NC}"
        fi

        if git push; then
            echo -e "\n${GREEN}✓ Push successful!${NC}"
            return 0
        else
            echo -e "${RED}✗ Attempt $retry_count failed${NC}"
        fi
    done

    echo -e "${RED}✗ All $MAX_RETRIES attempts failed${NC}"
    return 1
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

    # Count commits to push
    local commits_ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "unknown")
    echo -e "${BLUE}Commits to push: $commits_ahead${NC}\n"

    # Step 1: Test network quality
    echo -e "${YELLOW}Step 1: Network Quality Assessment${NC}\n"
    test_network_quality
    local network_quality=$?

    if [ $network_quality -eq 2 ]; then
        echo -e "\n${RED}⚠ Network quality is poor. Push may fail.${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Push cancelled. Your commits are safe locally.${NC}"
            exit 0
        fi
    fi

    echo ""

    # Step 2: Optimize Git timeout settings
    echo -e "${YELLOW}Step 2: Optimizing Git Settings${NC}\n"
    optimize_git_timeout
    echo ""

    # Step 3: Test connectivity
    echo -e "${YELLOW}Step 3: Testing Connectivity${NC}\n"

    PROXY_WORKS=false
    DIRECT_WORKS=false

    if test_connectivity "true"; then
        PROXY_WORKS=true
    fi

    if test_connectivity "false"; then
        DIRECT_WORKS=true
    fi

    echo ""

    # Step 4: Try to push with retry
    echo -e "${YELLOW}Step 4: Pushing to Remote${NC}\n"

    PUSH_SUCCESS=false

    # Try proxy first if it works
    if [ "$PROXY_WORKS" = "true" ]; then
        echo -e "${BLUE}Using proxy method${NC}"
        set_proxy "$DEFAULT_PROXY"
        if try_push_with_retry "proxy"; then
            PUSH_SUCCESS=true
        fi
    fi

    # Try direct connection if proxy failed or wasn't available
    if [ "$PUSH_SUCCESS" = "false" ] && [ "$DIRECT_WORKS" = "true" ]; then
        echo -e "\n${BLUE}Using direct connection method${NC}"
        unset_proxy
        if try_push_with_retry "direct"; then
            PUSH_SUCCESS=true
        fi
    fi

    # Restore settings
    echo ""
    restore_git_timeout
    restore_proxy "$ORIGINAL_PROXY"

    # Check result
    if [ "$PUSH_SUCCESS" = "true" ]; then
        echo -e "\n${GREEN}✓✓✓ Push completed successfully! ✓✓✓${NC}"
        exit 0
    fi

    # All methods failed
    echo -e "\n${RED}=== Push Failed ===${NC}"
    echo -e "${YELLOW}All push attempts failed. Your commits are safe locally.${NC}\n"

    # Suggest SSH alternative
    if check_ssh_available; then
        suggest_ssh_switch
    fi

    echo -e "\n${YELLOW}Other options:${NC}"
    echo -e "  1. Wait for better network conditions and try: ${BLUE}npm run push${NC}"
    echo -e "  2. Check if GitHub is accessible: ${BLUE}https://www.githubstatus.com/${NC}"
    echo -e "  3. Try pushing from a different network"

    exit 1
}

# Run main function
main "$@"
