# Network And Unsupported States Prompt

<!-- markdownlint-disable MD013 MD012 -->

```text
Design network and unsupported-state screens for Synapse.

Use `images/network-states-v1.png` as the visual reference when available.

Show a dashboard with a navbar Mainnet/Calibration toggle.

Create states for:
- Mainnet selected and ready
- Calibration selected and ready
- wallet connected to the wrong chain
- P256VERIFY unavailable at 0x0100
- FWSS P-256 verifier unavailable
- no storage providers available
- insufficient payment balance

Storage actions must be disabled during mismatch or unsupported states. Provide clear corrective actions.

Each state card should explain whether upload, dataset, file, payment, and passkey actions are enabled or disabled for the currently selected network.

Use consumer copy first:
- "This passkey is not authorized on Mainnet yet."
- "Authorize it with your wallet to use passkey uploads here."
- "Passkey uploads are not available on this network yet."
- "You can still upload with your wallet."

Put advanced explanations in tooltips:
- "Passkey authorization is chain-specific. Calibration authorization does not apply to Mainnet."
- "P256VERIFY at 0x0100 was not detected on this chain."
```
