# STRYDE® — MOVE BEYOND

An original, high-motion sneaker concept storefront created for a portfolio. **Frontend-only:** no account service, payment processor, inventory server, or email backend is connected.

## Live preview / local run

Zero build steps and no npm required:

```bash
cd STRYDE
python3 -m http.server 8080
```

Open http://localhost:8080 (or open `index.html` directly). Copy **all** files in this folder to a public web directory on cPanel, Netlify, GitHub Pages, etc. Relative paths work in subfolders.

## Interactions

- Animated layered hero with WebGL shader, particles, orbital effects and cursor-driven 2.5D shoe parallax (3D transform). Mobile touch support.
- Four colorway collections, interactive product quick-view, size picking, customizer (finish/colorway/size), and bag with quantity edits.
- Search, mobile menu, newsletter concept form, cinematic motion experience overlay, scroll entrance animation, editorial sections, animated statistics, smooth section navigation.
- Native WebGL2 procedural sneaker engineering scan with true 3D geometry, drag-to-orbit, zoom, and configurable energy accents (works without CDN dependencies).
- Shopping bag persists in browser localStorage. No orders or contact data are sent anywhere.
- Keyboard navigation, focus management for dialogs, reduced-motion support, WebGL graceful degradation and responsive layouts.

## Technology

- Semantic HTML5, CSS transitions / CSS 3D, vanilla ES2023, optional GSAP + ScrollTrigger from CDN, custom fragment / vertex WebGL shader (no framework), IntersectionObserver, localStorage.
- Product artwork is custom-generated for this original concept, bundled locally with the site. Visual mockup is a design guide only, not used as a page screenshot.
- GSAP and Google Fonts are progressive enhancements; the site remains functional offline without them.
- Reduced-motion visitors receive minimal animation.

## Why not install all 44 libraries?

The exhaustive list includes competing renderers and scroll engines. Stacking all of them adds visual conflict, high bandwidth use and runtime issues. This build selects complementary effects; a next phase could add a production-grade high-poly GLB matching the bespoke sneaker imagery, and upgrade the chassis view to a real material-accurate Three.js / React Three Fiber configurator.

## Demo behavior

Custom sizes and product selections work. Add to Bag and the cart operate locally. Checkout explains that payments require a backend. Newsletter validates an email address but does not collect it server-side. Product prices and performance statistics are fictional placeholders; not real goods for sale.

## STRYDE Digital Atelier V2 — High detail GLB upgrade

- An **original digitally modeled** AERODYNE ONE sneaker is included in `models/aerodyne-one.glb` (15 independent PBR materials / meshes; reproducible source in `tools/build_shoe.py`). This is not a photogrammetric or production scan and should not be marketed as such.
- `glb-engine.js` loads the glTF 2.0 binary and renders the geometry in native WebGL2, so no bundler or network 3D dependencies are necessary. The original artwork stays visible as an accessible fallback when WebGL2/model delivery fails.
- Separate live material controls: accent lighting, knit upper, shoelaces, rubber sole, and matte/reflective finishes. Change them in the Custom Lab. Save a style in localStorage or share a URL encoding the material selections.
- Live 3D hero scene, Custom Lab viewer with orbit/zoom, engineering exploded GLB view, and dedicated full-screen 3D viewer, all synchronized to current material settings.
- Scroll and camera choreography has a native animation fallback and enhances via GSAP ScrollTrigger when loaded. Reduced-motion preference disables automatic motion.
- Production commerce and newsletter sending are intentionally **not** connected. This is still a portfolio frontend demonstration.
- Host as static files with `index.html`, `models/` and source assets in the same directory. A local `python3 -m http.server 8080` is recommended over `file://` because the GLB is fetched.

## STRYDE V3 — Immersive motion lab and showroom

This remains a **frontend-only portfolio concept**, not a real checkout or engineering specification.

### New features
- A responsive 3D showroom (#showroom) lazily loads the same authored GLB and lets visitors select four concept colorways, orbit/zoom and four camera presets. All material changes synchronize with the main Custom Lab. The models are not four separate product scans; they are variations of the original AERODYNE ONE silhouette.
- The WebGL2 technology GLB adds per-component highlight modes (upper, cushioning, traction), scroll-synchronized part separation and manual explode/reassemble controls.
- Real-time hero kinetics are rendered on Canvas2D with spring attraction, simulated gravity, collisions and pointer repulsion. This is **2D interactive particle physics behind the 3D model**, not rigid-body simulation of 3D rocks.
- Interactive engineering field-notes visualize cushioning, airflow and traction. Their values are user-controlled **illustrations**, not measured performance claims.
- Animated in-page scene transitions, magnetic buttons, cursor lighting and product-card spotlight micro-interactions progressively enhance the base layout.
- Reduced-motion support disables continuous motion, and fallback artwork remains when WebGL2 or GLB fetching is unavailable.

### Code and hosting
- `experience-v3.js` owns the hero physics, showroom selector/cameras, illustration lab, transitions and micro-interactions.
- `glb-engine.js` owns the model, camera presets, mesh highlighting and part separation.
- `styles.css` includes the STRYDE V3 layouts and responsive overrides (the source additions are also mirrored in `tools/experience-v3.css` for iteration).
- `tools/test_v3.py` performs desktop/mobile non-WebGL interaction checks.
- Use any static server (including cPanel) that serves `.glb` as `model/gltf-binary` or `application/octet-stream`, preserves the `models/` directory, and supports same-origin fetch. The visual fallback loads even if GLB fails.
- Real accounts, checkout, orders, inventory, email delivery and server payments are still intentionally **not connected**.


## STRYDE V3.1 — Safari crash prevention

- Detect iPhone, iPad, touch and low-memory devices before styles and scripts load. These devices default to a static cinematic product presentation rather than allocating four simultaneous GLB scenes, an independent shader and an animated lab.
- Showroom and studio 3D are **opt-in** with visible buttons; only one high-detail GLB WebGL context is allowed at a time. Switching viewers explicitly releases vertex buffers and the previous context. The full-screen engineering viewer is also opt-in.
- Mobile WebGL context creation uses low-power settings, antialiasing off, and DPR capped to 0.85; automatic continuous GLB rendering and animations are paused. The image fallback stays visible if WebGL is unavailable.
- Hero background shader is disabled in mobile safe mode, particle simulation starts paused, and lab visuals draw statically until interacted with. The storefront, product cards, cart and material selectors still work.
- Desktop stays in fully animated mode. The Safari crash shown by the user suggests GPU/memory pressure, but remote iOS crash logs are needed to verify the cause.