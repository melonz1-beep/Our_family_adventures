# Version 6.7.0 Consolidated Release

This release consolidates the stacked patch files into one active JavaScript file and one active CSS file.

## What changed
- `index.html` now loads only `style.css` and `app.js` for the app code.
- Older patch files remain in the ZIP for reference, but they are no longer loaded by the page.
- The service worker cache was bumped to `ofa-6-7-0-consolidated`.
- The service worker now uses a network-first update strategy for `index.html`, `app.js`, `style.css`, Firebase config, and manifest files.
- The service worker registration is now inside the HTML body instead of after the closing `</html>` tag.

## Why this matters
Loading every patch file at once caused duplicate renderers, duplicate event handlers, duplicate travel links, repeated meal layouts, and old scrapbook behavior to override newer fixes. This package gives the app one active code path.

## Deploy note
Upload the full ZIP contents to GitHub Pages and replace existing files. After deployment, open the app once while online, close it, then reopen it so the new service worker can take over.
