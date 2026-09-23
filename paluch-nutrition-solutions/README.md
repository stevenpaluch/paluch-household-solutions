# Paluch Nutrition Solutions — starter version

A dependency-free HTML, CSS and JavaScript app based on the approved landscape tablet design. The permanent hosting target is the Odroid. This first version can also run on GitHub Pages or ordinary cPanel hosting, without PHP, a database, an account, or a build step.

## Try it

Open `index.html` for a quick look. For reliable saved-data testing, serve all three app files from the same website address. Browser data belongs to that specific address and browser; it does not follow you to a different server or device.

- **GitHub:** put `index.html`, `styles.css`, and `app.js` in your repository's `paluch-nutrition-solutions` folder, within the configured Pages publishing source.
- **cPanel:** put those same three files in a `paluch-nutrition-solutions` folder under your chosen domain's document root.
- **Odroid:** any static web server can serve that folder for this first stage.

Do not overwrite an existing site or root index file. This package has not been published or pushed to a repository.

## Working now

- Add, edit and delete inventory in Refrigerator, Freezer, Pantry and Evergreen staples.
- Save quantities and optional use-by dates. Date order is only an organizational aid; no food-safety assessment is made.
- Enter, view, edit and delete recipes, including original source links.
- Save experimentation, difficulty and time preferences for later recipe discovery.
- Add shopping items, check them off and delete them.
- Browse a monthly calendar and record dated breakfast, lunch, dinner and snack entries.
- Separate Planned from Ate; mark a planned meal eaten on or after its date.
- Use a saved recipe as a meal entry, or enter any meal, including takeout.
- Persist changes on this browser, with visible errors if saving fails.

The app starts empty; no fabricated household data is inserted. Recipe names are copied into meal records so meal history remains readable if a recipe is later renamed or removed. Checking shopping items and logging meals do not automatically change inventory.

## Not connected yet

Google Calendar, online recipe discovery, automatic meal suggestions, receipt/photo scanning, accounts and shared/server storage. The interface identifies these as later features. No external services are called and no secrets are embedded.

Calendar meal history is stored by this app. A future Google Calendar connection can show events alongside it; it should not overwrite what the household actually ate.

## Data limitations

Browser storage is a prototype, not a household database or backup. Clearing browser data removes entries; devices do not synchronize. Use test data until server storage is implemented. A published static page does not require sign-in; the data entered here remains in each browser.

## Next server stage

Keep this interface and replace the local storage adapter with an authenticated backend on the Odroid. Choose the backend after confirming its model and operating system. A cPanel/PHP/MySQL staging environment is an option if supported by the hosting plan. Keep all AI/search credentials and calendar tokens on the server. Add Google Calendar authorization and receipt review before adding automatic inventory updates.

## Tablet compatibility

Uses classic JavaScript and widely supported CSS without a framework or external fonts. Layout targets a landscape tablet and adapts to narrower screens. Actual iPad mini 3/Safari testing remains required, particularly date inputs, browser storage and text sizing. Modern desktop checks do not establish compatibility with its older browser.

## Validation performed

JavaScript syntax checks passed. Offline simulated-DOM tests passed for inventory and recipe saving, shopping check-offs, meal creation and edits, Planned-to-Ate changes, deletion, reload persistence, invalid/future-date rejection, escaped user input and failed-save rollback. Interactive browser and visual testing could not be completed in this environment: the local server was blocked by execution permissions and the browser disallowed local file URLs. Test the deployed page on the iPad before relying on it.

## Receipt review update

Our food → Add groceries now includes a local JPEG/PNG photo preview (up to 12 MB), editable grocery rows and a single confirmation to add reviewed items to inventory. Add rows manually: automatic reading is not connected. Every row requires a food name, quantity and explicit storage location. Dates are optional. Items remain separate from existing stock; quantities are not automatically merged.

Photos are never transmitted or stored, and review drafts are not saved across reloads. Removing or replacing the image preserves review rows. A failed inventory save preserves the entire review list for retry. Successful confirmation clears the draft and photo, preventing a second submission of the same batch.

To install this update, replace index.html, styles.css and app.js together in the existing paluch-nutrition-solutions folder. Keep the same site address to preserve that browser's existing inventory. Do not upload the ZIP itself as the website.

Receipt logic checks passed for batch saves, validation, duplicate-submit prevention, save-failure retry, photo size/type rejection, preview load/error handling, releasing preview images and retaining draft items. These were simulated DOM checks; camera/photo selection and layout still need actual browser and iPad testing.
