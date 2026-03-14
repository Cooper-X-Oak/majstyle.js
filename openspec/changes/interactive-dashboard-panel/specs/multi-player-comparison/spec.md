# Multi-Player Comparison Specification

## ADDED Requirements

### Requirement: Comparison list displays added players
The system SHALL display a list of players currently selected for comparison, showing nickname and style title.

#### Scenario: Display player in list
- **WHEN** player is added to comparison list
- **THEN** list shows player's nickname and style title (e.g., "狂战士")

#### Scenario: Display player count
- **WHEN** comparison list is displayed
- **THEN** header shows current count and maximum (e.g., "对比列表 (2/4)")

#### Scenario: Display empty state
- **WHEN** comparison list is empty
- **THEN** list shows message "暂无对比玩家，请搜索添加"

### Requirement: Comparison list supports maximum 4 players
The system SHALL limit the comparison list to a maximum of 4 players.

#### Scenario: Allow adding up to 4 players
- **WHEN** comparison list has less than 4 players
- **THEN** user can add more players

#### Scenario: Prevent adding 5th player
- **WHEN** comparison list already has 4 players
- **THEN** add button is disabled and shows message "对比列表已满"

#### Scenario: Enable adding after removal
- **WHEN** user removes player from full list (4 players)
- **THEN** add button becomes enabled again

### Requirement: User can remove players from list
The system SHALL provide a remove button (×) for each player in the comparison list.

#### Scenario: Remove player from list
- **WHEN** user clicks × button next to player
- **THEN** player is removed from list and charts update

#### Scenario: Confirm removal for last player
- **WHEN** user removes last player from list
- **THEN** charts are cleared and empty state is shown

#### Scenario: Maintain order after removal
- **WHEN** user removes player from middle of list
- **THEN** remaining players maintain their relative order

### Requirement: Comparison list shows player color indicator
The system SHALL display a color indicator next to each player matching their chart color.

#### Scenario: Display color indicator
- **WHEN** player is in comparison list
- **THEN** colored circle or square appears next to player name matching chart color

#### Scenario: Update color when order changes
- **WHEN** players are reordered in list
- **THEN** color indicators update to match new chart colors

### Requirement: Comparison list is scrollable
The system SHALL make the comparison list scrollable when content exceeds available space.

#### Scenario: Scroll list with many players
- **WHEN** comparison list has 4 players and limited vertical space
- **THEN** list becomes scrollable with scrollbar

#### Scenario: Maintain visibility of controls
- **WHEN** list is scrolled
- **THEN** header and controls remain visible at top

### Requirement: Comparison triggers chart updates
The system SHALL automatically update all charts when comparison list changes.

#### Scenario: Update charts on player add
- **WHEN** player is added to comparison list
- **THEN** radar chart and bar chart update to include new player

#### Scenario: Update charts on player remove
- **WHEN** player is removed from comparison list
- **THEN** radar chart and bar chart update to exclude removed player

#### Scenario: Debounce rapid changes
- **WHEN** user rapidly adds/removes multiple players
- **THEN** charts update only after 300ms of inactivity to avoid flickering

### Requirement: Comparison highlights maximum differences
The system SHALL highlight the metrics with largest differences between players.

#### Scenario: Highlight top 3 differences
- **WHEN** comparison includes 2+ players
- **THEN** system highlights top 3 metrics with largest standard deviation

#### Scenario: Display difference indicator
- **WHEN** metric is highlighted
- **THEN** metric row shows "⚠️" icon and yellow background

#### Scenario: Show difference magnitude
- **WHEN** user hovers over highlighted metric
- **THEN** tooltip shows standard deviation value and range (min-max)

### Requirement: Comparison displays detailed stats table
The system SHALL provide a detailed statistics table view showing all metrics for all players side-by-side.

#### Scenario: Display stats table
- **WHEN** user switches to "详细数据" tab
- **THEN** table shows all metrics in rows and players in columns

#### Scenario: Highlight best value in each row
- **WHEN** stats table is displayed
- **THEN** best value in each metric row is highlighted in green

#### Scenario: Highlight worst value in each row
- **WHEN** stats table is displayed
- **THEN** worst value in each metric row is highlighted in red

#### Scenario: Sort table by metric
- **WHEN** user clicks metric name in table header
- **THEN** table rows are sorted by that metric in descending order

### Requirement: Comparison generates play suggestions
The system SHALL generate tactical suggestions based on player style differences.

#### Scenario: Generate suggestions for aggressive opponent
- **WHEN** opponent has high 进攻意愿 (>55)
- **THEN** system suggests "对手进攻性强，注意防守和牌"

#### Scenario: Generate suggestions for defensive opponent
- **WHEN** opponent has low 放铳率 (<12%)
- **THEN** system suggests "对手防守严密，可以尝试更激进的打法"

#### Scenario: Generate suggestions for riichi-heavy opponent
- **WHEN** opponent has high 立直率 (>25%)
- **THEN** system suggests "对手立直率高，注意追立和防守"

#### Scenario: Display suggestions in panel
- **WHEN** suggestions are generated
- **THEN** suggestions appear in dedicated section below comparison list

### Requirement: Comparison supports exporting data
The system SHALL allow users to copy comparison data to clipboard in text format.

#### Scenario: Copy comparison summary
- **WHEN** user clicks "复制对比" button
- **THEN** formatted text summary is copied to clipboard

#### Scenario: Include all player stats in export
- **WHEN** comparison data is exported
- **THEN** export includes all metrics for all players in comparison list

#### Scenario: Format export for readability
- **WHEN** comparison data is exported
- **THEN** text is formatted with aligned columns and clear labels

### Requirement: Comparison persists across sessions
The system SHALL save comparison list to localStorage and restore on next session.

#### Scenario: Save comparison list on change
- **WHEN** comparison list is modified
- **THEN** current list is saved to localStorage

#### Scenario: Restore comparison list on load
- **WHEN** panel is opened in new session
- **THEN** comparison list is restored from localStorage

#### Scenario: Clear stale data
- **WHEN** restoring comparison list
- **THEN** players with data older than 24 hours are removed and fresh data is fetched
