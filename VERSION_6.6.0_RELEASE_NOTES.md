# Our Family Adventures Version 6.6.0

## Main fix
Version 6.6.0 connects the entire app to one shared family Firebase document so invited family members see the same live updates instead of separate local/device-only data.

## Shared in Firebase now
- Trips and trip details
- Itinerary, maps, reservations, budget, notes, voting, RSVP, and links
- Meal planning by trip dates
- Grocery lists
- Packing lists
- People/profiles
- Memories/photos/video records
- Scrapbook pages, stickers, sticker position, and sticker size
- Family chat, history, read receipts, and unread status
- Notifications/activity history
- Saved pins and travel links

## Important
All family members must sign in through the app/Firebase. Firestore rules must allow authenticated family users to read and write `/families/our-family-adventures/private/appData`.
