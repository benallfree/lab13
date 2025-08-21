import Heading from '@theme/Heading'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './styles.module.css'

type FeatureItem = {
  title: string
  Svg: React.ComponentType<React.ComponentProps<'svg'>>
  description: ReactNode
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Sponsored by Cloudflare',
    Svg: require('@site/static/img/cloudflare.svg').default,
    description: (
      <>
        Cloudflare proudly supports <a href="https://js13kgames.com/2025/online">JS13K Online</a>.
      </>
    ),
  },
  {
    title: 'Focus on the Game',
    Svg: require('@site/static/img/IonIosGameControllerB.svg').default,
    description: (
      <>
        You don't need to write any server code to participate in the Online category. The JS13K Online relay server is
        hosted on Cloudflare and will handle all the server-side logic for you.
      </>
    ),
  },
  {
    title: 'Vanilla JS',
    Svg: require('@site/static/img/MaterialIconThemeJavascriptMap.svg').default,
    description: (
      <>
        You can add MMO to your game using just vanilla JS. No React, no Angular, no Vue, no Svelte, no Deno, no Node,
        no Bun, no anything.
      </>
    ),
  },
]

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
