# profile-toast-notifications

## Purpose

Make the Profile page report biodata and password outcomes through the shared toast notification system, consistent with the rest of the app, instead of native `alert()` dialogs.

## Requirements

### Requirement: Profile actions report via standard toast notifications

The Profile page SHALL report the outcome of biodata updates and password changes using the shared toast notification system (`useToast`), matching the styling and behavior used elsewhere in the app. Native `alert()` dialogs MUST NOT be used for these outcomes.

#### Scenario: Biodata update succeeds

- **WHEN** the user saves a valid biodata change
- **THEN** a success toast is shown using the standard template and no native alert appears

#### Scenario: Biodata update fails

- **WHEN** saving biodata fails (e.g. network or server error)
- **THEN** an error toast is shown using the standard template and no native alert appears

#### Scenario: Password change succeeds

- **WHEN** the user submits a valid password change
- **THEN** a success toast is shown using the standard template and no native alert appears

#### Scenario: Password change is rejected

- **WHEN** password validation fails (empty current password, mismatch, too short) or the server rejects the change
- **THEN** the corresponding message is shown as a warning/error toast using the standard template and no native alert appears
