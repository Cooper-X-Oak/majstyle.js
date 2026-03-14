# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tampermonkey userscript for real-time opponent style analysis in Mahjong Soul (雀魂), specifically for 4-player mahjong in Gold/Jade rooms. The script reads player IDs from the game's exposed window objects and fetches statistics from the Amae Koromo public API to display style analysis overlays.

**Key Constraint**: This project must remain compliant with Mahjong Soul's anti-cheat system. Never suggest modifications that:

- Parse WebSocket communications
- Decode protobuf protocols
- Inject code that modifies game behavior
- Directly interact with Mahjong Soul servers

The script only reads from `window.view.DesktopMgr.Inst.player_datas` (publicly exposed game data) and calls external APIs.

## Build System

**Build Commands**:

```bash
npm run build    # Production build
npm run watch    # Development mode with auto-rebuild
npm run dev      # Alias for watch
```

**Build Process**:

- Entry point: `src/main.js`
- Output: `dist/雀魂金玉四麻风格分析助手-v{version}.user.js`
- Rollup bundles ES6+ modules into a single ES5-compatible userscript
- Babel transpiles to IE11 compatibility
- Userscript metadata is generated from `rollup.config.js` (lines 25-36)

**Version Management**: When updating versions, modify both:

1. `rollup.config.js` - metadata.version (line 28) and output.file (line 41)
2. `package.json` - version field (line 3)

## Architecture

**Module Structure**:

```
src/
├── main.js                    # Entry point, polling loop, keyboard shortcuts
├── game/
│   ├── game-bridge.js         # Access to window.view/GameMgr objects
│   └── player-processor.js    # Process individual player data
├── api/
│   ├── client.js              # GM_xmlhttpRequest wrapper
│   └── amae-koromo.js         # Amae Koromo API endpoints
├── analysis/
│   ├── style-analyzer.js      # Style classification logic
│   └── advice-generator.js    # Generate tactical advice
├── ui/
│   ├── ui-manager.js          # UI lifecycle management
│   ├── player-info-card.js    # Player info card rendering
│   └── color-utils.js         # Color coding for deviations
├── config/
│   ├── constants.js           # API config, thresholds, baselines
│   └── metadata.js            # Userscript metadata
└── utils/
    └── html-escape.js         # XSS prevention
```

**Data Flow**:

1. `main.js` polls `getPlayerDatas()` every 1s (after 2s initial delay)
2. When player IDs change, `processPlayer()` is called for each player
3. API requests fetch stats from Amae Koromo
4. `style-analyzer.js` classifies players into 9 main titles + 11 trait tags
5. `player-info-card.js` renders semi-transparent overlay cards
6. Cards are positioned using `window.majstyleJS.playerUICounter`

**Key Game Objects**:

- `window.view.DesktopMgr.Inst.player_datas` - Array of player objects with `account_id`, `nickname`, etc.
- `window.GameMgr.Inst.account_id` - Current user's account ID
- Access via `getGameWindow()` which handles `unsafeWindow` vs `window`

**API Integration**:

- Base URL: `https://5-data.amae-koromo.com/api/v2/pl4`
- Endpoints: `/player_stats/{id}/{start}/{end}`, `/player_extended_stats/{id}/{start}/{end}`
- Mode: `16` (4-player ranked), Tag: `12,13,14,15,16,17` (Gold/Jade rooms)
- Start time: `1609459200000` (2021-01-01)

## Development Guidelines

**Code Style**:

- Use ES6+ syntax in `src/`, Babel handles transpilation
- Use `var` for function-scoped variables (ES5 compatibility target)
- Use `function() {}` syntax, not arrow functions (for IE11)
- Always use `'use strict';` in IIFE wrappers
- Avoid external runtime dependencies (Chart.js will be CDN-loaded for dashboard feature)

**Security**:

- Always escape user input with `htmlEscape()` before rendering
- Use `GM_xmlhttpRequest` for cross-origin requests (not fetch/XMLHttpRequest)
- Never expose sensitive data in console logs

**UI Conventions**:

- Semi-transparent overlays: `background: rgba(0, 0, 0, 0.85)`
- Color coding: Red (above average), Green (below average), intensity by deviation
- Position cards using `window.majstyleJS.playerUICounter` to avoid overlap
- Use `z-index: 10000` for overlays

