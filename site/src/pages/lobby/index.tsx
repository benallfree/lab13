import Link from '@docusaurus/Link'
import { usePluginData } from '@docusaurus/useGlobalData'
import Layout from '@theme/Layout'
import { useEffect, useRef, useState } from 'react'
import { Js13kLobby, LobbyStats } from '../../lib/Js13kLobby'

type GameMeta = {
  title: string
  description: string
  slug: string
  thumbnail: string
}

export default function Lobby() {
  const gamesData = (usePluginData('dynamic-games-plugin') as GameMeta[]) || []
  const [playerCount, setPlayerCount] = useState(0)
  const [lobbyStats, setLobbyStats] = useState<LobbyStats>({ games: {} })
  const lobbyRef = useRef<Js13kLobby | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const lobby = new Js13kLobby({ host: window.location.origin, debug: true })
    lobbyRef.current = lobby
    lobby.on('stats', (lobbyStats) => {
      setLobbyStats(lobbyStats)
      setPlayerCount(lobbyStats.games.js13k.playerCount)
    })

    return () => {
      lobby.disconnect()
    }
  }, [])
  return (
    <Layout title="Game Lobby" description="Choose a game to play with friends">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--12">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h1 className="hero__title" style={{ marginBottom: '0.25rem' }}>
                  Game Lobby{' '}
                  <span
                    style={{
                      fontSize: '0.8rem',
                      marginLeft: '0.5em',
                      color: '#22c55e',
                      fontWeight: 600,
                      animation: 'fancyThrob 1.1s infinite alternate cubic-bezier(0.4,0,0.6,1)',
                      textShadow: '0 0 8px #22c55e88, 0 0 2px #fff',
                      letterSpacing: '0.01em',
                    }}
                  >
                    ({playerCount} players online)
                  </span>
                  <style>
                    {`
                      @keyframes fancyThrob {
                        0% { transform: scale(1); filter: brightness(1); }
                        100% { transform: scale(1.15); filter: brightness(1.5); }
                      }
                    `}
                  </style>
                </h1>
                <p className="hero__subtitle" style={{ margin: 0 }}>
                  Choose a game to play with friends
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'nowrap' }}>
                <Link
                  className="button button--primary button--sm"
                  to="/docs/tutorials/add-your-game"
                  style={{
                    background: 'linear-gradient(90deg, #22c55e 0%, #3b82f6 50%, #a855f7 100%)',
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Add your game
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {(gamesData as GameMeta[]).map((game) => (
            <div key={game.slug} className="col col--3 margin-bottom--md">
              <div className="card" style={{ height: '100%', position: 'relative' }}>
                {lobbyStats.games[(game as GameMeta).slug]?.playerCount > 0 && (
                  <div className="online-badge">
                    Online Now: {lobbyStats.games[(game as GameMeta).slug].playerCount}
                  </div>
                )}
                <div
                  className="card__image padding--none"
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
