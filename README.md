# Calorie Tracker PWA

A phone-first calorie tracking web app.

## Features
- Set a daily calorie target
- Add your own food items
- Add recipes with total calories and number of servings
- Add foods or recipe servings to today's diary
- Shows calories eaten and calories remaining
- Data is stored locally in the browser using localStorage
- Installable as a Progressive Web App (PWA)
- Basic offline support

## Run locally
Because the app uses a service worker, serve the folder over HTTP rather than opening index.html directly.

Python:
    python -m http.server 8000

Then open:
    http://localhost:8000

## Deploy
Upload the folder contents to any static web host such as GitHub Pages, Netlify, Vercel or Cloudflare Pages.

## Important
This first version stores data only on the device/browser where you use it. Clearing browser site data will erase the app data.
