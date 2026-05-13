# Demo Product Definition

<!-- markdownlint-disable MD013 MD012 -->

## Objective

Build a live, production-ish Synapse demo that shows why FIP-0113 matters: a user can authorize Filecoin storage actions with a device passkey, and the app can verify the P-256 signature on-chain through `P256VERIFY` at `0x0100`.

The demo should feel like a real storage product first. Protocol details are required for credibility, but they should appear in receipts, drawers, advanced sections, explorer links, and developer panels rather than dominating the default screens.

## Core Narrative

```text
Choose files -> confirm with passkey -> storage is verified on-chain
```

The user should understand that:

- the root wallet owns funds, recovery, and chain assets
- the passkey authorizes storage actions after wallet approval
- Mainnet and Calibration are separate chain contexts
- uploaded files become visible through chain-backed dataset and piece state
- file bytes live with storage providers, not on-chain
- `P256VERIFY` makes passkey-backed authorization practical in FEVM

## Primary Happy Path

1. User opens the Synapse demo.
2. User connects a root wallet.
3. User chooses Mainnet or Calibration from the navbar toggle.
4. App detects wallet chain, passkey session state, payment readiness, provider availability, and P-256 verification support for the selected network.
5. User creates or activates a passkey session.
6. User authorizes the passkey session with the root wallet for the selected network.
7. User selects files to upload.
8. User confirms the storage authorization with the device passkey.
9. App uploads through Synapse and commits chain-backed storage state.
10. App shows a receipt with dataset, PieceCID, provider, transaction, network, and verifier details.
11. Files, Datasets, Dataset Detail, and Activity views reconstruct the result from chain-backed state.

## Product Scope

Required product surfaces:

- Home dashboard
- Upload with Passkey
- Passkey Session
- Datasets
- Dataset Detail
- Files
- Activity
- Payments
- Network and unsupported states
- Developer Verification Checks
- Settings

Required cross-cutting behavior:

- navbar-accessible Mainnet/Calibration toggle on every page
- wallet chain and selected app network must stay visibly consistent
- passkey session authorization must be chain-specific
- chain-backed uploads must be the source of truth for files, datasets, and activity
- local storage may cache labels, preferences, and UI convenience data only
- technical receipts must expose `P256VERIFY`, synthetic signer, operation/proof details, dataset IDs, PieceCIDs, providers, and explorer links

## Live Demo Standard

The main happy path should be real end to end:

- real wallet connection
- real network selection
- real passkey creation/signing
- real on-chain P-256 verification path
- real Synapse SDK upload
- real chain-backed dataset/file/activity reconstruction

Simulation or fixtures are acceptable for:

- developer verification checks
- empty states
- unsupported network states
- rehearsal mode
- fallback presenter mode when a live dependency is unavailable

Simulation must be clearly labeled and should not replace the main happy path.

## Capability-Gated Delivery

Because `P256VERIFY` is in the release queue, the app should support three explicit modes:

- **Live Mode**: real wallet, passkey, Synapse SDK, on-chain P-256 verification, and chain-backed readback.
- **Pending Network Mode**: real wallet/network/passkey/readiness surfaces, but passkey-backed storage actions are disabled because the selected network does not yet expose the required P-256 verification path.
- **Demo Simulation Mode**: explicitly labeled fixture behavior for visual buildout, rehearsals, unsupported states, and developer verification checks.

This lets the team build the product shell, look and feel, wallet/network state, Synapse readiness, chain-backed views, and placeholder receipts now. When Calibration activates `P256VERIFY`, the app should switch to live behavior through capability detection and adapter configuration rather than a redesign.

Simulation must never be represented as the live FIP-0113 proof. The live claim is reserved for a real passkey proof verified through `P256VERIFY` and connected to a real Synapse upload/readback.

## Success Criteria

The demo is successful when a presenter can reliably show:

- Calibration happy path from passkey setup through uploaded file receipt
- Mainnet/Calibration toggle with correct chain-scoped state separation
- at least one file visible in Files, Datasets, Dataset Detail, and Activity from chain-backed state
- payment/readiness status before upload
- a technical receipt proving the P-256 verification path
- developer checks showing invalid proofs are rejected
- graceful handling for wrong chain, insufficient funds, unavailable providers, and unavailable verifier states

## References

- Product spec: `docs/specs/p256-passkey-sessions-demo.md`
- Design workspace: `design/README.md`
- Page inventory: `design/page-index.md`
- State model: `design/state-model.md`
- Full mockup review: `design/reviews/2026-05-12-full-page-generation-review.md`
