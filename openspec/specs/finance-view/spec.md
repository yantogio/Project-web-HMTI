# Spec: Finance View

## Purpose

Defines requirements for the FinanceView component, which handles dues configuration, dues generation, and financial data display for the organization treasurer (bendahara).

## Requirements

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

### Requirement: Auto-apply late fees on finance page load
On mount, the FinanceView component SHALL call `POST /finance/apply-late-fees` so that any dues that have passed their `finalDate` without payment have their late fee applied before the dues summary is displayed.

#### Scenario: Late fees applied before summary renders
- **WHEN** any authenticated user navigates to the Finance page
- **THEN** the system SHALL call `POST /finance/apply-late-fees` during page initialization, before or concurrently with fetching the dues summary

#### Scenario: Apply late fees failure does not block page
- **WHEN** the `POST /finance/apply-late-fees` call fails (network error, server error)
- **THEN** the page SHALL still load and display available data; the error SHALL be logged but not shown to the user as a blocking toast

### Requirement: Seluruh baris bukti transaksi dapat di-tap

Pada daftar bukti transaksi di halaman keuangan, keseluruhan area baris entri SHALL berfungsi sebagai target tap untuk membuka bukti, bukan hanya area ikon.

#### Scenario: Membuka bukti dari mana saja di baris

- **WHEN** pengguna men-tap bagian mana pun dari sebuah baris bukti transaksi (ikon, teks, atau ruang kosong baris)
- **THEN** bukti transaksi terbuka (di Google Drive) sama seperti men-tap ikonnya

#### Scenario: Target tap memadai di mobile

- **WHEN** daftar bukti transaksi ditampilkan di mobile
- **THEN** tiap baris memiliki area tap yang cukup besar dan nyaman ditekan

### Requirement: Tombol "Buat Tagihan Bulan Ini" dapat diklik ulang setelah modal ditutup

Tombol "+ Buat Tagihan Bulan Ini" SHALL tetap responsif dan dapat memicu modal generate tagihan setiap kali ditekan, termasuk segera setelah modal sebelumnya ditutup, tanpa memerlukan scroll terlebih dahulu.

#### Scenario: Membuka ulang modal generate

- **WHEN** pengguna membuka modal generate tagihan lalu menutupnya, kemudian menekan tombol "+ Buat Tagihan Bulan Ini" lagi
- **THEN** modal generate tagihan langsung terbuka kembali tanpa perlu men-scroll halaman ke atas atau bawah lebih dulu
