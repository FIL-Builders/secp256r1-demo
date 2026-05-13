# Datasets Prompt

<!-- markdownlint-disable MD013 MD012 -->

```text
Design a Datasets page for Synapse.

The page lists chain-backed datasets for the connected root wallet on the selected network.

Use `images/datasets-v2.png` as the preferred visual reference when available. Pull the selected-dataset drawer pattern from `images/datasets-v1.png` if useful.

Include:
- Mainnet/Calibration toggle in the navbar
- connected wallet
- passkey upload availability, with P256VERIFY details in tooltip or advanced details
- table or dense list of datasets
- dataset ID
- provider
- pieces count
- metadata
- payment rail status
- proof status
- last activity
- action to open dataset detail

Prefer card-like dataset rows:
- Research Dataset
- 12 files
- 8.4 GB
- Private
- Verified
- Open
- Add Files
- Manage

Dataset detail can use tabs:
- Files
- Activity
- Settings
- Advanced

Make clear that this data is reconstructed from chain-backed Synapse/FWSS/PDP queries, not local storage.

In default copy, phrase the source as `Chain-backed Synapse data`. Keep FWSS and PDP wording in an advanced source/details area.

Use a clean storage-app style with restrained purple accents and compact rows.
```
