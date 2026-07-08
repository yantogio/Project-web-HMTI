## ADDED Requirements

### Requirement: Admin row action controls stay clickable and unobscured

Row action controls (view/edit/delete in the member table) SHALL remain fully clickable at every viewport size and SHALL NOT be overlapped by floating navigation or other fixed-position overlays. Floating navigation (the speed-dial button) SHALL be positioned or layered so it never intercepts pointer events targeting table action buttons, including when the browser window is resized to a short or narrow size. Row hover effects SHALL NOT apply transforms to `<tr>` elements in a way that displaces the clickable hit area of the action buttons.

#### Scenario: Action buttons clickable on resize
- **WHEN** the member table is displayed and the browser window is resized to a short or narrow size
- **THEN** every row's action buttons remain clickable and are not covered by the floating navigation button

#### Scenario: Floating nav does not intercept action clicks
- **WHEN** a user clicks an action button in a table row that visually overlaps the floating navigation area
- **THEN** the action button receives the click, not the floating navigation

#### Scenario: Row hover does not break hit targets
- **WHEN** a user hovers a member row and then clicks its edit or delete button
- **THEN** the click registers on the intended button without offset from a row transform
