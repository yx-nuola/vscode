## ADDED Requirements

### Requirement: Component accepts configuration-based props
The system SHALL provide a MatrixGrid component that accepts data and configuration through props.

#### Scenario: Render with minimal configuration
- **WHEN** user provides only required props (data)
- **THEN** component SHALL render with default configuration

#### Scenario: Render with full configuration
- **WHEN** user provides all configuration options
- **THEN** component SHALL render according to the provided configuration

### Requirement: Component renders matrix grid using Konva.js
The system SHALL use Konva.js for rendering the matrix grid.

#### Scenario: Initialize Konva Stage
- **WHEN** component mounts
- **THEN** a Konva Stage SHALL be created in the container element

#### Scenario: Render cells
- **WHEN** data is provided
- **THEN** each cell SHALL be rendered as a Konva.Rect

### Requirement: Component supports Ctrl+scroll zoom
The system SHALL support zooming when user holds Ctrl and scrolls mouse wheel.

#### Scenario: Zoom in
- **WHEN** user holds Ctrl and scrolls up
- **THEN** the matrix SHALL zoom in centered on cursor position

#### Scenario: Zoom out
- **WHEN** user holds Ctrl and scrolls down
- **THEN** the matrix SHALL zoom out centered on cursor position

### Requirement: Component supports pan/drag
The system SHALL support panning the matrix by dragging.

#### Scenario: Pan matrix
- **WHEN** user clicks and drags on the matrix
- **THEN** the visible area SHALL move following the drag direction

### Requirement: Component is reusable across different use cases
The system SHALL allow the component to be used without modification in different business contexts.

#### Scenario: Use in RRAM visualization
- **WHEN** component is used for RRAM data visualization
- **THEN** it SHALL work with RRAM-specific data structure through configuration

#### Scenario: Use in generic data display
- **WHEN** component is used for generic matrix display
- **THEN** it SHALL work with any data structure through configuration
