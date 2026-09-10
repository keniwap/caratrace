# Clear Hardcoded Data on Collector Dashboard

## Steps
- [x] 1. Remove the inline seed IIFE from `collector/dashboard.html` (seeds `collectorCollection` with demo entries)
- [x] 2. Remove the `seedCollectorCollection` IIFE from `collector/dashboard.js`
- [x] 3. Remove the hardcoded farmer fallback list from `collector/dashboard.js`

## Additional seeded/sample data removed (follow-up)
- [x] 4. Remove the demo collector account seed from `login.html` (`seedDemoCollector`)
- [x] 5. Remove `defaultFarmers` and `defaultBatches` hardcoded fallbacks from `collector/collection.js`
- [x] 6. Rename "Sample Route Map" to "Route Map" in `collector/dashboard.html`
- [x] 7. Remove "Example Carabao (demo)" seeding from `farmers/reporting.js` (show "No carabaos on file" empty state instead)
- [x] 8. Remove "local demo" wording from `farmers/reporting.js` notification alert

## Reflect localStorage data on dashboard
- [x] 9. Derive **Pickup Schedule** from `collectorCollection` farmers + today's entries (time, farmer, liters/grade/APT, done/pending status)
- [x] 10. Derive **Priority Updates** from `collectorCollection` (review-count urgent task + open batches)
- [x] 11. Derive **Route Map stops** from `collectorCollection` farmers + today's entries (collected/pending status, liters)

## Purge previously-seeded demo data from localStorage
- [x] 12. Add one-time cleanup in `collector/dashboard.js` that strips known demo records (DEL-0001/2/3, F-2024-001/006/011/014/018, B-0001-A/B, B-0420) from `collectorCollection`
- [x] 13. Add the same cleanup in `collector/collection.js`
- [x] 14. Bump dashboard script cache version `?v=4` → `?v=5` so the cleanup runs on next load

## Collector Farmers page (same treatment)
- [x] 15. Rewrite `collector/farmers.html` to remove all hardcoded data (sidebar count, topbar identity, status strip, count badge, 5 demo farmer cards, selected farmer details, quality percentages, reminders) — replace with ID-based empty elements
- [x] 16. Create `collector/farmers.js` with demo-data cleanup, farmer list from localStorage, live status counts, farmer card rendering, search + filter tabs, selected-farmer panel population, quality overview from real grades, and derived reminders
- [x] 17. Selected Farmer panel: removed Phone / Coop carabaos / Latest collection / Overall quality / Common grade rows
- [x] 18. Selected Farmer panel: replaced with Quality Overview (Farmer Milk Quality — Grade A/B/C percentages + bars) computed per selected farmer
- [x] 19. Selected Farmer panel: removed the farmer profile mini block (avatar initials, farm name, location) — panel now shows just the selected farmer name + Quality Overview
- [x] 20. Selected Farmer panel: added a single divider line above Quality Overview (per feedback)

## Collector Batches page (same treatment)
- [x] 21. Rewrite `collector/batches.html` to remove all hardcoded data (sidebar 410 L, topbar identity, status strip 02/03/1.2k, 4 batch cards, selected batch summary, latest farmer cards) — replace with ID-based empty elements + "Open New Batch" button
- [x] 22. Create `collector/batches.js` with demo-data cleanup, batch list from localStorage, live status counts, batch card rendering, selected-batch summary, contributors from entries, close-batch action, and print summary
- [x] 23. Add modal form (batch ID, grade, target volume, dairy box) for opening new batches — auto-suggested ID, persisted to `collectorCollection.batches`
- [x] 24. Add modal + form styles to `collector/collector.css`

