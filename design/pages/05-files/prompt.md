# Files Prompt

<!-- markdownlint-disable MD013 MD012 -->

```text
Design a Files page for Synapse.

Show a chain-backed browser of committed pieces/files for the connected wallet and selected network.

Use `images/files-list-v1.png` as the visual reference when available. It should show a global committed-files browser with a selected-row detail rail.

Include:
- Mainnet/Calibration toggle in the navbar
- passkey upload availability in the navbar, with P256VERIFY details in tooltip or advanced details
- passkey session status
- search and filters
- refresh action
- upload files action
- summary strip for files, datasets, total size, and on-chain verification
- PieceCID
- dataset
- provider
- size
- metadata labels
- retrieval link
- verification status
- explorer link

Use consumer-friendly rows:
- file name
- Verified status
- size
- modified time

Clicking a row opens a detail drawer with:
- status: Stored and verified
- dataset
- storage provider
- authorization: Passkey protected
- Retrieve
- Schedule Removal
- View Details
- note that file bytes are stored with providers

Advanced details reveal PieceCID, transaction hash, provider address, and proof metadata.

The selected row should be visually highlighted. The detail drawer should separate friendly quick details from advanced chain/proof details.

Make clear that file bytes are retrieved from storage providers and that committed file history comes from chain-backed dataset and piece state.
```
