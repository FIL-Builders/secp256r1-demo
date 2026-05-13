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
