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
