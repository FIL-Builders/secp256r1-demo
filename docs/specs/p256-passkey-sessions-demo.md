# P-256 Passkey Sessions for Synapse Demo Spec

<!-- markdownlint-disable MD013 -->

## Intent

Build a polished final demo showing how FIP-0113, the FEVM `P256VERIFY` precompile at `0x0100`, makes passkey-backed Synapse storage authorization practical.

The demo should not be a standalone signature checker. It should be a real Synapse product flow:

```text
Root wallet owns funds and datasets
-> user registers a device passkey
-> root wallet authorizes that passkey as a Synapse session key
-> uploads, removals, and dataset operations are approved with the passkey
-> FWSS verifies the P-256 WebAuthn signature through P256VERIFY
-> Synapse storage proceeds through the normal provider, PDP, and payment rails flow
```

The intended audience is developers, protocol reviewers, and product stakeholders. The demo should make the FIP feel useful because it removes repeated wallet prompts from a real storage workflow while preserving on-chain authorization.

## Product Name

Use one of these names consistently in UI and docs:

- **Passkey Sessions for Synapse**
- **Upload with Passkey**
- **Passkey Storage Sessions**

Preferred demo title: **Passkey Sessions for Synapse**.

## Core Claim

After a root wallet funds and authorizes a session, a user should be able to manage Synapse warm storage with the same kind of authentication they already use for modern apps: Face ID, Touch ID, Windows Hello, Android screen unlock, or a hardware security key.

The contract-level reason this works is FIP-0113:

```text
P-256 WebAuthn signature
-> msg_hash || r || s || pubkey_x || pubkey_y
-> staticcall 0x0000000000000000000000000000000000000100
-> 32-byte 1 on success, empty bytes on failure
```

## Scope

This spec describes the full final demo, not a minimal MVP.

The final version must include:

- Browser passkey registration.
- On-chain passkey authorization by the root wallet.
- Passkey-backed signing for Synapse warm storage operations.
- Integration into the existing `apps/synapse-playground` upload experience.
- Mainnet and Calibration testnet support through a navbar network toggle.
- SDK support in `@filoz/synapse-core`, `@filoz/synapse-sdk`, and `@filoz/synapse-react`.
- Contract support for P-256/WebAuthn session-key verification.
- Feature detection for chains where `P256VERIFY` is available.
- Capability-driven live, pending-network, and simulation modes so most of the product can be built before `P256VERIFY` lands on Calibration.
- Clear UI states for unsupported, unregistered, expired, revoked, ready, signing, verifying, uploading, committed, and failed states.
- Full failure demonstrations that prove tampering and replay are rejected.
- Tests across crypto utilities, SDK encoding, contract verification, React hooks, and browser WebAuthn behavior.

## Delivery Modes And Activation Strategy

The app must be built so the live product experience can be developed before `P256VERIFY` is active on Calibration. The blocked feature should be isolated behind capability checks and adapters, not scattered through page components.

Required modes:

- **Live Mode**: real wallet, real passkey signing, real Synapse SDK operations, real on-chain P-256 verification, and real chain-backed dataset/file/activity readback.
- **Pending Network Mode**: real wallet/network detection, real passkey/WebAuthn probes where possible, real SDK readiness checks where possible, but passkey-backed storage actions are blocked because the selected network does not yet expose the required P-256 verification path.
- **Demo Simulation Mode**: explicitly labeled fixture flow for look and feel, rehearsals, unsupported-state previews, and developer verification checks. It must never be presented as the live happy path.

The default behavior while Calibration lacks `P256VERIFY` is Pending Network Mode, not a fake success path. The UI may still show the full upload, files, datasets, payments, and verification surfaces, but any simulated receipt or verification result must be labeled as simulated.

Switch-on criteria for Calibration:

1. `pnpm check:p256 -- --network calibration` returns `available`.
2. The deployed FWSS P-256 verifier path is reachable for the selected Calibration deployment.
3. A browser-generated passkey proof verifies through the deployed path.
4. A Synapse upload can be committed and read back from chain-backed state.

When those criteria pass, the app should switch by configuration/capability detection from Pending Network Mode to Live Mode without redesigning the UI.

## Non-Goals

The demo must not become:

- A generic P-256 signature verification page unrelated to Synapse.
- A toy vault that ignores storage providers, PDP, or Filecoin Pay.
- A WebAuthn login-only demo with no on-chain authorization.
- A replacement for root wallets. The root wallet remains the funding and recovery authority.
- A custodial flow. The passkey private key must never leave the authenticator.

## Existing Repo Fit

The implementation should build on these repo surfaces:

- `apps/synapse-playground`: user-facing demo app.
- `packages/synapse-core/src/session-key`: session-key abstractions.
- `packages/synapse-core/src/typed-data`: storage operation intent construction.
- `packages/synapse-core/src/sp`: Curio/SP request helpers that carry `extraData`.
- `packages/synapse-sdk/src/storage`: high-level upload, pull, commit, and removal flows.
- `packages/synapse-react`: React hooks used by the playground.
- `docs/src/content/docs/developer-guides/session-keys.mdx`: end-user developer docs.

The current repo already has `SessionKeyType = 'Secp256k1' | 'P-256'`. The full demo should make the `P-256` branch real.

## Implementation Constraints

These constraints are implementation-critical and should guide the first design pass.

### P-256 Passkeys Are Not EVM Accounts

A P-256 passkey must not be modeled as a generic viem `LocalAccount` that can sign arbitrary EVM transactions, EIP-7702 authorizations, or secp256k1 EIP-712 signatures. Platform passkeys are WebAuthn authenticators. They sign WebAuthn assertions with P-256 and return browser-scoped assertion data.

