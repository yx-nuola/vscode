## ADDED Requirements

### Requirement: Display cell information on hover
The system SHALL display detailed information when hovering over a bitmap cell.

#### Scenario: Show tooltip on hover
- **WHEN** user hovers over a cell for more than 300ms
- **THEN** a tooltip SHALL appear showing cell information (BL, WL, Vset, Vreset, Imeas)

#### Scenario: Hide tooltip on mouse leave
- **WHEN** user moves mouse away from the cell
- **THEN** the tooltip SHALL disappear

### Requirement: Display detailed popup on click
The system SHALL display a detailed popup window when clicking a bitmap cell.

#### Scenario: Show popup on click
- **WHEN** user clicks on a cell
- **THEN** a popup window SHALL appear with detailed cell information

#### Scenario: Close popup on outside click
- **WHEN** user clicks outside the popup
- **THEN** the popup SHALL close

### Requirement: Multi-tab information display
The system SHALL organize cell information into multiple tabs.

#### Scenario: Information tab
- **WHEN** popup is displayed
- **THEN** an "Information" tab SHALL show basic test parameters (Vset, Vreset, Imeas)

#### Scenario: Address tab
- **WHEN** popup is displayed
- **THEN** an "Address" tab SHALL show physical address information (BL, WL coordinates)

#### Scenario: Logical tab
- **WHEN** popup is displayed
- **THEN** a "Logical" tab SHALL show logical address information if available

### Requirement: Popup positioning
The system SHALL position the popup to avoid viewport overflow.

#### Scenario: Position within viewport
- **WHEN** popup is triggered near viewport edge
- **THEN** the popup SHALL be positioned to remain fully visible

#### Scenario: Follow cursor for tooltip
- **WHEN** tooltip is displayed
- **THEN** the tooltip position SHALL follow the cursor movement
