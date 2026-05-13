# Upload With Passkey Combined Execution Prompt

<!-- markdownlint-disable MD013 MD012 MD024 MD025 -->

Use this file as a standalone prompt for generating the Upload With Passkey page. It already includes the shared product context, reviewed consumer UI direction, page requirements, and page-specific generation instructions.

## Execution Instruction

Generate a high-fidelity UI mockup for the page described below. Follow all shared context and page requirements. Preserve the consumer storage-app direction: lead with user goals, keep protocol details available through progressive disclosure, and maintain Mainnet/Calibration network support.

---

## Shared Product And Design Context

# Shared Page Generation Prompt

<!-- markdownlint-disable MD013 MD012 -->

Use this as the base prompt for generating page mockups.

```text
Design a polished storage app dashboard for "Synapse", a Filecoin Onchain Cloud demo for passkey-backed storage authorization.

The app is an operational product UI, not a landing page. It should feel like a modern consumer cloud-storage product with technical details available on demand.

Layout:
- left sidebar navigation with Synapse logo
- top navbar with Mainnet/Calibration network toggle, passkey upload availability, wallet status, and passkey session status
- main content area for the active page
- optional right rail for recent activity, session status, verification details, or contextual actions

Visual style:
- clean white or near-white background
- subtle gray borders and shadows
- compact 8px-radius cards
- restrained purple accent
- green success states
- amber warning states
- red failure states
- crisp typography
- no marketing hero section
- no decorative gradient blobs
- soft cloud/passkey/lock illustration is allowed on the Upload page

Core product facts to reflect:
- root wallet owns funds, datasets, and recovery
- passkey authorizes storage actions after root-wallet authorization
- P-256 signatures are verified on-chain through P256VERIFY at 0x0100
- Mainnet and Calibration are separate chain contexts
- upload history comes from chain-backed dataset and piece queries, not local storage alone
- file bytes live with storage providers, not on-chain

Default UI should lead with consumer goals:
- upload files
- view datasets
- manage files
- see recent activity
- manage passkey session
- add storage funds

Move protocol details into details drawers, receipts, tooltips, advanced tabs, or developer mode.

Default consumer pages should say `Passkey uploads available` or `On-chain verified` before saying `P256VERIFY at 0x0100`. The exact precompile address must still be visible in tooltips, receipts, advanced panels, or developer views.

The UI should include real labels such as:
- Dataset
- PieceCID
- Provider
- Root Wallet
- Synthetic Signer
- P256VERIFY
- Mainnet
- Calibration
- Passkey Session
- On-chain Verified

Avoid using these as primary labels in the default UI:
- FWSS
- PDP
- P-256 proof envelope
- clientDataJSON
- authenticatorData
- operation nonce
- batch nonce
- staticcall
- precompile detection

Avoid vague marketing copy. Keep copy short and operational.
```


---

## Reviewed Consumer UI Direction

# Consumer App UI Layout

<!-- markdownlint-disable MD013 MD012 -->

Reviewed source: `/Users/michaelseiler/Downloads/passkey_sessions_synapse_ui_layout.md`

This is the revised direction for the Synapse passkey demo UI.

## Product Direction

The app should feel like a polished storage app that happens to be powered by Synapse, passkeys, Filecoin, and on-chain verification.

The primary user experience is:

```text
Choose files -> confirm with passkey -> storage is verified on-chain
```

Protocol details remain available, but they should not dominate the first impression.

Default UI should feel closer to a modern cloud-storage product than a protocol console. Details such as `P256VERIFY at 0x0100`, synthetic signer, operation hash, proof deadline, and FWSS verifier belong in receipts, drawers, tooltips, advanced tabs, and developer mode.

## App First, Protocol Second

Lead with user goals:

- upload files
- view datasets
- manage files
- see recent activity
- manage passkey session
- add storage funds

Do not lead with:

- FWSS
- PDP
- precompile status
- synthetic signer
- operation hashes
- proof envelopes