The correct abstraction is a storage-authorization signer:

```ts
interface StorageAuthorizationSigner<KeyType extends string> {
  keyType: KeyType
  rootAddress: Address
  syntheticSigner: Address
  hasPermission(permission: Permission): boolean
  hasPermissions(permissions: Permission[]): boolean
  syncExpirations(): Promise<void>
  signStorageIntent(intent: StorageAuthorizationIntent): Promise<Hex>
}
```

For secp256k1 session keys this can be backed by the existing viem client. For P-256 passkeys it must be backed by `navigator.credentials.get()` in browser code and by deterministic test adapters in tests.

The root wallet remains the normal EVM account. It is still used for wallet connection, funding, payment approvals, session authorization, extension, and revocation. The passkey only signs Synapse/FWSS storage authorization payloads.

### Upload State Source Of Truth

The app must not treat local storage as the source of truth for uploaded files or committed pieces.

On-chain Synapse/FWSS/PDP state is the source of truth for what has been committed:

- dataset ID
- provider ID and provider address
- piece ID
- PieceCID or piece commitment
- committed piece metadata
- dataset metadata
- payment rail and storage state
- proof or dataset status exposed by the existing Synapse contracts

Storage providers are the source of truth for retrievable file bytes. The bytes themselves are not stored on-chain.

Local storage may only be used as a convenience cache for browser-local state:

- passkey credential metadata
- selected network
- preferred authorization mode
- collapsed or expanded UI state
- recent labels for display

A clean browser profile connected to the same root wallet must be able to reconstruct uploaded datasets and pieces by querying chain and provider state. It may lose local-only labels or UI preferences, but it must not lose the uploaded-piece history.

If local cache and chain state disagree, the UI must prefer chain state and either discard or clearly mark stale local cache entries.

### Composite Operations Must Be First-Class

Synapse operations are not always one contract validation.

Examples:

- `CreateDataSetAndAddPieces` contains a create-dataset authorization and an add-pieces authorization.
- Multi-copy upload can require provider-specific commit authorizations for primary and secondary providers.
- Pull-to-secondary validation and later commit submission may reuse the same authorization.

The final demo should not accidentally create a separate passkey prompt for each internal validation. The storage authorization model must support a batch intent:

```ts
interface StorageAuthorizationIntent {
  version: 1
  chainId: number
  verifyingContract: Address
  payer: Address
  source: string | null
  batchNonce: bigint
  proofDeadline: bigint
  sessionExpiresAt: bigint
  operations: StorageOperationIntent[]
}
```

The challenge should commit to the entire batch. A verifier that is checking one sub-operation must be able to prove that sub-operation is included in the signed batch and that the synthetic signer has every required permission for that batch.

For single-operation flows, the batch contains one operation. For `CreateDataSetAndAddPieces`, the preferred final demo behavior is one passkey prompt over a batch that contains both the create-dataset and add-pieces operation intents.

### Contract Support Is Required

This cannot be implemented as an SDK-only feature. FWSS, or a verifier contract called by FWSS, must understand the versioned P-256/WebAuthn proof envelope and must call `P256VERIFY` at `0x0100`.

If FWSS only performs secp256k1 recovery over the `bytes signature` field, passkey uploads will fail even if the SDK can create valid WebAuthn assertions.

### Trusted Origin And RP Configuration

The contract verifier must get expected origin and RP ID values from trusted configuration, not from the untrusted proof alone.

Acceptable approaches:

- Immutable verifier configuration for a single hosted demo origin and RP ID.
- Owner-governed allowlists of `originHash` and `rpIdHash`.
- Devnet-only configuration that includes `localhost` origins for local demos.

The proof may include offsets into `clientDataJSON`, but it must not be able to self-declare which origin or RP ID should be trusted.

## User Experience

### First Visit

The user sees the standard Synapse playground with wallet connection, network selection, payments account, and warm storage sections.

The navbar must include a network toggle with exactly these primary options:

- **Mainnet**: Filecoin mainnet, chain ID `314`.
- **Calibration**: Filecoin Calibration testnet, chain ID `314159`.

The toggle should be visible whether or not a wallet is connected. Calibration should be the safer default for demos unless a deployment explicitly opts into mainnet by configuration.

Changing the navbar toggle must update:

- Wagmi/viem active chain.
- RPC endpoint.
- Synapse chain configuration.
- FWSS, PDPVerifier, Payments, SPRegistry, SessionKeyRegistry, and token addresses.
- P-256 precompile availability status.
- Provider lists and dataset queries.
- Uploaded dataset and piece lists from chain state.
- Payment account balances and approvals.
- Passkey authorization status for the selected chain.

The toggle must never imply that authorizing a passkey on one chain authorizes it on the other. Mainnet and Calibration authorization state is separate even when the same browser passkey credential is reused.

If the active chain does not expose the `P256VERIFY` precompile, the passkey panel must show a disabled state:

```text
Passkey sessions require P256VERIFY at 0x0100 on this network.
```

This is the Pending Network Mode state. The app should still allow the user to inspect wallet state, payment readiness, provider readiness, existing chain-backed datasets/files where available, and simulated demo flows if demo mode is explicitly enabled. Passkey-backed storage actions must remain disabled until the capability check passes.

The rest of the playground must continue to work in wallet-signing mode.

If the connected wallet is on a different chain than the navbar selection, the app must show a clear chain mismatch state and provide a switch-network action. Storage actions must be disabled until the wallet and navbar agree.

### Passkey Setup

The connected user sees a **Passkey Session** panel with:

