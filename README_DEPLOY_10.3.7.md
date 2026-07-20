# Our Family Adventures 10.3.7

Scrapbook flow, persistence, mobile editing, and Memories thumbnail repair release.

## Included fixes

- Joins the full-screen editor to the app's Scrapbook hub, with visible My Drafts and Finalized Pages lists.
- Finalized pages open in view-only mode; drafts remain editable and are automatically attributed to the signed-in family member.
- Adds photos from app Media and phone uploads to the same page. Phone uploads are also saved to Media and Firebase when connected.
- Keeps remote photo URLs portable between devices while storing local-only image data in IndexedDB.
- Repairs Memories thumbnails using their Media records and Firebase Storage paths.
- Matches the app's dark theme and improves the mobile canvas, bottom quick tools, and photo containment.
- Adds Undo and Redo to mobile editing plus text cutouts, chat bubbles, fonts, font colors, fill colors, and no-fill text.
- Adds curated theme-aware photo arrangements and safer frame/photo replacement controls.
- Exports the full 900 × 675 page to JPEG or PDF.

## Cache

Service worker cache: `ofa-10-3-7`

After GitHub Pages deploys, close every app tab, open `?v=10.3.7`, and then reopen or reinstall the home-screen app.
