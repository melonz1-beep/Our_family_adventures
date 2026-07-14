# Our Family Adventures 9.2.0

This release is built on 9.1.9 and preserves the 9.1.7–9.1.9 features.

Fixes:
- Hard-clips saved scrapbook pages and every object so photos/cutouts cannot paint over the app header or dock.
- Resets a stale scrapbook route to Home on the first launch after upgrading.
- Adds a separate `chat.html` page. Chrome opens it as a separate window; the installed Android app launches it in Chrome using an Android intent, with an in-app Chat-page fallback.
- Shows the running version and build date in both locked and unlocked Admin views.
- Links the departure date to the selected arrival date so its calendar opens on the same month/year and cannot be earlier.
- Restores notification registration on startup when permission is already granted.
- Adds Firebase Web Push certificate key storage and diagnostics to Admin. Remote push requires the Web Push key from Firebase Console and a sender/backend that sends FCM messages to stored tokens.

Deploy every file and folder from the ZIP, including `chat.html`.