- Current root wallet address.
- Current chain.
- Active network name: Mainnet or Calibration.
- P-256 precompile availability.
- Session status.
- Session expiry.
- Granted permissions.
- Synthetic signer ID derived from the P-256 public key.
- Credential label, such as "MacBook Touch ID" or user-editable "Work laptop".

Primary actions:

- **Create Passkey**
- **Authorize**
- **Extend**
- **Revoke**
- **Test**

The setup flow:

1. User clicks **Create Passkey**.
2. Browser calls `navigator.credentials.create()`.
3. Authenticator creates an ES256/P-256 credential.
4. App extracts:
   - `credentialId`
   - `pubkey_x`
   - `pubkey_y`
   - COSE algorithm
   - authenticator data from the registration response
   - RP ID hash
   - initial sign counter, if present
5. App derives a synthetic session signer address:

   ```text
   credentialIdHash = keccak256(credentialId)

   syntheticSigner = address(uint160(uint256(keccak256(abi.encode(
     "synapse.p256.session.v1",
     credentialIdHash,
     pubkey_x,
     pubkey_y
   )))))
   ```

6. User reviews permissions and expiry.
7. Root wallet sends one authorization transaction on the selected chain to authorize the synthetic signer for the selected FWSS permissions and expiry.
8. App stores public credential metadata locally.
9. Session becomes **Ready**.

The same credential may be authorized on both Mainnet and Calibration, but each chain requires its own authorization transaction, expiry, permission set, and revocation.

### Upload With Passkey

The existing upload UI should gain an authentication mode indicator:

```text
Authorization: Passkey session
```

Upload flow:

1. User drops a file.
2. Synapse calculates the PieceCID.
3. Synapse selects provider contexts.
4. Synapse builds the exact storage intent:
   - one or more operation types
   - chain ID
   - FWSS verifying contract
   - payer/root wallet
   - payee/provider for each provider-specific operation
   - dataset ID or client dataset ID for each operation
   - PieceCID bytes for each operation
   - piece metadata for each operation
   - dataset metadata where relevant
   - operation nonce and batch nonce
   - proof deadline
   - expiry
   - source namespace
5. Browser asks for passkey confirmation.
6. Authenticator signs the WebAuthn assertion.
7. SDK encodes the versioned P-256/WebAuthn proof into the existing `extraData` signature field.
8. Curio/SP receives the same shape of storage request it already expects, with a larger proof payload.
9. SP submits the PDP/FWSS transaction.
10. FWSS validates the P-256 proof using `P256VERIFY`.
11. Piece is committed on-chain.
12. UI shows the provider, dataset, PieceCID, transaction hash, and verification method.

Upload history shown in the UI must be populated from chain-backed dataset and piece queries. Local storage may enrich the display, but it must not be required to know which pieces have been committed.

The final UI must make the authorization path visible without becoming noisy:

```text
Stored successfully
Authorized by passkey
Verified by P256VERIFY at 0x0100
```

### Multi-Copy Upload

The full version must support the normal Synapse multi-copy flow:

```text
store on primary provider
-> pre-sign authorization for secondary commits
-> secondary providers pull from primary
-> commit primary and successful secondaries
```

Passkey signing must still avoid duplicate prompts where the current SDK avoids duplicate wallet prompts. If one passkey assertion can safely authorize both pull validation and commit for a secondary, reuse it. If separate assertions are required for different intents, the UI must group the prompts clearly and avoid surprising repeated modals.

For the final demo, one user-visible upload action should normally produce one passkey prompt. If an implementation needs more than one prompt for a legitimate protocol reason, the UI must show the reason before opening the second prompt.

### Removal And Dataset Operations

The full demo should cover more than upload:

- Add pieces to an existing dataset.
- Create a new dataset and add pieces.
- Schedule piece removal.
- Delete dataset where supported by FWSS.
- Extend session expiry.
- Revoke the passkey session.

Each operation must use the same passkey session model and show the same verification result pattern.

### Failure Demonstrations

The playground should include a compact **Verification Checks** section for demo presenters.

It must be possible to trigger or view these cases:

- Wrong passkey fails.
- Modified PieceCID fails.
- Modified provider/payee fails.
- Modified chain ID fails.
- Modified FWSS contract address fails.
- Replayed operation nonce or batch nonce fails.
- Expired session fails.
- Revoked session fails.
- Wrong origin fails.
- Wrong RP ID fails.
- Invalid P-256 signature returns failure without reverting inside the precompile.

These checks can be implemented as test-mode buttons or a separate developer panel that is hidden by default.

## WebAuthn Requirements

### Credential Creation

The app must request an ES256 credential:

```text
publicKeyCredParams: [{ type: "public-key", alg: -7 }]
```

The request must also require user verification for the final demo:

```text
authenticatorSelection.userVerification = "required"
attestation = "none"
```

If a passkey already exists for the connected root address and chain, the UI should pass the existing credential ID through `excludeCredentials` to avoid accidental duplicate registration.

The credential must be created for the app's RP ID:

- `localhost` during local development.
- the production demo domain for hosted deployments.

The app must not support cross-origin or wildcard RP IDs.

### Credential Parsing

Registration parsing must:

- Decode CBOR authenticator data using a structured parser.
- Require COSE `kty = EC2`.
- Require COSE `alg = -7`.
- Require COSE curve `crv = 1` for P-256.
- Extract 32-byte `x` and `y`.
- Reject compressed points.
- Reject missing or incorrectly sized coordinates.
- Store only public credential metadata.

Credential metadata stored locally:

