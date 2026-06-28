# Installation — Version 6.0.3

Upload all files to your GitHub Pages repository root.

Open the site with `?v=6.0.3` after committing so the service worker cache refreshes.

Firebase must have Authentication, Firestore, and Storage enabled. Add your GitHub Pages domain as an authorized domain.


## Version 6.0.3 Scrapbook Studio

This update adds working scrapbook layouts: Grid, Feature Photo, Collage, and Freeform. Select multiple photos from Memories, create a page, then drag photos, stickers, and text boxes around the page. Use the gold corner handle to resize. Each page supports frames, backgrounds, movable stickers, movable text boxes, JPEG export, and Print / Save as PDF.

After uploading to GitHub, open the app with `?v=6.0.3` to clear the old cache.

## Version 6.0.3 asset folders
This package includes the required folders:

- `assets/splash-background.png` for the opening splash screen.
- `assets/lighthouse-home.png` for the home page hero image.
- `assets/lighthouse-clean.png` and clean size versions for scrapbook/background use.
- `icons/favicon.png`, `icons/icon-192.png`, and `icons/icon-512.png` for browser and home-screen icons.

Upload the `assets` folder and the `icons` folder to the GitHub repository root with `index.html`, `style.css`, and `app.js`.

After uploading, open the app with:

`?v=6.0.3`

This refreshes the service worker cache so the new home page and splash images show.


## Version 6.0.3 Fix
This update fixes scrapbook photo saving on phones by compressing local photos, keeps the photo source inside saved scrapbook pages, removes cropped wording from the lighthouse splash/home background, and improves mobile card spacing. Open the app with `?v=6.0.3` after upload.


## Version 6.0.3 fixes
- Moves storage-full messages away from the Begin Our Journey button.
- Adds a clearer Firebase setup message when firebase-config.js still has placeholder values.
- Rebuilds the scrapbook draft editor so selected photos appear, can be rearranged before saving, and support frames, stickers, text boxes, background changes, bring-to-front, delete selected, PDF/print, and JPEG export.
- Improves phone spacing on the splash page, home page, cards, and bottom navigation.

After uploading, open the app with `?v=6.0.3` to clear the old cache.
