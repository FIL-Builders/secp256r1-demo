# Verification Checks Prompt

<!-- markdownlint-disable MD013 MD012 -->

```text
Design a Verification Checks page or developer panel for Synapse.

The panel is used during demos to prove invalid passkey proofs fail.

Use `images/verification-checks-v1.png` as the visual reference when available.

This panel should be hidden from the default consumer navigation. Present it as Settings -> Advanced -> Developer Verification Checks or as a demo-mode panel.

Include check rows for:
- replayed proof
- modified PieceCID
- modified provider
- modified chain
- wrong origin
- wrong RP ID
- expired session
- revoked session
- invalid P-256 signature

Each row should show expected result, actual result, tx or simulation reference, and concise explanation.

Negative checks should show `Expected: Rejected` and `Actual: Rejected` when the verifier behaves correctly.

Use a technical dashboard style. Keep this page useful for presenters and developers.
```
