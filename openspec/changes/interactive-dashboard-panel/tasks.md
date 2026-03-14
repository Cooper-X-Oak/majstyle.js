# Implementation Tasks

## 1. Project Setup and Infrastructure

- [x] 1.1 Create new script file `雀魂数据分析面板Pro.user.js` based on existing script
- [x] 1.2 Add Chart.js CDN dependency to Tampermonkey @require header
- [x] 1.3 Add Chart.js load timeout detection (10 seconds) with fallback message
- [x] 1.4 Set up namespace structure for DashboardPanel modules (UI, Search, Comparison, Chart, Cache, Storage)
- [x] 1.5 Implement EventBus for inter-module communication (on/emit methods)
- [x] 1.6 Create DashboardState object with initial state (isOpen, position, size, compareList, currentChart, cache)
- [x] 1.7 Add ResizeObserver polyfill detection and fallback to window.resize

## 2. Core Panel UI Framework (P0)

- [x] 2.1 Implement createPanel() function to generate panel DOM structure
- [x] 2.2 Add panel title bar with title text, minimize/maximize/close buttons
- [x] 2.3 Implement panel content area with tab navigation (雷达图/柱状图/详细数据)
- [x] 2.4 Style panel with semi-transparent background (rgba(20, 20, 30, 0.95))
- [x] 2.5 Set panel z-index to 9999 to appear above game UI
- [x] 2.6 Create floating trigger button in bottom-right corner
- [x] 2.7 Implement togglePanel() function to show/hide panel
- [x] 2.8 Add keyboard shortcut listener for Ctrl+Shift+D
- [x] 2.9 Implement panel open/close with position save to localStorage

### 2.1 Panel Dragging

- [x] 2.10 Implement mousedown handler on title bar to start drag mode
- [x] 2.11 Implement mousemove handler to update panel position during drag
- [x] 2.12 Implement mouseup handler to end drag mode and save position
- [x] 2.13 Prevent dragging when mousedown is on content area (not title bar)
- [x] 2.14 Add visual feedback during drag (cursor change)

### 2.2 Panel Resizing

- [x] 2.15 Add resize handle element to bottom-right corner of panel
- [x] 2.16 Implement mousedown handler on resize handle to start resize mode
- [x] 2.17 Implement mousemove handler to update panel size during resize
- [x] 2.18 Enforce minimum size constraint (600x400px)
- [x] 2.19 Enforce maximum size constraint (1200x800px)
- [x] 2.20 Implement mouseup handler to end resize mode and save size
- [x] 2.21 Trigger chart resize on panel resize using ResizeObserver

### 2.3 Panel Minimize/Maximize

- [x] 2.22 Implement minimize button click handler to collapse panel to title bar only
- [x] 2.23 Implement restore button to expand minimized panel to previous size
- [x] 2.24 Implement maximize button to expand panel to maximum size (1200x800px)
- [x] 2.25 Implement restore button to return maximized panel to previous size
- [x] 2.26 Save minimize/maximize state to localStorage

### 2.4 User Preferences Storage

- [x] 2.27 Implement savePreferences() to save position, size, state to localStorage
- [x] 2.28 Implement loadPreferences() to restore saved preferences on panel open
- [x] 2.29 Use default values (center, 800x600px) for first-time users
- [x] 2.30 Add preference key namespacing to avoid conflicts

**Acceptance Criteria**: Panel can be opened/closed, dragged, resized, minimized/maximized, and remembers user preferences

## 3. Player Search Module (P0)

### 3.1 Search UI

- [x] 3.1 Create search input field in panel header
- [x] 3.2 Add search button next to input field
- [x] 3.3 Add "添加当前对局" button next to search button
- [x] 3.4 Create search results container below search controls
- [x] 3.5 Style search results with player info cards

### 3.2 Search by Player ID

- [x] 3.6 Implement searchPlayer() function to handle search requests
- [x] 3.7 Validate input is numeric for player ID search
- [x] 3.8 Call existing getPlayerStats() API function
- [x] 3.9 Display error message for invalid or non-existent player ID
- [x] 3.10 Display error message for empty input