- `credentialId`
- `credentialIdHash`
- `pubkey_x`
- `pubkey_y`
- `syntheticSigner`
- `rpId`
- `rpIdHash`
- `label`
- `createdAt`
- `lastUsedAt`
- `lastSignCount`, when meaningful
- `chainIds` where the app has used or offered this credential
- `rootAddress`

Authorization metadata must be stored separately from credential metadata and keyed by:

```text
rootAddress || chainId || syntheticSigner
```

This prevents a valid Calibration authorization from being displayed or used as a Mainnet authorization.

The app must never store or request private key material.

### Assertion Signing

For authentication, the app must call `navigator.credentials.get()` with a challenge derived from the Synapse storage intent.

The request must pass:

- `allowCredentials` containing the selected credential ID.
- `userVerification = "required"` for the final demo.
- the expected RP ID for the current deployment.

The signed WebAuthn hash is:

```text
sha256(authenticatorData || sha256(clientDataJSON))
```

The P-256 precompile verifies this 32-byte hash.

The frontend must parse the DER ECDSA signature into fixed-width 32-byte `r` and `s`. It must reject malformed DER and out-of-range `r` or `s` before submitting.

### Challenge Binding

The challenge must bind the passkey approval to a precise Synapse action.

Recommended challenge bytes:

```text
keccak256(abi.encode(
  "synapse.passkey.storage.v1",
  chainId,
  fwssAddress,
  payer,
  syntheticSigner,
  permissionsHash,
  intentHash,
  batchNonce,
  proofDeadline,
  sessionExpiresAt
))
```

Where:

- `intentHash` commits to the full `StorageAuthorizationIntent`, including every sub-operation.
- `permissionsHash` commits to the exact set of permissions required by the batch.
- A single-operation flow uses one sub-operation and one permission.
- A batch flow, such as `CreateDataSetAndAddPieces`, includes every sub-operation and every required permission.

`operationHashes` and `permissionHashes` must be de-duplicated and deterministically ordered before hashing. The SDK and contracts must share one ordering rule, and tests must include out-of-order and duplicate arrays.

WebAuthn places the challenge in `clientDataJSON.challenge` as base64url without padding. The verifier must compare the JSON challenge string to the base64url encoding of the expected challenge bytes, not to a hex string.

The verifier must also reject assertions where:

- `clientDataJSON.type` is not exactly `webauthn.get`.
- `clientDataJSON.origin` is not an allowed origin for the verifier configuration.
- `proofDeadline < block.timestamp`.

### Authenticator Data Checks

The on-chain or helper-contract verifier must check:

- `authenticatorData.length >= 37`.
- RP ID hash equals expected `sha256(rpId)`.
- User Present flag is set.
- User Verified flag is set for the demo default.
- Backup eligibility/state flags are either recorded or explicitly ignored with documentation.
- Sign count is parsed from bytes 33 through 36 as a big-endian `uint32`.
- Sign count increases when the authenticator reports a meaningful non-zero counter.

If sign count is zero for both old and new assertions, the verifier may accept it but the UI must not claim clone detection.

### Origin Checks

The verifier must bind the assertion to the expected origin.

For the final demo:

- Local development origin: `http://localhost:<port>` may be supported only in dev mode.
- Hosted demo origin: exact HTTPS origin only.

The contract should avoid general-purpose JSON parsing if possible. It may accept precomputed offsets into `clientDataJSON` as long as tests prove the exact fields are checked and tampering fails.

Offset-based checks must include both offset and length for `type`, `challenge`, and `origin`. The verifier must bounds-check every offset before slicing.

## Contract Requirements

### P256VERIFY Interface

Contracts must call:

```text
0x0000000000000000000000000000000000000100
```

Input:

```text
msg_hash(32) || r(32) || s(32) || pubkey_x(32) || pubkey_y(32)
```

Success:

```text
0x0000000000000000000000000000000000000000000000000000000000000001
```

Failure:

```text
empty bytes
```

The contract wrapper must treat malformed inputs and invalid signatures as authorization failure, not as an app-level panic. It must only accept the call as valid when returned data is exactly 32 bytes and decodes to `1`.

### Backward Compatibility

Existing secp256k1 session keys and wallet EIP-712 signatures must continue to work.

The P-256 proof should be encoded inside the existing `bytes signature` position in FWSS `extraData` where practical. The verifier should distinguish:

- 65-byte secp256k1 signature.
- Versioned P-256/WebAuthn proof envelope.

Dispatch must fail closed. A malformed P-256 envelope must not fall back to secp256k1 recovery, and an arbitrary non-65-byte blob must not be treated as authorized.

Recommended P-256 proof envelope:

```solidity
struct P256WebAuthnProof {
  bytes4 magic;              // "P256" or equivalent version marker
  uint16 version;            // start at 1
  bytes authenticatorData;
  bytes clientDataJSON;
  uint256 typeOffset;
  uint256 typeLength;
  uint256 challengeOffset;
  uint256 challengeLength;
  uint256 originOffset;
  uint256 originLength;
  bytes32 r;
  bytes32 s;
  bytes32 pubkeyX;
  bytes32 pubkeyY;
  bytes32 credentialIdHash;
  bytes32[] operationHashes;
  bytes32[] permissionHashes;
  bytes32 intentHash;
  bytes32 permissionsHash;
  uint256 batchNonce;
  uint32 signCount;
  uint64 proofDeadline;
  uint64 sessionExpiresAt;
}
```

The exact encoding may differ, but it must be versioned and testable.

The verifier must enforce bounded proof sizes before looping over dynamic fields. The final demo should set explicit limits, such as:

- maximum `clientDataJSON` bytes
- maximum `authenticatorData` bytes
- maximum operation hashes per proof
- maximum permission hashes per proof

