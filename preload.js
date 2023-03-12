/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

const { contextBridge, ipcRenderer } = require('electron')

// Exposed protected methods in the render process
contextBridge.exposeInMainWorld(
  // Allowed 'ipcRenderer' methods
  'bridge',
  {
    // From main to render
    initCopied: () => {
      ipcRenderer.sendSync('initCopied', true)
    },
    setCopied: payload => {
      ipcRenderer.on('setCopied', payload)
    },
    clearCopied: () => {
      ipcRenderer.sendSync('clearCopied', true)
    },
    updateCopied: payload => {
      ipcRenderer.sendSync('updateCopied', payload)
    },
    removeCopied: payload => {
      ipcRenderer.sendSync('removeCopied', payload)
    },
    setClipboard: copy => {
      ipcRenderer.sendSync('setClipboard', copy)
    }
  }
)
