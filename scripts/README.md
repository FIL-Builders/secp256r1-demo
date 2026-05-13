# Scripts

<!-- markdownlint-disable MD013 MD012 -->

## `check-p256-precompile.mjs`

Checks whether Filecoin Mainnet and Calibration currently support `P256VERIFY` at `0x0000000000000000000000000000000000000100`.

Run:

```sh
pnpm check:p256
```

Useful variants:

```sh
pnpm check:p256 -- --network calibration
pnpm check:p256 -- --network mainnet
pnpm check:p256 -- --json
```

RPC overrides:

```sh
FILECOIN_MAINNET_RPC_URL=... FILECOIN_CALIBRATION_RPC_URL=... pnpm check:p256
```

## `check-synapse-readiness.mjs`

Checks Synapse provider and payment readiness for a funded local test wallet without
printing the private key.

Run:

```sh
pnpm check:synapse -- --network calibration
```

Private key env var lookup order:

```text
Calibration: SYNAPSE_CALIBRATION_PRIVATE_KEY, SYNAPSE_PRIVATE_KEY, RECALL_PRIVATE_KEY
Mainnet: SYNAPSE_MAINNET_PRIVATE_KEY, SYNAPSE_PRIVATE_KEY
```

RPC overrides use the same `FILECOIN_MAINNET_RPC_URL` and
`FILECOIN_CALIBRATION_RPC_URL` variables as the P-256 check. The script redacts
query strings and credentials when printing the RPC endpoint.
