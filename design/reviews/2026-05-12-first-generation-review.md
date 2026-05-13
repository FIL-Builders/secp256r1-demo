# First Generated Mockups Review

<!-- markdownlint-disable MD013 MD012 -->

Reviewed images:

- `design/pages/00-home-dashboard/images/home-dashboard-v1.png`
- `design/pages/01-upload-with-passkey/images/upload-with-passkey-v1.png`
- `design/pages/01-upload-with-passkey/images/upload-with-passkey-v2.png`

## Mapping

| Image | Source file | Page |
| --- | --- | --- |
| Home dashboard response | `home-dashboard-v1.png` | Home Dashboard |
| Upload response 1 | `upload-with-passkey-v1.png` | Upload With Passkey |
| Upload response 2 | `upload-with-passkey-v2.png` | Upload With Passkey |

## Overall Direction

The generated direction is strong. The app reads as a storage product first, with enough Filecoin/Synapse/passkey detail to support the FIP demo.

Keep:

- left app sidebar
- soft purple selected nav state
- clean white dashboard surface
- right rail with Passkey Session, Recent Activity, and On-Chain Verified
- storage balance and connected wallet cards
- Mainnet/Calibration switching
- passkey session status
- single prominent `Authorize & Upload with Passkey` CTA
- chain-backed upload language

## Home Dashboard Notes

`home-dashboard-v1.png` is a good direction for the Home page.

Keep:

- overview cards for storage balance, payment account, datasets, and pieces
- action cards for Upload, Manage Passkey, Add Funds, and View Datasets
- recent uploads table
- provider health summary
- right rail with session/activity/verification
- "All data is chain-backed" banner

Adjust next pass:

- reduce visual density slightly so Home feels less like an admin console
- use `Passkey uploads available` as the default navbar status, with `P256VERIFY at 0x0100` in tooltip/details
- make Calibration equally easy to select, not only Mainnet
- keep provider health secondary; storage/upload readiness should be primary
- avoid showing too many technical rows before the user asks for details

## Upload Page Notes

Both upload variants are useful.

Preferred base: `upload-with-passkey-v2.png`.

Why:

- cleaner upload flow
- strong trust chips
- clear Mainnet/Calibration network control
- good right rail
- direct CTA hierarchy
- footer line explicitly notes `Verified by P256VERIFY at 0x0100`

Pull from `upload-with-passkey-v1.png`:

- segmented Mainnet/Calibration control in the top area is clear
- "P-256 Precompile Active at 0x0100" communicates FIP value, but should be softened in default UI
- file card with provider/copies is useful after expansion

Adjust next pass:

- default navbar status should say `Passkey uploads available`; put `P256VERIFY at 0x0100` in tooltip or advanced details
- hide pending Dataset ID and provider internals behind `Advanced storage details` before upload
- keep PieceCID out of the default pre-upload card
- fix any generated text artifacts such as misspelled provider labels
- make upload progress and success receipt states explicit in the next image set
- include `View Details` on success to reveal PieceCID, dataset ID, transaction, synthetic signer, and verification method
- keep developer verification checks off the Upload page unless demo mode is enabled

## Prompt Updates Needed

Update Home and Upload prompts to request:

- consumer label `Passkey uploads available`
- tooltip/details text `P256VERIFY at 0x0100`
- visible but calm Mainnet/Calibration toggle
- advanced disclosure for protocol details
- success receipt state for Upload
- reduced technical density in Home

