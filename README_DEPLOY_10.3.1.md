# Our Family Adventures 10.3.1

Stability release for Scrapbook Studio 2.0.

## Included fixes
- Prevents render-triggered autosave loops and editor lockups.
- Uses one photo input handler to prevent duplicate frame uploads.
- Adds compact undo/redo snapshots with a bounded history.
- Adds local storage quota protection and session recovery.
- Compresses large images before saving.
- Uses requestAnimationFrame for smoother Android dragging.
- Removes accumulated editor event listeners when the editor closes.
- Syncs to Firebase only when scrapbook data changed.
- Restores the editor after app switching without reopening duplicates.
- Displays: “Tap + to add photos, stickers, or text” on an empty page.

## Cache
Service worker cache: `ofa-10-3-1`

After deployment, close all app tabs and clear the previous PWA cache or reinstall the PWA.
