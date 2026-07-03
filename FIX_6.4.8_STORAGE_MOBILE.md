# Final 6.4.8 Storage + Mobile Fix

Changes included:
- Replaced home/splash lighthouse assets with the uncropped full poster image.
- Reduced duplicate image asset size to lower app storage usage.
- Updated service worker to cache only small core app files, not uploaded photos or large image assets.
- Clears older OFA cache names during activation.
- Keeps one floating chat bubble and removes floating notification/bell duplicates.
- Adjusted mobile hero sizing so the bottom wording is not cut off by the dock.
- Lowered emergency local photo fallback size if Firebase Storage is unavailable.

After deploy: open Chrome > three dots > Settings > Site settings > All sites > melonz1-beep.github.io > Clear storage, then reinstall the app icon if needed.
