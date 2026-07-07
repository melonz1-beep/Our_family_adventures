# Our Family Adventures 8.0 — Deploy Package

Upload all files and folders in this ZIP to the root of your GitHub Pages repository or Firebase Hosting project.

## Important after uploading
1. Commit all changed files.
2. Open the live site in Chrome/Safari.
3. If an old version appears, clear site data or uninstall/reinstall the home-screen app. Version 8.0 uses a new service-worker cache: `ofa-8-0-0`.

## Included 8.0 fixes
- Each trip opens as its own Trip Workspace page.
- Trip workspace includes Google map, live weather link, dates, calendar export, itinerary, reservations, budgets, travel links, meals, groceries, packing and notes.
- Grocery and packing areas are separate and support group/private items.
- Private trips and private activity are hidden unless the user created them or is invited.
- Trip RSVP supports attending, can't make it, propose date and suggest location.
- Meal assignments use invited/attending family members.
- Forms clear after successful save.
- Travel link duplicate prevention and clear-after-save behavior added.
- Memories save with files and trip selection.
- Scrapbook restores freeform, collage grid, cutout mode, backgrounds, frames, stickers, text, resizing and drag/drop.
- Notification bell opens the notifications page.
- Trip History Map shows completed-trip pins from trip destinations.
- Admin dashboard restored with export/import and private activity history.
- Family member form clears after saving.
- Text/email page supports all members or selected members.
- Firestore listeners provide live updates when users are signed in.
- PWA cache updated for iPhone/Android.

## Firebase
This package keeps your existing Firebase config in `firebase-config.js`.
Users must sign in for true live shared updates. Local mode still works offline on one device.
