

const { contextBridge, ipcRenderer } = require("electron");

/**
 * This is how any JS in the main thread chats to the rendered backend
 * if for example to communicate to the server or to call native methods
 */
process.once("loaded", () => {

  contextBridge.exposeInMainWorld("electron", {
    send: (channel, data) => {
      // whitelist channels
      let validChannels = ["toMain", "showDialog"]
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data)
      }
    },
    receive: (channel, func) => {
      let validChannels = ["fromMain"]
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args))
      }
    }

  })
})

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})