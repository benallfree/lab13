---
title: Add Your Game to the Lobby
sidebar_position: 8
---

# Add Your Game

Join a growing online community ecosystem of tiny Online MMO games. Adding your game to the lobby makes it easy for players to discover and play your creation directly on the site.

## 1) Add your front end (build output)

- Put your built static files at: `site/static/games/<your-slug>`
- Minimally, include an `index.html` entry point

Example structure:

```text
site/static/games/cats/
  index.html
  assets/
    bundle.js
    styles.css
```

## 2) (Optional) Add a thumbnail

- Take a square screenshot (recommended 512×512) of your game
- Save it as `thumbnail.webp` next to your `index.html`
- Path: `site/static/games/<your-slug>/thumbnail.webp`
- If missing, the lobby will use `/img/favicon.webp` as a fallback

## 3) (Optional) Add `meta.json`

Add metadata to improve the lobby card and game page.

Create `site/static/games/<your-slug>/meta.json`:

```json
{
  "title": "Black Cats",
  "description": "Chase mice with black cats in a spooky environment.",
  "repository": "https://github.com/your/repo"
}
```

> Note: if `meta.json` is omitted, the lobby will title‑case your folder name and leave description blank

## 4) Open a PR

Submit a pull request to the repository: [benallfree/js13k-online](https://github.com/benallfree/js13k-online).

Include your `site/static/games/<your-slug>` folder.

That's it! Once merged, your game will appear in the lobby.