The limits should be high enough for normal multi-copy uploads but low enough to prevent accidental or malicious gas blowups.

### Session Authorization

The root wallet remains the identity and payer.

The passkey public key is represented in the existing session permission model by a synthetic signer address derived from the credential and public key.

Verification flow:

1. Decode the storage operation `extraData`.
2. Reconstruct the current sub-operation hash.
3. Reconstruct the expected WebAuthn challenge.
4. Decode the P-256 proof envelope.
5. Verify `magic`, `version`, bounds, and proof deadline.
6. Verify `clientDataJSON.type`, `clientDataJSON.challenge`, and `clientDataJSON.origin`.
7. Verify RP ID hash and authenticator flags.
8. Compute `syntheticSigner` from `credentialIdHash`, `pubkeyX`, and `pubkeyY`.
9. Recompute `intentHash` from the proof's batch fields and verify it matches the signed challenge.
10. Recompute `permissionsHash` from `permissionHashes` and verify it matches the signed challenge.
11. Verify the current sub-operation hash is included in `operationHashes`.
12. Check `SessionKeyRegistry.authorizationExpiry(payer, syntheticSigner, permission) >= block.timestamp` for every permission in `permissionHashes`.
13. Verify every relevant registry expiry is at least `sessionExpiresAt`.
14. Compute the WebAuthn signed hash: `sha256(authenticatorData || sha256(clientDataJSON))`.
15. Call `P256VERIFY`.
16. Update sign-count state if applicable.
17. Authorize the FWSS operation.

If sign counters are enforced on-chain, store them by at least:

```text
payer || credentialIdHash
```

and reject non-zero counters that do not strictly increase across distinct WebAuthn assertions.

The sign-counter logic must be batch-safe. If the same WebAuthn assertion is intentionally reused to validate multiple sub-operations in the same signed batch, the verifier must not reject the later sub-operation only because the sign count equals the value accepted for the earlier sub-operation. Acceptable approaches include:

- Validate the full batch once in an outer FWSS path, then pass an internal authorization result to sub-operation checks.
- Store the last accepted assertion hash alongside the last sign count and allow the exact same assertion hash to be reused only for sub-operations included in the same signed intent.
- Disable on-chain sign-counter enforcement for the demo and clearly document that replay protection is provided by FWSS operation nonces and proof deadlines.

Do not implement a naive `signCount > lastSignCount` check if the same proof can be embedded in more than one internal validation.

### Replay Protection

Replay protection must include:

- Existing FWSS nonces or `clientDataSetId` values.
- Operation-specific nonce for AddPieces.
- Batch nonce for multi-operation passkey assertions.
- Chain ID.
- FWSS verifying contract.
- Payer/root wallet.
- Provider/payee where relevant.
- Dataset ID or client dataset ID.
- Piece data and metadata.
- Credential ID hash.
- Intent hash.
- Permissions hash.
- Proof deadline.
- Session expiry.

The same proof must not authorize a different piece, provider, chain, contract, or operation.

### Precompile Detection

The SDK or app must provide a feature check:

```text
staticcall 0x0100 with a known valid P-256 vector
```

The call data must be exactly the 160-byte FIP-0113 input. Detection must require both:

- returned data length is exactly 32 bytes
- returned word equals `1`

Do not treat `success == true` as sufficient. On networks without the precompile, calling an empty address may still return successfully with empty data.

The UI must disable passkey sessions if the call does not return 32-byte `1`.

Contracts should not assume every devnet, calibration, or mainnet environment has FIP-0113 active until the chain configuration says so.

Feature detection must run independently per selected chain. The app should cache the result by `chainId`, but a cached Mainnet result must not be reused for Calibration or vice versa.

### Capability Model And Adapter Boundaries

Pages must consume a network capability model instead of directly branching on hard-coded environment flags.

Suggested shape:

```ts
type DemoRuntimeMode = 'live' | 'pending-network' | 'simulation'
type CapabilityState = 'unknown' | 'available' | 'unavailable' | 'error'

interface NetworkCapabilities {
  chainId: number
  network: 'mainnet' | 'calibration'
  mode: DemoRuntimeMode
  p256Precompile: CapabilityState
  fwssP256Verifier: CapabilityState
  synapseStorage: CapabilityState
  providers: CapabilityState
  payments: CapabilityState
  blockers: string[]
  checkedAt: number
}
```

The implementation should isolate unfinished or network-gated behavior behind adapters:

```ts
interface P256VerifierAdapter {
  detect(chainId: number): Promise<CapabilityState>
  verify(input: P256VerifyInput): Promise<P256VerifyResult>
}

interface StorageAdapter {
  readiness(chainId: number, rootAddress: Address): Promise<StorageReadiness>
  upload(input: StorageUploadInput): Promise<StorageUploadReceipt>
  listDatasets(input: ChainScopedQuery): Promise<DatasetSummary[]>
  listFiles(input: ChainScopedQuery): Promise<FileSummary[]>
}

interface ActivityAdapter {
  listActivity(input: ChainScopedQuery): Promise<ActivityEvent[]>
}
```

Required adapter implementations:

- `PrecompileVerifierAdapter`: calls the real `P256VERIFY` path.
- `SimulatedVerifierAdapter`: returns fixture verification results and marks every result as simulated.
- `SynapseLiveStorageAdapter`: uses real Synapse SDK and chain/provider reads.
- `FixtureStorageAdapter`: powers demo-mode look and feel with clearly labeled fixture data.
- `ChainBackedActivityAdapter`: reconstructs activity from chain-backed state.
- `FixtureActivityAdapter`: powers demo-mode activity with clearly labeled fixture data.

