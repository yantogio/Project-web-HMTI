# solid-modal-surfaces

## Purpose

Ensure popup/modal card surfaces across the HMTI site render with solid (opaque) backgrounds so overlaid content stays readable, while the backdrop overlay behind the card remains dimmed/blurred.

## Requirements

### Requirement: Opaque popup/modal card surfaces

Every popup and modal card surface across the site SHALL render with a solid (fully opaque) background color in both light and dark mode. Underlying page content MUST NOT be visible through the card surface. The dimmed/blurred backdrop overlay behind the card MAY remain translucent.

#### Scenario: Modal card is opaque in dark mode

- **WHEN** a user opens any popup/modal (e.g. the edit or profile popup on the Anggota page) while dark mode is active
- **THEN** the card surface renders with a solid dark background and no page content shows through it

#### Scenario: Modal card is opaque in light mode

- **WHEN** a user opens any popup/modal on any page while light mode is active
- **THEN** the card surface renders with a solid light background and no page content shows through it

#### Scenario: Backdrop overlay is preserved

- **WHEN** any popup/modal is open
- **THEN** the area outside the card is still dimmed/blurred and clicking it (where already supported) dismisses the popup
