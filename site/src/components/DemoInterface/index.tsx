import { useHistory } from '@docusaurus/router'
import clsx from 'clsx'
import { useEffect, useState } from 'react'

// Demo data
const demos = [
  {
    name: 'Paint',
    filename: 'paint.html',
    description: 'Collaborative painting with friends.',
  },
  {
    name: 'Cars',
    filename: 'cars.html',
    description: 'Race with friends in a 2D car race.',
  },
  {
    name: 'Black Cats',
    filename: 'cats.html',
    description: 'Chase mice with black cats in a spooky environment.',
  },
  {
    name: 'Flight Simulator',
    filename: 'flight.html',
    description: 'Fly with friends in a 3D flight simulator.',
  },
]

interface DemoInterfaceProps {
  initialDemo?: string
}

export default function DemoInterface({ initialDemo }: DemoInterfaceProps) {
  const history = useHistory()
  const [currentDemo, setCurrentDemo] = useState('')
  const [iframeCount, setIframeCount] = useState(1)
  const [activeDemo, setActiveDemo] = useState('')

  // Load initial demo based on prop or first demo by default
  useEffect(() => {
    if (demos.length > 0 && !currentDemo) {
      let demoToLoad = demos[0].filename

      if (initialDemo) {
        // Find demo by name (case-insensitive), kebab-case name, or filename
        const foundDemo = demos.find(
          (demo) =>
            demo.name.toLowerCase() === initialDemo.toLowerCase() ||
            demo.name.toLowerCase().replace(/\s+/g, '-') === initialDemo.toLowerCase() ||
            demo.filename === `${initialDemo}.html` ||
            demo.filename === initialDemo
        )
        if (foundDemo) {
          demoToLoad = foundDemo.filename
        }
      }

      setCurrentDemo(demoToLoad)
      setActiveDemo(demoToLoad)
    }
  }, [currentDemo, initialDemo])

  const loadDemo = (filename: string) => {
    setCurrentDemo(filename)
    setActiveDemo(filename)
    setIframeCount(1)

    // Find the demo name to update the URL with query parameter
    const demo = demos.find((d) => d.filename === filename)
    if (demo) {
      const demoName = demo.name.toLowerCase().replace(/\s+/g, '-')
      history.push(`/demos?game=${demoName}`)
    }
  }

  const addNewIframe = () => {
    if (!currentDemo) return
    setIframeCount((prev) => prev + 1)
  }

  const viewOnGithub = () => {
    if (!currentDemo) return
    window.open(`https://github.com/benallfree/js13k-online/tree/main/site/static/demos/${currentDemo}`, '_blank')
  }

  return (
    <div className="container margin-vert--lg">
      <div className="row">
        <aside className="col col--3">
          <div className="card">
            <div className="card__header">
              <h2 className="margin-bottom--none">JS13K Online Demos</h2>
            </div>
            <div className="card__body">
              <nav>
                {demos.map((demo) => (
                  <button
                    key={demo.filename}
                    className={clsx(
                      'button',
                      'button--outline',
                      'button--block',
                      'margin-bottom--sm',
                      'text--left',
                      activeDemo === demo.filename && 'button--primary'
                    )}
                    onClick={() => loadDemo(demo.filename)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 'var(--ifm-button-padding-vertical) var(--ifm-button-padding-horizontal)',
                      textAlign: 'left',
                      border: '1px solid var(--ifm-color-emphasis-300)',
                      borderRadius: 'var(--ifm-button-border-radius)',
                      background:
                        activeDemo === demo.filename ? 'var(--ifm-color-primary)' : 'var(--ifm-background-color)',
                      color:
                        activeDemo === demo.filename
                          ? 'var(--ifm-color-primary-contrast-background)'
                          : 'var(--ifm-font-color-base)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    <h3 className="margin-bottom--xs" style={{ fontSize: '1rem', margin: '0 0 0.25rem 0' }}>
                      {demo.name}
                    </h3>
                    <p className="margin-bottom--none" style={{ fontSize: '0.875rem', opacity: 0.8, margin: 0 }}>
                      {demo.description}
                    </p>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        <main className="col col--9">
          <div className="card" style={{ minHeight: '600px', position: 'relative' }}>
            <div className="card__header">
              <div className="row">
                <div className="col col--12">
                  <div className="text--right">
                    <button
                      className="button button--outline button--sm"
                      onClick={viewOnGithub}
                      style={{ display: currentDemo ? 'inline-flex' : 'none' }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        style={{ marginRight: '0.5rem' }}
                      >
                        <path
                          fill="currentColor"
                          d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                        />
                      </svg>
                      Source
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card__body">
              <div className="row" style={{ marginBottom: '80px' }}>
                {Array.from({ length: iframeCount }, (_, index) => (
                  <div key={index} className="col col--12 margin-bottom--md">
                    <div className="card" style={{ padding: '1rem' }}>
                      <iframe
                        src={currentDemo ? `/demos/${currentDemo}` : ''}
                        width="100%"
                        height="400"
                        frameBorder="0"
                        style={{
                          borderRadius: 'var(--ifm-card-border-radius)',
                          background: 'var(--ifm-background-color)',
                          border: '1px solid var(--ifm-color-emphasis-300)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="button button--primary"
                onClick={addNewIframe}
                style={{
                  position: 'absolute',
                  bottom: '2rem',
                  right: '2rem',
                  borderRadius: '50px',
                  padding: '1rem 1.5rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>+</span>
                <span>Add Demo Instance</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