## Batches modal refinements
- [x] 25. Fix modal showing on page load (added `.modal-backdrop[hidden] { display: none; }`)
- [x] 26. Simplify modal to confirmation-only (remove input fields; two big buttons: Open Grade A / Open Grade B)
- [x] 27. Batch ID auto-format: `B` + `YYMMDD` + milk class letter (e.g. `B260803A`, `B260803B`)
- [x] 28. Add **Emergency Backup** section — when the primary batch (A1/B1) is full, open a backup batch (A2/B2, A3/B3, ...) with auto-incrementing sequence numbers
- [x] 29. Auto-computed IDs with sequence numbers (A1, A2, A3... and B1, B2, B3...) based on existing batches for the day
- [x] 30. Emergency backup buttons disabled if the exact batch ID already exists for today
- [x] 31. Backup sequence always starts at A2/B2 (primary batches are A1/B1)
- [x] 32. Add **Reopen Batch** button to `collector/batches.html` and wire up the handler in `collector/batches.js` (toggles a delivered batch back to open, sets status to `open` and clears the closed timestamp)
- [x] 33. Replace the **Selected Batch summary** panel (Status/Target/Current/Remaining/Grade/Box) with the **Contributors / Latest Farmers** panel in `collector/batches.html`; updated `collector/batches.js` to drop the removed summary setText calls and render the contributors list (with empty state) directly in the side panel, keeping Close/Reopen/Print actions
- [x] 34. Make the **Grade-Based Batch Records** list scrollable when 3 or more batches exist — `batches.js` toggles a `scrollable` class on `#batch-list`, `collector.css` adds max-height + thin styled scrollbar, and the script cache version was bumped to `?v=3`
- [x] 35. Add **search** to the batch records list — new search input above the list in `batches.html`, live `input` filter in `batches.js` (matches batch ID, grade, label, status), with a "no matches" empty state
- [x] 36. **Highlight today's batch** — `batches.js` detects batches whose ID starts with today's `B YYMMDD` code (or whose `opened` date is today) and adds a `today` class plus a "Today" badge; `collector.css` adds a green highlight ring + badge styles; script cache bumped to `?v=4`
- [x] 37. **Clean the Collector Reports module** — rewrote `collector/reports.html` and `collector/reports.js` to show only **carabao health reports** (filtered from farmer dashboards), removing all non-health hardcoded data (pickup pinned, quality follow-up, etc.)
- [x] 38. **Notify Coop Vet modal** — when the collector clicks "Notify Coop Vet", a modal opens where the collector can indicate the **health action needed** (Injection, Medicine, Vitamin/Supplement, Deworming, Observation only, Refer to coop vet, Other) plus free-text **Details/Instructions**; the action is persisted to the farmer's dashboard and logged in the resolution log
- [x] 39. **Mark Visited** — collector can mark a report as visited, disabling further actions
- [x] 40. **Search & filter** — search by carabao, farmer, or symptom; filter by All/Urgent/Pending/Notified
- [x] 41. **Clean the Collector Profile page** — rewrote `collector/profile.html` and created `collector/profile.js` to pull data from `currentUser` and `collectorDashboard` localStorage; removed all hardcoded "Maria Santos", "C-2024-003", "Route 03" data
- [x] 42. **Login sets up collectorDashboard** — `login.html` now creates the `collectorDashboard` record on collector login with name, ID, route, areas, window, phone, email from the user account
- [x] 43. **Replace fake CSS-drawn map with Leaflet** — `collector/dashboard.html` loads Leaflet CSS/JS from CDN, replaced fake `#map-canvas` spans with empty div, `collector/collector.css` stripped fake map styles (roads, pins, gradients) and added Leaflet container sizing, `collector/dashboard.js` now initializes a real Leaflet map centered on Jalajala, Rizal (14.3560, 121.3230) with OpenStreetMap tiles and numbered markers for each farmer stop with green/orange colors for completed/pending
- [x] 44. **Pin Dairy Box store on the map** — added a distinct diamond-shaped green "DB" marker at `14.309697, 121.306943` on the Leaflet map as the central collection point where all milk goes; it is always included in the fit bounds, has a popup/tooltip ("The store where all milk will go"), a pulsing highlight ring, and the route stops sidebar always lists "Dairy Box — Final Drop-off" as the destination
- [x] 45. **Connect Farmer → Collector pickup notifications** — when a farmer clicks "Notify Collector" on their dashboard, `farmers/dashboard.js` now saves a pickup request (farmer name, ID, lat/lng, status "Waiting for pickup", timestamp) into a shared `collectorPickupRequests` localStorage key. The collector dashboard reads that store and: (1) renders a **red "P" pin** at the farmer's real geolocation on the Leaflet map with a tooltip/popup showing "Farmer — Waiting for pickup", (2) adds a **"Waiting for pickup"** stop to the route stops sidebar, (3) shows a **priority update task** "Farmer — Waiting for pickup" with the notification time, and (4) counts pickup-request farmers in the assigned list. Cache version bumped to `?v=8`.
- [x] 46. **Center the map on the Dairy Box first** — the Leaflet map on the collector dashboard now initializes centered on the Dairy Box store (`14.309697, 121.306943`) at zoom 15 instead of the Jalajala town center; random farmer-stop offsets are now generated around the Dairy Box position. Cache version bumped to `?v=9`.
- [x] 47. **Collection entry shows open batches only** — the "Select batch" dropdown on the collection form (`collector/collection.js`) now filters `collectorCollection.batches` to open batches only (status is missing or `open`); delivered/closed batches are hidden. Cache version bumped to `?v=2`.
- [x] 48. **Collection reflects on the specific farmer's account** — when the collector encodes a collection, `reflectOnFarmerDashboard(entry)` in `collector/collection.js` mirrors the record into the farmer's per-user dashboard (`farmerDashboards[farmerId]`) and, if that farmer is currently logged in the same browser, the global `farmerDashboard` too. It adds the delivery to `deliveries`, increments `totalMilk`/`today.liters`/`status.litersDelivered`/`metrics`, updates the grade quality distribution, and adds a "Collection recorded" notice + notification counter. Cache version bumped to `?v=3`.

