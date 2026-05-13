# Passkey Session

<!-- markdownlint-disable MD013 MD012 -->

Purpose: manage P-256 passkey session lifecycle.

The page should support:

- create passkey
- authorize passkey on selected chain
- show synthetic signer
- show root wallet
- show permissions
- show expiry
- test passkey
- extend session
- revoke session
- show Mainnet and Calibration authorization separately

The default session card should stay approachable. Hide synthetic signer, root wallet, public key fingerprint, chain ID, and precompile details until the user opens Manage Session or Advanced.

Setup should feel like onboarding:

1. Set up Passkey Uploads
2. Create your passkey
3. Authorize this device
4. Passkey Uploads Ready

Required images:

- `images/passkey-session-empty.png`
- `images/passkey-session-authorized.png`
- `images/passkey-session-expired.png`
- `images/passkey-session-revoked.png`
- `images/passkey-setup-flow.png`
