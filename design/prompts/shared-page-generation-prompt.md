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
