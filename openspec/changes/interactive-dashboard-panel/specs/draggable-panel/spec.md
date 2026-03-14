# Draggable Panel Specification

## ADDED Requirements

### Requirement: Panel can be opened and closed
The system SHALL provide two methods to open/close the panel: keyboard shortcut (Ctrl+Shift+D) and a floating button in the bottom-right corner of the screen.

#### Scenario: Open panel with keyboard shortcut
- **WHEN** user presses Ctrl+Shift+D while panel is closed
- **THEN** panel appears at the last saved position or default position (center of screen)

#### Scenario: Close panel with keyboard shortcut
- **WHEN** user presses Ctrl+Shift+D while panel is open
- **THEN** panel disappears and position is saved to localStorage

#### Scenario: Open panel with floating button
- **WHEN** user clicks the floating button in bottom-right corner
- **THEN** panel appears at the last saved position or default position

#### Scenario: Close panel with close button
- **WHEN** user clicks the X button in panel title bar
- **THEN** panel disappears and position is saved to localStorage

### Requirement: Panel can be dragged
The system SHALL allow users to drag the panel by its title bar to any position on the screen.

#### Scenario: Start dragging panel
- **WHEN** user presses mouse button down on panel title bar
- **THEN** panel enters drag mode and follows mouse cursor

#### Scenario: Move panel while dragging
- **WHEN** user moves mouse while in drag mode
- **THEN** panel position updates in real-time following the cursor

#### Scenario: Stop dragging panel
- **WHEN** user releases mouse button while in drag mode
- **THEN** panel stays at current position and position is saved to localStorage

#### Scenario: Prevent dragging from content area
- **WHEN** user presses mouse button down on panel content area (not title bar)
- **THEN** panel does NOT enter drag mode

### Requirement: Panel can be resized
The system SHALL allow users to resize the panel by dragging its edges or corners, with minimum size 600x400px and maximum size 1200x800px.

#### Scenario: Resize panel by dragging corner
- **WHEN** user drags bottom-right corner of panel
- **THEN** panel size updates in real-time following the cursor

#### Scenario: Enforce minimum size
- **WHEN** user attempts to resize panel below 600x400px
- **THEN** panel size stops at 600x400px and does not shrink further

#### Scenario: Enforce maximum size
- **WHEN** user attempts to resize panel above 1200x800px
- **THEN** panel size stops at 1200x800px and does not grow further

#### Scenario: Save resized dimensions
- **WHEN** user finishes resizing panel
- **THEN** new size is saved to localStorage

### Requirement: Panel can be minimized and maximized
The system SHALL provide minimize and maximize buttons in the panel title bar.

#### Scenario: Minimize panel
- **WHEN** user clicks minimize button
- **THEN** panel collapses to show only title bar

#### Scenario: Restore minimized panel
- **WHEN** user clicks restore button on minimized panel
- **THEN** panel expands to show full content at previous size

#### Scenario: Maximize panel
- **WHEN** user clicks maximize button
- **THEN** panel expands to maximum size (1200x800px)

#### Scenario: Restore maximized panel
- **WHEN** user clicks restore button on maximized panel
- **THEN** panel returns to previous size before maximization

### Requirement: Panel has semi-transparent background
The system SHALL render the panel with a semi-transparent dark background (rgba(20, 20, 30, 0.95)) to maintain visibility of game content behind it.

#### Scenario: Panel background is semi-transparent
- **WHEN** panel is displayed
- **THEN** game content behind panel is partially visible through the background

#### Scenario: Panel content is fully opaque
- **WHEN** panel is displayed
- **THEN** text and UI elements within panel are fully opaque and readable

### Requirement: Panel remembers user preferences
The system SHALL save and restore panel position, size, and state (open/closed, minimized/maximized) using localStorage.

#### Scenario: Save preferences on close
- **WHEN** user closes panel
- **THEN** current position, size, and state are saved to localStorage

#### Scenario: Restore preferences on open
- **WHEN** user opens panel after previous session
- **THEN** panel appears at saved position and size with saved state

#### Scenario: Use defaults for first-time users
- **WHEN** user opens panel for the first time (no saved preferences)
- **THEN** panel appears at center of screen with default size (800x600px)

### Requirement: Panel has fixed z-index
The system SHALL render the panel with a high z-index (9999) to ensure it appears above game UI elements.

#### Scenario: Panel appears above game UI
- **WHEN** panel is displayed
- **THEN** panel is visible above all game UI elements including menus and dialogs

#### Scenario: Panel does not block mouse events when closed
- **WHEN** panel is closed
- **THEN** floating button is the only element that receives mouse events
