## ADDED Requirements

### Requirement: Header logos remain legible in dark mode

In dark mode, the HMTI and Universitas Bani Saleh logos shown in every page header SHALL receive a bright outline / edge treatment so both logos stay clearly visible against dark backgrounds. In light mode the logos MUST keep their current appearance.

#### Scenario: Logos get a bright edge in dark mode

- **WHEN** any page header renders with dark mode active
- **THEN** both the HMTI and UBS logos show a bright outline/edge that visually separates them from the dark background

#### Scenario: Light mode appearance unchanged

- **WHEN** any page header renders with light mode active
- **THEN** the logos appear as they do today, without the dark-mode bright outline

#### Scenario: Applies to all headers

- **WHEN** the header logo component is used on any page
- **THEN** the dark-mode legibility treatment is applied consistently everywhere the header logos appear
