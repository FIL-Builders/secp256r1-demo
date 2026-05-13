# Implementation Plan

<!-- markdownlint-disable MD013 MD012 -->

## Planning Principle

Build the demo as a live, production-ish product. The happy path should use real wallet state, real passkey signing, real Synapse SDK operations, and real chain-backed file/dataset reconstruction.

Use simulation only where it makes the demo more reliable without weakening the core claim:

- developer verification checks
- seeded empty/error states
- unsupported-state previews
- fallback presenter mode

## Capability-First Strategy

The current blocker is that `P256VERIFY` is not active yet on public GLIF Mainnet or Calibration RPC at the checked blocks. The project should still build most of the app now by separating product UI from live network capabilities.

Required runtime modes:

- **Live Mode**: real wallet, passkey, Synapse SDK, on-chain P-256 verification, and chain-backed readback.
- **Pending Network Mode**: real wallet/network/passkey/readiness surfaces, but passkey storage actions are disabled because the selected network lacks the P-256 verification path.
- **Demo Simulation Mode**: explicit fixture mode for UI buildout, rehearsals, unsupported-state previews, and developer verification checks.

Required adapter seams:

- `P256VerifierAdapter`: real precompile verifier and simulated verifier.
- `StorageAdapter`: real Synapse storage adapter and fixture storage adapter.
- `ActivityAdapter`: chain-backed activity adapter and fixture activity adapter.

Build pages against capability state and adapter interfaces, not directly against hard-coded activation assumptions. When Calibration activates `P256VERIFY`, the switch should be:

1. `pnpm check:p256 -- --network calibration` returns `available`.
2. Calibration capability state flips from `pending-network` to `live`.
3. real verifier/storage/activity adapters replace simulated or disabled behavior.
4. receipts and page state move from `Simulation` or `Unavailable` to `On-chain verified`.

## Milestone 0: Integration Spike

Goal: prove the high-risk path before investing heavily in UI.

Scope:

- connect a wallet on Calibration
- check `P256VERIFY` activation on Calibration and Mainnet
- initialize Synapse SDK client for the selected network
- create or load a browser passkey credential with the local WebAuthn probe
- produce a local WebAuthn assertion over a storage authorization payload
- verify the signature through the intended P-256 verifier path
- upload one small file through Synapse
- retrieve enough chain-backed state to identify dataset, PieceCID, provider, and transaction/result
- define the capability model and adapter boundaries needed to continue while activation is blocked

Acceptance criteria:

- a developer can run one command or local script and complete a real upload on Calibration
- if activation is blocked, the script clearly reports the blocker and the app can enter Pending Network Mode
- output includes network, wallet, passkey credential label or ID, dataset, PieceCID, provider, and verifier result
- any unknowns in Synapse SDK, verifier contract, or WebAuthn payload shape are documented
- until `P256VERIFY` and the verifier path land, chain authorization remains simulated or unavailable

Exit decision:

- if the full path works, proceed to app foundation
- if one dependency is blocked, isolate it and define the smallest fallback that preserves the live demo claim

## Milestone 1: App Shell And Navigation

Scope:

- responsive app shell with sidebar and top navbar
- primary routes: Home, Upload, Datasets, Files, Activity
- secondary routes: Payments, Passkey Session, Settings
- hidden/developer route: Verification Checks
- navbar Mainnet/Calibration toggle
- wallet connect surface
- passkey session status surface
- passkey upload availability surface
- mode/status surface for live, pending-network, and simulation behavior

Acceptance criteria:

- every page shares the same network, wallet, and session state
- Verification Checks are hidden unless developer/demo mode is enabled
- changing Mainnet/Calibration updates all visible context labels
- wrong-chain state is visible before any storage action

## Milestone 2: Network, Wallet, And Session State

Scope:

- chain configuration for Mainnet and Calibration
- wallet connection and chain mismatch detection
- root wallet identity model
- passkey credential creation/loading
- passkey session authorization state per chain
- session expiry, extension, revoke, and test actions
- local cache for preferences, labels, and passkey credential metadata only

Acceptance criteria:

- Mainnet and Calibration passkey authorization states are independent
- passkey authorization lookup is scoped by credential, selected network, and connected root wallet, with no walletless wildcard state
- clearing local cache does not remove chain-backed datasets, pieces, payments, or authorizations
- session status survives page navigation and refresh where feasible
- session details expose root wallet, synthetic signer, credential fingerprint, expiry, permissions, network, and verifier details
- production logs must not include raw credential IDs, authenticator data, client data, or signatures

## Milestone 3: Synapse SDK Integration

Scope:

- client initialization by selected network
- provider discovery/readiness
- dataset creation/listing
- piece/file listing
- upload primitives
- retrieval primitives
- payment account and rail reads
- explorer link generation

Acceptance criteria:

- app can query chain-backed datasets and files for the connected wallet and selected network
- SDK errors are mapped to product states instead of raw stack traces
- provider and payment readiness can be checked before upload
- Mainnet and Calibration clients cannot leak state into each other
- fixture adapters can power clearly labeled demo data without changing page components