Consumer page components must render from capabilities and adapter results. They should not need to know whether Calibration activation has landed beyond the mode/status they receive.

Simulation rules:

- simulated receipts must show `Simulation` or `Demo data`
- simulated verification must not use `On-chain verified` as the primary status
- developer verification checks may default to simulation until live verifier support exists
- the main happy path must switch to live adapters as soon as capability checks and deployed verifier support pass

## SDK Requirements

### synapse-core

Add P-256 passkey authorization helpers under:

```text
packages/synapse-core/src/session-key/
```

Required exports:

- `fromP256Passkey(...)`
- `createP256StorageAuthorizer(...)` or equivalent storage-authorization signer.
- `deriveP256SyntheticSigner(...)`
- `encodeP256WebAuthnProof(...)`
- `decodeP256WebAuthnProof(...)`
- `createStoragePasskeyChallenge(...)`
- `detectP256Precompile(...)`
- WebAuthn parsing helpers, kept browser-safe and dependency-conscious.

Core code must remain environment agnostic. Direct browser APIs such as `navigator.credentials` should be isolated behind an adapter interface or a browser-specific module.

Suggested adapter shape:

```ts
interface PasskeyCredentialStore {
  getCredential(rootAddress: Address, chainId: number): Promise<P256Credential | null>
  saveCredential(credential: P256Credential): Promise<void>
  removeCredential(id: string): Promise<void>
}

interface PasskeySigner {
  create(options: CreatePasskeyOptions): Promise<P256Credential>
  sign(options: SignPasskeyChallengeOptions): Promise<P256WebAuthnProof>
}
```

Do not require the P-256 passkey branch to implement arbitrary viem account signing methods. It only needs to sign supported storage authorization intents.

The credential store API may expose chain-specific convenience methods, but the implementation must distinguish credential identity from chain authorization. A browser credential can be reused across Mainnet and Calibration; session expiry, permissions, balances, datasets, providers, and on-chain authorization cannot.

### Typed Data And extraData

The existing typed-data operation definitions should remain the canonical operation-intent source.

The P-256 path must produce operation hashes equivalent to the existing secp256k1 EIP-712 path wherever FWSS currently expects those hashes.

For composite flows, the P-256 path must additionally produce a deterministic batch intent hash. The batch hash must be stable across SDK, tests, and contracts, and each FWSS validation must be able to check membership of the sub-operation it is currently validating.

The final `extraData` must remain compatible with SP APIs:

- Create dataset.
- Add pieces.
- Create dataset and add pieces.
- Schedule removals.
- Delete dataset.
- Pull authorization for secondary providers.

### synapse-sdk

`Synapse.create()` and `new Synapse(...)` must accept P-256 storage authorizers without requiring them to be viem wallet clients:

```ts
sessionKey?: SessionKey<'Secp256k1'>
storageAuthorizer?: StorageAuthorizationSigner<'P-256'>
```

It is acceptable to expose this as a discriminated `auth` option instead, as long as secp256k1 session keys and P-256 passkey sessions are distinct at the type level.

Storage operations must work with P-256 sessions without app authors needing to manually pass proofs.

The SDK must expose clear errors:

- `P256PrecompileUnavailableError`
- `PasskeyCredentialNotFoundError`
- `PasskeyAuthorizationExpiredError`
- `PasskeyUserCancelledError`
- `PasskeyVerificationRejectedError`
- `UnsupportedAuthenticatorError`

Errors should preserve causes where useful and should not leak credential IDs in messages.

### synapse-react

Add hooks for the demo app and downstream developers:

- `useP256PrecompileAvailable`
- `usePasskeySession`
- `useCreatePasskeySession`
- `useAuthorizePasskeySession`
- `useExtendPasskeySession`
- `useRevokePasskeySession`
- `usePasskeyUpload`

Hooks must integrate with existing Wagmi and React Query patterns.

Query invalidation must update:

- session authorization state
- warm storage datasets
- chain-backed upload, dataset, and piece lists
- payment account where relevant
- all of the above when the navbar network changes

### Playground App

Add a full passkey session UI to:

```text
apps/synapse-playground/src/components/
```

Suggested component layout:

```text
components/passkey-session/
  passkey-session-panel.tsx
  passkey-session-status.tsx
  create-passkey-dialog.tsx
  authorize-passkey-dialog.tsx
  revoke-passkey-dialog.tsx
  verification-checks.tsx
  auth-mode-selector.tsx
```

The upload section should support:

- Wallet mode.
- Passkey session mode.
- Disabled passkey mode with explicit reason.
- Progress steps for passkey signing and on-chain verification.
- Network-aware state derived from the navbar toggle.

Use the existing UI system and lucide icons. Do not turn the demo into a landing page.

## Service Provider And Curio Requirements

Curio/SP APIs should not need to understand passkeys if they already pass `extraData` through to contracts and use gas estimation for validation.

However, the full demo must verify:

- SP request body accepts larger P-256/WebAuthn proof payloads.
- SP request size limits are documented and high enough for the chosen proof envelope.
- SP logs and errors do not leak full `clientDataJSON`, credential IDs, or signatures unnecessarily.
- `estimateGas` validation works with the P-256 proof envelope.
- Pull endpoints continue to treat repeated `extraData` idempotently where applicable.
- Errors from failed P-256 verification surface in a user-readable way through the SDK.

## Security Requirements

The demo must be honest and secure enough to explain publicly.

Required checks:

