# Our Family Adventures 9.0.0 — Deploy Ready

## Included
- Installable PWA for Android, iPhone/iPad, and desktop
- Firebase Authentication, Realtime Database, and Storage sync
- Trip-date meal planning with dining-out restaurant name, link, address, and meeting time
- Shared/private grocery and packing lists with family volunteer checkboxes/actions
- Assignments, family voting, voting analytics, notifications, and offline caching
- Scrapbook Studio with large infinite workspace, photo crop/fit, object/photo zoom, rotate, layers, transparent stickers, themes, frames, cutouts, collage creation, finalized pages, and print-to-PDF export

## Deploy
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Sign in: `firebase login`
3. From this folder run: `firebase deploy`
4. In Firebase Authentication enable Email/Password.
5. Confirm Realtime Database and Storage are enabled and deploy the included rules.

## Mobile installation
- Android/Chrome: menu → **Install app**
- iPhone/iPad/Safari: Share → **Add to Home Screen**

## Production push notifications
The app displays local service-worker notifications after permission is granted. Remote push from a server requires Firebase Cloud Messaging credentials and a trusted server/Cloud Function to send messages; never place server credentials in this client bundle.
