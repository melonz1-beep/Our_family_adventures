# Our Family Adventures 9.1.1 — Startup Fix

This corrected package fixes the app remaining on **Starting…**.

## Deploy
1. Delete the existing repository files, but keep the repository itself.
2. Upload every file and folder from this ZIP to the repository root.
3. Commit the upload and wait for GitHub Pages to finish deploying.
4. On Android Chrome, open the site, go to Site settings, choose **Delete data**, then reopen the site.
5. If the app is installed, uninstall the old installed copy and install it again after the website opens correctly.

The service worker now uses a new 9.1.1 cache and will never substitute `index.html` for a missing JavaScript file.
