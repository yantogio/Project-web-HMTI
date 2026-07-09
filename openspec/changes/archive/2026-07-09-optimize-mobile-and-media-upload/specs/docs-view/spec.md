## MODIFIED Requirements

### Requirement: Per-tab file upload type filtering

The file upload SHALL both filter the OS picker AND enforce the allowed types before sending to the server. The `accept` attribute SHALL differ by active tab, and `handleFileUpload` SHALL reject files whose type is not allowed for the active tab (for both file-picker selection and drag-and-drop), showing an error toast instead of uploading.

- **Arsip Surat** tab: accept attribute `.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.ods,.odp`; only office/document types accepted.
- **Media Event** tab: accept attribute `image/*,video/*`; ONLY files whose MIME type starts with `image/` or `video/` SHALL be accepted. Documents (PDF/Word/PowerPoint/Excel) and design/other types SHALL be rejected.
- **Branding Kit** tab: accept attribute `image/*,.psd,.ai,.fig,.sketch,.svg,.eps`; ONLY files that are an image (`image/*`) OR whose filename ends with a design extension (`.psd,.ai,.fig,.sketch,.svg,.eps`) SHALL be accepted. Documents (PDF/Word/PowerPoint/Excel) and video SHALL be rejected.

The backend document upload endpoint SHALL additionally reject: (a) a `type=MEDIA` file whose MIME is not `image/*` or `video/*`; and (b) a `type=BRANDING` file that is neither an image nor a recognized design extension. Both return a 400 error, so the restriction cannot be bypassed by a crafted client request.

#### Scenario: Media Event tab shows media picker
- **WHEN** the user is on the Media Event tab and opens the file picker
- **THEN** the OS file dialog SHALL filter to images and videos

#### Scenario: Non-media file rejected in Media Event tab
- **WHEN** the user selects or drops a PDF, PowerPoint, Excel, Word, or other non-image/non-video file while on the Media Event tab
- **THEN** the file SHALL NOT be uploaded and an error toast SHALL inform the user that only photos and videos are allowed

#### Scenario: Image or video accepted in Media Event tab
- **WHEN** the user selects an image (`image/*`) or video (`video/*`) file on the Media Event tab
- **THEN** the upload SHALL proceed as normal

#### Scenario: Backend rejects non-media MEDIA upload
- **WHEN** a request uploads a file with `type=MEDIA` whose MIME type is not `image/*` or `video/*`
- **THEN** the server SHALL respond with a 400 error and SHALL NOT store the file

#### Scenario: Non-image/non-design file rejected in Branding Kit tab
- **WHEN** the user selects or drops a PPTX, PDF, video, or other file that is neither an image nor a design file (`.psd/.ai/.fig/.sketch/.svg/.eps`) while on the Branding Kit tab
- **THEN** the file SHALL NOT be uploaded and an error toast SHALL inform the user that only images or design files are allowed

#### Scenario: Backend rejects non-branding BRANDING upload
- **WHEN** a request uploads a file with `type=BRANDING` that is neither an image nor a recognized design extension
- **THEN** the server SHALL respond with a 400 error and SHALL NOT store the file

#### Scenario: Arsip tab shows document picker
- **WHEN** the user is on the Arsip Surat tab and opens the file picker
- **THEN** the OS file dialog SHALL filter to PDF, Word, PowerPoint, Excel, and similar office formats

#### Scenario: Branding Kit tab excludes video
- **WHEN** the user is on the Branding Kit tab and opens the file picker
- **THEN** the OS file dialog SHALL filter to images and design files, without video formats

#### Scenario: Tab switch updates accept filter
- **WHEN** the user switches from one tab to another
- **THEN** the file input accept attribute SHALL update immediately to reflect the new tab's allowed types
