# GitHub Pages Deployment Steps

1. Unzip the final app package.
2. Upload the **contents** of the package to the GitHub repository root.
3. Do not upload the whole folder as a folder inside the repository.
4. Confirm these files are at the top/root level:
   - index.html
   - app.js
   - style.css
   - firebase-config.js
   - service-worker.js
   - manifest.json
   - firestore.rules
   - storage.rules
   - firebase.json
   - assets/
   - icons/
5. Confirm real images exist:
   - assets/splash-background.png
   - assets/lighthouse-home.png
   - assets/lighthouse-clean.png
6. Commit changes.
7. Open GitHub Pages URL with a fresh version query, for example:
   `?fresh=final630`
8. Delete old installed app from phone.
9. Clear Chrome site data for the GitHub Pages domain.
10. Reopen the GitHub Pages URL and reinstall.

## Service worker cache requirement
Every final deploy must change the cache name in `service-worker.js`, for example:

```js
const CACHE_NAME = 'our-family-adventures-final-630';
```

If the cache name is not changed, Android/iOS may keep showing an older app.