Those details are still required for the demo, but they move to progressive disclosure.

## Primary Screen

The Upload screen should have one calm primary action:

```text
Authorize & Upload with Passkey
```

The page should not feel like every technical subsystem is competing for attention.

## Consumer Copy

Use approachable phrasing in the default UI:

- `Passkey protected`
- `On-chain verified`
- `Your data, your control`
- `No repeated wallet prompts`
- `Use Face ID, Touch ID, Windows Hello, Android unlock, or a security key`
- `Stored successfully`
- `Manage Session`
- `View on Explorer`

Reserve technical wording for details:

- `P256VERIFY at 0x0100`
- `Synthetic signer`
- `Storage authorization intent`
- `FWSS verifier`
- `Operation hash`
- `Proof envelope`
- `clientDataJSON`
- `authenticatorData`

## App Shell

Use a full app shell with:

- persistent left sidebar
- large central content area
- optional right rail for session, activity, and verification
- network control in the sidebar, navbar, or account area

The spec requires a navbar-accessible Mainnet/Calibration toggle. The consumer layout may also mirror that selector in the sidebar, but the active network must remain obvious and consistent.

## Sidebar

Primary navigation:

- Home
- Upload
- Datasets
- Files
- Activity

Utility cards:

- Storage balance
- Connected wallet
- Network selector

The selected item should use a soft filled background. Avoid hard outlines.

## Main Upload Composition

The Upload page should include:

- title: `Upload with Passkey`
- subtitle: `Secure, fast storage authorization with your device.`
- trust chips:
  - `Your data, your control`
  - `Passkey protected`
  - `On-chain verified`
- soft cloud/passkey/lock illustration
- central drag-and-drop card
- selected file row
- upload details card
- primary CTA
- supporting text about device confirmation
- bottom benefit strip
- right rail with Passkey Session, Recent Activity, and On-Chain Verified cards

Default upload card should not show provider IDs, PieceCID, FWSS, operation hash, or proof details.

## Upload States

### Default

```text
Drag and drop files here
or click to browse

[Choose Files]
```

### File Selected

```text
research-dataset.zip
2.45 GB
Ready
```

### Progress

Use a consumer-friendly timeline:

```text
Preparing your upload

File prepared
Passkey confirmed
Uploading to Synapse storage
Verifying on-chain
Finalizing dataset
```

### Passkey Prompt

```text
Confirm with your passkey

Use Face ID, Touch ID, Windows Hello, Android unlock, or your security key to approve this upload.
```

### User Cancelled

```text
Upload not authorized

You cancelled the passkey confirmation. No files were uploaded.

[Try again]
```

## Upload Details

Default details should show:

- dataset name
- visibility label
- storage provider
- number of copies, if relevant
- estimated cost

Advanced details, hidden by default:

- dataset ID, if existing
- primary provider
- secondary providers
- chain-backed source
- proof deadline
- authorization mode

## Right Rail

### Passkey Session

Default card shows:

- status
- device label
- added date
- expiry
- manage action

Default card hides:

- synthetic signer
- root wallet
- permission list
- public key fingerprint
- chain ID
- precompile status

Those details belong in the Manage Session drawer.

### Recent Activity

Use friendly rows:

- File Committed
- Upload Initiated
- Payment Confirmed
- Dataset Created
- Passkey Session Active

Protocol details are one click away.

### On-Chain Verified

Default copy:

```text
All uploads are verified on-chain via Synapse and Filecoin.
```

Advanced tooltip or disclosure:

```text
Verified by P256VERIFY at 0x0100 when using passkey sessions.
```

## Passkey Setup Flow

The setup flow should feel like onboarding, not contract configuration.

1. Intro
   - `Set up Passkey Uploads`
   - explain no repeated wallet prompts
2. Create Device Passkey
   - device label
   - create passkey action
3. Authorize With Root Wallet
   - session length
   - permissions
   - root-wallet authorization
4. Ready
   - start uploading

## Success Receipt

Default receipt:

