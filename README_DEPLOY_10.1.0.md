# Our Family Adventures 10.1.1

## Added
- Photos-only uploads in Media and Memories; video files are rejected before upload.
- Five-photo maximum per upload remains active.
- Family Archive page for completed trips.
- Admin Storage & Archive Center with recorded photo counts and file-size estimates.
- Manual archive workflow: download originals, upload compressed archive copies, mark archived, and delete originals only after explicit confirmation.
- Private-trip archive visibility continues to follow existing trip permissions; Admin retains full visibility.
- No automatic compression or deletion.

## Deployment
Replace all GitHub Pages files with this package and open `?v=10.1.1` once.

No Realtime Database rule or Cloud Function update is required for this release. Existing Firebase Storage rules must continue to allow authorized photo upload/delete operations used by the app.

## Important
“Download original photos” starts individual browser downloads. Android/iPhone may ask for permission or open photos in new tabs. Verify the external backup before deleting originals.
