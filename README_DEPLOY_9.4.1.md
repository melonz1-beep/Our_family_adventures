# Our Family Adventures 9.4.2 — Reliable Trip Deletion

Version 9.4.2 changes trip deletion to a verified Firebase-first operation.

## Fixed

- Deletes the trip from both `familyTrips` and `privateTrips` in one atomic multi-path update.
- Deletes the trip member index and all known `tripAccess` entries in the same update.
- Admin deletion also scans for stale access entries left by older builds.
- The trip is removed from the screen only after Firebase confirms the records are gone.
- Failed deletion now leaves the trip visible and shows the actual Firebase error instead of reporting a partial local deletion.
- Updated Realtime Database rules allow the owner/admin to delete the complete `tripMembers/{tripId}` node and allow Admin to scan stale access indexes.

## Deploy

1. Replace all repository files with this package.
2. Publish the included `database.rules.json` in Firebase Realtime Database Rules.
3. Open the site with `?v=9.4.2` and refresh once.
4. Reopen the installed app.
