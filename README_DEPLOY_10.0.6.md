# Our Family Adventures 10.0.7 — Backup & Restore Manager

## Added
- Admin Backup & Restore Manager
- Timestamped full JSON backups with version, family path, and item counts
- Backup review screen before importing
- Merge or Replace restore modes
- Automatic safety backup before either restore operation
- Version-aware support for legacy raw backups and Version 10 backup envelopes
- Restore writes through the normal Firebase synchronization process
- Local backup history metadata for the last 20 backup/restore actions

## Deploy
Replace the website files in the GitHub repository and open `?v=10.0.7`.

No Firebase rules or Cloud Function update is required for this release.

## Important
Backups contain app records and Firebase Storage URLs. They do not duplicate the underlying photo and video files already stored in Firebase Storage. Keep the Firebase Storage bucket and files intact when restoring.
