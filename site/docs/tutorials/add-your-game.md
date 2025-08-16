---
title: Add Your Game to the Lobby
sidebar_position: 8
---

# Add Your Game

Join a growing online community ecosystem of tiny Online MMO games. Adding your game to the lobby makes it easy for players to discover and play your creation directly on the site.

## 1) Get a screenshot

- Take a square screenshot (recommended 512×512) of your game
- Save it as `thumbnail.webp`

Place it next to your game files at: `site/static/games/<your-slug>/thumbnail.webp`.

## 2) Add your front end (build output)

- Put your built static files at: `site/static/games/<your-slug>`
- Must include an `index.html` entry point

Example structure:

```text
site/static/games/cats/
  index.html
  thumbnail.webp
  assets/
    bundle.js
    styles.css
```

## 3) Add your game to `site/games.json`

Add an entry with a unique `slug`, title, description, and thumbnail path:

```json
{
  "title": "Black Cats",
  "description": "Chase mice in multiplayer.",
  "slug": "cats",
  "thumbnail": "/games/cats/thumbnail.webp"
}
```

Notes:

- `thumbnail` should be a web path beginning with `/games/...`
- `slug` becomes the lobby URL: `/lobby/<slug>`

## 4) Open a PR

Submit a pull request to the repository: [benallfree/js13k-online](https://github.com/benallfree/js13k-online).

Include:

- Your `site/static/games/<your-slug>` folder
- The update to `site/games.json`

That's it! Once merged, your game will appear in the lobby.
