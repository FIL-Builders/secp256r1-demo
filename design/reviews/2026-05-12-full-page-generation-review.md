# Full Page Generated Mockups Review

<!-- markdownlint-disable MD013 MD012 -->

Reviewed generated images from May 12, 2026.

## Imported References

| Source image | Stored as | Page |
| --- | --- | --- |
| `ChatGPT Image May 12, 2026, 02_38_41 PM.png` | `design/pages/00-home-dashboard/images/home-dashboard-v1.png` | Home Dashboard |
| `ChatGPT Image May 12, 2026, 02_38_03 PM (2).png` | `design/pages/01-upload-with-passkey/images/upload-with-passkey-v1.png` | Upload With Passkey |
| `ChatGPT Image May 12, 2026, 02_38_03 PM (1).png` | `design/pages/01-upload-with-passkey/images/upload-with-passkey-v2.png` | Upload With Passkey |
| `ChatGPT Image May 12, 2026, 02_43_53 PM.png` | `design/pages/02-passkey-session/images/passkey-session-v1.png` | Passkey Session |
| `ChatGPT Image May 12, 2026, 02_43_58 PM.png` | `design/pages/03-datasets/images/datasets-v1.png` | Datasets |
| `ChatGPT Image May 12, 2026, 02_44_02 PM.png` | `design/pages/03-datasets/images/datasets-v2.png` | Datasets |
| `ChatGPT Image May 12, 2026, 02_44_07 PM.png` | `design/pages/04-dataset-detail/images/dataset-detail-v1.png` | Dataset Detail |
| `ChatGPT Image May 12, 2026, 02_44_11 PM.png` | `design/pages/04-dataset-detail/images/dataset-detail-v2.png` | Dataset Detail |
| `ChatGPT Image May 12, 2026, 02_44_21 PM.png` | `design/pages/06-activity/images/activity-v1.png` | Activity |
| `ChatGPT Image May 12, 2026, 02_44_26 PM.png` | `design/pages/07-payments/images/payments-v1.png` | Payments |
| `ChatGPT Image May 12, 2026, 02_46_09 PM.png` | `design/pages/08-network-states/images/network-states-v1.png` | Network States |
| `ChatGPT Image May 12, 2026, 02_45_25 PM.png` | `design/pages/09-verification-checks/images/verification-checks-v1.png` | Verification Checks |
| `ChatGPT Image May 12, 2026, 02_45_32 PM.png` | `design/pages/10-settings/images/settings-v1.png` | Settings |
| `ChatGPT Image May 12, 2026, 03_05_32 PM.png` | `design/pages/05-files/images/files-list-v1.png` | Files |

`ChatGPT Image May 12, 2026, 02_44_13 PM.png` was not imported because its SHA-256 hash matches `02_44_11 PM.png`.

## Preferred Bases

- Home: use `home-dashboard-v1.png` for app-shell direction, but reduce technical density.
- Upload: use `upload-with-passkey-v2.png` as the primary Upload reference; borrow the clearer network segmented control from `upload-with-passkey-v1.png`.
- Passkey Session: use `passkey-session-v1.png`.
- Datasets: use `datasets-v2.png` as the base; borrow the selected-dataset drawer from `datasets-v1.png`.
- Dataset Detail: use `dataset-detail-v1.png` and `dataset-detail-v2.png` as network variants.
- Files: use `files-list-v1.png` as the preferred global Files page base.
- Activity: use `activity-v1.png`.
- Payments: use `payments-v1.png`.
- Network States: use `network-states-v1.png`.
- Verification Checks: use `verification-checks-v1.png`.
- Settings: use `settings-v1.png`; treat it as a scrollable page reference.

## Implementation Notes

Keep these direction choices:

- persistent app shell with left sidebar and top navbar
- navbar-accessible Mainnet/Calibration toggle on every page
- visible wallet, passkey session, and passkey upload availability state
- consumer-first labels with protocol details in drawers, tooltips, advanced tabs, receipts, or developer mode
- chain-backed datasets/files/activity as the source of truth, with local cache limited to preferences, labels, and UI convenience
- clear disabled states for wrong network, missing P256VERIFY, unavailable verifier, missing providers, and insufficient funds

Fix these before implementation:

- replace generated typo `Permisition` with `Permission`
- use consistent labels: `P256VERIFY`, `P-256`, `Payment Rail`, `PieceCID`, `Root Wallet`, `Passkey Session`
- do not make `FWSS`, `PDP`, `staticcall`, or proof-envelope terminology primary in consumer views
- avoid stale absolute dates unless the screen is explicitly sample data
- keep Mainnet and Calibration state synchronized across navbar, sidebar, cards, receipts, and drawers
- ensure verification-check rows show invalid proofs as expected failures: `Expected: Rejected`, `Actual: Rejected`
