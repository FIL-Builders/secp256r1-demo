# Home Dashboard Prompt

<!-- markdownlint-disable MD013 MD012 -->

```text
Create a high-fidelity dashboard page for Synapse, a Filecoin Onchain Cloud app.

Page: Home Dashboard.

The page should feel like the home screen of a consumer storage app with technical depth available on demand. Do not lead with protocol internals.

Show a left sidebar with Home selected, Upload, Datasets, Files, Activity, Payments, Passkey Session, and Settings.

Show a top navbar with:
- Mainnet / Calibration segmented network toggle
- P256VERIFY status
- connected wallet
- passkey session status

Main content should show a compact overview:
- storage balance
- payment account status
- datasets count
- pieces count
- recent uploads
- provider health
- passkey session status
- action cards for Upload, Manage Passkey, Add Funds, and View Datasets

Use the first generated Home Dashboard image as a reference direction if available:
`design/pages/00-home-dashboard/images/home-dashboard-v1.png`.

Improve the next pass:
- reduce visual density slightly
- make storage/upload readiness more prominent than provider health
- use "Passkey uploads available" as the default status copy
- put "P256VERIFY at 0x0100" in tooltip, receipt, or advanced details
- make Mainnet and Calibration equally easy to select
- keep protocol rows out of the first impression

Use a clean white dashboard style with subtle borders, restrained purple accent, green success states, and compact cards.

The UI must make clear that upload history is chain-backed and that local storage is not the source of truth.

Protocol details such as P256VERIFY, synthetic signer, and operation hashes should appear only in status cards, receipts, or advanced disclosures.
```
