# Installation — Version 5.0.6

Upload all files to your GitHub Pages repository root.

Open the site with `?v=5.0.6` after committing so the service worker cache refreshes.

Firebase must have Authentication, Firestore, and Storage enabled. Add your GitHub Pages domain as an authorized domain.


## Version 5.0.7 Scrapbook Studio

This update adds working scrapbook layouts: Grid, Feature Photo, Collage, and Freeform. Select multiple photos from Memories, create a page, then drag photos, stickers, and text boxes around the page. Use the gold corner handle to resize. Each page supports frames, backgrounds, movable stickers, movable text boxes, JPEG export, and Print / Save as PDF.

After uploading to GitHub, open the app with `?v=5.0.7` to clear the old cache.

## Version 6.0.1 asset folders
This package includes the required folders:

- `assets/splash-background.png` for the opening splash screen.
- `assets/lighthouse-home.png` for the home page hero image.
- `assets/lighthouse-clean.png` and clean size versions for scrapbook/background use.
- `icons/favicon.png`, `icons/icon-192.png`, and `icons/icon-512.png` for browser and home-screen icons.

Upload the `assets` folder and the `icons` folder to the GitHub repository root with `index.html`, `style.css`, and `app.js`.

After uploading, open the app with:

`?v=6.0.1`

This refreshes the service worker cache so the new home page and splash images show.
