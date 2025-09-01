import { createGroup } from './group'
import { Scene } from './scene'
import { createTriangle } from './triangle'
import { vec } from './vector'

// Main application
function main() {
  const scene = Scene()
  document.body.appendChild(scene.canvas)

  // Add keyboard event listeners for controls
  document.addEventListener('keydown', (event) => {
    if (event.key === '.') {
      const wireframeMode = scene.wireframe()
      console.log('Wireframe mode:', wireframeMode ? 'ON' : 'OFF')
    } else if (event.key === 'q') {
      const quality = scene.quality()
      const newQuality = quality > 0.5 ? 0.3 : 0.9
      scene.quality(newQuality)
      console.log('Quality:', newQuality)
    } else if (event.key === 'l') {
      const lod = scene.lod()
      const newLod = lod > 10 ? 0 : 25
      scene.lod(newLod)
      console.log('LOD distance:', newLod)
    }
  })

  const triangle = createTriangle({
    color: [1.0, 0.0, 0.0],
    vertices: [
      [-0.5, -0.5, 0],
      [0.5, -0.5, 0],
      [0, 0.5, 0],
    ],
    position: vec(-1, 0, 0),
  })
  scene.add(triangle)

  const triangleGroup = createGroup({
    children: [
      createTriangle({
        color: [0.0, 1.0, 0.0],
        vertices: [
          [-0.5, -0.5, 0],
          [0.5, -0.5, 0],
          [0, 0.5, 0],
        ],
        position: vec(0.5, 0, 0),
      }),
      // createTriangle({
      //   color: [1.0, 0.0, 0.0],
      //   vertices: [
      //     [-0.5, -0.5, 0],
      //     [0.5, -0.5, 0],
      //     [0, 0.5, 0],
      //   ],
      //   position: vec(-0.5, 0, 0),
      // }),
    ],
    position: vec(4, 0, 0),
  })
  scene.add(triangleGroup)

  // const ground = Plane({ color: [0.0, 0.8, 0.0], width: 20, height: 20, position: vec(0, -2, 0) }) // Green - ground plane
  // scene.add(ground)

  // const box = Box({ color: [1.0, 0.5, 0.0], length: 1.5, width: 1, height: 0.8, position: vec(3, 0, 0) }) // Orange - right
  // scene.add(box)

  // const cube = Cube({ color: [1.0, 0.0, 0.0], size: 1, position: vec(0, 0, 0) }) // Red - center
  // scene.add(cube)

  // const cylinder = Cylinder({
  //   color: [0.5, 0.0, 1.0],
  //   diameterTop: 0.8,
  //   diameterBottom: 1.2,
  //   height: 1.5,
  //   quality: 0.8,
  //   position: vec(-3, 0, 0),
  // }) // Purple - left
  // const sphere = Sphere({ color: [0.0, 0.0, 1.0], radius: 0.8, quality: 0.9, position: vec(0, 2, 0) }) // Blue - top
  // const ellipsoid = Ellipsoid({
  //   color: [1.0, 1.0, 0.0],
  //   radiusX: 1.5,
  //   radiusY: 0.8,
  //   radiusZ: 1.2,
  //   quality: 0.6,
  //   position: vec(0, -1, 2),
  // }) // Yellow - front

  // // Create a complex shape using Group - a "robot" made of multiple primitives
  // const robotBody = Box({ color: [0.3, 0.3, 0.3], length: 1, width: 0.8, height: 1.5, x: 0, y: 0, z: 0 })
  // const robotHead = Sphere({ color: [0.7, 0.7, 0.7], radius: 0.4, quality: 0.8, x: 0, y: 1.2, z: 0 })
  // const robotEye1 = Sphere({ color: [1, 0, 0], radius: 0.1, quality: 0.6, x: -0.15, y: 1.3, z: 0.3 })
  // const robotEye2 = Sphere({ color: [1, 0, 0], radius: 0.1, quality: 0.6, x: 0.15, y: 1.3, z: 0.3 })
  // const robotArm1 = Cylinder({
  //   color: [0.5, 0.5, 0.5],
  //   diameterTop: 0.2,
  //   diameterBottom: 0.2,
  //   height: 1,
  //   quality: 0.7,
  //   x: -0.8,
  //   y: 0.2,
  //   z: 0,
  // })
  // const robotArm2 = Cylinder({
  //   color: [0.5, 0.5, 0.5],
  //   diameterTop: 0.2,
  //   diameterBottom: 0.2,
  //   height: 1,
  //   quality: 0.7,
  //   x: 0.8,
  //   y: 0.2,
  //   z: 0,
  // })
  // const robotLeg1 = Cylinder({
  //   color: [0.2, 0.2, 0.2],
  //   diameterTop: 0.3,
  //   diameterBottom: 0.3,
  //   height: 1.2,
  //   quality: 0.7,
  //   x: -0.3,
  //   y: -1.2,
  //   z: 0,
  // })
  // const robotLeg2 = Cylinder({
  //   color: [0.2, 0.2, 0.2],
  //   diameterTop: 0.3,
  //   diameterBottom: 0.3,
  //   height: 1.2,
  //   quality: 0.7,
  //   x: 0.3,
  //   y: -1.2,
  //   z: 0,
  // })

  // const robot = Group({
  //   children: [robotBody, robotHead, robotEye1, robotEye2, robotArm1, robotArm2, robotLeg1, robotLeg2],
  //   x: 6,
  //   y: 0,
  //   z: 0,
  // })

  // Add objects to scene (no more callbacks!)
  // scene.add(cylinder)
  // scene.add(sphere)
  // scene.add(ellipsoid)
  // scene.add(robot)

  function loop(time: number) {
    // Update rotations using the clean API
    triangle.state.rotation.y = time * 0.001 // Rotate triangle around its Y axis (local rotation)
    triangle.state.rotation.x = time * 0.002
    triangle.state.rotation.z = time * 0.0035

    // triangleGroup.state.position.x = Math.cos(time * 0.001) * 2
    // triangleGroup.state.position.y = Math.sin(time * 0.001) * 2
    triangleGroup.state.rotation.y = time * 0.0035
    // triangleGroup.state.rotation.x = time * 0.0035
    triangleGroup.state.rotation.z = time * 0.0035
    // cube.state.rotation.y = time * 0.001
    // box.state.rotation.y = time * 0.001 * 0.8
    // cylinder.setRotation(0, time * 0.001 * 0.6, 0) // Medium rotation
    // sphere.setRotation(0, time * 0.001 * 0.5, 0) // Slower rotation
    // ellipsoid.setRotation(0, time * 0.001 * 0.7, 0) // Medium rotation
    // robot.setRotation(0, time * 0.001 * 0.4, 0) // Slow rotation

    scene.render(time)
    scene.renderHUD()
    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
}

main()

export {}