**Testing**:

- Manual testing in Mahjong Soul game environment
- Test with Ctrl+Alt+E keyboard shortcut to explore game objects and API data
- Verify in both `game.maj-soul.com` and `game.maj-soul.net`

## Common Tasks

**Adding a new style classification**:

1. Update thresholds in `src/config/constants.js`
2. Modify classification logic in `src/analysis/style-analyzer.js`
3. Update color coding in `src/ui/color-utils.js` if needed
4. Rebuild and test in-game

**Adding a new API endpoint**:

1. Add endpoint function in `src/api/amae-koromo.js`
2. Update `API_CONFIG` in `src/config/constants.js` if needed
3. Call from `src/game/player-processor.js`

**Modifying UI layout**:

1. Edit rendering logic in `src/ui/player-info-card.js`
2. Update positioning logic in `src/ui/ui-manager.js`
3. Test with multiple players to ensure no overlap

## Git Push with Network Issues

When pushing to GitHub in environments with unstable network or proxy issues, use the enhanced `git-push-flexible.sh` script:

```bash
# Recommended: Use the automated script
npm run push

# Or run directly
bash tools/scripts/git-push-flexible.sh
```

**Features**:

1. **Network Quality Assessment**: Tests packet loss and latency to GitHub before attempting push
2. **Automatic Retry**: Retries up to 3 times with exponential backoff (2s, 4s, 6s delays)
3. **Timeout Optimization**: Temporarily sets reasonable Git timeout parameters (1KB/s for 30s)
4. **Multiple Methods**: Tries both proxy and direct connection automatically
5. **SSH Fallback Suggestion**: Recommends SSH if HTTPS fails and SSH keys are available

**How It Works**:

1. Checks if there are commits to push
2. Tests network quality (ping GitHub for packet loss and latency)
3. Warns if network is poor, asks for confirmation
4. Optimizes Git timeout settings temporarily
5. Tests both proxy and direct connectivity
6. Attempts push with retry mechanism (3 attempts per method)
7. Restores original Git settings
8. Suggests SSH alternative if all HTTPS methods fail

**Network Quality Levels**:

- **Good**: 0% packet loss, <200ms latency → proceeds automatically
- **Fair**: <30% packet loss → proceeds with warning
- **Poor**: ≥30% packet loss → asks for confirmation before proceeding

**Manual Fallback**:

If the script fails, you can try these manual approaches:

```bash
# Method 1: Try with current proxy settings first
git push

# Method 2: If proxy fails, temporarily disable and use direct connection
git config --global --unset http.proxy
git config --global --unset https.proxy
git push

# Method 3: Restore proxy after successful push
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897

# Method 4: Switch to SSH (more stable than HTTPS)
git remote set-url origin git@github.com:user/repo.git
git push
```

**Troubleshooting**:

- **Proxy timeout**: Script automatically tries direct connection
- **Direct connection blocked**: Script tries proxy if available
- **Both fail repeatedly**: Consider switching to SSH or waiting for better network
- **SSH alternative**: If you have SSH keys configured, the script will suggest switching to SSH remote URL

**Common Issues**:

- Proxy timeout: Switch to direct connection
- Direct connection blocked: Try proxy or wait for network stability
- Both fail: Commits are safe locally, push later when network is stable
- High packet loss: Wait for better network conditions or try from different network
git config --global --unset https.proxy
git push

# Method 3: Restore proxy after successful push
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897
```

**Strategy**:
1. Always try with current settings first
2. If connection fails, check if proxy is the issue (test with `curl`)
3. Temporarily disable proxy if it's not working
4. Push with direct connection
5. Restore original proxy settings after success

**Common Issues**:
- Proxy timeout: Switch to direct connection
- Direct connection blocked: Try proxy or wait for network stability
- Both fail: Commits are safe locally, push later when network is stable

## Important Notes

- The script uses a 1-second polling interval to detect player changes
- API requests are deduplicated using `processingCache` Map
- Cleanup handlers prevent memory leaks on page unload
- The project targets IE11 compatibility (Babel preset-env)
- All Chinese text should be preserved as-is (player-facing content)
- Version numbers in filenames must match metadata version
