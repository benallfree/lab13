export const sendMessage = (message: string, socket = window.socket) => {
  socket.send(message)
}
export const sendMessageToClient = (clientId: string, message: string, socket = window.socket) => {
  sendMessage(`@${clientId}|${message}`, socket)
}