### 3.3 Search by Nickname

- [x] 3.11 Implement nickname search API call (if supported by API)
- [x] 3.12 Implement fuzzy matching for partial nickname matches
- [x] 3.13 Display list of matching players for user selection
- [x] 3.14 Display "未找到匹配的玩家" message when no matches

### 3.4 Add Current Game Players

- [x] 3.15 Implement addCurrentPlayers() function
- [x] 3.16 Access game player data from gameWindow.view.DesktopMgr.Inst.player_datas
- [x] 3.17 Check if user is in active game, display error if not
- [x] 3.18 Add all 4 players to comparison list
- [x] 3.19 Skip players already in comparison list (no duplicates)

### 3.5 Search Results Display

- [x] 3.20 Implement displaySearchResult() to render player info card
- [x] 3.21 Display player nickname, account ID, rank badge
- [x] 3.22 Display total game count and last active time
- [x] 3.23 Display style title and characteristic tags (if data sufficient)
- [x] 3.24 Display warning "数据不足（少于50局）" for insufficient data
- [x] 3.25 Add "添加到对比" button to search result card

### 3.6 Add to Comparison

- [x] 3.26 Implement add button click handler
- [x] 3.27 Check comparison list size, prevent adding if already 4 players
- [x] 3.28 Add player to DashboardState.compareList
- [x] 3.29 Emit 'player:added' event via EventBus
- [x] 3.30 Change button state to "已添加" and disable
- [x] 3.31 Display "对比列表已满" message when list is full

### 3.7 Keyboard Support

- [x] 3.32 Add Enter key listener on search input to trigger search
- [x] 3.33 Add Escape key listener to clear search input

### 3.8 Error Handling

- [x] 3.34 Handle network timeout (10 seconds) with "请求超时" message
- [x] 3.35 Handle API rate limiting (429) with "请求过于频繁" message
- [x] 3.36 Handle server error (500) with "服务器错误" message

**Acceptance Criteria**: Can search players by ID/nickname, add current game players, display results, and add to comparison list

## 4. Data Cache Module (P0)

- [x] 4.1 Implement DataCache.set() to store player data with timestamp
- [x] 4.2 Implement DataCache.get() to retrieve cached data
- [x] 4.3 Check cache TTL (5 minutes) and return null if expired
- [x] 4.4 Implement DataCache.clear() to remove expired entries
- [x] 4.5 Implement cache size limit (50 players max)
- [x] 4.6 Remove oldest entries when cache exceeds limit
- [x] 4.7 Integrate cache check into searchPlayer() before API call
- [x] 4.8 Display cache timestamp "数据缓存于 X分钟前" in search results
- [x] 4.9 Implement manual refresh button to bypass cache for single player
- [x] 4.10 Implement "刷新全部" button to clear cache and refetch all comparison list players

**Acceptance Criteria**: Player data is cached for 5 minutes, cache size is limited to 50 players, manual refresh works

## 5. Radar Chart Visualization (P0)

### 5.1 Chart Setup

- [x] 5.1 Create chart canvas element in panel content area
- [x] 5.2 Initialize Chart.js radar chart instance
- [x] 5.3 Configure chart with 6 dimension labels (立直率, 副露率, 和牌率, 防守力, 平均打点, 进攻意愿)
- [x] 5.4 Set chart scale to 0-100 with 50 as baseline

### 5.2 Data Normalization

- [x] 5.5 Implement normalizeData() function
- [x] 5.6 Normalize percentage dimensions: (actual / baseline) × 50
- [x] 5.7 Normalize inverted dimension (防守力): (1 - 放铳率/baseline放铳率) × 50 + 50
- [x] 5.8 Normalize score dimension (平均打点): (actual / baseline) × 50
- [x] 5.9 Calculate composite dimension (进攻意愿): ((立直率+副露率) / (baseline立直率+baseline副露率)) × 50

### 5.3 Multi-Player Display

