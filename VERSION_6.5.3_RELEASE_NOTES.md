# Our Family Adventures 6.5.3

Corrective iPhone/Safari and family-share build.

## Fixes
- Added iPhone Safari install help: Share → Add to Home Screen.
- Added iOS PWA meta tags for Home Screen behavior.
- Updated service worker cache to 6.5.3 and added notification click handling.
- Changed Firebase app data to use a shared family document instead of a private per-user document, so family testers do not see an empty app after signing in.
- Added migration from the existing local/private copy into the shared family document when the first populated device opens the build.
- Added stronger notification permission/test handling and app badge refresh.
- Added embedded Explore map display with saved pins and directions links.
- Hardened travel link saving and profile contact email saving.

## Important iPhone note
An iPhone cannot install this like a downloaded APK. Open the deployed site in Safari, tap Share, then Add to Home Screen.
