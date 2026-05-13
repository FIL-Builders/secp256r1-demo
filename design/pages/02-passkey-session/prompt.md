# Passkey Session Prompt

<!-- markdownlint-disable MD013 MD012 -->

```text
Design the Passkey Session management page for Synapse.

Show a dashboard page where the user can create, authorize, test, extend, and revoke a P-256 passkey session.

Use `images/passkey-session-v1.png` as the visual reference when available.

The top navbar must include Mainnet and Calibration network toggle, wallet status, passkey session status, and passkey upload availability. Put `P256VERIFY at 0x0100` in details rather than making it the loudest default label.

Default UI should use consumer copy:
- Set up Passkey Uploads
- Create your passkey
- Authorize this device
- Passkey Uploads Ready
- Upload without repeated wallet prompts

Main content:
- session status card
- credential label
- synthetic signer address
- root wallet address
- chain-specific authorization status
- permissions list: create dataset, add pieces, schedule removals, delete dataset
- expiry and extend action
- revoke action
- test passkey action

Use a Manage Session drawer for deeper details:
- root wallet
- selected network
- permissions
- expiry
- synthetic signer
- P-256 fingerprint
- verifier: P256VERIFY at 0x0100

Do not make synthetic signer or proof terminology prominent in the default card.

Show that Mainnet and Calibration are separate authorization contexts. If Calibration is authorized and Mainnet is not, the UI must make that obvious.

Use polished final copy. Correct generated artifacts such as `Permisition`; the label should be `Permission`.

Use a clean operational dashboard style, not a landing page.
```