Sprint 4 status:

- `@filoz/synapse-sdk` is installed as the live SDK dependency.
- non-simulation storage adapters now run read-only Synapse provider and payment readiness checks by selected network and connected root wallet.
- the Payments page renders USDFC payment account, wallet balances, representative-upload cost, FWSS approval, provider counts, and blockers.
- the live adapter can list chain-backed datasets for the connected wallet; file/piece rows remain scheduled for the Datasets/Files sprint.
- `pnpm check:synapse -- --network calibration` can use a local private key env var for funded Calibration readiness testing without printing or committing the key.

## Milestone 4: Upload Flow

Scope:

- drag/drop and file picker
- upload details and estimate
- readiness checks for wallet, network, funds, providers, verifier, and passkey session
- passkey authorization prompt
- Synapse upload progress
- commit/verification progress
- success receipt
- retry and failure states

Acceptance criteria:

- a user can upload a small file on Calibration end to end
- receipt includes dataset, PieceCID, provider, network, transaction/explorer link, passkey authorization status, and `P256VERIFY` details
- failed passkey prompts, wrong chain, insufficient funds, missing providers, and unavailable verifier states are actionable
- upload result appears in Files, Datasets, Dataset Detail, and Activity from chain-backed state
- while `P256VERIFY` is unavailable, the same UI shows a disabled/pending passkey path and can show clearly labeled simulation receipts

## Milestone 5: Datasets, Files, And Activity Views

Scope:

- Datasets list
- Dataset Detail page with tabs
- global Files browser
- selected file detail rail
- Activity timeline
- refresh/reindex controls
- retrieval and schedule-removal actions where supported

Acceptance criteria:

- Datasets, Files, and Activity are reconstructed from chain-backed Synapse/Filecoin state
- local cache may improve labels and display order but is not the source of truth
- file detail exposes friendly details first and advanced PieceCID/transaction/provider/proof details second
- each event links back to the relevant dataset, file, provider, and explorer reference when available

## Milestone 6: Payments And Readiness

Scope:

- storage balance
- available funds
- lockup and runway
- token approval status
- deposit/top-up flow
- payment rail list and details
- readiness summary for upload

Acceptance criteria:

- user can see whether uploads can proceed before selecting a file
- insufficient funds state blocks storage actions with a clear top-up path
- payment rail internals remain available without dominating the default view
- payment state is scoped to the selected network

## Milestone 7: Developer Verification Panel

Scope:

- hidden developer/demo mode route
- negative verification checks:
  - replayed proof
  - modified PieceCID
  - modified provider
  - modified chain
  - wrong origin
  - wrong RP ID
  - expired session
  - revoked session
  - invalid P-256 signature
- simulation-first mode
- optional on-chain submission mode where safe and affordable
- JSON report export

Acceptance criteria:

- each invalid proof check shows `Expected: Rejected` and `Actual: Rejected` when behavior is correct
- failures explain the user-facing risk in one sentence
- developer details expose proof inputs and references without affecting the consumer flow

## Milestone 8: Demo Hardening

Scope:

- seeded demo data
- rehearsal checklist
- presenter runbook
- fallback mode labels
- loading/empty/error states
- mobile sanity pass
- browser compatibility pass for passkeys
- final network/provider/payment readiness check

Acceptance criteria:

- presenter can run the demo from a clean browser profile
- demo can recover from refresh, wallet reconnect, and network switch
- Calibration happy path is reliable
- Mainnet path is available when network/provider/payment readiness allows
- fallback states are clearly labeled and do not masquerade as the live happy path

## Build Order

Recommended order:

1. Integration spike
2. App shell and routing
3. Network/wallet/session model
4. Synapse SDK reads
5. Upload happy path
6. Chain-backed browsing views
7. Payments/readiness
8. Developer verification checks
9. hardening and runbook

This order intentionally validates the highest-risk integrations before polishing lower-risk UI surfaces.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| WebAuthn payload does not map cleanly to verifier input | Prove in Milestone 0; document exact payload, hash, and signature encoding. |
| Synapse SDK does not expose enough chain-backed listing state | Identify missing reads in Milestone 0 and add adapter/indexing layer if needed. |
| P256VERIFY is not active on Calibration yet | Build Pending Network Mode and simulation adapters now; switch to live adapters when `check:p256` passes and the verifier deployment is ready. |
| Mainnet readiness is unstable | Make Calibration the primary live path while keeping Mainnet fully represented and tested. |
| Provider or payment state blocks live upload | Add readiness checks, top-up path, seeded data, and presenter preflight. |
| Protocol details overwhelm product UX | Keep consumer labels primary and move internals into receipts/drawers/developer mode. |
| Local cache accidentally becomes source of truth | Centralize chain-backed reads and treat cache as labels/preferences only. |

## Commit Cadence

Commit and push after:

- each planning milestone document
- each integration spike result
- each working vertical slice
- each page implementation reaching a usable state
- each demo-hardening pass

Prefer small commits with clear messages over broad end-of-day snapshots.
