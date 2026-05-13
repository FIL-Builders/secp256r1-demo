# Style Guide

<!-- markdownlint-disable MD013 MD012 -->

## Product Tone

The app should feel like a polished consumer storage app with technical depth available on demand:

- quiet
- precise
- trustworthy
- fast to scan
- useful during a live demo

Avoid a landing-page feel. The first screen should be the working app. The default experience should be:

```text
Choose files -> confirm with passkey -> storage is verified on-chain
```

Protocol details should be progressively disclosed through receipts, details drawers, advanced tabs, and developer mode.

## Layout

Use a shell layout:

- left sidebar for primary navigation
- top navbar for network, wallet, and passkey status
- main content area for the active page
- optional right rail for context, recent activity, verification, or session status

Primary pages:

- Home
- Upload
- Datasets
- Files
- Activity
- Passkey Session
- Payments
- Settings

## Visual Language

The draft upload dashboard uses:

- white and near-white backgrounds
- soft borders
- light purple accents
- green success states
- compact cards
- left navigation
- prominent upload action
- right rail for session and recent activity

Keep the purple accent, but do not make every component purple. Use neutral text, blue-gray secondary labels, green success, amber warnings, and red errors.

The imported design resource recommends a softer consumer app feel. Adopt that hierarchy, but keep implementation consistent with the app's actual design system. If no token exists for large rounded cards, use 8px card radius and preserve softness through whitespace, color, and subtle shadows.

## Progressive Disclosure

Default UI should show:

- file name
- dataset name
- storage balance
- passkey session status
- recent activity
- upload status
- storage provider brand/name
- estimated cost
- simple verified status

Details UI can show:

- PieceCID
- dataset ID
- provider ID
- transaction hash
- chain-backed source
- authorization method
- verification method

Advanced UI can show:

- `P256VERIFY at 0x0100`
- synthetic signer
- root wallet
- public key fingerprint
- operation hash
- FWSS verifier address
- batch nonce
- proof deadline
- session expiry
- WebAuthn hash construction
- proof envelope version

## Interaction Requirements

Common controls:

- network selector in navbar
- wallet connect and wallet menu in navbar
- passkey session status in navbar or right rail
- upload dropzone
- dataset and provider filters
- explorer links
- transaction status links
- retry actions for recoverable failures

Required state treatment:

- Mainnet selected
- Calibration selected
- wallet chain mismatch
- P-256 precompile unavailable
- passkey unsupported
- no passkey registered
- passkey registered but unauthorized
- passkey authorization expired
- passkey revoked
- passkey ready
- waiting for passkey confirmation
- upload in progress
- on-chain verification in progress
- committed
- failed verification

## Content Rules

Use concrete labels:

- "Authorize & Upload with Passkey"
- "Verified by P256VERIFY"
- "Calibration"
- "Mainnet"
- "Dataset"
- "PieceCID"
- "Provider"
- "Root Wallet"
- "Synthetic Signer"

Use approachable default labels:

- "Upload with Passkey"
- "Passkey protected"
- "On-chain verified"
- "Your data, your control"
- "No repeated wallet prompts"
- "Stored successfully"
- "Manage Session"

Avoid vague copy like:

- "Next-gen"
- "Seamless"
- "Revolutionary"
- "Military grade"
