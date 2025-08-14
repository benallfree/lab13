import React, { useState, useEffect } from 'react'
import { useHistory } from '@docusaurus/router'
import styles from './styles.module.css'

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
        const foundDemo = demos.find(demo => 
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
    const demo = demos.find(d => d.filename === filename)
    if (demo) {
      const demoName = demo.name.toLowerCase().replace(/\s+/g, '-')
      history.push(`/demos?game=${demoName}`)
    }
  }

  const addNewIframe = () => {
    if (!currentDemo) return
    setIframeCount(prev => prev + 1)
  }

  const viewOnGithub = () => {
    if (!currentDemo) return
    window.open(`https://github.com/benallfree/js13k-mmo/tree/main/site/static/demos/${currentDemo}`, '_blank')
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h2>JS13K MMO Demos</h2>
        <nav className={styles.demoNav}>
          {demos.map((demo) => (
            <button
              key={demo.filename}
              className={`${styles.demoItem} ${activeDemo === demo.filename ? styles.active : ''}`}
              onClick={() => loadDemo(demo.filename)}
            >
              <h3>{demo.name}</h3>
              <p>{demo.description}</p>
            </button>
          ))}
        </nav>
        
      </aside>
      <main className={styles.mainContent}>
        <div className={styles.mainHeader}>
          <button
            className={styles.viewGithubBtn}
            onClick={viewOnGithub}
            style={{ display: currentDemo ? 'flex' : 'none' }}
          >
            <span className={styles.githubIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </span>
            <span>Source</span>
          </button>
        </div>
        <div className={styles.iframesContainer}>
          {Array.from({ length: iframeCount }, (_, index) => (
            <div key={index} className={styles.iframeContainer}>
              <iframe
                className={styles.demoIframe}
                src={currentDemo ? `/demos/${currentDemo}` : ''}
                width="640"
                height="400"
                frameBorder="0"
              />
            </div>
          ))}
        </div>
        <button className={styles.addIframeBtn} onClick={addNewIframe}>
          <span>+</span>
          <span>Add Demo Instance</span>
        </button>
      </main>
    </div>
  )
}
