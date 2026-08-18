# Calorie Tracker v3.7

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
