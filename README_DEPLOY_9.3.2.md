# Our Family Adventures 9.3.2

## Fixes
- Permanently removes deleted trips from familyTrips, privateTrips, tripMembers, tripAccess, and all trip collections.
- Adds Edit trip details for name, destination, dates, and Family/Private visibility.
- Floating chat now opens as an in-app overlay so the app remains available while chatting. A separate-page option remains available.
- Aligns Admin lock checkboxes.
- Restores Firebase Cloud Messaging token registration with an Admin field for the Firebase Web Push certificate (VAPID) key.
- Shows push permission and device-token status in Admin.

## Deploy
Upload every file and folder, replacing the existing repository files. Open `?v=9.3.2` once after GitHub Pages finishes deploying. The Realtime Database rules do not require a change from 9.3.1 for these UI fixes, provided the current rules permit the existing `pushTokens` path. If pushTokens is denied, add the supplied rules update before registering devices.
