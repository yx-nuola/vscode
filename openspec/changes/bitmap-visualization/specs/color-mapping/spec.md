## ADDED Requirements

### Requirement: Configure color ranges
The system SHALL allow users to configure color mappings for different current value ranges.

#### Scenario: Add new color range
- **WHEN** user defines a new current range with min, max, and color
- **THEN** the range SHALL be added to the color mapping configuration

#### Scenario: Edit existing color range
- **WHEN** user modifies an existing color range's values or color
- **THEN** the changes SHALL be reflected immediately in the bitmap

#### Scenario: Delete color range
- **WHEN** user removes a color range
- **THEN** cells in that range SHALL use the default or next applicable range

### Requirement: Real-time color preview
The system SHALL provide real-time preview of color mapping changes.

#### Scenario: Preview on configuration change
- **WHEN** user modifies color range settings
- **THEN** the bitmap SHALL update to reflect the new colors immediately

### Requirement: Default color scheme
The system SHALL provide a default color scheme for common use cases.

#### Scenario: Load default scheme
- **WHEN** component initializes without user configuration
- **THEN** a default color scheme SHALL be applied (e.g., Pass=green, Fail=red)

### Requirement: Handle out-of-range values
The system SHALL handle values that fall outside defined color ranges.

#### Scenario: Apply fallback color
- **WHEN** a cell's value does not match any defined range
- **THEN** a fallback color (e.g., gray) SHALL be applied

### Requirement: Support RGB color input
The system SHALL accept RGB color values for color configuration.

#### Scenario: Input RGB values
- **WHEN** user enters RGB values (e.g., #FF5733 or rgb(255,87,51))
- **THEN** the color SHALL be validated and applied
