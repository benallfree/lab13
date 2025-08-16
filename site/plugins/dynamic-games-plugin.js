const path = require('path')
const fs = require('fs').promises

module.exports = function (context, options) {
  return {
    name: 'dynamic-games-plugin',
    async loadContent() {
      // Read the games.json file
      const gamesJsonPath = path.join(context.siteDir, 'games.json')
      const gamesData = JSON.parse(await fs.readFile(gamesJsonPath, 'utf-8'))
      return gamesData
    },
    async contentLoaded({ content, actions }) {
      const { addRoute, createData } = actions

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
