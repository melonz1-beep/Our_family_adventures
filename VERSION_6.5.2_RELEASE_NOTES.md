# Our Family Adventures — Version 6.5.2 Corrective Build

This build patches the issues found during testing after 6.5.1.

## Fixed
- Live weather now uses the trip destination/address and loads through Open-Meteo.
- Trips render with map cards and directions links.
- Voting tab shows trips and voter names.
- Travel links save to both trip-level and global link storage.
- Meal type is preserved, including Snack, Dessert, Drinks, Breakfast, Lunch, and Dinner.
- Group and private meal/grocery/packing list items are added and displayed.
- Scrapbook draft now shows selected memory photos before page creation.
- Scrapbook photos can be rearranged, removed, and zoom/cropped before saving.
- Stickers and text are moveable and resizable on the draft page.
- Cutouts/frames are separated from stickers with heart, scallop, star, moon, sun, polaroid, and wood frames.
- Explore Map page added with saved pins and trip pins.
- Notifications now include an in-app notification center, unread badge, app badge attempt, and local phone notification attempt when permission is granted.
- Profile editor supports name, phone, contact email, and profile photo. Firebase login email update is attempted when allowed by Firebase.

## Important note about phone-screen notifications
True push notifications when the app is fully closed require Firebase Cloud Messaging service worker setup and browser/device permission. This build adds local installed-app notifications and badge support when the app/browser is allowed to notify.
