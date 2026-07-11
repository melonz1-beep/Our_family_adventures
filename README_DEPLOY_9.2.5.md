# Our Family Adventures 9.2.5

This release adds automatic Firebase UID linking.

## Added
- After a user signs in, the app finds the People profile with the same email address.
- The Firebase Authentication UID is stored internally as `owner`, `uid`, `firebaseUid`, and `authUid`.
- The UID remains hidden from normal user-facing screens; names and profile photos continue to display.
- Pending invitations with the same email are marked accepted and linked to the UID.
- Existing private-trip invitations that match the email are upgraded to UID-based access.
- Melissa's admin account is automatically linked to UID `fBXQ6PzPBDPQkpXSV9Zj1OTDUvg1` when that authenticated account signs in; the code does not rely on manually displaying or entering it.
- Admin shows whether the signed-in profile has been linked.

## Deploy
Replace all repository files with this package. Open the website once with `?v=9.2.5`, refresh, and reopen the installed app. Sign out and back in once so the profile-linking process runs against the current Firebase Authentication account.
