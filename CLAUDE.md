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

## Important Notes

- The script uses a 1-second polling interval to detect player changes
- API requests are deduplicated using `processingCache` Map
- Cleanup handlers prevent memory leaks on page unload
- The project targets IE11 compatibility (Babel preset-env)
- All Chinese text should be preserved as-is (player-facing content)
- Version numbers in filenames must match metadata version
