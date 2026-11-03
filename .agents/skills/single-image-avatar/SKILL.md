---
name: single-image-avatar
description: Build a character and expressions from one illustration for Avatar Studio. Includes a pinned upstream real Live2D moc3 workflow and a local raster-puppet fallback; distinguishes their outputs and privacy requirements.
---

# Single image → character + expressions

Repository root is three directories above this skill folder. Read `docs/SINGLE_IMAGE_AVATAR.md` for commands and output contracts. Work in an ignored `private/` directory or outside the repository; never commit user artwork, generated models, credentials or personal filenames. A request to add this skill does not authorize uploading a future user's image.

## Choose the correct output

- If the user requests **Live2D / VTube Studio / .moc3**, use the fixed upstream linked in `docs/SINGLE_IMAGE_AVATAR.md` and its configuration/layer/prompt documents. Upstream code is not bundled or automatically installed. This is a third-party implementation, **not** the official Cubism Editor/compiler and not a guarantee of runtime compatibility. It writes `.moc3`, not editable `.cmo3`. Do not substitute the raster fallback without explaining the difference.
- If they want an **offline prototype directly in Avatar Studio**, use `scripts/create-avatar.py`: image + calibrated feature rectangles → `.avatar.json`. The existing player animates eyes, brows and a stylized mouth, with six expressions. This is a raster puppet, not Live2D. No neural generation, automatic face detection, segmentation, hidden-region reconstruction or Cubism output is included in this route.

## Real Live2D route

1. Run `python3 scripts/check-live2d.py`. With `--upstream /path/to/source`, it hashes and parses the selected pinned upstream source files without executing them. Without that option it checks discoverable dependencies only. Report missing dependencies, image-editing backend, See-through layers, licensed Core and target runtime. A passing check is not a passing model build.
2. Confirm authorization before executing third-party upstream scripts or accepting SDK terms where required. Install dependencies only in a separate environment. Preserve upstream licenses when obtaining code; Core, model weights, patches, image backends and user art have separate licenses. Do not redistribute unreviewed upstream historical notes.
3. Inspect the input illustration. Obtain the user's approval of the base artwork before making expression/occlusion variants. Follow upstream standard prompts; do not pretend a flat image already contains hidden hair, face, mouth interiors or separate limbs.
4. **Keep images local by default.** Upstream `rigkit.variants` can invoke a cloud-backed Codex image tool and `rigkit.seethrough fetch` defaults to external sites. Do not run either implicitly. Prefer user-provided aligned variants plus layered PSD, or separately authorized local generation/See-through. For local splitting use an explicit `--site local`; stop if unavailable. Never fall back to HF/ModelScope without specific permission for the images and service. Approval for one service does not cover another. Do not read or configure tokens automatically.
5. Before executing upstream steps, audit output paths: `split` may delete layer directories and VTS packaging may recursively replace its target; use fresh private directories and validate that configured paths remain inside them. Do not implicitly search/load unknown native libraries; use an explicit authorized Core path. With ready layers, follow estimate → check_art → prepare → build → preview. Inspect alignment, bare patches, mesh flips, mouth closure, smile eyes, brows, hair and movements. Stop at missing inputs or runtime instead of reporting success. Building a file alone is not validation.
6. VTS installation is a separate explicit user action/authorization, not part of generating a pack. Preserve existing VTS settings/models. Deliver the model and preview only when validated; otherwise label them unverified. Avatar Studio's browser currently cannot load `.moc3`.

## Offline raster route

Run the documented generator on a local static PNG/JPEG/WebP. Inspect `calibration.png` and correct all five normalized eye/brow/mouth boxes via `--landmarks`, generating to a fresh directory. Defaults are only a centered-face starting point, not detection. Inspect actual rendered neutral, smile, laugh, serious, frown and angry states and both mouth-closed/open states. Use `window.avatarAgent.loadAvatar(pack)` or the local file picker, then the existing script/player API. Report rectangular seams, inaccurate skin fill or unrealistic mouth if present; ask for a better frontal illustration or offer the real layered workflow. Do not call the output production-quality Live2D.

## Completion evidence

Report which route ran, exact output type, tests actually run, inputs/services used, privacy behavior, remaining manual calibration and unavailable dependencies. Do not promote upstream README claims into facts verified in this repository. See `docs/SINGLE_IMAGE_AVATAR.md` for current verification scope.
