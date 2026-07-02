# Photo Crop Fix

This deploy package includes the final scrapbook/photo crop correction.

What changed:
- Scrapbook photos now use `object-fit: contain` instead of `cover`.
- Collage, feature, memory picker, and exported JPEG scrapbook pages keep the full photo visible.
- Text or wording printed on uploaded photos should no longer be cut off.
- The service worker cache name was changed so phones and Chrome load the corrected CSS/JS.

After deploy:
1. Upload/replace all files from this package.
2. Open the app in Chrome.
3. Refresh once.
4. If the installed app still shows the old photo crop, close it completely and reopen it. If needed, uninstall/reinstall the PWA shortcut so the new service-worker cache is used.