- P-256 public key is on curve through precompile verification semantics.
- `r` and `s` are range-checked before submission where practical.
- Signature envelope is versioned.
- Challenge binds to exact operation details.
- `clientDataJSON.type` is verified.
- Origin and RP ID are verified.
- User presence is required.
- User verification is required by default.
- Replay protection is enforced.
- Expired and revoked authorizations fail.
- Wrong credential fails.
- Wrong chain or contract fails.
- Existing wallet and secp256k1 session paths remain unaffected.

Recommended checks:

- Enforce low-s signatures at the application or contract layer if the chosen policy requires non-malleability.
- Track sign counters when authenticators provide meaningful counters.
- Add a clear recovery path: root wallet can revoke passkey sessions.

Privacy requirements:

- Do not send passkey metadata to analytics.
- Do not log credential IDs, raw `clientDataJSON`, raw authenticator data, or signatures in production mode.
- Display only truncated public identifiers.

## Visual And Product Requirements

The demo should feel like an operational developer tool, consistent with the existing Synapse playground.

Required UI states:

- Wallet disconnected.
- Wrong network.
- Mainnet selected.
- Calibration selected.
- Wallet chain differs from navbar chain.
- P-256 precompile unavailable.
- Passkey unsupported by browser.
- No passkey registered.
- Passkey registered but not authorized.
- Passkey authorization expired.
- Passkey revoked.
- Passkey ready.
- Waiting for passkey confirmation.
- User cancelled passkey prompt.
- Uploading to primary provider.
- Pulling to secondary providers.
- Committing on-chain.
- Verified by `P256VERIFY`.
- Failed verification.

The UI must show enough technical detail for the FIP demo:

- `0x0100` precompile status.
- Active network name and chain ID.
- Credential public key fingerprint.
- Synthetic signer address.
- Root wallet address.
- Granted permissions.
- Expiry.
- Operation hash.
- Transaction hash.
- Dataset ID and PieceCID.
- Chain-backed upload source, such as dataset and provider references.

Avoid showing raw megabyte-size proof fields in the main UI. Put detailed proof fields behind a developer disclosure.

## Demo Script

The final demo should support this exact presenter script:

1. Open Synapse Playground.
2. Use the navbar toggle to select Calibration.
3. Connect root wallet.
4. Confirm the wallet is switched to Calibration.
5. Show funded payment account.
6. Show `P256VERIFY` available on Calibration.
7. Create a passkey with device authentication.
8. Authorize the passkey for Synapse storage operations on Calibration.
9. Upload a file with passkey authorization.
10. Show no wallet signature prompt occurred during upload.
11. Show the PieceCID, dataset, provider, and transaction.
12. Open the verification details and show `P256VERIFY at 0x0100`.
13. Try a replay or modified PieceCID and show rejection.
14. Use the navbar toggle to switch to Mainnet.
15. Show that the same passkey is not automatically authorized on Mainnet.
16. Either authorize it separately on Mainnet or leave passkey mode disabled with an explicit reason.
17. Revoke the Calibration passkey authorization.
18. Switch back to Calibration and show another passkey operation fails.
19. Switch back to wallet mode to show backward compatibility.

Optional mainnet presenter path:

1. Open Synapse Playground.
2. Use the navbar toggle to select Mainnet.
3. Show funded payment account.
4. Confirm `P256VERIFY`, FWSS P-256 verifier support, providers, and payment approvals are available on Mainnet.
5. Run the same passkey upload flow with an explicit mainnet confirmation step before any paid action.

## Testing Requirements

### Unit Tests

Required test coverage:

- COSE P-256 public key extraction.
- Rejection of non-ES256 credentials.
- Rejection of malformed CBOR.
- DER ECDSA signature parsing.
- Rejection of malformed DER.
- Base64url challenge encoding and decoding.
- Synthetic signer derivation.
- WebAuthn hash construction.
- P-256 proof envelope encoding and decoding.
- P-256 precompile feature-detection helper.
- Empty-return precompile detection failure on unsupported networks.
- Typed-data operation hash equivalence with existing secp256k1 path.
- Deterministic batch intent hash ordering and duplicate rejection.

### Contract Tests

Required contract tests:

- Valid WebAuthn P-256 proof authorizes CreateDataSet.
- Valid proof authorizes AddPieces.
- Valid proof authorizes SchedulePieceRemovals.
- Expired permission fails.
- Revoked permission fails.
- Wrong synthetic signer fails.
- Wrong challenge fails.
- Wrong WebAuthn type fails.
- Wrong origin fails.
- Wrong RP ID hash fails.
- Wrong authenticator flags fail.
- Bad JSON offsets fail.
- Empty or malformed `P256VERIFY` return data fails.
- Oversized proof fields fail before expensive verification.
- Reused assertion inside one authorized batch does not fail naive sign-counter checks.
- Replay fails.
- Tampered PieceCID fails.
- Tampered metadata fails.
- Tampered provider fails.
- Tampered chain ID fails.
- Invalid P-256 signature fails without precompile revert.
- Existing secp256k1 signatures still pass.

### Browser Tests

Use Playwright virtual authenticators where available.

Required scenarios:

- Create passkey.
- Authorize passkey.
- Upload with passkey.
- Toggle Mainnet and Calibration from the navbar.
- Chain mismatch between wallet and navbar disables storage actions.
- Calibration authorization does not count as Mainnet authorization.
- Mainnet authorization does not count as Calibration authorization.
- New browser profile reconstructs uploaded datasets and pieces from chain state.
- Stale local upload cache does not override chain state.
- Cancel passkey prompt.
- Use wrong passkey.
- Expired session UI.
- Revoke session UI.
- Unsupported browser UI.
- Unsupported network UI.

### Integration Tests

