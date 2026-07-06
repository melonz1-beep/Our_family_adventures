# Final 6.4.1 Fixes

This release adds a cleanup patch over 6.4 to correct duplicate form controls and improve production behavior.

## Fixed
- Removed duplicate notification/chat buttons where possible and uses one notification center.
- Added notification history, unread count, mark all read, and clear all.
- Added app badge support where Android/Chrome supports installed PWA badges.
- Added draggable floating chat bubble with live chat panel.
- Added Home button to every page header.
- Improved navigation so menu items open at the top of the selected page instead of feeling like the Home page is still showing.
- Added clickable dashboard statistic cards.
- Restored Vote tab if missing.
- Fixed voting so every link entered on a separate line becomes its own voteable option.
- Fixed vote/change behavior using the current family profile name.
- Cleaned duplicate meal type, privacy, and assigned-to controls.
- Meal, grocery, and packing items no longer require a name to add.
- Group list items include a dropdown so family members can claim/assign items.
- Private list items are only shown for the owner/current user.
- Added user profile edit workflow and profile photo change support.
- Added itinerary title/link support in the runtime patch.
- Improved live weather using Open-Meteo with city/state fallback.
- Added trip map opening support.
- Updated home/splash photo to the provided Our Family Adventures lighthouse image and uses contain sizing to prevent wording being cut off.
- Improved scrapbook page rendering with more cutout frame styles, themed stickers, and drag-to-rearrange saved photos.

## Notes
- The Weather Channel does not provide free direct weather API access for this static app. This build uses Open-Meteo live weather and can still open weather/map links.
- True pinch crop/canvas scrapbook editing remains a Version 7.0 rebuild item.
