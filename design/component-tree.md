# Component Tree

<!-- markdownlint-disable MD013 MD012 -->

This is the recommended component organization for the final app implementation.

```text
apps/synapse-playground/src/components/

app-shell/
  app-sidebar.tsx
  app-layout.tsx
  account-menu.tsx
  network-selector.tsx
  storage-balance-card.tsx

upload/
  upload-page.tsx
  upload-hero.tsx
  upload-dropzone.tsx
  selected-file-card.tsx
  upload-details-card.tsx
  upload-primary-action.tsx
  upload-progress.tsx
  upload-success-receipt.tsx

passkey/
  passkey-session-card.tsx
  passkey-session-drawer.tsx
  passkey-setup-flow.tsx
  passkey-status-badge.tsx
  passkey-expired-state.tsx
  passkey-revoked-state.tsx

activity/
  recent-activity-card.tsx
  activity-page.tsx
  activity-row.tsx

files/
  files-page.tsx
  file-list.tsx
  file-detail-drawer.tsx

datasets/
  datasets-page.tsx
  dataset-card.tsx
  dataset-detail.tsx

verification/
  onchain-verified-card.tsx
  verification-details.tsx
  advanced-verification-panel.tsx
  developer-verification-checks.tsx
```

## Implementation Note

This tree is design guidance, not a hard module boundary. Preserve the existing Synapse app conventions if they conflict with these exact names.

