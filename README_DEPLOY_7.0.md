# Our Family Adventures — Version 7.0 Deploy Release

Deploy the files in this ZIP to GitHub Pages or Firebase Hosting.

## What changed in 7.0

This release removes the patch-on-patch structure. The deploy folder contains only:

- `index.html`
- `style.css`
- `app.js`
- `firebase-config.js`
- `service-worker.js`
- `manifest.json`
- Firebase rules/config files
- `/assets`
- `/icons`

## Included features

- Firebase Authentication, Firestore, Storage SDK, Messaging SDK
- Realtime Firestore listeners after login
- Offline PWA cache
- Trips, reservations, budget, itinerary, Google Maps links, live weather search, nearby searches
- Travel links saved once and displayed once
- Meals with trip selection, generated date dropdown, meal type, private/shared status, grocery assignments and volunteers
- Scrapbook workspace with draggable photos, stickers, frames, text, backgrounds, edit/delete, print/PDF, export helper
- Memories with albums, timeline, multiple photos/video, delete and print
- Family chat with read/mark-read flow, reactions, typing indicator and badge counts
- Family profiles, invite records, roles and activity history
- Explore pins, saved places and nearby search
- Notifications read/unread, badge counts, activity feed and browser notification permission

## GitHub Pages deploy

1. Open the repository.
2. Delete the old files from the repository root.
3. Upload the contents of this ZIP.
4. Commit changes.
5. Open the GitHub Pages link in a private/incognito window first.
6. On phones, remove the old home-screen app and install again so the new service worker cache is used.

## Firebase notes

The existing Firebase project config is already included in `firebase-config.js`.
Make sure these Firebase products are enabled in the Firebase console:

- Authentication: Email/password provider
- Firestore Database
- Storage
- Cloud Messaging for push notification tokens/server pushes

Push notifications require HTTPS and may require additional VAPID/server setup for production Cloud Messaging sends.
