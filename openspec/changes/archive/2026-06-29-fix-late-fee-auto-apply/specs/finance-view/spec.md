## MODIFIED Requirements

### Requirement: Config save refreshes all dependent data
After a successful `saveConfig` API call, the system SHALL refresh `financeConfig`, `duesList`, and `duesSummaryList` so that the dues status panel reflects the new configuration immediately without requiring a page reload.

#### Scenario: Config save refreshes dues summary
- **WHEN** the user saves a new dues configuration (amount, late fee, due day, final day)
- **THEN** the dues status panel SHALL update to reflect any recalculated values within the same user action, without a page refresh

#### Scenario: Config save failure leaves data unchanged
- **WHEN** the saveConfig API call fails
- **THEN** existing data SHALL remain displayed and an error toast SHALL appear

### Requirement: Generate dues uses inline modal input
The "Buat Tagihan Bulan Ini" action SHALL present an inline modal with a text input for the billing period (format: YYYY-MM) instead of a native browser `prompt()` dialog. The modal SHALL follow the same visual design as the existing transaction modal. On confirm, the API call SHALL proceed and all three data lists (transactions, duesList, duesSummary) SHALL be refreshed automatically.

#### Scenario: Period input via modal
- **WHEN** the bendahara clicks "Buat Tagihan Bulan Ini"
- **THEN** an inline modal SHALL open with a text input pre-filled with the current year-month

#### Scenario: Generate dues success
- **WHEN** the bendahara confirms the period and the API call succeeds
- **THEN** the modal SHALL close, a success toast SHALL appear, and duesList, duesSummaryList, and transactions SHALL refresh without a page reload

#### Scenario: Generate dues cancel
- **WHEN** the bendahara dismisses or cancels the modal
- **THEN** no API call SHALL be made and the modal SHALL close

#### Scenario: Generate dues API failure
- **WHEN** the API call fails
- **THEN** an error toast SHALL appear and the modal SHALL remain closeable

## ADDED Requirements

### Requirement: Auto-apply late fees on finance page load
On mount, the FinanceView component SHALL call `POST /finance/apply-late-fees` so that any dues that have passed their `finalDate` without payment have their late fee applied before the dues summary is displayed.

#### Scenario: Late fees applied before summary renders
- **WHEN** any authenticated user navigates to the Finance page
- **THEN** the system SHALL call `POST /finance/apply-late-fees` during page initialization, before or concurrently with fetching the dues summary

#### Scenario: Apply late fees failure does not block page
- **WHEN** the `POST /finance/apply-late-fees` call fails (network error, server error)
- **THEN** the page SHALL still load and display available data; the error SHALL be logged but not shown to the user as a blocking toast
