# Bar Chart Visualization Specification

## ADDED Requirements

### Requirement: Chart displays key metrics horizontally
The system SHALL render a horizontal bar chart comparing 5 key metrics: 立直率, 副露率, 和牌率, 放铳率, and 平均打点.

#### Scenario: Display all 5 metrics
- **WHEN** bar chart is rendered
- **THEN** chart shows 5 rows labeled with metric names in Chinese

#### Scenario: Bars extend horizontally
- **WHEN** bar chart is rendered
- **THEN** bars extend from left to right with length proportional to metric value

### Requirement: Chart displays multiple players side-by-side
The system SHALL display bars for 2-4 players grouped by metric for easy comparison.

#### Scenario: Display bars for multiple players
- **WHEN** comparison list has 2-4 players
- **THEN** each metric row shows bars for all players side-by-side

#### Scenario: Use consistent player colors
- **WHEN** bar chart is rendered
- **THEN** player colors match those used in radar chart

#### Scenario: Update chart when players change
- **WHEN** comparison list is modified
- **THEN** chart updates to show current players

### Requirement: Chart uses color coding for deviation
The system SHALL color-code bars based on deviation from rank baseline: red for above average, green for below average.

#### Scenario: Color bars above baseline
- **WHEN** metric value is above rank baseline
- **THEN** bar is colored red with intensity based on deviation magnitude

#### Scenario: Color bars below baseline
- **WHEN** metric value is below rank baseline
- **THEN** bar is colored green with intensity based on deviation magnitude

#### Scenario: Color bars near baseline
- **WHEN** metric value is within ±2% of baseline
- **THEN** bar is colored gray indicating neutral deviation

#### Scenario: Use deeper colors for larger deviations
- **WHEN** deviation is more than 2× threshold
- **THEN** bar uses deeper shade of red or green

### Requirement: Chart displays actual values on bars
The system SHALL display the actual metric value as text label on or near each bar.

#### Scenario: Display value on bar
- **WHEN** bar is long enough (>50px)
- **THEN** value is displayed inside bar in white text

#### Scenario: Display value outside bar
- **WHEN** bar is too short (<50px)
- **THEN** value is displayed to the right of bar in black text

#### Scenario: Format percentage values
- **WHEN** metric is percentage-based (立直率, 副露率, 和牌率, 放铳率)
- **THEN** value is formatted as "XX.X%" with 1 decimal place

#### Scenario: Format score values
- **WHEN** metric is 平均打点
- **THEN** value is formatted as integer with no decimal places

### Requirement: Chart displays baseline reference line
The system SHALL display a vertical dashed line indicating the rank baseline value for each metric.

#### Scenario: Display baseline line
- **WHEN** bar chart is rendered
- **THEN** gray dashed vertical line shows baseline position for each metric

#### Scenario: Position baseline correctly
- **WHEN** baseline line is displayed
- **THEN** line position corresponds to baseline value on the scale

### Requirement: Chart scales automatically
The system SHALL automatically scale the x-axis to fit all player values with appropriate padding.

#### Scenario: Scale to fit all values
- **WHEN** bar chart is rendered
- **THEN** x-axis range includes all player values plus 10% padding

#### Scenario: Include baseline in scale
- **WHEN** determining x-axis range
- **THEN** range includes baseline value even if no player reaches it

#### Scenario: Use consistent scale across metrics
- **WHEN** multiple metrics are displayed
- **THEN** each metric uses independent scale appropriate for its value range

### Requirement: Chart displays player names in legend
The system SHALL display a legend showing player names with corresponding colors.

#### Scenario: Display legend with player names
- **WHEN** chart is rendered
- **THEN** legend shows each player's nickname with color indicator

#### Scenario: Click legend to toggle visibility
- **WHEN** user clicks player name in legend
- **THEN** that player's bars are hidden/shown on chart

### Requirement: Chart is responsive to panel size
The system SHALL automatically resize the chart when panel size changes.

#### Scenario: Resize chart with panel
- **WHEN** user resizes panel
- **THEN** chart resizes to fit new panel dimensions

#### Scenario: Maintain readability at minimum size
- **WHEN** panel is at minimum size (600x400px)
- **THEN** chart remains readable with labels not overlapping

### Requirement: Chart displays tooltips on hover
The system SHALL display tooltips showing detailed information when user hovers over bars.

#### Scenario: Show tooltip on hover
- **WHEN** user hovers over bar
- **THEN** tooltip displays player name, metric name, actual value, and deviation from baseline

#### Scenario: Show deviation percentage
- **WHEN** tooltip is displayed
- **THEN** tooltip shows deviation as "+X.X%" or "-X.X%" from baseline

#### Scenario: Hide tooltip on mouse leave
- **WHEN** user moves mouse away from bar
- **THEN** tooltip disappears

### Requirement: Chart handles missing data gracefully
The system SHALL display partial chart when some player data is unavailable.

#### Scenario: Display chart with incomplete data
- **WHEN** player has some metrics missing
- **THEN** chart shows available metrics and displays "数据不完整" warning

#### Scenario: Skip player with insufficient games
- **WHEN** player has less than 50 games
- **THEN** chart excludes that player and displays "数据不足" message

### Requirement: Chart updates without animation for performance
The system SHALL update chart data without animation to maintain performance.

#### Scenario: Update chart data instantly
- **WHEN** comparison list changes
- **THEN** chart updates immediately without transition animation