- [x] 5.10 Implement renderRadarChart() function
- [x] 5.11 Create dataset for each player in comparison list
- [x] 5.12 Assign colors from PLAYER_COLORS array (red, blue, teal, yellow)
- [x] 5.13 Add baseline dataset with gray dashed line
- [x] 5.14 Use highest rank baseline when players have different ranks
- [x] 5.15 Use default baseline (杰3) for unknown ranks

### 5.4 Chart Updates

- [x] 5.16 Listen to 'player:added' event to update chart
- [x] 5.17 Listen to 'player:removed' event to update chart
- [x] 5.18 Implement updateChart() to modify existing chart data
- [x] 5.19 Use chart.update('none') for instant update without animation
- [x] 5.20 Implement debounce wrapper (300ms) for rapid changes

### 5.5 Chart Interactivity

- [x] 5.21 Configure chart legend with player names and colors
- [x] 5.22 Add legend click handler to toggle player visibility
- [x] 5.23 Configure tooltips to show player name, dimension, normalized value
- [x] 5.24 Add actual value to tooltip (percentage or score)
- [x] 5.25 Implement ResizeObserver to resize chart when panel resizes

### 5.6 Error Handling

- [x] 5.26 Handle missing dimension data by showing partial chart
- [x] 5.27 Display "数据不完整" warning for incomplete data
- [x] 5.28 Skip players with less than 50 games and display "数据不足" message

**Acceptance Criteria**: Radar chart displays 6 dimensions for 2-4 players with baseline, updates instantly, and is responsive

## 6. Bar Chart Visualization (P0)

### 6.1 Chart Setup

- [x] 6.1 Create chart canvas element in panel content area (separate tab)
- [x] 6.2 Initialize Chart.js horizontal bar chart instance
- [x] 6.3 Configure chart with 5 metric labels (立直率, 副露率, 和牌率, 放铳率, 平均打点)

### 6.2 Multi-Player Display

- [x] 6.4 Implement renderBarChart() function
- [x] 6.5 Create grouped bars for each metric showing all players side-by-side
- [x] 6.6 Use same player colors as radar chart for consistency
- [x] 6.7 Add baseline reference line (vertical dashed gray) for each metric

### 6.3 Color Coding by Deviation

- [x] 6.8 Calculate deviation from baseline for each metric
- [x] 6.9 Color bars red for above baseline (intensity based on magnitude)
- [x] 6.10 Color bars green for below baseline (intensity based on magnitude)
- [x] 6.11 Color bars gray for near baseline (within ±2%)
- [x] 6.12 Use deeper colors for deviations >2× threshold

### 6.4 Value Labels

- [x] 6.13 Display actual value on bar (inside if bar >50px, outside if <50px)
- [x] 6.14 Format percentage values as "XX.X%" with 1 decimal
- [x] 6.15 Format 平均打点 as integer with no decimals

### 6.5 Chart Scaling

- [x] 6.16 Auto-scale x-axis to fit all player values plus 10% padding
- [x] 6.17 Include baseline value in scale calculation
- [x] 6.18 Use independent scale for each metric row

### 6.6 Chart Interactivity

- [x] 6.19 Configure chart legend with player names and colors
- [x] 6.20 Add legend click handler to toggle player visibility
- [x] 6.21 Configure tooltips to show player, metric, actual value, deviation
- [x] 6.22 Format deviation as "+X.X%" or "-X.X%" in tooltip
- [x] 6.23 Implement ResizeObserver to resize chart when panel resizes

### 6.7 Chart Updates

- [x] 6.24 Listen to 'player:added' event to update chart
- [x] 6.25 Listen to 'player:removed' event to update chart
- [x] 6.26 Use chart.update('none') for instant update without animation

### 6.8 Error Handling

- [x] 6.27 Handle missing metric data by showing partial chart
- [x] 6.28 Display "数据不完整" warning for incomplete data
- [x] 6.29 Skip players with less than 50 games

**Acceptance Criteria**: Bar chart displays 5 metrics for 2-4 players with color-coded deviations, baseline lines, and value labels

## 7. Multi-Player Comparison Module (P0)

