## ADDED Requirements

### Requirement: Cell click callback
The system SHALL support custom callback function for cell click events.

#### Scenario: Invoke click callback
- **WHEN** user clicks on a cell and onCellClick callback is provided
- **THEN** the callback SHALL be invoked with cell info and event

#### Scenario: Provide cell info in callback
- **WHEN** click callback is invoked
- **THEN** the callback SHALL receive rowIndex, colIndex, cell data, and position

### Requirement: Cell hover callback
The system SHALL support custom callback function for cell hover events.

#### Scenario: Invoke hover callback
- **WHEN** user hovers over a cell and onCellHover callback is provided
- **THEN** the callback SHALL be invoked with cell info and event

#### Scenario: Hover callback throttling
- **WHEN** user moves mouse rapidly across cells
- **THEN** hover callbacks SHALL be throttled to prevent performance issues

### Requirement: Callback receives original event
The system SHALL pass the original mouse event to callbacks.

#### Scenario: Access original event
- **WHEN** callback is invoked
- **THEN** the original MouseEvent SHALL be available for custom handling
