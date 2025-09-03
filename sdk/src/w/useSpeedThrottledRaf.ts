export const useSpeedThrottledRaf = (moveSpeed: number, moveFunction: (speed: number) => void) => {
  let lastTime = 0
  const animate = (currentTime: number) => {
    const deltaTime = (currentTime - lastTime) / 1000
    lastTime = currentTime
    moveFunction(moveSpeed * deltaTime)
    requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
}
