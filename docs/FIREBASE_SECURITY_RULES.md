# Firebase security checklist

Use Firebase Authentication before family launch.

## Realtime Database rule idea
Only authenticated users can read/write. Private trips must include the user's UID in `members`.

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "trips": {
      "$tripId": {
        ".read": "auth != null && (data.child('visibility').val() == 'family' || data.child('members').child(auth.uid).exists())",
        ".write": "auth != null && (!data.exists() || data.child('admins').child(auth.uid).exists() || data.child('owner').val() == auth.uid)"
      }
    }
  }
}
```

## Storage rule idea
Require sign-in and limit uploads to images/videos.

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /family/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 50 * 1024 * 1024
        && request.resource.contentType.matches('image/.*|video/.*');
    }
  }
}
```

Enable App Check before public launch.
