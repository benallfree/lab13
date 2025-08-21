import Link from '@docusaurus/Link'
import { usePluginData } from '@docusaurus/useGlobalData'
import { Lab13Client } from '@site/static/sdk'
import Layout from '@theme/Layout'
import { PartySocket } from 'partysocket'
import { useEffect, useRef } from 'react'
import { useMutative } from 'use-mutative'

type GameMeta = {
  title: string
  description: string
  slug: string
  thumbnail: string
}

type GameStats = {
  playerIds: Set<string>
}

type GameStatsMap = {
  [gameSlug: string]: GameStats
}

export default function Lobby() {
  const gamesData = (usePluginData('dynamic-games-plugin') as GameMeta[]) || []
  const [gameStats, setGameStats] = useMutative<GameStatsMap>({})
  const socketsRef = useRef<Map<string, PartySocket>>(new Map())

  const updateGameStats = (gameSlug: string, updater: (stats: GameStats) => void) => {
    setGameStats((draft) => {
      if (!draft[gameSlug]) {
        draft[gameSlug] = {
          playerIds: new Set(),
        }
      }
      updater(draft[gameSlug])
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize stats for all games
    const initialStats: GameStatsMap = {}
    gamesData.forEach((game) => {
      initialStats[game.slug] = {
        playerIds: new Set(),
      }
    })
    setGameStats(initialStats)

    // Connect to each game's WebSocket
    gamesData.forEach((game) => {
      const socket = new PartySocket({
        host: 'relay.js13kgames.com',
        party: 'mewsterpiece',
        room: game.slug,
      })

      const lab13Client = Lab13Client(socket, { bot: true })

      lab13Client.on('player-id-updated', (event) => {
        lab13Client.queryPlayerIds()
      })
      lab13Client.on('player-ids-updated', (event) => {
        console.log('player-ids-updated', event.detail)
        updateGameStats(game.slug, (stats) => {
          stats.playerIds = new Set(lab13Client.playerIds())
        })
      })

      socketsRef.current.set(game.slug, socket)
    })

    return () => {
      // Clean up all sockets
      socketsRef.current.forEach((socket) => {
        socket.close()
      })
      socketsRef.current.clear()
    }
  }, [gamesData])

  const totalPlayers = Object.values(gameStats).reduce((sum, stats) => sum + stats.playerIds.size, 0)

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
                    ({totalPlayers} players online)
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
          {(() => {
            // Split games into "Now Playing" and "Needs Players" sections
            const nowPlaying = gamesData
              .filter((game) => {
                const stats = gameStats[game.slug] || { playerIds: new Set() }
                return stats.playerIds.size > 0
              })
              .sort((a, b) => a.title.localeCompare(b.title))

            const needsPlayers = gamesData
              .filter((game) => {
                const stats = gameStats[game.slug] || { playerIds: new Set() }
                return stats.playerIds.size === 0
              })
              .sort((a, b) => a.title.localeCompare(b.title))

            return (
              <>
                {/* Now Playing Section */}
                {nowPlaying.length > 0 && (
                  <div className="col col--12">
                    <div
                      style={{
                        borderBottom: '2px solid #22c55e',
                        marginBottom: '2rem',
                        paddingBottom: '0.5rem',
                      }}
                    >
                      <h2
                        style={{
                          marginBottom: '1rem',
                          color: '#22c55e',
                          fontSize: '1.5rem',
                          fontWeight: '600',
                        }}
                      >
                        Now Playing
                      </h2>
                    </div>
                    <div className="row">
                      {nowPlaying.map((game) => {
                        const stats = gameStats[game.slug] || { playerIds: new Set() }
                        return (
                          <div key={game.slug} className="col col--2 margin-bottom--md">
                            <div className="card" style={{ height: '100%', position: 'relative' }}>
                              <div className="online-badge">Online Now: {stats.playerIds.size}</div>
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
                              <div className="card__body" style={{ padding: '0.5rem' }}>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{game.title}</h4>
                                <p
                                  style={{
                                    margin: '0 0 0.5rem 0',
                                    fontSize: '0.75rem',
                                    lineHeight: '1.2',
                                    color: 'var(--ifm-color-emphasis-700)',
                                  }}
                                >
                                  {game.description}
                                </p>
                              </div>
                              <div className="card__footer" style={{ padding: '0.25rem 0.5rem' }}>
                                <Link
                                  className="button button--primary button--block button--sm"
                                  to={`/lobby/${game.slug}`}
                                >
                                  Play
                                </Link>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Needs Players Section */}
                {needsPlayers.length > 0 && (
                  <div className="col col--12">
                    <div
                      style={{
                        borderBottom: '2px solid #6b7280',
                        marginBottom: '2rem',
                        paddingBottom: '0.5rem',
                        marginTop: '3rem',
                      }}
                    >
                      <h2
                        style={{
                          marginBottom: '1rem',
                          color: '#6b7280',
                          fontSize: '1.5rem',
                          fontWeight: '600',
                        }}
                      >
                        Needs Players
                      </h2>
                    </div>
                    <div className="row">
                      {needsPlayers.map((game) => {
                        const stats = gameStats[game.slug] || { playerIds: new Set() }
                        return (
                          <div key={game.slug} className="col col--2 margin-bottom--md">
                            <div className="card" style={{ height: '100%', position: 'relative' }}>
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
                              <div className="card__body" style={{ padding: '0.5rem' }}>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{game.title}</h4>
                                <p
                                  style={{
                                    margin: '0 0 0.5rem 0',
                                    fontSize: '0.75rem',
                                    lineHeight: '1.2',
                                    color: 'var(--ifm-color-emphasis-700)',
                                  }}
                                >
                                  {game.description}
                                </p>
                              </div>
                              <div className="card__footer" style={{ padding: '0.25rem 0.5rem' }}>
                                <Link
                                  className="button button--primary button--block button--sm"
                                  to={`/lobby/${game.slug}`}
                                >
                                  Play
                                </Link>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </Layout>
  )
}
