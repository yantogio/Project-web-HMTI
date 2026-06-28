# Spec: Docs View

## Purpose

Defines requirements for the DocsView component, which handles document management including file upload, deletion, and tab-based organization of different document categories.

## Requirements

### Requirement: Notifications use toast/confirm system
All user-facing feedback in DocsView (upload success, upload error, delete success, delete error, delete confirmation) SHALL use the `useToast` and `useConfirm` composables. Native `alert()` and `confirm()` calls SHALL be removed.

#### Scenario: Upload succeeds
- **WHEN** a file upload completes successfully
- **THEN** a success toast notification SHALL appear using `toastSuccess()`

#### Scenario: Upload fails with permission error
- **WHEN** the server returns a 403 on upload
- **THEN** an error toast SHALL appear using `toastError()` with a descriptive message

#### Scenario: Upload fails with other error
- **WHEN** the server returns a non-403 error on upload
- **THEN** an error toast SHALL appear using `toastError()`

#### Scenario: Delete confirmation
- **WHEN** the user clicks the delete button on a document
- **THEN** a confirm dialog SHALL appear via `confirmDialog()` before proceeding with deletion

#### Scenario: Delete succeeds
- **WHEN** the delete API call completes successfully
- **THEN** a success toast SHALL appear using `toastSuccess()`

#### Scenario: Delete fails
- **WHEN** the delete API call fails
- **THEN** an error toast SHALL appear using `toastError()`

### Requirement: Per-tab file upload type filtering
The file upload input accept attribute SHALL differ by active tab:

- **Arsip Surat** tab: SHALL accept only document formats — `.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.ods,.odp`
- **Media Event** tab: SHALL accept only media and design formats — `image/*,video/*,.psd,.ai,.fig,.sketch`
- **Branding Kit** tab: SHALL accept image and design formats only, excluding video — `image/*,.psd,.ai,.fig,.sketch,.svg,.eps`

#### Scenario: Arsip tab shows document picker
- **WHEN** the user is on the Arsip Surat tab and opens the file picker
- **THEN** the OS file dialog SHALL filter to PDF, Word, PowerPoint, Excel, and similar office formats

#### Scenario: Media Event tab shows media picker
- **WHEN** the user is on the Media Event tab and opens the file picker
- **THEN** the OS file dialog SHALL filter to images, videos, and design files

#### Scenario: Branding Kit tab excludes video
- **WHEN** the user is on the Branding Kit tab and opens the file picker
- **THEN** the OS file dialog SHALL filter to images and design files, without video formats

#### Scenario: Tab switch updates accept filter
- **WHEN** the user switches from one tab to another
- **THEN** the file input accept attribute SHALL update immediately to reflect the new tab's allowed types
