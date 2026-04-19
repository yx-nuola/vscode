## ADDED Requirements

### Requirement: Data mode configuration
The system SHALL support overwrite and append data modes.

#### Scenario: Default overwrite mode
- **WHEN** no dataMode is specified
- **THEN** overwrite mode SHALL be used by default

#### Scenario: Set append mode
- **WHEN** user sets dataMode to 'append'
- **THEN** new data SHALL be appended to existing data

#### Scenario: Set overwrite mode
- **WHEN** user sets dataMode to 'overwrite'
- **THEN** new data SHALL replace existing data

### Requirement: Append mode merges data
The system SHALL merge data correctly in append mode.

#### Scenario: Append new data
- **WHEN** dataMode is 'append' and new data is loaded
- **THEN** new cells SHALL be added to existing grid without duplicates

#### Scenario: Append preserves cell positions
- **WHEN** appending data with overlapping coordinates
- **THEN** newer data SHALL overwrite older data for same coordinates

### Requirement: Overwrite mode replaces data
The system SHALL completely replace data in overwrite mode.

#### Scenario: Overwrite clears existing data
- **WHEN** dataMode is 'overwrite' and new data is loaded
- **THEN** existing grid SHALL be cleared before rendering new data
