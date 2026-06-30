# Our Family Adventures Version 6.2.7 Fixed

This package fixes the deployed app/PWA mismatch by using a new cache name and cache-busted file versions.

## What is included
- Real lighthouse photos in `assets/`
- Firebase config already embedded in `firebase-config.js`
- Realtime Database connection using anonymous sign-in
- Admin PIN `1218`
- Welcome Home interface
- Matching Chrome/PWA layout
- PWA manifest and service worker with cache name `our-family-adventures-v6-2-7`
- Trip settings, countdown, weather, itinerary, reservations, maps, budget, voting analytics, checklists, meals, notes, chat, activity log, scrapbook photo selection, drag/reorder, and JPEG/PDF export

## Deploy to GitHub Pages
Upload the CONTENTS of this folder to the root of your GitHub repository:

- index.html
- style.css
- app.js
- firebase-config.js
- service-worker.js
- manifest.json
- assets folder
- icons folder

Do not upload the folder itself.

## Firebase
In Firebase Authentication, enable Anonymous sign-in.

In Realtime Database rules for testing, use:

```json
{
  "rules": {
    "ourFamilyAdventuresV627": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

After upload, open your GitHub Pages URL with:

`?fresh=627`

Then delete the old installed app and install again from Chrome.
