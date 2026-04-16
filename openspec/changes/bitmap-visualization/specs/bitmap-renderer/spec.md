## ADDED Requirements

### Requirement: Render 128x1024 bitmap matrix
The system SHALL render a 128 rows (BL) x 1024 columns (WL) bitmap matrix displaying RRAM test results, with a total of 131,072 cells.

#### Scenario: Initial render completes within 2 seconds
- **WHEN** data is loaded and render is triggered
- **THEN** the complete matrix SHALL be rendered within 2 seconds

#### Scenario: Matrix displays correct cell colors
- **WHEN** a cell has test data with a current value
- **THEN** the cell SHALL be filled with the color mapped to its current range

### Requirement: Support zoom and pan interaction
The system SHALL provide zoom and pan functionality for navigating the bitmap matrix.

#### Scenario: Zoom in/out with mouse wheel
- **WHEN** user scrolls mouse wheel while holding Ctrl key
- **THEN** the matrix SHALL zoom in/out centered on cursor position

#### Scenario: Pan with mouse drag
- **WHEN** user clicks and drags on the canvas in pan mode
- **THEN** the visible area SHALL move following the drag direction

#### Scenario: Zoom level indicator
- **WHEN** zoom level changes
- **THEN** a zoom indicator (e.g., "Zoom x1", "Zoom x2") SHALL be displayed

### Requirement: Chunked rendering for performance
The system SHALL use chunked rendering strategy to optimize performance for large matrices.

#### Scenario: Only render visible chunks
- **WHEN** matrix is partially visible in viewport
- **THEN** only cells in visible chunks SHALL be rendered

#### Scenario: Render new chunks on pan/zoom
- **WHEN** user pans or zooms to a new area
- **THEN** new visible chunks SHALL be rendered within 500ms

### Requirement: Highlight selected cell
The system SHALL visually highlight the currently selected cell.

#### Scenario: Cell highlight on click
- **WHEN** user clicks on a cell
- **THEN** the cell SHALL be highlighted with a distinct border or outline

#### Scenario: Clear highlight on new selection
- **WHEN** user selects a different cell
- **THEN** the previous cell's highlight SHALL be removed
