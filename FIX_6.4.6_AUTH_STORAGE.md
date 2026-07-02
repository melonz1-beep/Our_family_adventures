# Version 6.4.6 Firebase Auth + Storage Stabilization

This release fixes the production sign-in/profile issue found in 6.4.4/6.4.5.

## Fixed
- Login no longer treats the background anonymous Firebase user as a completed sign-in.
- `Log In / Create Invite Account` validates invite codes and creates/links the email account correctly.
- The Profile & Family page updates from `Not signed in yet` after successful login.
- App data saves to the shared family Firestore document after login.
- Profile photos upload to Firebase Storage and save the download URL instead of Base64.
- The service worker cache was bumped to force GitHub Pages/PWA refresh.
- Firestore rules now include family invites and shared family app data.

## Upload these Firebase rules
- `firestore.rules`
- `storage.rules`

## GitHub deploy
Upload all extracted files and folders from this zip to GitHub Pages, replacing the old files.
