# Milestone 0 Integration Spike

<!-- markdownlint-disable MD013 MD012 -->

## Goal

Prove the high-risk live path before building the polished app:

```text
wallet + passkey + P-256 verification + Synapse upload + chain-backed readback
```

The first check is whether `P256VERIFY` at `0x0000000000000000000000000000000000000100` is active on the networks we intend to support.

## Check 1: P256VERIFY Activation

Command:

```sh
pnpm check:p256
```

What the script does:

- generates a real P-256 keypair with WebCrypto
- signs a fixed message with ECDSA P-256/SHA-256
- locally verifies the signature before making RPC calls
- builds the exact 160-byte precompile input:
  `msg_hash(32) || r(32) || s(32) || pubkey_x(32) || pubkey_y(32)`
- calls `eth_call` against `0x0100`
- sends one valid input and one invalid input per network
- classifies a network as available only when the valid input returns `0x...01` and the invalid input returns `0x`

Default RPC endpoints:

- Mainnet: `https://api.node.glif.io/rpc/v1`
- Calibration: `https://api.calibration.node.glif.io/rpc/v1`

Override endpoints with:

```sh
FILECOIN_MAINNET_RPC_URL=... FILECOIN_CALIBRATION_RPC_URL=... pnpm check:p256
```

## Current Result

Run result from May 12, 2026 HST:

| Network | Chain ID | Block | Result |
| --- | ---: | ---: | --- |
| Mainnet | 314 | 6011024 | `not_available_or_not_activated` |
| Calibration | 314159 | 3710358 | `not_available_or_not_activated` |

Both networks returned `0x` for the valid generated P-256 signature and `0x` for the invalid signature. Because a non-activated precompile address and an invalid signature both return empty output, the valid-signature check is the important signal.

Current conclusion:

```text
P256VERIFY at 0x0100 is not active yet on public GLIF Mainnet or Calibration RPC at the checked blocks.
```

This should be re-run before every integration pass because the FIP is in the release queue and network status can change.

## Impact On Milestone 0

Do now:

- keep the `check:p256` script as the activation gate
- build app readiness around a `P256VERIFY unavailable` state
- keep Calibration as the first target network once activation lands
- build the UI in Pending Network Mode so look and feel, navigation, wallet state, payments, datasets, files, and activity can progress before activation
- add explicit Demo Simulation Mode for rehearsals, unsupported-state previews, and developer verification checks
- route verifier, storage, and activity behavior through adapters so live implementations can replace fixtures without rewriting pages
- continue non-chain-blocked parts of the spike: wallet connection, WebAuthn payload generation, Synapse SDK client initialization, and payment/provider readiness reads

Do after activation:

- re-run `pnpm check:p256`
- capture the first block where valid P-256 verification returns `0x...01`
- run the full passkey authorization proof through the deployed verifier path
- proceed to live Synapse upload and chain-backed readback

## Build-Now Strategy While Blocked

The blocker only prevents the final live claim that a passkey-backed storage authorization was verified on-chain by `P256VERIFY`. It does not block the rest of the app.

Build now:

- app shell and page routing
- Mainnet/Calibration toggle
- wallet connection and wrong-chain state
- passkey credential creation/signing probe
- `P256VERIFY` availability checks
- Synapse SDK client/readiness probes
- payments/provider readiness UI
- fixture-backed Datasets, Files, Activity, and receipts
- disabled passkey upload state for Pending Network Mode
- developer verification checks in Simulation Mode

Do not fake:

- `On-chain verified` status for the main happy path
- real `P256VERIFY` activation
- real Synapse upload/readback
- real explorer links for simulated receipts

## Switch-On Criteria

Calibration can move from Pending Network Mode to Live Mode when:

1. `pnpm check:p256 -- --network calibration` classifies the network as `available`.
2. The deployed FWSS P-256 verifier path is available for the Calibration deployment.
3. A browser-generated passkey proof verifies through the deployed verifier path.
4. A small Synapse upload can be committed and read back from chain-backed state.
5. Files, Datasets, Dataset Detail, and Activity render the uploaded result without relying on fixture data.

## Next Spike Tasks

1. Add a browser/WebAuthn probe that creates a passkey credential and records the exact authenticator output shape needed by the verifier.
2. Add a Synapse SDK probe that initializes clients for Mainnet and Calibration and reports provider/payment readiness.
3. Define the app capability object and adapter interfaces in code.
4. Add a fixture-backed app mode that is explicitly labeled as Simulation Mode.
5. Add a minimal upload/readback probe once Calibration has the required P-256 path.
