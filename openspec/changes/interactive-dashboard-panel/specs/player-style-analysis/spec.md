# Player Style Analysis Specification (Delta)

## MODIFIED Requirements

### Requirement: System analyzes player style from historical data
The system SHALL fetch player statistics from Amae Koromo API and analyze playing style using dual-axis classification model (attack willingness × defense capability).

#### Scenario: Fetch player basic stats
- **WHEN** system needs to analyze player
- **THEN** system fetches basic stats from `/api/v2/pl4/player_stats/` endpoint

#### Scenario: Fetch player extended stats
- **WHEN** system needs detailed analysis
- **THEN** system fetches extended stats from `/api/v2/pl4/player_extended_stats/` endpoint

#### Scenario: Require minimum game count
- **WHEN** player has less than 50 games
- **THEN** system displays "数据不足" message and skips analysis

#### Scenario: Calculate attack willingness
- **WHEN** analyzing player style
- **THEN** system calculates 进攻意愿 = 立直率 + 副露率

#### Scenario: Calculate defense capability
- **WHEN** analyzing player style
- **THEN** system calculates 防守力 based on 放铳率 deviation from baseline

#### Scenario: Classify into 9 style categories
- **WHEN** analysis is complete
- **THEN** system assigns one of 9 style titles: 钢铁战士, 狂战士, 自爆兵, 忍者, 上班族, 赌徒, 乌龟, 摆烂人, 送分童子

#### Scenario: Generate characteristic tags
- **WHEN** analysis is complete
- **THEN** system generates up to 3 characteristic tags from 11 possible tags

## ADDED Requirements

### Requirement: System caches player data
The system SHALL cache player statistics in memory for 5 minutes to reduce API requests.

#### Scenario: Cache player data on fetch
- **WHEN** player data is fetched from API
- **THEN** data is stored in cache with current timestamp

#### Scenario: Return cached data within TTL
- **WHEN** player data is requested and cache entry is less than 5 minutes old
- **THEN** system returns cached data without making API request

#### Scenario: Refresh expired cache
- **WHEN** player data is requested and cache entry is more than 5 minutes old
- **THEN** system makes new API request and updates cache

#### Scenario: Limit cache size
- **WHEN** cache contains more than 50 players
- **THEN** system removes oldest entries to maintain limit

### Requirement: System supports batch player analysis
The system SHALL support analyzing multiple players concurrently with request queue management.

#### Scenario: Queue multiple player requests
- **WHEN** user adds multiple players to comparison list
- **THEN** system queues all requests and processes them

#### Scenario: Limit concurrent requests
- **WHEN** processing batch requests
- **THEN** system maintains maximum 3 concurrent API requests

#### Scenario: Display loading state for each player
- **WHEN** player data is being fetched
- **THEN** system shows loading spinner for that player

#### Scenario: Handle partial batch failure
- **WHEN** some requests in batch fail
- **THEN** system displays error for failed players and shows data for successful ones

### Requirement: System provides manual refresh
The system SHALL allow users to manually refresh player data to get latest statistics.

#### Scenario: Refresh single player
- **WHEN** user clicks refresh button next to player
- **THEN** system clears cache for that player and fetches fresh data

#### Scenario: Refresh all players
- **WHEN** user clicks "刷新全部" button
- **THEN** system clears cache for all players in comparison list and fetches fresh data

#### Scenario: Show last update time
- **WHEN** player data is displayed
- **THEN** system shows timestamp "数据更新于 X分钟前"

### Requirement: System handles API rate limiting
The system SHALL implement exponential backoff retry strategy when API rate limiting is encountered.

#### Scenario: Retry on rate limit
- **WHEN** API returns 429 status code
- **THEN** system waits 1 second and retries request

#### Scenario: Exponential backoff
- **WHEN** retry fails again
- **THEN** system doubles wait time (2s, 4s, 8s) up to maximum 3 retries

#### Scenario: Display rate limit message
- **WHEN** all retries are exhausted
- **THEN** system displays "请求过于频繁，请稍后再试" message

### Requirement: System supports on-demand analysis
The system SHALL analyze players on-demand via search rather than only automatically at game start.

#### Scenario: Analyze searched player
- **WHEN** user searches for player by ID or nickname
- **THEN** system fetches and analyzes that player's data

#### Scenario: Analyze current game players
- **WHEN** user clicks "添加当前对局" button
- **THEN** system analyzes all players in current game

#### Scenario: Analyze without active game
- **WHEN** user searches for player outside of active game
- **THEN** system performs analysis without requiring game context

## REMOVED Requirements

None - all existing functionality is preserved.
