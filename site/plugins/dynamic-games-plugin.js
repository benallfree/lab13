const path = require('path')
const fs = require('fs').promises

module.exports = function (context, options) {
  return {
    name: 'dynamic-games-plugin',
    async loadContent() {
      // Prefer aggregating per-game meta.json files from static games folders
      const gamesDir = path.join(context.siteDir, 'static', 'games')
      let aggregated = []
      try {
        const entries = await fs.readdir(gamesDir, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          const slug = entry.name
          const metaPath = path.join(gamesDir, slug, 'meta.json')
          let meta = {}
          try {
            const raw = await fs.readFile(metaPath, 'utf-8')
            meta = JSON.parse(raw)
          } catch (_) {
            // No meta.json available; fall back to slug-based defaults
          }

          const humanize = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

          // Determine thumbnail web path with filesystem check
          const thumbnailFsPath = path.join(gamesDir, slug, 'thumbnail.webp')
          let thumbnailWebPath = `/games/${slug}/thumbnail.webp`
          try {
            await fs.access(thumbnailFsPath)
          } catch (_) {
            // Fallback thumbnail if not present in the game folder
            thumbnailWebPath = `/img/favicon.webp`
          }

          const withDefaults = {
            // Always derive slug from folder name
            slug,
            title: meta.title || humanize(slug),
            description: meta.description || '',
            // Use game thumbnail if present, otherwise fallback icon
            thumbnail: thumbnailWebPath,
            repository: meta.repository || '',
          }
          aggregated.push(withDefaults)
        }
      } catch (_) {
        // static/games not found or unreadable
      }

      return aggregated
    },
    async contentLoaded({ content, actions }) {
      const { addRoute, createData, setGlobalData } = actions

      // Expose the aggregated games list to the client
      setGlobalData(content)

      // Generate routes for each game
      for (const game of content) {
        // Create JSON data file for each game
        const gameDataPath = await createData(`game-${game.slug}.json`, JSON.stringify(game))

        // Generate /lobby/[slug] route
        addRoute({
          path: `/lobby/${game.slug}`,
          component: '@site/src/components/GamePage.tsx',
          modules: { gameData: gameDataPath },
          exact: true,
        })
      }
    },
  }
}
