# Home Dashboard

<!-- markdownlint-disable MD013 MD012 -->

Purpose: show the overall state of the selected Synapse account and network.

The page should summarize:

- active network: Mainnet or Calibration
- wallet connection and root address
- P-256 precompile availability
- passkey session status
- payment balance and approvals
- dataset count
- recent uploads
- recent verification activity
- any blocking setup steps

The home page should feel like a storage-app overview, not a protocol dashboard. Lead with storage, files, datasets, balance, and passkey readiness. Put low-level protocol details behind cards, links, or advanced disclosures.

Source of truth:

- chain-backed account, dataset, piece, provider, and payment queries
- local storage only for UI preferences and credential labels

Required images:

- `images/home-dashboard.png`
- optional state variants in `images/states/`
