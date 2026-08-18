# Calorie Tracker v3

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
