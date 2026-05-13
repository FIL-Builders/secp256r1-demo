# State Model

<!-- markdownlint-disable MD013 MD012 -->

The app should expose simple consumer-facing states while retaining detailed internal states for progress, debugging, and demo verification.

## Consumer-Facing Session States

```text
not_set_up
active
expired
revoked
not_available
wrong_network
```

## Internal Session States

```text
unsupported_browser
unsupported_network
wallet_disconnected
wallet_wrong_chain
no_credential
credential_created_not_authorized
authorizing
ready
signing
verifying
expired
revoked
failed
```

## Consumer-Facing Upload States

```text
idle
file_ready
confirming_passkey
uploading
verifying
stored
failed
cancelled
```

## Internal Upload States

```text
idle
file_selected
piececid_calculating
provider_selecting
intent_building
awaiting_passkey
proof_encoding
uploading_primary
pulling_secondaries
committing_onchain
verified
committed
failed
cancelled
```

## Mapping Rule

The default UI should show consumer states. Internal states should appear in:

- progress detail drawers
- upload receipts
- advanced verification views
- developer mode
- error details

