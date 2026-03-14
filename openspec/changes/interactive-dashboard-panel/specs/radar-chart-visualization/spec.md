# Radar Chart Visualization Specification

## ADDED Requirements

### Requirement: Chart displays 6 dimensions
The system SHALL render a radar chart with 6 dimensions: 立直率, 副露率, 和牌率, 防守力, 平均打点, and 进攻意愿.

#### Scenario: Display all 6 dimensions
- **WHEN** radar chart is rendered
- **THEN** chart shows 6 axes labeled with dimension names in Chinese

#### Scenario: Dimensions are evenly distributed
- **WHEN** radar chart is rendered
- **THEN** 6 axes are distributed at 60-degree intervals forming a regular hexagon

### Requirement: Chart supports 2-4 player overlay
The system SHALL display data for 2 to 4 players simultaneously on the same radar chart with different colors.

#### Scenario: Display single player
- **WHEN** comparison list has 1 player
- **THEN** chart shows single colored polygon for that player

#### Scenario: Display multiple players
- **WHEN** comparison list has 2-4 players
- **THEN** chart shows overlapping polygons with distinct colors for each player

#### Scenario: Update chart when player added
- **WHEN** user adds player to comparison list
- **THEN** chart updates to include new player's polygon

#### Scenario: Update chart when player removed
- **WHEN** user removes player from comparison list
- **THEN** chart updates to remove that player's polygon

### Requirement: Chart uses distinct colors for players
The system SHALL assign distinct colors to each player from a predefined palette: red (255,99,132), blue (54,162,235), teal (75,192,192), yellow (255,206,86).

#### Scenario: Assign colors in order
- **WHEN** players are added to comparison list
- **THEN** first player gets red, second gets blue, third gets teal, fourth gets yellow

#### Scenario: Reuse colors when player removed
- **WHEN** player is removed and new player added
- **THEN** new player gets the freed color slot

### Requirement: Chart displays rank baseline
The system SHALL display a dashed gray baseline polygon representing the average stats for the player's rank.

#### Scenario: Display baseline for player rank
- **WHEN** chart is rendered with player data
- **THEN** gray dashed polygon shows baseline values for player's current rank

#### Scenario: Update baseline when rank changes
- **WHEN** comparison includes players of different ranks
- **THEN** baseline uses the highest rank among compared players

#### Scenario: Use default baseline for unknown rank
- **WHEN** player rank is unknown or unavailable
- **THEN** baseline uses 杰3 (10403) as default

### Requirement: Chart normalizes data to 0-100 scale
The system SHALL normalize all dimension values to a 0-100 scale based on rank baseline, where 50 represents the baseline average.

#### Scenario: Normalize percentage-based dimensions
- **WHEN** dimension is percentage-based (立直率, 副露率, 和牌率)
- **THEN** normalized value = (actual value / baseline value) × 50

#### Scenario: Normalize inverted dimension
- **WHEN** dimension is 防守力 (inverted from 放铳率)
- **THEN** normalized value = (1 - actual放铳率 / baseline放铳率) × 50 + 50

#### Scenario: Normalize score-based dimension
- **WHEN** dimension is 平均打点
- **THEN** normalized value = (actual value / baseline value) × 50

#### Scenario: Calculate composite dimension
- **WHEN** dimension is 进攻意愿
- **THEN** normalized value = ((立直率 + 副露率) / (baseline立直率 + baseline副露率)) × 50

### Requirement: Chart is responsive to panel size
The system SHALL automatically resize the chart when panel size changes.

#### Scenario: Resize chart with panel
- **WHEN** user resizes panel
- **THEN** chart resizes to fit new panel dimensions maintaining aspect ratio

#### Scenario: Maintain readability at minimum size
- **WHEN** panel is at minimum size (600x400px)
- **THEN** chart remains readable with labels not overlapping

### Requirement: Chart displays player names in legend
The system SHALL display a legend showing player names with corresponding colors.

#### Scenario: Display legend with player names
- **WHEN** chart is rendered
- **THEN** legend shows each player's nickname with color indicator

#### Scenario: Legend shows baseline
- **WHEN** chart is rendered
- **THEN** legend includes "段位平均" entry with gray dashed line indicator

#### Scenario: Click legend to toggle visibility
- **WHEN** user clicks player name in legend
- **THEN** that player's polygon is hidden/shown on chart

### Requirement: Chart updates without animation for performance
The system SHALL update chart data without animation to maintain performance when switching between players.

#### Scenario: Update chart data instantly
- **WHEN** comparison list changes
- **THEN** chart updates immediately without transition animation

#### Scenario: Initial render has no animation
- **WHEN** chart is first rendered
- **THEN** polygons appear instantly without fade-in animation

### Requirement: Chart displays tooltips on hover
The system SHALL display tooltips showing exact values when user hovers over data points.

#### Scenario: Show tooltip on hover
- **WHEN** user hovers over data point on chart
- **THEN** tooltip displays player name, dimension name, and exact value

#### Scenario: Show normalized and actual values
- **WHEN** tooltip is displayed
- **THEN** tooltip shows both normalized value (0-100) and actual value (percentage or score)

#### Scenario: Hide tooltip on mouse leave
- **WHEN** user moves mouse away from data point
- **THEN** tooltip disappears

### Requirement: Chart handles missing data gracefully
The system SHALL display partial chart when some player data is unavailable.

#### Scenario: Display chart with incomplete data
- **WHEN** player has some dimensions missing
- **THEN** chart shows available dimensions and displays "数据不完整" warning

#### Scenario: Skip player with insufficient games
- **WHEN** player has less than 50 games
- **THEN** chart excludes that player and displays "数据不足" message
