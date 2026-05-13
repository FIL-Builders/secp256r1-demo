# Synapse Passkey Demo Design Workspace

<!-- markdownlint-disable MD013 MD012 -->

This folder is the design source for the P-256 passkey Synapse demo.

Use it to track:

- the pages/screens the app should include
- reference images for each page
- image-generation prompts for page mockups
- implementation notes that should carry from design into product
- reviewed external design resources

The current product target is defined in:

```text
docs/specs/p256-passkey-sessions-demo.md
```

## Structure

```text
design/
  README.md
  style-guide.md
  page-index.md
  component-tree.md
  state-model.md
  combined-prompts/
    00-home-dashboard.md
    01-upload-with-passkey.md
    ...
  reference/
    consumer-app-ui-layout.md
  prompts/
    shared-page-generation-prompt.md
  reviews/
    2026-05-12-full-page-generation-review.md
  pages/
    01-upload-with-passkey/
      README.md
      prompt.md
      images/
        README.md
    ...
```

Each page folder should contain:

- `README.md`: page purpose, expected states, and implementation notes
- `prompt.md`: prompt to generate or revise the page mockup
- `images/`: generated mockups, references, and screenshots for that page

## Design Principles

- Build the actual storage app, not a marketing landing page.
- Lead with the consumer file-storage workflow, then disclose protocol details.
- Keep Synapse storage state chain-backed, not local-only.
- Make passkey authorization feel simple, with on-chain verification visible in receipts and details.
- Support Mainnet and Calibration through a navbar network toggle.
- Keep root wallet, passkey session, network, storage provider, dataset, and PieceCID available enough for a technical demo.
- Avoid UI copy that over-explains obvious controls.
- Prefer calm storage-product UI over a protocol console.

## Reviewed References

- [Consumer App UI Layout](reference/consumer-app-ui-layout.md): reviewed and revised from the imported design resource in Downloads.
- [Component Tree](component-tree.md): suggested implementation component structure.
- [State Model](state-model.md): consumer and internal app states.
- [Full Page Generated Mockups Review](reviews/2026-05-12-full-page-generation-review.md): imported screenshot mapping, preferred variants, and implementation fixes.

## Ready-To-Run Prompts

Use [combined-prompts](combined-prompts/) when executing image or UI generation prompts.

Each combined prompt is standalone and includes:

- shared product/design context
- reviewed consumer UI direction
- page requirements
- page-specific generation instructions

Recommended first prompt:

```text
design/combined-prompts/01-upload-with-passkey.md
```
