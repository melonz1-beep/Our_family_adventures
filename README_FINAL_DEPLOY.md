# Our Family Adventures — Final Deploy Ready Package

This package contains the full app source plus final deployment documents.

## Upload these root files/folders to GitHub Pages
- `index.html`
- `app.js`
- `style.css`
- `firebase-config.js`
- `service-worker.js`
- `manifest.json`
- `firestore.rules`
- `storage.rules`
- `firebase.json`
- `firestore.indexes.json`
- `assets/`
- `icons/`

Do **not** upload only the `deploy-documents/` folder. The deploy-documents folder is for instructions and QA notes.

## Important fixes included in this package
- Firebase config is filled in for the `our-family-adventures` project.
- `window.OFA_FIREBASE_ENABLED = true` is enabled.
- Service worker cache name was changed to force Chrome/PWA refresh.
- Manifest start URL was updated with a fresh version query.
- Final deploy checklist documents are included in `deploy-documents/`.

## After upload
1. Commit the files to GitHub.
2. Open the GitHub Pages site with `?fresh=final-2026-06-29`.
3. Clear old Chrome site data if the old app still appears.
4. Delete and reinstall the phone PWA if the installed app shows an older version.
5. Use the QA checklist in `deploy-documents/04_QA_TEST_CHECKLIST.md`.
