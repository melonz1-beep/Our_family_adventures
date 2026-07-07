# Our Family Adventures 6.6.3

Fixes installed-app update behavior so family members do not need the app link shared again after each patch.

## Included
- Bumps the service worker cache to `ofa-6-6-3-core`.
- Adds cache-busted script and CSS loading for all current app files.
- Includes 6.6.0, 6.6.1, 6.6.2, and 6.6.3 files in the service worker cache list.
- Forces the installed PWA to update its service worker and clear old `ofa-*` caches.
- Keeps network-first loading so Memories and Scrapbook receive the latest fixes after deployment.

After deployment, open the installed app once while online, then close and reopen it if the old screen is still showing.
