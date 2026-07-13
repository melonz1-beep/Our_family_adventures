# Our Family Adventures 9.2.2

Built on 9.2.1.

## Added
- Central private/locked trip access blocker.
- Direct hash/URL access is redirected to Home.
- Trip lists, history map, media, meals, grocery, packing, links, reservations, budgets, itinerary, RSVPs, memories, scrapbook pages, voting, and trip chat use the same invitation check.
- Unauthorized writes and deletes are blocked in the application.
- Running app and security version are shown in Admin.

## Important Firebase architecture note
The current app stores the complete family database in one Realtime Database node (`families/default-family/appData`). Firebase rules cannot hide only selected fields inside that single downloaded object. Version 9.2.2 prevents access throughout the app interface, but true server-enforced per-trip confidentiality requires a future data migration that stores each trip and its related records in separate Firebase paths. Do not describe the current monolithic database as server-side trip isolation.
