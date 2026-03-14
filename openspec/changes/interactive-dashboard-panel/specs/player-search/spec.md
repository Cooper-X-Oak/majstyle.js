# Player Search Specification

## ADDED Requirements

### Requirement: User can search by player ID
The system SHALL allow users to search for players by entering their numeric account ID.

#### Scenario: Search with valid player ID
- **WHEN** user enters a valid numeric player ID and clicks search button
- **THEN** system fetches player data from API and displays search result

#### Scenario: Search with invalid player ID
- **WHEN** user enters an invalid player ID (non-numeric or non-existent)
- **THEN** system displays error message "玩家不存在或ID无效"

#### Scenario: Search with empty input
- **WHEN** user clicks search button with empty input field
- **THEN** system displays error message "请输入玩家ID或昵称"

### Requirement: User can search by player nickname
The system SHALL allow users to search for players by entering their nickname with fuzzy matching support.

#### Scenario: Search with exact nickname match
- **WHEN** user enters exact player nickname and clicks search button
- **THEN** system fetches player data and displays search result

#### Scenario: Search with partial nickname match
- **WHEN** user enters partial player nickname
- **THEN** system displays list of matching players for user to select

#### Scenario: Search with no nickname matches
- **WHEN** user enters nickname that matches no players
- **THEN** system displays message "未找到匹配的玩家"

### Requirement: User can add current game players
The system SHALL provide a button to quickly add all players from the current game session to the comparison list.

#### Scenario: Add current players in active game
- **WHEN** user clicks "添加当前对局" button while in an active game
- **THEN** system adds all 4 players (including self) to comparison list

#### Scenario: Add current players outside game
- **WHEN** user clicks "添加当前对局" button while not in a game
- **THEN** system displays message "当前不在对局中"

#### Scenario: Skip duplicate players
- **WHEN** user clicks "添加当前对局" and some players are already in comparison list
- **THEN** system only adds players not already in the list

### Requirement: Search results display player basic info
The system SHALL display player basic information in search results including nickname, ID, rank, total games, and last active time.

#### Scenario: Display complete player info
- **WHEN** search returns valid player data
- **THEN** system displays nickname, account ID, current rank badge, total game count, and last active timestamp

#### Scenario: Display player with insufficient data
- **WHEN** search returns player with less than 50 games
- **THEN** system displays basic info with warning "数据不足（少于50局）"

#### Scenario: Display player style tags
- **WHEN** search returns player with sufficient data (50+ games)
- **THEN** system displays player style title and characteristic tags

### Requirement: Search results have add to comparison button
The system SHALL provide an "添加到对比" button in search results to add the player to comparison list.

#### Scenario: Add player to comparison list
- **WHEN** user clicks "添加到对比" button in search result
- **THEN** player is added to comparison list and button changes to "已添加"

#### Scenario: Prevent adding when list is full
- **WHEN** user clicks "添加到对比" when comparison list already has 4 players
- **THEN** system displays message "对比列表已满（最多4个玩家）"

#### Scenario: Prevent adding duplicate player
- **WHEN** user clicks "添加到对比" for player already in comparison list
- **THEN** button shows "已添加" state and click has no effect

### Requirement: Search uses data cache
The system SHALL cache player search results for 5 minutes to reduce API requests.

#### Scenario: Use cached data for repeated search
- **WHEN** user searches for same player within 5 minutes
- **THEN** system returns cached data without making API request

#### Scenario: Refresh expired cache
- **WHEN** user searches for player after 5 minutes since last search
- **THEN** system makes new API request and updates cache

#### Scenario: Display cache indicator
- **WHEN** search result is from cache
- **THEN** system displays timestamp "数据缓存于 X分钟前"

### Requirement: Search handles API errors gracefully
The system SHALL display user-friendly error messages when API requests fail.

#### Scenario: Handle network timeout
- **WHEN** API request times out after 10 seconds
- **THEN** system displays message "请求超时，请检查网络连接"

#### Scenario: Handle API rate limiting
- **WHEN** API returns 429 status code
- **THEN** system displays message "请求过于频繁，请稍后再试"

#### Scenario: Handle server error
- **WHEN** API returns 500 status code
- **THEN** system displays message "服务器错误，请稍后再试"

### Requirement: Search input supports Enter key
The system SHALL trigger search when user presses Enter key in search input field.

#### Scenario: Search with Enter key
- **WHEN** user types in search input and presses Enter key
- **THEN** system performs search as if search button was clicked

#### Scenario: Clear input with Escape key
- **WHEN** user presses Escape key while search input is focused
- **THEN** system clears the input field
