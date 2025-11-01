# Thais — Nutrition Coach

Next.js app using **Open Food Facts** (free) + optional **USDA FDC** (free key) to power a nutrition coach:
- Search foods
- Add to a daily diary
- Macro/kcal goals by weight
- Recipe analysis
- **Barcode scanning** (native BarcodeDetector, with manual entry fallback)

## Quick start
```bash
npm install
cp .env.example .env.local   # optional (for USDA FDC)
# edit .env.local and set FDC_API_KEY=...
npm run dev
# open http://localhost:3000
```

### Routes
- `/` — search & diary (OFF/FDC)
- `/recipes` — paste ingredients → estimate macros
- `/scan` — scan EAN/UPC using camera; manual entry fallback

### Data sources
- OFF search: `GET /api/off/search?q=...` (no key)
- OFF product: `GET /api/off/product/:barcode` (no key)
- FDC search: `GET /api/fdc/search?q=...` (needs `FDC_API_KEY`)

> Educational use only. Verify nutrient data before recommendations.


## PWA / App Icons
- Manifest at `/public/manifest.webmanifest`
- Service worker `/public/sw.js` (basic cache-first for static assets)
- Icons in `/public/icons` (maskable + apple-touch)
- iOS splash screens included for common devices

### Install (Add to Home Screen)
- **iOS Safari**: Share → Add to Home Screen
- **Android Chrome**: You’ll be prompted to install (or use the ⋮ menu → Install App)

## Deploying to Netlify
1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Netlify, **New site from Git** → select repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Environment variables:** add `FDC_API_KEY` (optional, only if you want USDA FDC).
4. Netlify will auto-use the **Next.js Runtime** via `@netlify/plugin-nextjs` from `netlify.toml`.

**Notes**
- Your PWA files (`manifest.webmanifest`, icons, `sw.js`) are served from `/public` and will work over HTTPS.
- Camera (barcode scanner) requires HTTPS — Netlify provides it automatically.
- The free Open Food Facts endpoints can be called directly from the browser; USDA calls go through `/api/fdc/*` so your key stays private.
