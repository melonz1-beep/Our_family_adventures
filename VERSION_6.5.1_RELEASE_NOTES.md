# Our Family Adventures Version 6.5.1

Deployable patch over 6.5.0.

## Fixed
- Firebase/app notifications now render in Settings with read/unread status, badge count, test notification, and user-specific records.
- Live weather now shows a loading state, auto-saves updated weather to the trip, and gives a clearer fallback message when the provider cannot find the location.
- Google Maps cards are shown for trip destination/address and open mobile Google Maps directions.
- Scrapbook draft editor now shows selected photos before page creation.
- Scrapbook photos can be selected, removed, and rearranged before saving.
- Scrapbook draft supports layouts, backgrounds, and separate frame choices.
- Stickers/emojis are separate from frames and can be moved/resized in the draft.
- Added more adventure, holiday, beach, camping, family, food, pet, and emoji stickers.
- Added frame choices: heart, scallop, star, moon, sun, wood, polaroid, and soft rounded.
- Meal type is preserved when adding Breakfast, Lunch, Dinner, Snack, Dessert, Drinks, Dining Out, or Happy Hour.
- Voting now displays the names of people who voted under each option.
- Profile page now allows editing name, email address, phone number, and profile photo.
- Mobile bottom spacing and floating controls were adjusted so content is not covered by the dock.
- Service worker cache updated to `ofa-6-5-1-core` and includes the 6.5.1 files.

## Deployment
Upload all files in this package to GitHub/Firebase Hosting, replacing the current files. After deployment, open the app in Chrome and refresh once. If the installed app still shows old behavior, clear site data or reinstall the PWA so the new service worker takes over.
