export const onOpen = (callback: () => void, socket = window.socket) => {
  socket.addEventListener('open', callback)
}
export const onClose = (callback: () => void, socket = window.socket) => {
  socket.addEventListener('close', callback)
}
export const onError = (callback: () => void, socket = window.socket) => {
  socket.addEventListener('error', callback)
}
