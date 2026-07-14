# Our Family Adventures 9.2.3 — Split-path privacy

This release builds on 9.2.2 and moves trip information out of the single `appData` record.

## New Realtime Database paths

- `families/default-family/publicData`
- `families/default-family/familyTrips/{tripId}`
- `families/default-family/privateTrips/{tripId}`
- `families/default-family/tripAccess/{uid}/{tripId}`
- `families/default-family/tripMembers/{tripId}/{uid}`
- `families/default-family/userNotifications/{uid}`

Private trips and every trip-linked list are stored together under the protected `privateTrips/{tripId}` node. Non-invited accounts cannot read that node under the included database rules.

## Deployment order

1. Upload every file and folder from this ZIP to GitHub Pages.
2. Open Firebase Console → Realtime Database → Rules.
3. Replace the existing rules with `database.rules.json`, then publish them.
4. Sign into the app first using `mlehr1211@gmail.com`. The app performs the one-time migration from the old `appData` record.
5. Confirm the Admin screen reports Version 9.2.3 and split-path privacy.
6. Test with one invited account and one non-invited account before deleting the old record.

Keep `families/default-family/appData` as a read-only Admin backup until the migration has been verified.

An invited person must have a People profile linked to that person's Firebase Authentication UID in its `owner` field. Name-only or email-only invitations cannot become server-enforced members until the profile is linked to a UID.

Existing Firebase Storage download URLs are not revoked by this database migration. File-level Storage privacy requires a separate media migration.
