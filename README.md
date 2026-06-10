# 1or2

A beautiful serverless poll platform built for `1or2.com`.

Visitor taps one option out of two (or more); their pick locks in, then percentage bars reveal results. Anyone can create polls and share them instantly.

## Features
- **Serverless Architecture:** A created poll is serialized to JSON, compressed natively via `CompressionStream('deflate-raw')`, encoded to base64url, and passed in the URL hash (`#/p/<payload>`). There is no backend database for polls!
- **Local First Data:** Votes and stats are persisted per-device in `localStorage`. Users see their device's results.
- **Poll Studio:** Multi-step form to create Duels (1v2), Polls (multi-choice), Verdicts (Yes/No), and Tournaments (Brackets).
- **Beautiful Result Cards:** After voting, users can generate and download a stylized canvas result card to share via the Web Share API.
- **No-build Vanilla JS:** Runs directly in the browser, ES Modules used throughout.
- **Accessible:** Semantic HTML, keyboard support (`1`, `2`, `Enter`), and full `prefers-reduced-motion` support.

## How to run locally

Since it uses ES Modules, you need to serve the directory via HTTP.

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

- `index.html`: The main SPA shell
- `css/style.css`: The complete design system (letterpress ballot / editorial zine aesthetic)
- `js/app.js`: Entry point and global event listeners
- `js/router.js`: Hash-based component router
- `js/store.js`: Event emitter for state and `localStorage` persistence
- `js/codec.js`: Compression and base64url encoding for serverless sharing
- `js/decks.js`: Seed data for the curated "Classics"
- `js/components/*.js`: View modules (home, decks, create, play, mine)

## Creating & Sharing Polls
When a user finishes the "Create" form, `codec.js` serializes the configuration into a compact hash string. The generated link can be shared anywhere. Opening that link decodes the state entirely in the client's browser without any server requests.
