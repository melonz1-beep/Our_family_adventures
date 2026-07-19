# Our Family Adventures 9.4.4

## Notification queue correction

This build verifies that the app creates a record at:

`families/default-family/notificationQueue/{queueId}`

The Admin test button now waits for the database write, reads the record back, and shows either **queued successfully** or the exact Firebase error. The Firebase configuration now includes the Realtime Database rules file so the queue rules can be deployed with the CLI.

## Deploy

From the extracted project folder in Cloud Shell:

```bash
firebase deploy --only database,functions:sendQueuedFamilyNotification
```

Upload the regular website files to GitHub Pages and open `?v=9.4.4`. Then tap **Send on-device test notification**.

A new `notificationQueue` node should appear automatically. Do not create it manually.
