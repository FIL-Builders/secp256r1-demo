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