### 7.1 Comparison List UI

- [ ] 7.1 Create comparison list container in panel sidebar
- [ ] 7.2 Display header with count "对比列表 (X/4)"
- [ ] 7.3 Display empty state message "暂无对比玩家，请搜索添加"
- [ ] 7.4 Make list scrollable when content exceeds space

### 7.2 Player List Items

- [ ] 7.5 Render player item with color indicator circle
- [ ] 7.6 Display player nickname and style title
- [ ] 7.7 Add remove button (×) to each player item
- [ ] 7.8 Update color indicators when list order changes

### 7.3 List Management

- [ ] 7.9 Implement addPlayer() to add player to compareList
- [ ] 7.10 Check list size and prevent adding 5th player
- [ ] 7.11 Implement removePlayer() to remove player from compareList
- [ ] 7.12 Emit 'player:removed' event via EventBus
- [ ] 7.13 Maintain player order after removal
- [ ] 7.14 Clear charts when last player is removed

### 7.4 Chart Integration

- [ ] 7.15 Listen to comparison list changes and trigger chart updates
- [ ] 7.16 Debounce rapid changes (300ms) to avoid flickering
- [ ] 7.17 Update both radar and bar charts on list change

### 7.5 Difference Highlighting

- [ ] 7.18 Calculate standard deviation for each metric across players
- [ ] 7.19 Identify top 3 metrics with largest standard deviation
- [ ] 7.20 Highlight these metrics with ⚠️ icon and yellow background
- [ ] 7.21 Add tooltip on hover showing deviation value and range (min-max)

### 7.6 Detailed Stats Table

- [ ] 7.22 Create detailed stats table view (separate tab)
- [ ] 7.23 Display all metrics in rows, players in columns
- [ ] 7.24 Highlight best value in each row (green)
- [ ] 7.25 Highlight worst value in each row (red)
- [ ] 7.26 Implement table sorting by clicking metric name header

### 7.7 Play Suggestions

- [ ] 7.27 Implement suggestion generation based on player styles
- [ ] 7.28 Generate suggestion for high 进攻意愿 (>55): "对手进攻性强，注意防守和牌"
- [ ] 7.29 Generate suggestion for low 放铳率 (<12%): "对手防守严密，可以尝试更激进的打法"
- [ ] 7.30 Generate suggestion for high 立直率 (>25%): "对手立直率高，注意追立和防守"
- [ ] 7.31 Display suggestions in dedicated section below comparison list

### 7.8 Data Export

- [ ] 7.32 Add "复制对比" button
- [ ] 7.33 Implement copyComparison() to format data as text
- [ ] 7.34 Include all metrics for all players in export
- [ ] 7.35 Format text with aligned columns and clear labels
- [ ] 7.36 Copy formatted text to clipboard using navigator.clipboard API

### 7.9 Persistence

- [ ] 7.37 Save comparison list to localStorage on change
- [ ] 7.38 Restore comparison list from localStorage on panel open
- [ ] 7.39 Clear players with data older than 24 hours on restore
- [ ] 7.40 Fetch fresh data for restored players

**Acceptance Criteria**: Comparison list manages up to 4 players, highlights differences, shows detailed stats, generates suggestions, and persists across sessions

## 8. API Request Queue and Rate Limiting (P1)

- [ ] 8.1 Implement request queue to manage concurrent API calls
- [ ] 8.2 Limit concurrent requests to maximum 3
- [ ] 8.3 Queue additional requests when limit is reached
- [ ] 8.4 Process queued requests as active requests complete
- [ ] 8.5 Display loading spinner for each player being fetched
- [ ] 8.6 Implement exponential backoff retry for rate limiting (429)
- [ ] 8.7 Retry with 1s, 2s, 4s, 8s delays (max 3 retries)
- [ ] 8.8 Display "请求过于频繁，请稍后再试" after exhausting retries
- [ ] 8.9 Handle partial batch failure (show errors for failed, data for successful)

**Acceptance Criteria**: API requests are queued, limited to 3 concurrent, and retry with exponential backoff on rate limiting

