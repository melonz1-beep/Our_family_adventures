# Home and Splash Photo Wording Fix

This package updates the home hero and splash screen images so wording in the lighthouse artwork is not cut off.

## What changed

- Home screen image now uses `background-size: contain` instead of `cover`.
- Splash screen image now uses `background-size: contain` instead of `cover`.
- Mobile overrides were corrected so phones also show the full image.
- Service worker cache name was updated to force Chrome/PWA to load the corrected files.

## After deploying

1. Upload/replace all files in the repo.
2. Open the site in Chrome.
3. If the old image still appears, clear site data or uninstall/reinstall the PWA once so the old cache is removed.
