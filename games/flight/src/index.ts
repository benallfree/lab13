import {
  createMyStateCopier,
  createPositionNormalizer,
  createRotationNormalizer,
  onClientJoined,
  onClientLeft,
  onClose,
  onMyIdUpdated,
  onOpen,
  PLAYER_ENTITY_COLLECTION_KEY,
  round,
  StateBase,
  useMyId,
  useOnline,
  useState,
} from 'lab13-sdk'
import type * as THREEType from 'three'

declare global {
  var THREE: typeof THREEType
}

// Create status indicator
const statusIndicator = document.createElement('div')
statusIndicator.className = 'status-indicator status-connecting'
statusIndicator.textContent = 'Connecting...'
document.body.appendChild(statusIndicator)

type PlayerState = { x: number; y: number; z: number; rz: number; s: number; rx: number; ry: number }

type GameState = StateBase<PlayerState>

const normalizePosition = createPositionNormalizer()
const normalizeRotation = createRotationNormalizer()

useOnline(`mewsterpiece/flight`)
const { getMyId } = useMyId()
const myStateCopier = createMyStateCopier(getMyId)
const { getState, updateMyState, getMyState, getPlayerStates } = useState<GameState>({
  onBeforeSendDelta: (delta) => {
    console.log('Before sending delta:', JSON.stringify(delta, null, 2))
    const myId = getMyId()
    const playerState = delta[PLAYER_ENTITY_COLLECTION_KEY]?.[myId]
    if (playerState != null) {
      playerState.s = round(playerState.s || 0, 2)
    }
    return normalizePosition(normalizeRotation(delta as any))
  },
  onStateReceived: (currentState, newState) => {
    return myStateCopier(currentState, newState)
  },
})

const deltaEvaluator = (delta: any, remoteState: any, playerId: any) => {
  // If no base state, always send
  if (!remoteState || !playerId) {
    return true
  }

  // Get the player's previous state from the delta base
  const playerBase = remoteState._players?.[playerId]
  if (!playerBase) {
    return true
  }

  // Check if position, rotation, or speed have changed significantly
  const newX = delta._players?.[playerId]?.x
  const newY = delta._players?.[playerId]?.y
  const newZ = delta._players?.[playerId]?.z
  const newRx = delta._players?.[playerId]?.rx
  const newRy = delta._players?.[playerId]?.ry
  const newRz = delta._players?.[playerId]?.rz
  const newS = delta._players?.[playerId]?.s

  const xChanged = newX != null && (playerBase.x == null || Math.abs(newX - playerBase.x) > 2)
  const yChanged = newY != null && (playerBase.y == null || Math.abs(newY - playerBase.y) > 2)
  const zChanged = newZ != null && (playerBase.z == null || Math.abs(newZ - playerBase.z) > 2)
  const rxChanged = newRx != null && (playerBase.rx == null || Math.abs(newRx - playerBase.rx) > 0.05)
  const ryChanged = newRy != null && (playerBase.ry == null || Math.abs(newRy - playerBase.ry) > 0.05)
  const rzChanged = newRz != null && (playerBase.rz == null || Math.abs(newRz - playerBase.rz) > 0.05)
  const sChanged = newS != null && (playerBase.s == null || Math.abs(newS - playerBase.s) > 1)

  return xChanged || yChanged || zChanged || rxChanged || ryChanged || rzChanged || sChanged
}

// Game state
let keys: Record<string, boolean> = {}

// Three.js setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000)
const renderer = new THREE.WebGLRenderer({ antialias: false })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x87ceeb)
document.body.appendChild(renderer.domElement)

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(100, 100, 50)
scene.add(directionalLight)

// Ground
const groundGeometry = new THREE.PlaneGeometry(5000, 5000)
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90ee90 })
const ground = new THREE.Mesh(groundGeometry, groundMaterial)
ground.rotation.x = -Math.PI / 2
scene.add(ground)

