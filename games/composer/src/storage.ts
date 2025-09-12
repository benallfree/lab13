// Port-independent storage using multiple fallback methods
export class PortIndependentStorage {
  private static readonly STORAGE_KEY = 'musicComposer_data'

  // Try multiple storage methods in order of preference
  private static getStorageMethods(): Storage[] {
    const methods: Storage[] = []

    // 1. Try localStorage on current origin
    try {
      if (typeof localStorage !== 'undefined') {
        methods.push(localStorage)
      }
    } catch (e) {
      console.warn('localStorage not available:', e)
    }

    // 2. Try sessionStorage as fallback
    try {
      if (typeof sessionStorage !== 'undefined') {
        methods.push(sessionStorage)
      }
    } catch (e) {
      console.warn('sessionStorage not available:', e)
    }

    return methods
  }

  static save(data: any): boolean {
    const methods = this.getStorageMethods()

    for (const storage of methods) {
      try {
        storage.setItem(this.STORAGE_KEY, JSON.stringify(data))
        return true
      } catch (e) {
        console.warn(`Failed to save to ${storage.constructor.name}:`, e)
      }
    }

    return false
  }

  static load(): any | null {
    const methods = this.getStorageMethods()

    for (const storage of methods) {
      try {
        const data = JSON.parse(storage.getItem(this.STORAGE_KEY) || 'null')
        if (data) {
          console.log('Loaded data from storage:', JSON.stringify(data))
          return data
        }
      } catch (e) {
        console.warn(`Failed to load from ${storage.constructor.name}:`, e)
      }
    }

    return null
  }

  static clear(): boolean {
    const methods = this.getStorageMethods()
    let success = false

    for (const storage of methods) {
      try {
        storage.removeItem(this.STORAGE_KEY)
        success = true
      } catch (e) {
        console.warn(`Failed to clear ${storage.constructor.name}:`, e)
      }
    }

    return success
  }

  // Cross-origin storage using postMessage (for same domain, different ports)
  static saveCrossOrigin(data: any): void {
    try {
      // Try to save to parent window if in iframe
      if (window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'musicComposer_save',
            data: data,
          },
          '*'
        )
      }

      // Try to save to all open windows of same origin
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'musicComposer_save',
            data: data,
          },
          '*'
        )
      }
    } catch (e) {
      console.warn('Cross-origin storage failed:', e)
    }
  }

  static loadCrossOrigin(): any | null {
    // Listen for cross-origin messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'musicComposer_save') {
        return event.data.data
      }
    }

    window.addEventListener('message', handleMessage)

    // Request data from other windows
    try {
      if (window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'musicComposer_request',
          },
          '*'
        )
      }

      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'musicComposer_request',
          },
          '*'
        )
      }
    } catch (e) {
      console.warn('Cross-origin request failed:', e)
    }

    return null
  }
}
