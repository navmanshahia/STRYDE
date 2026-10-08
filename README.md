# STRYDE V5 — Digital Atelier

A static, frontend-only original sneaker design experience with progressive 3D and cinematic interactions.

## What's included
- Original concept product art remains default, faithfully preserving STRYDE's white/silver/black/orange design.
- GLB technical reconstruction with 35 individually named mesh components and 102,104 triangles (generated from original procedural mesh). **Artistic reconstruction, NOT a photogrammetric scan.** Unseen sides are designed by interpretation.
- WebGL2 3D viewer with orbit, zoom, focus and illustrative X-ray transparency. Mobile activates 3D only upon user request.
- Three environments using light-weight CSS; animated product chapters, showroom presets, product film, optional audio.
- Design Studio: accent, upper, sole, laces, metallic or matte finishes, exoskeleton, stitching, energy intensity; local saves and share links.
- Material hotspots, product comparison, technology visualization, size estimator, prototype cart, favorites and quick-view.
- Experimental AR preview: loads `<model-viewer>` on request from a third-party CDN, only works on supported HTTPS devices; uses the concept GLB and may not be available on iOS/other devices.
- Responsive reduced-motion and GPU-aware fallback options. No shipping, payment, email, accounts or actual AR product calibration.

## Manual publishing
Copy the root source files, `images/`, `models/` and `assets/` to `public_html/STRYDE/`. No npm needed.

## cPanel Git Version Control deployment
This repository now includes root-level `.cpanel.yml` with deployment tasks. cPanel must **manage the repository** via Git Version Control, and the checked-out branch must be up to date and clean. To use Deploy HEAD Commit:

1. In cPanel → Git Version Control, create/locate a clone of `https://github.com/navmanshahia/STRYDE.git` **outside** the live website folder, e.g. `/home/USER/repositories/STRYDE`.
2. In cPanel Git Version Control select **Manage** → **Pull or Update from Remote** and ensure `main` is selected.
3. Open **Deploy** tab, choose **Deploy HEAD Commit**. It uses `.cpanel.yml` to copy the public files to `$HOME/public_html/STRYDE/`.
4. If Deploy is missing: confirm repository is cPanel-managed, not a bare repo, no uncommitted tracked changes, valid `.cpanel.yml` at repository root, account has Git deployment enabled by host. Some hosting tiers disable this control; we cannot enable it from repository files alone.
5. Linux paths are case sensitive. If `public_html/STRYDE` is itself a live Git checkout, migrate to separate source checkout to avoid conflicts. Do not run destructive resets on live content.

## Rebuilding models

```bash
python3 -m pip install numpy trimesh
python3 tools/enhance_model_v4.py
python3 tools/enhance_model_v5.py
```

The GLB uses authored PBR base colors and normal-based shading. It does not contain a scanned texture map. The provided renderer has a high-fidelity *concept* look but not studio-grade offline path tracing.

## Testing
`node --check` for each JS file. Local static file test `python3 -m http.server 8080` is recommended because GLB fetches require HTTP(S). Verify on real iPhone Safari and desktop after deploying. The AR viewer CDN and GPU render need real-device testing.

## Scope
Demo only. No actual payments, account registration, newsletter processing, order submission or physical footwear technical validation. All motion/performance examples are conceptual, not measured.
