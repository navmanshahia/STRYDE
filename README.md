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
- Shopping bag persists in browser localStorage. No orders or contact data are sent anywhere.
- Keyboard navigation, focus management for dialogs, reduced-motion support, WebGL graceful degradation and responsive layouts.

## Technology

- Semantic HTML5, CSS transitions / CSS 3D, vanilla ES2023, optional GSAP + ScrollTrigger from CDN, custom fragment / vertex WebGL shader (no framework), IntersectionObserver, localStorage.
- Product artwork is custom-generated for this original concept, bundled locally with the site. Visual mockup is a design guide only, not used as a page screenshot.
- GSAP and Google Fonts are progressive enhancements; the site remains functional offline without them.
- Reduced-motion visitors receive minimal animation.

## Why not install all 44 libraries?

The exhaustive list includes competing renderers and scroll engines. Stacking all of them adds visual conflict, high bandwidth use and runtime issues. This build selects complementary effects; a next phase could add a real high-poly GLB sneaker viewer with Three.js / React Three Fiber after a matching sneaker mesh is sourced or modelled.

## Demo behavior

Custom sizes and product selections work. Add to Bag and the cart operate locally. Checkout explains that payments require a backend. Newsletter validates an email address but does not collect it server-side. Product prices and performance statistics are fictional placeholders; not real goods for sale.