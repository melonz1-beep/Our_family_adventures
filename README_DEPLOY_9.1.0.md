# Our Family Adventures 9.1.0

Version 9.1.0 is built directly from 9.0.7 and keeps the existing Firebase configuration, data structure, trip features, media, lists, voting, chat, and PWA files.

## Main changes

- Dedicated full-screen Scrapbook Studio with a fixed portrait/landscape canvas.
- Canvas containment prevents photos, stickers, text, handles, and frames from covering menus.
- Selection handles display only for the selected object.
- New photos, stickers, and text start centered on the canvas.
- Photo controls include resize, rotate, portrait/landscape/square, crop/fit, reposition inside frame, layering, duplicate, and delete.
- Vector cutouts: heart, star, flower, scalloped, circle, oval, hexagon, puzzle piece, and torn paper.
- Frame thickness, color, shadow, glow, and rounded controls.
- Creator-owned drafts automatically save when closing or leaving the editor and restore on return.
- Finalize publishes and locks the scrapbook page.
- Notification permission and preference state are retained locally and synchronized with app settings when signed in.
- App badge count automatically follows unread notifications.
- Admin navigation is hidden until an Admin account unlocks it with the PIN.
- Lock Admin button immediately removes admin controls.
- Admin automatically relocks after 15 minutes of inactivity.
- The PIN is never printed on user-visible pages.

## Deploy

Upload every file and folder in this package to the GitHub repository, replacing the prior deployment. Commit the changes and allow GitHub Pages to rebuild. The service-worker cache name is `ofa-9-1-0`, so installed devices receive the new files after reopening/refreshing the app.

## Important browser limitation

Persistent background push after the app/browser is fully closed requires a server-side Firebase Cloud Messaging sender and valid web-push subscription tokens. Version 9.1.0 retains permission/preferences and provides service-worker notification handling, in-app notifications, and badge updates; server-originated background delivery still depends on that Firebase messaging backend.