Run against a devnet or calibration-like environment with:

- FIP-0113 active.
- FWSS P-256 verifier support deployed.
- At least one usable service provider.
- Payments account funding.
- End-to-end upload, retrieval, removal, and revocation.

If the target network does not yet have FIP-0113 active, tests must run against a devnet that does. The demo UI must make this condition explicit.

Network integration tests must cover both configured public networks when available:

- Mainnet chain ID `314`.
- Calibration chain ID `314159`.

If one network lacks FIP-0113, FWSS P-256 verifier support, providers, or funding, the test should assert the disabled state rather than pretending the network is usable.

## Documentation Requirements

Update docs after implementation:

- Session keys guide: add P-256 passkey session flow.
- Synapse SDK guide: show `sessionKey: passkeySession`.
- Synapse React guide: show passkey hooks.
- Storage upload pipeline guide: explain passkey authorization in `extraData`.
- Contract docs: describe `P256VERIFY` verification path.

Docs must explicitly explain that WebAuthn signs:

```text
sha256(authenticatorData || sha256(clientDataJSON))
```

and that `P256VERIFY` verifies that resulting 32-byte hash.

## Acceptance Criteria

The demo is complete when all of the following are true:

- A clean browser profile can create a passkey and authorize it from the root wallet.
- A user can upload a file through Synapse warm storage using only passkey confirmation after authorization.
- The upload commits on-chain through the normal Synapse provider/PDP/FWSS path.
- The UI shows that the storage action was verified through `P256VERIFY` at `0x0100`.
- The navbar can switch between Mainnet and Calibration.
- Network-specific balances, datasets, providers, precompile status, and passkey authorization state update after switching.
- Upload history is reconstructed from chain-backed dataset and piece queries, not local storage alone.
- A passkey authorization on one network is not treated as authorization on the other network.
- The same uploaded piece can be retrieved successfully.
- A passkey can authorize at least one removal or dataset management action.
- Replayed or tampered proofs fail.
- Expired and revoked sessions fail.
- Existing wallet-signing and secp256k1 session-key flows still work.
- The app disables passkey mode on networks without the precompile.
- Tests cover crypto parsing, proof encoding, contract verification, SDK flows, and browser behavior.
- The presenter script can be completed without manual console commands.

## Implementation Workstreams

This section is written as a handoff for agents or contributors.

### Workstream 1: Contracts

Own:

- P-256/WebAuthn verifier library.
- FWSS integration.
- P-256 proof envelope decoding.
- Synthetic signer authorization checks.
- Sign-count storage, if implemented on-chain.
- Contract tests.

Do not break existing secp256k1 authorization.

### Workstream 2: synapse-core

Own:

- P-256 session-key types.
- Passkey credential parsing.
- Proof envelope encoding.
- Challenge construction.
- Synthetic signer derivation.
- Feature detection for `0x0100`.
- Unit tests for all crypto and encoding helpers.

Keep browser-only APIs behind adapters.

### Workstream 3: synapse-sdk

Own:

- Accepting P-256 session keys in `Synapse`.
- Using P-256 sessions in storage operations.
- Error types.
- Upload, pull, commit, removal, and dataset operation compatibility.
- SDK tests.

Do not fork the storage flow into a separate passkey-only pipeline unless contract requirements force it.

### Workstream 4: synapse-react And Playground

Own:

- React hooks.
- Passkey session panel.
- Upload auth-mode integration.
- Verification checks panel.
- Browser-state handling.
- Playwright tests.

Use the existing playground design language.

### Workstream 5: SP/Curio Compatibility

Own:

- Verifying larger proof payloads pass through APIs.
- Gas estimation behavior.
- Error surfacing.
- Integration tests with real provider endpoints.

Prefer pass-through compatibility over SP-side WebAuthn awareness.

### Workstream 6: Docs And Demo Readiness

Own:

- Developer docs.
- Presenter script.
- Deployment instructions.
- Devnet/calibration readiness notes.
- Known limitations.

The final demo should be runnable from the repo without requiring the presenter to know internal contract details.

## Open Questions

- Will FWSS be upgraded directly, or will a separate verifier/helper contract be used behind FWSS?
- Should the existing `SessionKeyRegistry` be reused with synthetic signer addresses, or should a dedicated P-256 registry be deployed?
- Which target network will first expose FIP-0113 for the demo?
- Should the public hosted demo default to Calibration, Mainnet, or remember the last selected network?
- Should sign counters be enforced on-chain, off-chain, or only displayed?
- Which exact hosted origin and RP ID will be used for the public demo?
- Should low-s normalization be enforced as policy even though FIP-0113 does not require it?
- What is the maximum acceptable `extraData` size for Curio/SP endpoints and contract calldata?

## Risks

- WebAuthn JSON validation on-chain can become complex or gas-heavy.
- Some platform authenticators report zero sign counters, limiting clone detection.
- FIP-0113 availability may lag on the desired demo network.
- Mainnet and Calibration may not have matching FWSS verifier deployments or provider readiness at the same time.
- Existing FWSS contracts may need a meaningful authorization-path upgrade.
- Browser WebAuthn support requires HTTPS except localhost.
- Large `extraData` payloads may expose assumptions in SP APIs or gas estimation.

## Success Definition

The demo succeeds if a viewer understands this in under one minute:

```text
Synapse already has storage, PDP, payments, and session keys.
FIP-0113 lets Synapse use the passkeys built into phones and laptops as session keys.
That means real Filecoin storage operations can be authorized with Face ID, Touch ID, Windows Hello, or a hardware key, while FWSS verifies the approval on-chain through P256VERIFY.
```
