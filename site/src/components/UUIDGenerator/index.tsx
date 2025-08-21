import React, { useEffect, useState } from 'react'
import styles from './styles.module.css'

export default function UUIDGenerator(): React.JSX.Element {
  const [uuid, setUuid] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)

  const generateUUID = () => {
    return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    )
  }

  const refreshUUID = () => {
    setUuid(generateUUID())
  }

  const sampleCode = `import Js13kClient from 'https://esm.sh/js13k'\nconst client = new Js13kClient('${uuid}')`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sampleCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  useEffect(() => {
    refreshUUID()
  }, [])

  return (
    <div className={styles.uuidGenerator}>
      <div className={styles.codeBlock}>
        <div className={styles.codeHeader}>
          <div className={styles.headerText}>Super Mighty Room Key Generator</div>
          <div className={styles.headerActions}>
            <button onClick={copyToClipboard} className={styles.copyButton} title="Copy code">
              {copied ? '✅' : '📋'}
            </button>
            <button onClick={refreshUUID} className={styles.refreshButton} title="Generate new UUID">
              🔄
            </button>
          </div>
        </div>
        <pre className={styles.code}>
          <code>{sampleCode}</code>
        </pre>
      </div>
    </div>
  )
}
