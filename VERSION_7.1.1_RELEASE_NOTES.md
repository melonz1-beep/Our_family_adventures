# Our Family Adventures 7.1.1

Corrective patch based on mobile testing screenshots.

## Fixed
- Scrapbook page bottom scroll space and dock overlap.
- New scrapbook editor with draggable photos, crop/zoom/up/down/left/right controls, draggable stickers/text, shorter frame buttons.
- Memories, media, scrapbook pages, meals, groceries, and packing now save through the 7.1.1 shared save path.
- Travel links are deduplicated and link forms clear after save.
- Voting option add buttons no longer refresh/navigate to RSVP.
- Weather opens the Weather Channel forecast reliably when mobile browsers block embedded weather.
- Search Near This Trip uses the selected trip destination/address instead of the phone location.
- Profile fields clear after saving.
- Admin dashboard and admin actions are hidden unless the saved family role is Admin.
- Admins can delete media items and scrapbook pages.
- Meal, grocery, and packing assignment uses member dropdowns with Volunteer needed.
- Grocery form removes duplicate privacy/list type controls.
- Home navigation scrolls back to the top.

## Firebase
Uses Realtime Database path `families/our-family-adventures/data`. Deploy `database.rules.json` with Firebase if the app still shows “Could not load shared family data.”
