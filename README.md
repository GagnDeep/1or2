# 1or2

A fun, beautiful, head-to-head voting game built for `1or2.com`.

Visitor taps one option out of two; their pick locks in with an animation, then animated percentage bars reveal how everyone else voted.

## Features
- **No-build Vanilla JS:** Runs directly in the browser, no bundlers needed.
- **Responsive:** Mobile-first design layout.
- **Categories:** Filter by food, travel, tech, lifestyle, and more.
- **Keyboard Support:** `1` or `2` to vote, `Enter` or `ArrowRight` to advance.
- **Persistence:** Remembers your overall votes and streak in `localStorage`.
- **Accessible:** Semantic HTML, ARIA tags, and support for `prefers-reduced-motion`.

## How to run locally

Since it uses ES Modules and `fetch` for data, you need to serve the directory via HTTP.

You can use python:
```bash
python3 -m http.server
```

Or Node (npx):
```bash
npx serve
```

Then visit `http://localhost:8000` (or the port specified by your tool) in your browser.

## Architecture & File Structure

- `index.html`: The main app shell
- `css/style.css`: Complete design system (Dark mode, custom gradients, CSS variables)
- `js/app.js`: Main application logic and state
- `data/matchups.json`: Seed data containing 40+ scenarios and vote counts.
- `.github/workflows/pages.yml`: Deploys the static site to GitHub pages on push.

## How voting works
When a user votes, their vote is instantly added to the "community" seeds. The majority percentage is then calculated. A running agreement percentage dictates how often the user votes with the crowd.
