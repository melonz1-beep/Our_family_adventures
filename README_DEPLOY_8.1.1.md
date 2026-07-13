# Our Family Adventures 8.1.1

Fixes the stuck Starting status and broken Add/Save buttons caused by the form onclick attribute quoting issue.

## Deploy
1. Delete old GitHub Pages files or overwrite all files in the repository root.
2. Upload everything from this ZIP.
3. Commit changes.
4. Open the site in Chrome and refresh. If the installed app still shows the old version, remove and reinstall the home screen app.

## What was fixed
- Startup now clears from Starting to local Admin status even before Firebase login.
- Add/Save buttons on pages now call the save function correctly.
- Firebase initialization status is clearer.
- Cache version bumped to 8.1.1 so Android/iPhone do not keep the old broken script.
