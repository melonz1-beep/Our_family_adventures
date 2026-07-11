# Our Family Adventures 9.0.4

## Corrected in this build
- Scrapbook photo backgrounds are transparent so photos blend into the selected canvas.
- Frames now outline photos with the chosen color.
- Cutout shape and frame style are separate controls, including no frame with heart, scallop, or flower cutouts.
- Trip Media preview uses image thumbnails instead of JPEG filenames.
- Change My Vote removes the signed-in member from the previous option and updates the selected option.
- PWA app icon badges are updated through the Badging API where supported by the installed browser/phone.
- Light theme uses deeper Dusty Rose, Greenery, Rose Gold, and warm cream colors for improved contrast and eye comfort.

## Deploy
Replace all files in the GitHub Pages repository with this package, commit, then close and reopen the installed app/browser after publishing so the 9.0.4 service-worker cache loads.

App icon badges depend on operating-system and browser support. Android Chromium-based installed PWAs generally support them, but the launcher may control how badges are displayed.
