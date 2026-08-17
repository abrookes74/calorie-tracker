# Calorie Tracker v2

A phone-first multi-device Progressive Web App using Supabase.

## Included

- Email/password sign-in
- Sync across phones and laptops
- Daily calorie target stored per user
- Personal food database
- Foods can be stored per g, ml, item or serving
- Ingredient-based recipes
- Recipe calories calculated automatically
- Breakfast, Lunch, Dinner and Snacks
- Previous/next-day diary navigation
- Calories eaten and calories remaining
- GitHub Pages compatible
- Basic PWA/offline shell support
- Supabase Row Level Security so users only access their own data

## 1. Create a Supabase project

Create a project at Supabase.

In the SQL Editor, run:

    supabase-schema.sql

## 2. Configure authentication

In Supabase:
Authentication -> Providers -> Email

Enable Email authentication.

For easiest testing you can temporarily disable email confirmation. For normal use, keeping email confirmation enabled is recommended.

## 3. Configure the app

Open `config.js` and replace:

    https://YOUR_PROJECT.supabase.co

with your Project URL, and:

    YOUR_SUPABASE_PUBLISHABLE_KEY

with your project's publishable key.

Find these in:
Project Settings -> API

The publishable key is intended for browser use. Security is enforced by the Row Level Security policies in the SQL file. Never put the Supabase service-role key in this app.

## 4. Deploy to GitHub Pages

Put all files in the root of your GitHub repository.

GitHub:
Settings -> Pages -> Build and deployment -> Deploy from a branch

Choose:
- Branch: main
- Folder: / (root)

Then open:

    https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/

## 5. Supabase URL configuration

In Supabase Authentication URL configuration, add your GitHub Pages URL as an allowed Redirect URL / Site URL as appropriate, for example:

    https://YOUR-USERNAME.github.io/calorie-tracker/

This matters particularly when email confirmation links are enabled.

## Data model

- `profiles`: daily calorie target
- `foods`: user food database
- `recipes`: recipe metadata and servings
- `recipe_items`: ingredients and ingredient quantities
- `diary_entries`: historical daily diary

Diary entries store the calorie value at the time they were entered, so changing a food or recipe later does not rewrite your historic diary totals.

## Important security note

Only use the Supabase publishable browser key in `config.js`. Do not use the `service_role` secret.
