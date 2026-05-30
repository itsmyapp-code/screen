# Its My Screen

Digital signage app for editing a live TV menu, notices, and display settings.

## What This App Does

- Shows a menu board on a TV or browser display.
- Lets a merchant edit menu sections, items, prices, notices, and images from one dashboard.
- Pushes changes live through Firestore.
- Includes a display settings page for layout, accent, tint, and image styling.

## How To Use It

### 1. Open the dashboard

Go to the dashboard after signing in.

### 2. Pick what you want to change

Use the selectors on the dashboard to choose:

- a menu section
- a menu item
- a notice

### 3. Edit the content

Change the fields below the selectors:

- item name
- description
- price
- status tags
- notice text
- uploaded images

### 4. Push the update

When you are ready, click Push Update to Display.

## Display Pages

- `/display/:boardId` - main screen view
- `/display/:boardId?tv=lite` - lighter TV-friendly display mode
- `/dashboard/settings` - display presets and layout controls

## Menu Rotation

The display already pages through longer menus automatically.

- Each page stays visible for 10 seconds.
- The menu then moves to the next page.
- This is built into all supported layouts.

## Help For Common Problems

If the screen looks wrong:

- open Display Settings
- check the selected layout
- check the accent and tint settings
- refresh the TV/browser after pushing an update

If editing feels confusing:

- use the dashboard selectors first
- change one thing at a time
- push the update after each edit while testing

If the display does not update:

- confirm the board is signed in
- check Firestore rules and auth
- reload the dashboard and display page

## Development

```bash
npm install
npm run dev
npm run build
```

## Notes

- This app uses React, TypeScript, Vite, Firebase Auth, and Firestore.
- The display is designed to stay readable on TV screens as well as desktop browsers.
