# Version 6.4.5 Firebase Storage Fix

This package updates the app so photos upload to Firebase Storage instead of being saved as large Base64 text in the database/local browser storage.

Changes made:
- Auto signs into Firebase anonymously when no user is signed in.
- Uses Firebase Storage for profile, person, memory, and scrapbook photos.
- Saves Storage download URLs in app data.
- Adds production-safe Storage rules that require Firebase Authentication.
- Adds Firestore rules that allow each signed-in user to save their own app data.

After uploading these files:
1. In Firebase Authentication, keep Anonymous enabled.
2. In Firebase Storage Rules, publish the included storage.rules.
3. In Firestore Rules, publish the included firestore.rules if you use Firestore syncing.
4. Reopen the app and test a new photo upload.

Existing old Base64 photos may still remain in existing saved data. New photos should upload to Storage and appear in the Storage Files tab.
