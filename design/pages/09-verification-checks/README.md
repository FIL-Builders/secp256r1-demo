# Verification Checks

<!-- markdownlint-disable MD013 MD012 -->

Purpose: presenter and developer panel for proving invalid proofs fail.

This page should not be prominent in the default consumer UI. It belongs behind developer mode, Settings -> Advanced, or a demo query flag such as `?demo=1`.

Checks:

- replayed proof
- modified PieceCID
- modified provider
- modified chain
- wrong origin
- wrong RP ID
- expired session
- revoked session
- invalid P-256 signature
