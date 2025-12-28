# TODO List



- [ ] Implement QR code scanning route
- [x] Implement barcode generation per item
- [x] Implement layout for barcode printing

## bug list

### global
- [ ] add animations on everything
- [ ] add localization
- [ ] UI mockup
- [ ] conversion of UI mockup to code
- [ ] integration of everything
- [ ] making the service worker actually work
- [ ] allow changing of sound files

### barcodePrinter.js

- [ ] the pictures of barcodes may overflow
- [ ] allow customization of the printing settings
- [ ] allow customization of the barcode itself

### inventoryList.js
- [ ] UI cleanup oml
- [ ] bug that causes selecting all on one item causes hiding of edit and select all button
- [ ] potentially drag to select?
- [ ] apply currency settings on this section


### settings.js
- [ ] allow editing of barcode and barcode layout on paper from settings
- [ ] add currency setting
- [ ] add setting of languages
- [ ] add about and credits oml
- [ ] abstract the sync checkboxes thing
- [ ] allow changing of sound files

### tab-navigation.js
- [ ] bug of clicking the inventory button and adding of elements to UI duplicating/triplicating
- [ ] clear out QR tab when leaving it


### tests.js
- [ ] think of more tests, what kind of tests? i have no idea

### qrReading.js
- [ ] UI
- [ ] cart system
- [x] fail scanning when product doesn't exist in db

### db.js
- [ ] Disallow letters in number areas in the inventory add pop-up

### inventoryForm.js
- [x] Disallow negative numbers in both stock and cost

### cartManager.js
- [ ] Cart and QR UI
- [ ] apply currency settings on this section

## Milestones

- [x] database system (bound to change, but mostly done)
- [ ] home tab
- [ ] algorithms to figure out min/max, total sales, best sellers (prerequisite of home tab)
- [x] inventory tab (mostly done, just UI and QoL improvements are needed to be resolved)
- [ ] QR tab
- [ ] Activity tab
- [ ] Settings tab
- [ ] figure out what to actually put there (prerequisite of settings tab)
- [ ] import/export settings
- [ ] branding
- [ ] OG tags
- [ ] advertisement (online and organic advertising)
- [ ] (not required) sync/backup/restore system 
- [ ] (not required) syncing to payment handlers
- [ ] (not required, COSTS MONEY) authentication system
- [ ] (not required) ads system (jk,,,, half jk IT's DISABLED BY DEFAUKT)
- [ ] (not required) seo optimization
- [ ] (not required but it would be nice) submitting to Google
- [ ] (not required, COSTS MONEY) domain

## User-reported issues
- [x] When SKU is edited on existing stock, it generates a new listing on the inventory

> Response: It works on my machine

To attempt fix, try clearing the cache, disabling cache temporarily, and visiting DevTools to right-click the Reload button and clicking "Empty Cache and Hard Reload" **(invalidated/not reproducible)**

- [x] Stocks not updating on his browser/laptop

> Response: It works on my machine

~~To attempt fix, try clearing the cache, disabling cache temporarily, and visiting DevTools to right-click the Reload button and clicking "Empty Cache and Hard Reload" **(invalidated/not reproducible)**~~

**The bug has been reproduced!** [`3568b69`](https://github.com/danimato/portable-pos/commit/3568b69f1e85f58a66cd415f7f9fda7fefec805d) now fixes this issue. The bug was about the behavior of `resetSelected()` when the mouse input is overshooting. It is now fixed accordingly by detecting if the mouse was dragging during the event, or if there's text selected.

- [x] You can put a negative number in both stock and cost

> Response: clamp stock and price variables to 0 to Infinity. This is an [inventoryForm.js](#inventoryformjs) bug

- [ ] You can put in letters in number filled areas in the inventory add pop-up

> Response: lock database schema to accept floats only and preprocess/postprocess all fields to be in float only. This is an [inventoryForm.js](#inventoryformjs) and [db.js](#dbjs) bug
