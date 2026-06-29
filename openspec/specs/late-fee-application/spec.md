# Spec: Late Fee Application

## Purpose

TBD — Defines requirements for the late fee application mechanism, which automatically applies late fees to overdue dues records based on the active FinanceConfig.

## Requirements

### Requirement: Apply pending late fees to overdue dues
The system SHALL provide a dedicated mechanism to apply late fees to all dues records where `status` is `UNPAID` or `PARTIAL`, `lateFeeApplied` is `false`, and the current date/time is after `finalDate`. When applied, `amountDue` SHALL increase by the active `lateFee` from `FinanceConfig` and `lateFeeApplied` SHALL be set to `true`.

#### Scenario: Late fee applied to overdue UNPAID dues
- **WHEN** the apply-late-fees endpoint is called and there exists a dues record with `status = UNPAID`, `lateFeeApplied = false`, and `finalDate` is in the past
- **THEN** the system SHALL update that record: `amountDue += lateFee` and `lateFeeApplied = true`

#### Scenario: Late fee not applied to dues within deadline
- **WHEN** the apply-late-fees endpoint is called and a dues record has `finalDate` in the future
- **THEN** that record SHALL NOT be modified

#### Scenario: Late fee not applied twice (idempotent)
- **WHEN** the apply-late-fees endpoint is called multiple times
- **THEN** a dues record that already has `lateFeeApplied = true` SHALL NOT have its `amountDue` increased again

#### Scenario: No active config
- **WHEN** the apply-late-fees endpoint is called but no active `FinanceConfig` exists
- **THEN** the system SHALL return successfully with zero dues modified (no error thrown)

### Requirement: Apply late fees endpoint accessible to authenticated users
The `POST /finance/apply-late-fees` endpoint SHALL be accessible to any authenticated user (protected by JWT), not restricted to bendahara role only, because it is triggered automatically on page load.

#### Scenario: Authenticated user triggers late fee application
- **WHEN** an authenticated user sends `POST /finance/apply-late-fees`
- **THEN** the system SHALL process eligible dues and return a count of modified records

#### Scenario: Unauthenticated request rejected
- **WHEN** an unauthenticated request is sent to `POST /finance/apply-late-fees`
- **THEN** the system SHALL return HTTP 401
