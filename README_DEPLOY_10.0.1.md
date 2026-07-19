# Our Family Adventures 10.0.2

## Local storage quota correction

Version 10.0.2 keeps Firebase as the source of truth and stores only a compact browser cache. Large image, video, PDF, and scrapbook binary data are omitted from localStorage, preventing the `ofa-9-data exceeded the quota` startup error. Existing Firebase data is not deleted.

## Deploy

Replace all GitHub Pages files with this package and open `?v=10.0.2`. Close and reopen the installed app after the first browser load. No Firebase rules or Cloud Function update is required for this cache-only correction.
