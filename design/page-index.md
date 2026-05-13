# Page Index

<!-- markdownlint-disable MD013 MD012 -->

This is the current screen inventory for the full demo.

| Page | Folder | Purpose |
| --- | --- | --- |
| Home Dashboard | `pages/00-home-dashboard` | Overview of storage, payment balance, passkey state, network state, and recent activity. |
| Upload With Passkey | `pages/01-upload-with-passkey` | Main hero workflow: upload a file using passkey-backed Synapse authorization. |
| Passkey Session | `pages/02-passkey-session` | Create, authorize, extend, test, and revoke a P-256 passkey session. |
| Datasets | `pages/03-datasets` | Chain-backed list of datasets for the selected network and root wallet. |
| Dataset Detail | `pages/04-dataset-detail` | Inspect one dataset, provider, pieces, metadata, proof status, and payment rail. |
| Files | `pages/05-files` | Chain-backed piece/file browser with retrieval actions and provider references. |
| Activity | `pages/06-activity` | Timeline of uploads, verification checks, passkey events, payments, and failures. |
| Payments | `pages/07-payments` | Payment account, balances, deposits, approvals, and rail state. |
| Network And Unsupported States | `pages/08-network-states` | Mainnet/Calibration switching, mismatch, unsupported precompile, and disabled states. |
| Verification Checks | `pages/09-verification-checks` | Demo presenter panel for replay, tamper, wrong-origin, and invalid-signature cases. |
| Settings | `pages/10-settings` | Local preferences, labels, developer mode, and cached state management. |

Default navigation should keep Verification Checks hidden unless developer mode or demo mode is enabled.

## Navigation

Primary sidebar:

- Home
- Upload
- Datasets
- Files
- Activity

Secondary/account area:

- Payments
- Passkey Session
- Settings

Navbar:

- Mainnet / Calibration toggle
- passkey upload availability, with P256VERIFY details available on hover or in details
- wallet connect or wallet menu
- passkey session status