## 9. Performance Optimization (P1)

- [ ] 9.1 Implement debounce utility function (300ms default)
- [ ] 9.2 Apply debounce to chart update functions
- [ ] 9.3 Apply debounce to search input handler
- [ ] 9.4 Use chart.update('none') instead of chart.destroy() + new Chart()
- [ ] 9.5 Implement chart.destroy() when panel is closed to free memory
- [ ] 9.6 Recreate chart when panel is reopened
- [ ] 9.7 Limit cache size to 50 players with LRU eviction
- [ ] 9.8 Add performance timing logs for debugging (optional)

**Acceptance Criteria**: Panel opens <200ms, search responds <500ms, charts render <300ms, memory usage <20MB

## 10. Testing and Bug Fixes (P1)

### 10.1 Unit Testing (Manual)

- [ ] 10.1 Test data normalization function with various inputs
- [ ] 10.2 Test cache expiration logic (5 minute TTL)
- [ ] 10.3 Test cache size limit (50 players)
- [ ] 10.4 Test EventBus on/emit mechanism

### 10.2 Integration Testing

- [ ] 10.5 Test search → cache → display flow
- [ ] 10.6 Test add player → update charts flow
- [ ] 10.7 Test remove player → update charts flow
- [ ] 10.8 Test drag → save position → restore flow
- [ ] 10.9 Test resize → save size → restore flow
- [ ] 10.10 Test minimize/maximize state persistence

### 10.3 Performance Testing

- [ ] 10.11 Measure panel open time (<200ms target)
- [ ] 10.12 Measure search response time (<500ms target)
- [ ] 10.13 Measure chart render time (<300ms target)
- [ ] 10.14 Measure memory usage (<20MB target)
- [ ] 10.15 Test with 4 players in comparison list (worst case)

### 10.4 Error Handling Testing

- [ ] 10.16 Test with invalid player ID
- [ ] 10.17 Test with non-existent player
- [ ] 10.18 Test with player having <50 games
- [ ] 10.19 Test with network timeout
- [ ] 10.20 Test with API rate limiting (429)
- [ ] 10.21 Test with API server error (500)
- [ ] 10.22 Test Chart.js CDN load failure

### 10.5 Browser Compatibility Testing

- [ ] 10.23 Test on Chrome 90+
- [ ] 10.24 Test on Edge 90+
- [ ] 10.25 Test on Firefox 88+
- [ ] 10.26 Test ResizeObserver fallback on older browsers

### 10.6 Integration with Existing Script

- [ ] 10.27 Test that new panel doesn't conflict with existing auto-display
- [ ] 10.28 Verify shared cache works between both features
- [ ] 10.29 Verify no DOM ID conflicts
- [ ] 10.30 Test both features running simultaneously

**Acceptance Criteria**: All test cases pass, performance targets met, no conflicts with existing features

## 11. Documentation and Polish (P1)

- [ ] 11.1 Add code comments for complex functions
- [ ] 11.2 Update README.md with new panel features
- [ ] 11.3 Add usage instructions (keyboard shortcut, floating button)
- [ ] 11.4 Document browser requirements (Chrome/Edge 90+)
- [ ] 11.5 Add screenshots of panel UI to README
- [ ] 11.6 Create CHANGELOG entry for new version
- [ ] 11.7 Add first-time user guide tooltip (optional)
- [ ] 11.8 Update version number in script header
- [ ] 11.9 Update script description in Tampermonkey header

**Acceptance Criteria**: Documentation is complete and accurate, code is well-commented

## 12. Release Preparation

- [ ] 12.1 Final code review and cleanup
- [ ] 12.2 Remove debug console.log statements
- [ ] 12.3 Test installation from scratch in clean browser profile
- [ ] 12.4 Verify all features work in production environment
- [ ] 12.5 Create release notes summarizing new features
- [ ] 12.6 Tag release version in version control (if applicable)
- [ ] 12.7 Publish updated script to distribution channel

**Acceptance Criteria**: Script is production-ready and can be installed by users
