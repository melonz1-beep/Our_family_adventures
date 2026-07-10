# Our Family Adventures 9.0.3

## Corrections
- Removed the false/ambiguous startup syntax banner and refreshed the service-worker cache.
- Added a draggable floating chat bubble that opens a pop-out live chat feed.
- Fixed People assignment checklists in light and dark themes.
- Added visible notification permission controls in Settings.
- Rebuilt scrapbook object wrappers so photo and sticker resize handles remain usable.
- Added Freeform, 2-photo grid, 4-photo grid, layered collage, and feature-photo layouts.
- Kept the scrapbook canvas fixed while the surrounding workspace scrolls.
- Applied the Dusty Rose, Greenery, and Rose Gold palette throughout.
- Dark theme now uses a true black background with palette-colored text and controls.
- Admin navigation and page rendering are hidden from non-admin users. Fresh unsigned devices default to Family, not Admin.

## Deploy
Upload all files and folders to the repository root, replacing the previous version. Commit the changes, then wait for GitHub Pages to publish. On phones with an older installed version, close all app/browser tabs and reopen once so the 9.0.3 service worker replaces the old cached files.