```text
Stored successfully

research-dataset.zip was committed to Synapse warm storage.

Authorized by passkey
On-chain verified

[View Details] [Retrieve File] [Share / Copy Link]
```

Details view:

- file name and size
- dataset name and ID
- provider
- PieceCID
- transaction
- authorization method
- verification method
- explorer link

Advanced verification disclosure:

- root wallet
- synthetic signer
- chain ID
- FWSS verifier
- operation hash
- batch nonce
- signed WebAuthn hash construction

## Files Page

Files should look like a consumer storage browser:

- search
- upload action
- file name
- verified status
- size
- modified time

Clicking a row opens a file detail drawer with dataset, provider, authorization, retrieval, removal, and advanced protocol details.

## Datasets Page

Datasets should be card-like:

- dataset name
- file count
- total size
- visibility
- verified status
- open/add/manage actions

Dataset detail can use tabs:

- Files
- Activity
- Settings
- Advanced

Advanced tab contains protocol-level data.

## Activity Page

Activity should use friendly timeline labels:

- File committed
- Upload initiated
- Payment confirmed
- Dataset created
- Passkey session active

Rows can open details with chain-backed references, transactions, providers, and PieceCID.

## Verification Checks

Developer verification checks are required for the FIP demo but should not sit prominently on the main page.

Place them behind:

- Settings -> Advanced
- developer mode
- a demo query flag such as `?demo=1`

The panel should still cover:

- modified PieceCID
- modified provider
- modified chain ID
- replayed nonce
- expired session
- revoked session
- wrong origin
- wrong RP ID
- invalid P-256 signature

## Network Handling

Network selector copy:

```text
Mainnet
Filecoin mainnet · 314

Calibration
Filecoin testnet · 314159
```

Network-specific passkey copy:

```text
This passkey is not authorized on Mainnet yet.
Authorize it with your wallet to use passkey uploads here.
```

Advanced explanation:

```text
Passkey authorization is chain-specific. Calibration authorization does not apply to Mainnet.
```

Wrong network:

```text
Your wallet is connected to Calibration, but this app is set to Mainnet.
```

P-256 unavailable:

```text
Passkey uploads are not available on this network yet.
You can still upload with your wallet.
```

Advanced tooltip:

```text
P256VERIFY at 0x0100 was not detected on this chain.
```

## Visual Direction

Use:

- light near-white background
- white cards
- deep navy or charcoal text
- muted blue-gray secondary text
- purple/blue primary accent
- soft green success
- soft amber warning
- soft red error
- friendly icons
- cloud + lock + passkey/fingerprint illustration

The original resource suggests large 20-28px card radii. For implementation, use the existing app design system. If no design token exists, prefer 8px cards for consistency with the implementation design rules while preserving the soft spacing and calm visual hierarchy.

## Suggested Component Tree

```text
app-shell/
  app-sidebar.tsx
  app-layout.tsx
  account-menu.tsx
  network-selector.tsx
  storage-balance-card.tsx

upload/
  upload-page.tsx
  upload-hero.tsx
  upload-dropzone.tsx
  selected-file-card.tsx
  upload-details-card.tsx
  upload-primary-action.tsx
  upload-progress.tsx
  upload-success-receipt.tsx

passkey/
  passkey-session-card.tsx
  passkey-session-drawer.tsx
  passkey-setup-flow.tsx
  passkey-status-badge.tsx
  passkey-expired-state.tsx
  passkey-revoked-state.tsx

activity/
  recent-activity-card.tsx
  activity-page.tsx
  activity-row.tsx

files/
  files-page.tsx
  file-list.tsx
  file-detail-drawer.tsx

datasets/
  datasets-page.tsx
  dataset-card.tsx
  dataset-detail.tsx

verification/
  onchain-verified-card.tsx
  verification-details.tsx
  advanced-verification-panel.tsx
  developer-verification-checks.tsx
```

## App State Model

Consumer-facing session states:

```text
not_set_up
active
expired
revoked
not_available
wrong_network
```

Internal session states:

```text
unsupported_browser
unsupported_network
wallet_disconnected
wallet_wrong_chain
no_credential
credential_created_not_authorized
authorizing
ready
signing
verifying
expired
revoked
failed
```

Consumer-facing upload states:

```text
idle
file_ready
confirming_passkey
uploading
verifying
stored
failed
cancelled
```

Internal upload states:

```text
idle
file_selected
piececid_calculating
provider_selecting
intent_building
awaiting_passkey
proof_encoding
uploading_primary
pulling_secondaries
committing_onchain
verified
committed
failed
cancelled
```

The UI should map internal states to simple consumer states unless the user opens details.



---

## Suggested Component Tree

# Component Tree

<!-- markdownlint-disable MD013 MD012 -->

This is the recommended component organization for the final app implementation.

```text
apps/synapse-playground/src/components/

app-shell/
  app-sidebar.tsx
  app-layout.tsx
  account-menu.tsx
  network-selector.tsx
  storage-balance-card.tsx

upload/
  upload-page.tsx
  upload-hero.tsx
  upload-dropzone.tsx
  selected-file-card.tsx
  upload-details-card.tsx
  upload-primary-action.tsx
  upload-progress.tsx
  upload-success-receipt.tsx

passkey/
  passkey-session-card.tsx
  passkey-session-drawer.tsx
  passkey-setup-flow.tsx
  passkey-status-badge.tsx
  passkey-expired-state.tsx
  passkey-revoked-state.tsx

activity/
  recent-activity-card.tsx
  activity-page.tsx
  activity-row.tsx

files/
  files-page.tsx
  file-list.tsx
  file-detail-drawer.tsx

datasets/
  datasets-page.tsx
  dataset-card.tsx
  dataset-detail.tsx

verification/
  onchain-verified-card.tsx
  verification-details.tsx
  advanced-verification-panel.tsx
  developer-verification-checks.tsx
```

## Implementation Note

This tree is design guidance, not a hard module boundary. Preserve the existing Synapse app conventions if they conflict with these exact names.



---

## App State Model

# State Model

<!-- markdownlint-disable MD013 MD012 -->

The app should expose simple consumer-facing states while retaining detailed internal states for progress, debugging, and demo verification.

## Consumer-Facing Session States

```text
not_set_up
active
expired
revoked
not_available
wrong_network
```

## Internal Session States

```text
unsupported_browser
unsupported_network
wallet_disconnected
wallet_wrong_chain
no_credential
credential_created_not_authorized
authorizing
ready
signing
verifying
expired
revoked
failed
```

## Consumer-Facing Upload States

```text
idle
file_ready
confirming_passkey
uploading
verifying
stored
failed
cancelled
```

## Internal Upload States

```text
idle
file_selected
piececid_calculating
provider_selecting
intent_building
awaiting_passkey
proof_encoding
uploading_primary
pulling_secondaries
committing_onchain
verified
committed
failed
cancelled
```

## Mapping Rule

The default UI should show consumer states. Internal states should appear in:

- progress detail drawers
- upload receipts
- advanced verification views
- developer mode
- error details



---

## Page Requirements

# Upload With Passkey

<!-- markdownlint-disable MD013 MD012 -->

Purpose: primary demo flow for uploading to Synapse warm storage with passkey authorization.

This page is based on the draft dashboard image provided in the chat:

- left Synapse sidebar
- Upload selected
- storage balance and wallet/network controls in sidebar
- main upload area with "Upload with Passkey"
- drag-and-drop zone
- upload details card
- primary "Authorize & Upload with Passkey" button
- right rail with Passkey Session, Recent Activity, and On-Chain Verified cards

The reviewed design direction says this page should feel like a consumer storage upload flow, not a protocol console. Default UI should lead with:

```text
Choose files -> confirm with passkey -> storage is verified on-chain
```

Protocol details must remain available through details, receipts, tooltips, and advanced disclosures.

Required implementation notes:

- upload history must come from chain-backed dataset and piece queries
- selected network must be visible and switchable between Mainnet and Calibration
- wallet/network mismatch must disable upload actions
- passkey authorization state must be chain-specific
- final committed state must show PieceCID, dataset, provider, and transaction hash
- default upload card should not show PieceCID, FWSS, operation hashes, or proof details before upload
- success receipt should show friendly status first, with technical details behind "View Details"
- developer verification checks should not appear on this page unless demo mode is enabled

Required images:

- `images/upload-with-passkey-draft.png`
- `images/upload-with-passkey-ready.png`
- `images/upload-with-passkey-confirming.png`
- `images/upload-with-passkey-verified.png`
- `images/upload-with-passkey-failed.png`
- `images/upload-success-receipt.png`


---

## Page-Specific Generation Prompt

# Upload With Passkey Prompt

<!-- markdownlint-disable MD013 MD012 -->

```text
Create a high-fidelity web-app dashboard mockup for Synapse.

Page: Upload With Passkey.

The page should feel like a polished consumer cloud-storage app. It should not feel like a protocol console. The simple user story is: choose files, confirm with passkey, storage is verified on-chain.

Use these generated references if available:
- `design/pages/01-upload-with-passkey/images/upload-with-passkey-v2.png` as the preferred base
- `design/pages/01-upload-with-passkey/images/upload-with-passkey-v1.png` for the segmented network control idea

Use this reference composition:
- left sidebar with Synapse logo and navigation: Home, Upload, Datasets, Files, Activity
- Upload is selected with a soft purple highlight
- lower sidebar contains Storage Balance, connected wallet, and Mainnet/Calibration network selector
- main panel title: "Upload with Passkey"
- subtitle: "Secure, fast storage authorization with your device."
- trust row: "Your data, your control", "Passkey protected", "On-chain verified"
- central drag-and-drop upload zone
- selected file row showing file icon, filename, size, and Ready state
- Upload Details card with Dataset Name, Visibility, Storage Provider, Estimated Cost
- primary button: "Authorize & Upload with Passkey"
- right rail with Passkey Session, Recent Activity, and On-Chain Verified cards

Add a top navbar or clearly visible control for switching between Mainnet and Calibration. The active network must be obvious. If using the sidebar network control, make it prominent and consistent with the navbar requirement.

Default network/passkey status copy should be consumer-friendly:
- "Passkey uploads available"
- "Passkey Session Active"

Put technical copy behind tooltip/details:
- "P256VERIFY at 0x0100"
- "P-256 precompile detected"

The UI must show that this is chain-backed:
- include Dataset ID or pending Dataset ID
- include Provider
- include PieceCID after upload
- include transaction hash and explorer link after commit

Do not show PieceCID, FWSS, operation hash, proof envelope, clientDataJSON, or batch nonce in the default pre-upload card. Put those in View Details, Advanced Verification, or developer mode.

Before upload, hide pending Dataset ID and provider internals behind an "Advanced storage details" disclosure. After upload, show Dataset ID, PieceCID, provider, and transaction in the success details.

Show passkey state as Active, with credential label, expiry, and Manage Session action.

Include upload states:
- default empty dropzone
- file selected with Ready state
- passkey confirmation state
- progress timeline: File prepared, Passkey confirmed, Uploading to Synapse storage, Verifying on-chain, Finalizing dataset
- user cancelled state
- success receipt

Success receipt copy:
"Stored successfully"
"research-dataset.zip was committed to Synapse warm storage."
"Authorized by passkey"
"On-chain verified"

Success receipt actions:
- View Details
- Retrieve File
- Share / Copy Link

Avoid generated text artifacts. Provider labels should be real readable names such as "Glif Storage", "Curio", or "Starboard".

Visual style:
- white dashboard
- subtle gray borders
- restrained purple accent
- green success badges
- compact cards with 8px radius
- polished but operational, not a marketing landing page

Do not imply files are stored locally. File bytes are with providers; committed upload state is tracked by chain-backed datasets and pieces.
```