// Add landmarks
function createLandmarks() {
  // Runway
  const runwayGeometry = new THREE.PlaneGeometry(200, 20)
  const runwayMaterial = new THREE.MeshLambertMaterial({
    color: 0x333333,
  })
  const runway = new THREE.Mesh(runwayGeometry, runwayMaterial)
  runway.rotation.x = -Math.PI / 2
  runway.position.set(0, 0.1, 0)
  scene.add(runway)

  // Runway markings
  for (let i = -8; i <= 8; i += 2) {
    const markingGeometry = new THREE.PlaneGeometry(2, 15)
    const markingMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
    })
    const marking = new THREE.Mesh(markingGeometry, markingMaterial)
    marking.rotation.x = -Math.PI / 2
    marking.position.set(i * 10, 0.2, 0)
    scene.add(marking)
  }

  // Control tower
  const towerGeometry = new THREE.CylinderGeometry(5, 8, 30, 8)
  const towerMaterial = new THREE.MeshLambertMaterial({
    color: 0x666666,
  })
  const tower = new THREE.Mesh(towerGeometry, towerMaterial)
  tower.position.set(50, 15, 50)
  scene.add(tower)

  // Tower top
  const topGeometry = new THREE.BoxGeometry(12, 4, 12)
  const topMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 })
  const top = new THREE.Mesh(topGeometry, topMaterial)
  top.position.set(50, 32, 50)
  scene.add(top)

  // Mountains in the distance
  for (let i = 0; i < 5; i++) {
    const mountainGeometry = new THREE.ConeGeometry(100 + Math.random() * 50, 200 + Math.random() * 100, 6)
    const mountainMaterial = new THREE.MeshLambertMaterial({
      color: 0x8b4513,
    })
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial)
    mountain.position.set((Math.random() - 0.5) * 2000, 100 + Math.random() * 100, (Math.random() - 0.5) * 2000)
    scene.add(mountain)
  }

  // Wind turbines
  for (let i = 0; i < 8; i++) {
    const baseGeometry = new THREE.CylinderGeometry(2, 3, 20, 8)
    const baseMaterial = new THREE.MeshLambertMaterial({
      color: 0x888888,
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.set((Math.random() - 0.5) * 1000, 10, (Math.random() - 0.5) * 1000)
    scene.add(base)

    // Turbine blades
    const bladeGeometry = new THREE.BoxGeometry(40, 2, 4)
    const bladeMaterial = new THREE.MeshLambertMaterial({
      color: 0xcccccc,
    })
    for (let j = 0; j < 3; j++) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial)
      blade.position.copy(base.position)
      blade.position.y += 20
      blade.rotation.y = (j * Math.PI * 2) / 3
      scene.add(blade)
    }
  }

  // Water tower
  const waterTowerGeometry = new THREE.CylinderGeometry(8, 8, 25, 8)
  const waterTowerMaterial = new THREE.MeshLambertMaterial({
    color: 0x87ceeb,
  })
  const waterTower = new THREE.Mesh(waterTowerGeometry, waterTowerMaterial)
  waterTower.position.set(-100, 12.5, -100)
  scene.add(waterTower)

  // Water tower top
  const waterTopGeometry = new THREE.SphereGeometry(10, 8, 6)
  const waterTopMaterial = new THREE.MeshLambertMaterial({
    color: 0x87ceeb,
  })
  const waterTop = new THREE.Mesh(waterTopGeometry, waterTopMaterial)
  waterTop.position.set(-100, 35, -100)
  scene.add(waterTop)
}

createLandmarks()

// Aircraft colors
const aircraftColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500, 0x800080]

// Create aircraft mesh
function createAircraft(color = 0xff0000) {
  const group = new THREE.Group()
  group.rotation.z = -Math.PI / 2

  // Fuselage
  const fuselageGeometry = new THREE.CylinderGeometry(1, 2, 8, 8)
  const fuselageMaterial = new THREE.MeshLambertMaterial({ color })
  const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial)
  fuselage.rotation.x = Math.PI / 2
  group.add(fuselage)

  // Wings
  const wingGeometry = new THREE.BoxGeometry(12, 0.5, 3)
  const wingMaterial = new THREE.MeshLambertMaterial({ color })
  const wings = new THREE.Mesh(wingGeometry, wingMaterial)
  wings.rotation.z = Math.PI / 2
  group.add(wings)

  // Tail
  const tailGeometry = new THREE.BoxGeometry(0.5, 4, 2)
  const tailMaterial = new THREE.MeshLambertMaterial({ color })
  const tail = new THREE.Mesh(tailGeometry, tailMaterial)
  tail.position.set(-3, 0, 0)
  tail.rotation.z = Math.PI / 2
  group.add(tail)

  return group
}

// Aircraft instances
const aircrafts: Record<string, THREEType.Group> = {}

// HUD elements
const hudElement = document.querySelector('.hud')

function updateHUD() {
  const myState = getMyState()
  if (!myState) return
  if (!hudElement) return
  hudElement.innerHTML = `
    ALT: ${Math.max(0, Math.round(myState.y || 0))}m<br>
    SPD: ${Math.round(myState.s || 0)}<br>
    HDG: ${Math.round(((myState.ry || 0 * 180) / Math.PI + 360) % 360)}°<br>
    PITCH: ${Math.round((myState.rx || 0 * 180) / Math.PI)}°<br>
    ROLL: ${Math.round((myState.rz || 0 * 180) / Math.PI)}°
  `
}

// Input handling
document.addEventListener('keydown', (e) => {
  keys[e.code] = true
})
document.addEventListener('keyup', (e) => {
  keys[e.code] = false
})

