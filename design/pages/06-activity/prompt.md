# Activity Prompt

<!-- markdownlint-disable MD013 MD012 -->

```text
Design an Activity page for Synapse.

Use `images/activity-v1.png` as the visual reference when available.

Show a timeline of chain-backed and local UI events:
- dataset created
- upload initiated
- file committed
- payment confirmed
- passkey authorized
- passkey revoked
- verification check failed
- network switched

Each chain-backed event should show network, tx hash, provider, dataset, PieceCID when available, and explorer link.

Use compact timeline rows with icons and status colors. Default labels should be friendly:
- File committed
- Upload initiated
- Payment confirmed
- Dataset created
- Passkey session active

Protocol details should be one click away.

Use demo-current timestamps or relative labels consistently. Avoid stale absolute dates unless they are clearly sample data.
```
