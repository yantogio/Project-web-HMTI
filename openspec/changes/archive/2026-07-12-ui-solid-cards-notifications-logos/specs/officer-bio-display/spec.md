## ADDED Requirements

### Requirement: Pengurus Inti card shows jabatan and short bio

The HomeView "Pengurus Inti" card SHALL display the member's `jabatan` as the pill badge positioned above the name, and the member's short bio as muted subtext positioned below the name. The card MUST NOT display a separate Role badge, because the position is already conveyed by `jabatan`.

#### Scenario: Card shows jabatan pill above name

- **WHEN** a Pengurus Inti card is rendered for a member with a `jabatan`
- **THEN** the `jabatan` value appears above the name using the pill/badge design previously used for the Role badge

#### Scenario: Card shows short bio below name

- **WHEN** a Pengurus Inti card is rendered for a member that has a short bio
- **THEN** the bio appears below the name using the muted-subtext design previously used for `jabatan`

#### Scenario: Role badge is removed

- **WHEN** any Pengurus Inti card is rendered
- **THEN** no standalone Role badge is shown on the card

#### Scenario: Member without a bio

- **WHEN** a Pengurus Inti card is rendered for a member with no short bio
- **THEN** the bio subtext area is omitted (or empty) without breaking the card layout
