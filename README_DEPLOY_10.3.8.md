# Our Family Adventures 10.3.8

Scrapbook export reliability, expressive editing, visual page library, layout, and invite-only Firebase security release.

## Included fixes

- Embeds every photo into the export canvas before JPEG or PDF rendering; export now stops with a clear message instead of silently creating a page with missing pictures.
- Adds a clearly labeled page-name field inside Add and keeps it synchronized with the top title.
- Adds editable blank text plus left/right chat bubbles, thought bubbles, shout cutouts, note cards, torn notes, labels, and captions.
- Adds Collage, Grid, Feature, Filmstrip, Mosaic, Freeform, and curated theme arrangements.
- Closes the Add sheet after an item is inserted so the result is immediately visible and duplicate taps are avoided.
- Shows photo-collage thumbnails for saved scrapbook pages and shares finalized page state with authorized family users.
- Makes the mobile Add menu a lower sheet so part of the page stays visible while choosing items.
- Caches illustrated backgrounds during editing to reduce redraw flicker.
- Replaces generic Halloween pumpkins and Christmas decorations with recognizable shaded pumpkins and decorated evergreen trees.

## Security included

- Replaces broad “any signed-in account” access with an active `familyMembers` approval check on every Realtime Database family path.
- Requires a secure administrator invitation before a new account can join the family workspace.
- Issues server-side Firebase custom claims for the approved family ID and role before Storage opens.
- Restricts uploaded photos to the approved family, records each file owner, and limits uploads to image files under 20 MB.
- Keeps finalized scrapbook pages visible to approved family members while drafts remain owner/admin editable.
- Denies all access to the unused Firestore service.
- Removes the administrator email and default PIN from public source code. The existing Firebase template setting is used only by the server to bootstrap the administrator membership.

## Required Firebase deployment

GitHub Pages publishes the website, but it cannot activate Firebase Functions or security rules. From an authenticated Firebase CLI, deploy in this order:

```bash
firebase deploy --only functions
firebase deploy --only database,storage,firestore
```

The first administrator sign-in creates the protected administrator membership and access claims. Existing accepted invitees are linked when they next sign in. New users must open an invitation link before choosing **Create Invited Account**.

## Cache

Service worker cache: `ofa-10-3-8`

After GitHub Pages deploys, close every app tab, open `?v=10.3.8`, and then reopen or reinstall the home-screen app.