// Aircraft physics
function updateMyAircraft() {
  const myState = getMyState(true) // get a deep copy of the state
  if (!myState) return

  let moved = false
  const maxSpeed = 200
  const acceleration = 2
  const drag = 0.98

  // Thrust
  if (keys.KeyW || keys.ArrowUp) {
    myState.s = Math.min(maxSpeed, (myState.s || 0) + acceleration)
    moved = true
  }
  if (keys.KeyS || keys.ArrowDown) {
    myState.s = Math.max(0, (myState.s || 0) - acceleration)
    moved = true
  }

  // Controls
  if (keys.KeyA || keys.ArrowLeft) {
    myState.ry = (myState.ry || 0) + 0.02
    myState.rz = Math.max(-Math.PI / 2 - 0.3, (myState.rz || 0) - 0.02)
    moved = true
  } else if (keys.KeyD || keys.ArrowRight) {
    myState.ry = (myState.ry || 0) - 0.02
    myState.rz = Math.min(-Math.PI / 2 + 0.3, (myState.rz || 0) + 0.02)
    moved = true
  } else {
    myState.rz = (myState.rz || 0) + (-Math.PI / 2 - (myState.rz || 0)) * 0.05
  }

  if (keys.KeyQ) {
    myState.rx = Math.min(0.3, (myState.rx || 0) + 0.02)
    moved = true
  } else if (keys.KeyE) {
    myState.rx = Math.max(-0.3, (myState.rx || 0) - 0.02)
    moved = true
  } else {
    myState.rx = (myState.rx || 0) * 0.95
  }

  // Apply physics
  const velocity = new THREE.Vector3(0, 0, myState.s)
  const rotation = new THREE.Euler(myState.rx, myState.ry, myState.rz)
  velocity.applyEuler(rotation)

  myState.x = (myState.x || 0) + velocity.x * 0.016
  myState.y = (myState.y || 0) + velocity.y * 0.016
  myState.z = (myState.z || 0) + velocity.z * 0.016

  // Ground collision
  myState.y = Math.max(2, myState.y)

  // Apply drag
  myState.s = (myState.s || 0) * drag

  if (moved || (myState.s || 0) > 0.1) {
    // console.log('myState', myState)
    updateMyState(myState)
  }
}

// Update other aircrafts
function updateAircrafts() {
  const players = getPlayerStates()
  if (!players) return

  for (const playerId in players) {
    const playerState = players[playerId]
    if (!playerState) continue
    if (!aircrafts[playerId]) {
      const color = aircraftColors[parseInt(playerId) % aircraftColors.length]
      aircrafts[playerId] = createAircraft(color)
      scene.add(aircrafts[playerId])
    }

    const aircraft = aircrafts[playerId]
    aircraft.position.set(playerState.x || 0, playerState.y || 0, playerState.z || 0)
    aircraft.rotation.set(playerState.rx || 0, playerState.ry || 0, playerState.rz || 0)
    aircraft.userData.speed = playerState.s || 0
  }
}

// Camera follow
function updateCamera() {
  const myState = getMyState()
  if (!myState) return

  const position = new THREE.Vector3(myState.x, myState.y, myState.z)
  const rotation = new THREE.Euler(myState.rx, myState.ry, myState.rz)

  const offset = new THREE.Vector3(0, 15, -40)
  offset.applyEuler(rotation)

  camera.position.copy(position).add(offset)
  camera.lookAt(position)
}

// Handle SDK events
onOpen(() => {
  console.log('open')
  statusIndicator.className = 'status-indicator status-connected'
  statusIndicator.textContent = 'Connected'
})

onClose(() => {
  console.log('close')
  statusIndicator.className = 'status-indicator status-disconnected'
  statusIndicator.textContent = 'Disconnected'
})

onMyIdUpdated((id: string) => {
  console.log('Received my ID from server:', id)

  // Create my aircraft visual representation
  const color = aircraftColors[parseInt(id) % aircraftColors.length]
  const myAircraft = createAircraft(color)
  myAircraft.position.set(0, 50, 0)
  scene.add(myAircraft)
  aircrafts[id] = myAircraft

  // Send initial state - set initial roll to match visual orientation
  const state = {
    x: 0,
    y: 50,
    z: 0,
    rx: 0,
    ry: 0,
    rz: -Math.PI / 2,
    s: 0,
  }
  updateMyState(state)
})

onClientJoined((playerId: string) => {
  console.log('Client connected:', playerId)
  // No need to do anything special, they'll send their aircraft data via delta
})

onClientLeft((playerId: string) => {
  console.log('Client disconnected:', playerId)
  // SDK automatically handles removing disconnected players from state
  if (aircrafts[playerId] && playerId !== getMyId()) {
    scene.remove(aircrafts[playerId])
    delete aircrafts[playerId]
  }
})

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  updateMyAircraft()
  updateAircrafts()
  updateCamera()
  updateHUD()
  renderer.render(scene, camera)
}

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

animate()
