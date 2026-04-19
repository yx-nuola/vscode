## ADDED Requirements

### Requirement: Configure minimum cell size
The system SHALL allow users to configure the minimum cell size.

#### Scenario: Set minimum cell size
- **WHEN** user sets minSize to 12px
- **THEN** cell size SHALL not be smaller than 12px

### Requirement: Configure maximum cell size
The system SHALL allow users to configure the maximum cell size (optional).

#### Scenario: Set maximum cell size
- **WHEN** user sets maxSize to 50px
- **THEN** cell size SHALL not exceed 50px

### Requirement: Auto-calculate cell size based on container
The system SHALL automatically calculate cell size based on container dimensions and preferred count.

#### Scenario: Calculate from preferred count
- **WHEN** user sets preferredCount.horizontal to 64 and container width is 768px
- **THEN** cell width SHALL be calculated as 12px (768 / 64)

#### Scenario: Use minimum size when calculated is too small
- **WHEN** calculated cell size is less than minSize
- **THEN** cell size SHALL use minSize and display scrollbar

### Requirement: Display scrollbar when cells exceed visible area
The system SHALL display scrollbar when total cells exceed the visible area.

#### Scenario: Show scrollbar for large matrix
- **WHEN** matrix has 128x1024 cells and cell size is 12px
- **THEN** scrollbar SHALL appear to allow navigation

### Requirement: Display specified number of cells in viewport
The system SHALL allow users to specify how many cells to display.

#### Scenario: Display 64x64 cells
- **WHEN** user configures preferredCount to { horizontal: 64, vertical: 64 }
- **THEN** approximately 64x64 cells SHALL be visible in the viewport
