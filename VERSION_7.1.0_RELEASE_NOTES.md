# Our Family Adventures 7.1.0 — Final Deploy Package

This build adds the final 7.1 override layer on top of the consolidated 6.7.0 app.

## Added / rebuilt

- Dedicated route for every trip: `#/trip/<trip-id>`
- Dedicated page routing for menu items with hash-based mobile navigation
- Working bottom navigation with safe mobile spacing
- Firebase Realtime Database live sync across family members
- Online family presence indicators
- Group/private trip permissions and private list markers
- Google Maps embeds on every trip page
- Weather Channel forecast embed on every trip page
- RSVP tracking by family member
- Voting for dates, locations, restaurants, lodging, and links
- Meals with Breakfast, Lunch, Dinner, Snacks, Happy Hour, and Dining Out
- Restaurant link/address/time fields
- Shared/private grocery lists
- Shared/private packing lists
- Assignment acceptance and completion workflow
- Trip history map page
- Media library page for all photos/videos
- Free-form scrapbook canvas with draggable photos, text, and stickers
- Push notification permission/test and badge counts where supported
- Android/iPhone PWA install metadata and cache refresh
- Admin dashboard with stats, online users, activity, duplicate cleanup, and force sync
- Duplicate prevention for trips, links, and voting options
- Improved form clearing after successful item entry

## Files added

- `ofa-7.1.0.js`
- `ofa-7.1.0.css`
- `database.rules.json`
- `VERSION_7.1.0_RELEASE_NOTES.md`

## Deploy notes

Upload all files and folders in this package to GitHub Pages. Because the service worker cache name changed to `ofa-7-1-0-final`, users may need to close and reopen the installed app once after deployment.

Firebase Realtime Database must be enabled in the Firebase console for live multi-user synchronization. If you deploy Firebase rules from the CLI, this package includes `database.rules.json`.
