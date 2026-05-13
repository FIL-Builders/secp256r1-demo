# Dataset Detail Prompt

<!-- markdownlint-disable MD013 MD012 -->

```text
Design a Dataset Detail page for Synapse.

Use `images/dataset-detail-v1.png` and `images/dataset-detail-v2.png` as visual references when available. They show Calibration and Mainnet variants of the same detail surface.

Show one chain-backed dataset with:
- dataset ID
- active network
- provider identity and service URL
- payment rail status
- proof status
- dataset metadata
- pieces table
- PieceCID
- piece ID
- size
- metadata
- retrieval action
- schedule removal action
- recent activity

Use tabs:
- Files
- Activity
- Settings
- Advanced

Keep protocol-level data in Advanced:
- provider ID
- provider address
- payment rail
- PieceCID list
- proof status
- chain-backed source

Include a right rail with passkey session status and on-chain verification details.

Use exact operational labels such as `Payment Rail`, `PieceCID`, `Provider`, and `On-chain verified`. Avoid generated text artifacts and keep Mainnet/Calibration state consistent across navbar, sidebar, and page content.

Use a compact operational dashboard layout.
```
