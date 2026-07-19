# Our Family Adventures 10.3.2

Mobile containment release for Scrapbook Studio 2.0.

## Included fixes

- Fits the entire 900 × 675 scrapbook page inside the available phone screen.
- Prevents the fixed canvas from widening the mobile grid and clipping the editor.
- Hides the app header, navigation dock, drawer, and floating chat while Studio 2.0 is open.
- Keeps the editor above all legacy app controls.
- Recalculates the fit after rotation and visual-viewport changes.
- Repairs PWA installation by removing the missing badge asset from the required cache list.
- Pre-caches `app.js` so the installed app can open offline after a successful update.
- Adds an automated mobile layout and cache-manifest regression check.

## Cache

Service worker cache: `ofa-10-3-2`

After deployment, close every open app tab, reopen the site, and allow the new service worker to activate. If an installed copy still shows 10.3.1, remove it from the home screen once and reinstall it.
