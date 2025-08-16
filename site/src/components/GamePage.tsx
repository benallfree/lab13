import Layout from '@theme/Layout'
import GameInterface from './GameInterface'

type GamePageProps = {
  gameData: {
    title: string
    description: string
    slug: string
    thumbnail: string
  }
}

export default function GamePage({ gameData }: GamePageProps) {
  return (
    <Layout title={gameData.title} description={gameData.description}>
      <div className="container margin-vert--lg">
        <GameInterface slug={gameData.slug} />
      </div>
    </Layout>
  )
}
