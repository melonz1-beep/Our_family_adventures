# Our Family Adventures 9.1.3 — Startup Repair

This build repairs the JavaScript startup failure in 9.1.2. The prior package referenced scrapbook draft and frame functions that were not defined, so the app stopped before `window.app` was created.

## Deploy
1. Delete the existing files in the GitHub repository.
2. Upload every file and folder from this package to the repository root.
3. Commit the upload and wait for GitHub Pages to finish deploying.
4. Open the site with `?v=9.1.3` appended once.
5. If an installed PWA still shows the old screen, remove it and reinstall after the browser version loads.

Version 9.1.3 includes the corrected external `app.js` and the same corrected script embedded in `index.html`.
