# Our Family Adventures 8.0 Deploy Package

## What this package includes
- GitHub Pages 404/reload fix with `404.html` and Firebase hosting rewrite.
- Preserved app branding/assets and installable PWA configuration.
- Firebase Realtime Database sync for the shared app data.
- Firebase Storage upload support for Media Library when Firebase is connected.
- CRUD pages for Trips, People, Memories, Media, Scrapbook, Meals, Grocery, Packing, and Travel Links.
- Dedicated route/page for every major feature and every trip.
- Trip pages with Google Maps embed and weather panel.
- Role-aware edit visibility with Admin/Family/Guest/Child invite records.
- Admin dashboard with invite creation, migration, duplicate prevention, backup export/import, and push notification permission.
- Canvas-style Scrapbook Studio with draggable/resizable text, stickers, and photo boxes.
- Real-time collaboration through Firebase database listeners.
- PWA service worker cache version `ofa-8-0-0` for Android/iPhone install improvements.

## Deploy to GitHub Pages
1. Unzip this package.
2. Upload every file and folder to the root of your `Our_family_adventures` GitHub repository.
3. Commit the changes.
4. Open: `https://melonz1-beep.github.io/Our_family_adventures/`
5. If Android still opens an old version, close the app, clear site storage/cache, then reopen.

## Firebase notes
- Your existing `firebase-config.js` is included.
- Realtime Database rules and Storage rules are included for deployment.
- Enable Authentication in Firebase. Anonymous auth is used as fallback so family members can sync.
- For stricter production security, tighten `database.rules.json` after testing.
