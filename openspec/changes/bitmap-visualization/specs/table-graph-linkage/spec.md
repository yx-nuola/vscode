## ADDED Requirements

### Requirement: Click cell to highlight table row
The system SHALL highlight the corresponding table row when a bitmap cell is clicked.

#### Scenario: Click cell scrolls to table row
- **WHEN** user clicks on a bitmap cell
- **THEN** the data table SHALL scroll to the corresponding row and highlight it

#### Scenario: Click cell shows row data
- **WHEN** user clicks on a bitmap cell
- **THEN** the row's data (BL, WL, Vset, Vreset, Imeas) SHALL be visible in the table

### Requirement: Click table row to highlight cell
The system SHALL highlight the corresponding bitmap cell when a table row is clicked.

#### Scenario: Click row highlights cell
- **WHEN** user clicks on a table row
- **THEN** the corresponding bitmap cell SHALL be highlighted and centered if necessary

#### Scenario: Pan to cell if outside viewport
- **WHEN** clicked row's cell is outside the current viewport
- **THEN** the bitmap SHALL pan to show the cell

### Requirement: Maintain sync between views
The system SHALL maintain synchronization between bitmap and table views.

#### Scenario: Selection state synced
- **WHEN** a cell/row is selected in either view
- **THEN** the corresponding element in the other view SHALL show the same selection state

#### Scenario: Clear selection synced
- **WHEN** user clears selection in one view
- **THEN** selection SHALL be cleared in both views

### Requirement: Support keyboard navigation
The system SHALL support keyboard navigation for linked selection.

#### Scenario: Arrow key navigation
- **WHEN** user presses arrow keys while a cell is selected
- **THEN** selection SHALL move to adjacent cell and sync with table