## Bug fixes: encode → pick-up transition + queue visibility
- [x] 49. **Fix "when I encode it disappears"** — `renderQueue()` in `collector/collection.js` now keeps collected farmers visible in the queue below pending ones, with a "Picked up - collection recorded for today." label and `.task-card.done` CSS styling (green border, green text, slightly faded).
- [x] 50. **Fix pickup status not flipping** — Moved the `collectorPickupRequests` "Picked up" marking code **before** the `if (!dash) return;` early return in `reflectOnFarmerDashboard()`, so the pickup flips to "Picked up" even if the farmer has no dashboard yet. Removed the duplicate that was after the dashboard sync.
- [x] 51. **Dashboard only shows active (waiting) pickup requests** — `dashboard.js` now uses `activePickupRequests` (only status "waiting") instead of all `pickupRequests` when adding farmers to the list and when rendering route stops, so "Picked up" requests no longer appear as "Waiting for pickup".
- [x] 52. **Added `.task-card.done` CSS** — green styling for collected farmers in the collection queue.
- [x] 53. **Traceability reads `deliveries`** — confirmed `traceability.js` aggregates deliveries from `farmerDashboard.deliveries`, so new collections appear there automatically.
- [x] 54. **Move pickup requests + open batches from Priority Updates to Notifications** — `dashboard.js` now builds live notifications from active pickup requests and open batches, rendering them in the bell-icon dropdown instead of the Priority Updates task list. Priority Updates now only shows review-needed items. Cache bumped to `?v=10`.
- [x] 55. **Remove the Collector Tasks / Priority Updates panel entirely** — removed the side panel from `collector/dashboard.html` (heading, count badge, task list), deleted the now-dead task-rendering code from `dashboard.js`, and changed `.content-grid` to a single full-width column so the Pickup Schedule spans the row. Cache bumped to `?v=11`.
- [x] 56. **Record the farmer against the selected batch when encoding** — `collection.js` now saves the canonical `batchId` on each collection entry (alongside the existing `batch` label). `batches.js` `batchEntries()` now matches entries by either `batchId` or `batch` label, so the farmer's liters are counted in the correct batch's volume, farmer count, contributors list, and print summary. Cache bumped: `collection.js?v=4`, `batches.js?v=5`.

