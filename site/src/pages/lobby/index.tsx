import Link from '@docusaurus/Link'
import Layout from '@theme/Layout'
import gamesData from '../../../games.json'

type GameMeta = {
  title: string
  description: string
  slug: string
  thumbnail: string
}

export default function Lobby() {
  return (
    <Layout title="Game Lobby" description="Choose a game to play with friends">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--12">
            <h1 className="hero__title">Game Lobby</h1>
            <p className="hero__subtitle">Choose a game to play with friends</p>
          </div>
        </div>

        <div className="row">
          {(gamesData as GameMeta[]).map((game) => (
            <div key={game.slug} className="col col--3 margin-bottom--md">
              <div className="card" style={{ height: '100%' }}>
                <div
                  className="card__image"
                  style={{
                    aspectRatio: '1 / 1',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div className="card__body" style={{ padding: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{game.title}</h4>
                  <p
                    style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '0.85rem',
                      lineHeight: '1.3',
                      color: 'var(--ifm-color-emphasis-700)',
                    }}
                  >
                    {game.description}
                  </p>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--ifm-color-secondary)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Players online: 0
                  </div>
                </div>
                <div className="card__footer" style={{ padding: '0.5rem 0.75rem' }}>
                  <Link className="button button--primary button--block button--sm" to={`/lobby/${game.slug}`}>
                    Play
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
