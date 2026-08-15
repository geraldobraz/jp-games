# Games for Sale

A small React + Vite app for tracking games you're selling, organized into tabs
(e.g. Nintendo Switch, PlayStation), with per-title platform badges, prices,
notes, a "bought" checkbox, filter/sort by badge, and cover image upload.

Everything is saved to the browser's `localStorage` — no backend, no
database. It's just a static site.

## Requirements

- Node.js 18+ and npm

## Local development

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Building

```bash
npm run build
```

Output goes to `dist/`. Preview the production build locally with:

```bash
npm run preview
```

## Deploying to GitHub Pages

There are two ways to do this — pick one.

### Option A: GitHub Actions (recommended, fully automatic)

This repo already includes `.github/workflows/deploy.yml`, which builds and
deploys on every push to `main`.

1. Push this project to a GitHub repository.
2. In the repo, go to **Settings → Pages**, and under "Build and deployment",
   set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

### Option B: `gh-pages` npm package (manual, one command)

```bash
npm run build
npm run deploy
```

This uses the `gh-pages` package (already in `devDependencies`) to push the
`dist/` folder to a `gh-pages` branch. Then in **Settings → Pages**, set
**Source** to **Deploy from a branch** and pick the `gh-pages` branch.

### A note on `vite.config.js`

`base` is set to `"./"` (relative paths), which works for both of the
options above regardless of your repo name. If you later deploy to a custom
domain or the root of a `username.github.io` user/org page, you don't need
to change anything either.

## Data persistence

All data — tabs, games, prices, notes, cover images, and "bought" checkmarks
— is stored in the browser's `localStorage`, scoped to whatever domain the
site is served from. That means:

- Data is per-browser and per-device. It won't sync between your phone and
  laptop, or between two different browsers on the same computer.
- Clearing site data/cookies for the domain will erase it.
- There's no server, so nobody else can see or edit your data — it never
  leaves your browser.

## Cover images

Clicking a game's cover (or the "+ Add cover" placeholder) lets you pick an
image file. It's automatically downscaled to a max of 500px on the longest
side and re-encoded as JPEG before being stored, to keep `localStorage`
usage reasonable. Non-image files and anything over 8MB are rejected with a
message.

## Project structure

```
src/
  main.jsx         — React entry point
  App.jsx          — main component (tabs, cards, forms, actions)
  App.css          — all styling (plain CSS, no framework)
  seedData.js      — badge colors + the starter game catalog
  persistence.js   — localStorage load/save helpers (with input validation)
  imageUtils.js    — image upload + canvas downscaling
```
