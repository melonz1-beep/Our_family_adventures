# Our Family Adventures 9.0.2

Deployment-ready static PWA package.

## Included
- Dedicated trip workspaces with Meals, Grocery, Packing, Links, RSVP, Reservations, Budget, Weather, Maps, Itinerary, Attendees, Chat, Media and Scrapbook
- People-based assignment selectors
- RSVP choices with live names/counts and one response per user
- Per-user notifications
- Admin-only dashboard and admin code change (default 1218)
- Fixed-canvas scrapbook editor with drag, eight resize handles, free rotation, stickers, cutouts and layers
- Firebase Realtime Database, Authentication and Storage integration
- PWA manifest, service worker, push notification handler and responsive layout

## Publish
Upload every file and folder in this package to the repository root, commit, then publish with GitHub Pages or Firebase Hosting. Keep firebase-config.js configured for the intended Firebase project. Enable Email/Password Authentication, Realtime Database and Storage in Firebase. Deploy the included database and storage rules after reviewing them for your family permissions.

## Important
Live multi-user features require a valid Firebase configuration and deployed Firebase services. Browser push delivery also requires HTTPS, notification permission, and a configured push sender/server for remote notifications.
