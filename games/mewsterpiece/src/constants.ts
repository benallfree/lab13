import cats from './cats.json' with { type: 'json' }

export { cats }

// Constants for deterministic timing
export const LEVEL_PAUSE_DURATION = 10 * 1000 // 10 seconds between levels

export const MATCH_PAUSE_DURATION = 10 * 1000 // 30 seconds between matches

export const TOTAL_MATCH_DURATION =
  cats.reduce((acc, cat) => acc + cat.ttl + LEVEL_PAUSE_DURATION, 0) + MATCH_PAUSE_DURATION
