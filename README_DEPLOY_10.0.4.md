# Our Family Adventures 10.0.5

## Changes
- Invitation links no longer show a verification failure when the recipient can continue creating a profile.
- Firebase login persistence is explicitly set to LOCAL, so users stay signed in on the same device until they choose Sign Out or clear browser/app data.
- Adds a scheduled seven-day trip reminder with the trip name and dates.
- Uses the existing lighthouse welcome image in full without covering or cropping its built-in wording.
- Removes the sentence “Plan every family adventure in one beautiful, shared place.” from the home screen.

## GitHub Pages
Replace all repository files and open `?v=10.0.5`.

## Firebase Functions
The seven-day reminder requires deploying both functions from Cloud Shell:

```bash
cd functions
nvm use 20
npm install --no-audit --no-fund
cd ..
firebase deploy --only functions:sendQueuedFamilyNotification,functions:queueSevenDayTripReminders
```

No Realtime Database rules change is required for this release because the scheduled function uses the Firebase Admin SDK.
