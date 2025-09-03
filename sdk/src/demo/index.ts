export type DemoOptions = {
  iframeWidth?: number
  iframeHeight?: number
  buttonText?: string
  buttonStyle?: Partial<CSSStyleDeclaration>
  containerStyle?: Partial<CSSStyleDeclaration>
  iframeStyle?: Partial<CSSStyleDeclaration>
}

export const useDemo = (options?: Partial<DemoOptions>) => {
  const {
    iframeWidth = 640,
    iframeHeight = 480,
    buttonText = '+ Add',
    buttonStyle = {},
    containerStyle = {},
    iframeStyle = {},
  } = options || {}

  // Check if we're in demo mode
  const isDemoMode = location.search.includes('demo')

  if (!isDemoMode) {
    return { isDemoMode: false }
  }

  // Create styles
  const containerStyles = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    padding: '10px',
    ...containerStyle,
  }

  const buttonStyles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '80px',
    height: '40px',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    zIndex: '1000',
    ...buttonStyle,
  }

  const sliderStyles = {
    position: 'fixed',
    top: '70px',
    right: '20px',
    width: '80px',
    height: '40px',
    background: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    zIndex: '1000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  }

  const iframeStyles = {
    border: '2px solid #333',
    borderRadius: '8px',
    ...iframeStyle,
  }

  // Create container
  const container = document.createElement('div')
  container.id = 'demo-container'
  Object.assign(container.style, containerStyles)

  // Create add button
  const addButton = document.createElement('button')
  addButton.className = 'add-btn'
  addButton.textContent = buttonText
  Object.assign(addButton.style, buttonStyles)

  // Create size slider
  const sizeSlider = document.createElement('div')
  sizeSlider.className = 'size-slider'

  // Get saved size or use default
  const savedSize = localStorage.getItem('demo-iframe-size')
  const initialSize = savedSize ? parseInt(savedSize) : iframeWidth

  sizeSlider.innerHTML = `
    <input type="range" min="200" max="800" value="${initialSize}" style="width: 60px; margin: 2px;">
    <span style="font-size: 10px;">Size</span>
  `
  Object.assign(sizeSlider.style, sliderStyles)

  // Hide canvas
  const canvas = document.getElementById('c')
  if (canvas) {
    canvas.style.display = 'none'
  }

  // Ensure body allows scrolling
  document.body.style.overflow = 'auto'
  document.body.style.height = 'auto'
  document.documentElement.style.overflow = 'auto'
  document.documentElement.style.height = 'auto'

  // Add elements to page
  document.body.appendChild(container)
  document.body.appendChild(addButton)
  document.body.appendChild(sizeSlider)

  // Get current size from slider
  const getCurrentSize = () => {
    const slider = sizeSlider.querySelector('input') as HTMLInputElement
    return parseInt(slider.value)
  }

  // Save size to localStorage
  const saveSize = (size: number) => {
    localStorage.setItem('demo-iframe-size', size.toString())
  }

  // Resize all iframes
  const resizeAllIframes = () => {
    const size = getCurrentSize()
    const aspectRatio = iframeHeight / iframeWidth
    const newHeight = Math.round(size * aspectRatio)

    const iframes = container.querySelectorAll('.demo-iframe') as NodeListOf<HTMLIFrameElement>
    iframes.forEach((iframe) => {
      iframe.width = size.toString()
      iframe.height = newHeight.toString()
    })
  }

  // Add iframe function
  const addIframe = () => {
    const iframeWrapper = document.createElement('div')
    iframeWrapper.style.position = 'relative'
    iframeWrapper.style.display = 'inline-block'

    const iframe = document.createElement('iframe')
    iframe.src = location.pathname
    const size = getCurrentSize()
    const aspectRatio = iframeHeight / iframeWidth
    const height = Math.round(size * aspectRatio)
    iframe.width = size.toString()
    iframe.height = height.toString()
    iframe.className = 'demo-iframe'
    Object.assign(iframe.style, iframeStyles)

    // Create trash can icon
    const trashIcon = document.createElement('div')
    trashIcon.innerHTML = '🗑️'
    trashIcon.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(255, 0, 0, 0.8);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
    `

    // Show/hide trash icon on hover
    iframeWrapper.addEventListener('mouseenter', () => {
      iframe.style.border = '3px solid #4caf50'
      iframe.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)'
      trashIcon.style.opacity = '1'
    })

    iframeWrapper.addEventListener('mouseleave', () => {
      iframe.style.border = '3px solid #000'
      iframe.style.boxShadow = '0 0 10px rgba(0,0,0, 0.5)'
      trashIcon.style.opacity = '0'
    })

    // Remove iframe when trash icon is clicked
    trashIcon.addEventListener('click', (e) => {
      e.stopPropagation()
      iframeWrapper.remove()
      // Update localStorage count after removal
      const remainingCount = container.children.length
      localStorage.setItem('demo-iframe-count', remainingCount.toString())
    })

    iframeWrapper.appendChild(iframe)
    iframeWrapper.appendChild(trashIcon)
    container.appendChild(iframeWrapper)
  }

  // Add click handler
  addButton.addEventListener('click', () => {
    addIframe()
    // Save count to localStorage
    const currentCount = container.children.length
    localStorage.setItem('demo-iframe-count', currentCount.toString())
  })

  // Add slider change handler
  const slider = sizeSlider.querySelector('input') as HTMLInputElement
  slider.addEventListener('input', () => {
    const size = getCurrentSize()
    resizeAllIframes()
    saveSize(size)
  })

  // Restore iframe count from localStorage
  const savedCount = localStorage.getItem('demo-iframe-count')
  const initialCount = savedCount ? parseInt(savedCount) : 1

  // Add initial iframes
  for (let i = 0; i < initialCount; i++) {
    addIframe()
  }

  return {
    isDemoMode: true,
    addIframe,
    container,
    addButton,
    sizeSlider,
    resizeAllIframes,
  }
}
