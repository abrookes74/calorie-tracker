# Calorie Tracker v5.0.1

## New in v3
- Food categories
- Favourite foods
- Recent-food ordering
- Per-100g/ml and per-item/serving entry
- Edit diary entries
- Copy previous day
- Weight tracking
- JSON backup export
- RecipeSage JSON import tailored to the RecipeSage export structure
- Recipe categories/tags, source URLs, descriptions, author notes and instructions
- Duplicate protection using RecipeSage recipe identifiers
- Preservation of unmatched ingredient text
- Automatic matching of imported ingredients against foods already in the calorie database
- Extraction of calorie values when RecipeSage descriptions/notes contain Cals/Calories/kcal

## Upgrade from v2
1. Run `supabase-v3-migration.sql` in the Supabase SQL Editor.
2. Keep your current working `config.js` from v2. Do NOT replace it with the placeholder unless you re-enter your Project URL and Publishable Key.
3. Replace the other web files in the GitHub Pages repository with the v3 files.
4. Commit to `main` and wait for the Pages deployment.

## RecipeSage import
Open Recipes -> Import RecipeSage JSON and select the RecipeSage export file.

The import can safely be attempted again: recipes with the same RecipeSage `identifier` are skipped.

RecipeSage ingredient lines are human-readable. The app preserves every line. Where an ingredient contains the name of an existing calorie food, the importer attempts to match it and recognizes explicit grams or ml. Other measurements (tbsp, tsp, cups, "1 onion", etc.) remain reviewable because reliable calorie conversion requires food-specific densities/weights.

## Important
Never place a Supabase service_role key in config.js.


## v3.1 cache fix
The main script is named `app-v3.1.js` so browsers controlled by the old v2 service worker cannot accidentally reuse the cached v2 `app.js`.


## v3.2 import diagnostics
The RecipeSage import now opens a progress dialog immediately, shows live progress, and displays the exact Supabase error if an import stops.


## v3.3 ingredient foods and diary recipes
- RecipeSage does not export a separate foods collection. v3.3 derives reusable foods from recipeIngredient lines.
- Imported ingredient foods start with calories unset. Edit them in Foods to enter kcal per 100g/ml or per item/serving.
- Recipes with a detected or manually entered calories-per-serving value are selectable when adding a diary entry.
- Recipes without calories show "Set calories to log".
- Re-running the RecipeSage import skips recipes already imported by RecipeSage identifier.

## v3.4 existing-import backfill
If RecipeSage recipes were imported using v3/v3.2 before ingredient-food creation existed, use:

Foods -> Build foods from imported recipes

This scans unmatched stored recipe ingredient lines, creates reusable food records with calories unset, and links the existing recipe ingredients to those foods. No RecipeSage re-import or recipe deletion is required.


## v3.5 diary filtering
The Add to diary dialog now includes:
- Item type: Foods only, Recipes only, or Foods & recipes
- Food category filter
- The item dropdown is reduced to matching items only
- Foods without calorie data are excluded from diary selection


## v3.6 corrections
- Fixes the JavaScript syntax error in v3.5 that prevented sign-in.
- Keeps the new diary item-type and food-category filters.
- Removes the obsolete "Build foods from imported recipes" feature.
- RecipeSage import now creates recipes only. Ingredient lines are stored as recipe text and never create Foods.
- Foods remain a separate list containing only items you deliberately create.


## v3.7 recipe label filtering
- RecipeSage recipe categories/tags are used as recipe labels.
- Recipes tab has a text search and an All recipe labels filter.
- Add to diary shows a Recipe label filter when Recipe is selected.
- Recipe label filtering works alongside the existing food-category filter.
- No database migration is required for v3.7 because recipe categories are already stored.


## v3.8 Sage visual refresh
- Sage-green palette throughout
- Softer cream background
- Refined cards, tabs, buttons and dialogs
- Improved spacing and typography
- Polished calorie summary and progress bar
- Updated browser/PWA theme colour
- No database changes required


## v3.9 cache-busting fix
- Renames the stylesheet to styles-v3.9.css.
- Renames the app script to app-v3.9.js.
- Service worker now deletes all older Calorie Tracker caches during activation.
- Adds a small "Sage v3.9" marker in the header so you can immediately confirm the new version is loaded.


## v4.0 shared catalogue
Run `supabase-v4-shared-catalogue.sql` first. Foods and Recipes are then readable by every authenticated account; only their owner can edit/delete them. Diary, weight and calorie targets remain private per account.


## v4.1
- Fixes the Cancel button in the New/Edit Food dialog. Cancel now explicitly closes the dialog and bypasses form validation.


## v4.2
- Fixes Cancel in the Recipe dialog.
- Fixes Cancel in the Weight dialog.
- Cancel buttons now explicitly close dialogs and bypass HTML form validation, matching the Food dialog fix.


## v4.3 shared Food editing
Run `supabase-v4.3-shared-food-editing.sql`.

After the migration, every authenticated user can add, edit and delete any shared Food.
Recipes retain the previous owner-only edit/delete model.
Diary, weight and profile data remain private to each account.


## v4.4 shared Recipe editing
Run `supabase-v4.4-shared-recipe-editing.sql`.

After the migration:
- every authenticated user can view Recipes;
- every authenticated user can add Recipes;
- every authenticated user can edit any shared Recipe;
- every authenticated user can delete any shared Recipe;
- recipe ingredient rows are also editable/deletable by authenticated users.

Foods retain the v4.3 fully-shared edit/delete model.
Diary, weight and profile data remain private to each account.


## V5.0 Usability
- Quick Add based on recent diary use plus favourite foods.
- Add buttons inside Breakfast, Lunch, Dinner and Snacks.
- Copy the same meal from the previous day.
- Copy previous day retained.
- Quantity shortcut buttons.
- Recipe detail viewer by tapping the recipe name.
- Tappable recipe label chips plus existing search/dropdown filter.
- Mobile bottom navigation.
- No database migration required.


## V5.0.1
- Reworks mobile bottom navigation with explicit event listeners and a shared tab activation function.
- Adds touch handling and stronger active-state feedback.
