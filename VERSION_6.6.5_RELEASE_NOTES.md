# Version 6.6.5 Cache/Load Fix

This package fixes the deployment wiring from 6.6.4.

## Fixed
- `index.html` now loads `ofa-6.6.4.css`.
- Local JS/CSS query strings are bumped to `v=6.6.5`.
- `service-worker.js` cache name is bumped to `ofa-6-6-5-core`.
- Service worker pre-cache includes the 6.6.4 JS/CSS patch files.
- Added service-worker update registration for installed PWA refreshes.
