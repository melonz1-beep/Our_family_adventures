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


## 9.0.1 startup-banner fix

This build ignores generic cross-origin `Script error.` events from browser/CDN scripts so they do not overwrite the app's real connection status. The service-worker cache name and asset query versions were also bumped. After deploying, refresh twice or remove the prior installed app once if a device continues serving 9.0.0.
