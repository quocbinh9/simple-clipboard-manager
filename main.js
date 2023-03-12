// Modules to control application life and create native browser window
const { app, BrowserWindow, screen, Tray, nativeImage, Menu, globalShortcut, clipboard, Notification, ipcMain } = require('electron')
const path = require('path')
const db = require('./db')
const uuid = require('uuid')
const autoLaunch = require('./auto_launch')

function createWindow() {
  global.title = 'Clipboard Manager'
  // Create the browser window.
  const display = screen.getPrimaryDisplay()
  const width = display.bounds.width
  const height = display.bounds.height

  global.win = new BrowserWindow({
    width: 350,
    height: 600,
    width: 350,
    x: width - 350,
    y: height - 600,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    show: false,
    frame: true,
    title,
    // icon: path.join(__dirname, '..', 'icons/16x16.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.setAlwaysOnTop(true, 'floating')
  win.setFullScreenable(false)
  // Below statement completes the flow
  win.moveTop()

  win.loadFile(path.join(__dirname, 'index.html')).then(() => {
    win.webContents.send('setCopied', getCopiedFromDb())
  })
  win.hide()

  // Open the DevTools.
  // win.webContents.openDevTools()
  win.on('close', function (event) {
    if (!global.quit) {
      event.preventDefault()
      win.hide()
    }
  })

  if (!global.tray) {
    createTray()
  }

  startMonitoringClipboard()
}

app.setLoginItemSettings({
  openAtLogin: true
})

function persistCopied(currentText) {
  const copiedQty = getCopiedQty()

  db.get('copied').pull(currentText).write()
  const copied = db.get('copied').push(currentText).write()
  const length = copied.length

  if (length > copiedQty) {
    copied.splice(0, length - copiedQty)
    db.set('copied', copied).write()
  }
}

function createTray() {
  global.tray = new Tray(nativeImage.createEmpty())

  const menu = Menu.buildFromTemplate([
    {
      label: 'Clipboard manager',
      click: () => {
        global.win.show()
      }
      // submenu: [
      //   {
      //     label: 'Open Google',
      //     click: (item, window, event) => {
      //       //console.log(item, event);
      //       global.win.show()
      //     }
      //   }
      // ]
    },
    {
      label: 'Start with system',
      click: menuItem => {
        autoLaunch.toggle()
        // const index = template.findIndex(item => item.label === menuItem.label)
        // setTimeout(() => {
        //   template[index].checked = autoLaunch.isEnabled()
        //   reloadContextMenu()
        // })
      },
      type: 'checkbox',
      checked: autoLaunch.isEnabled()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        global.quit = true
        app.quit()
      }
    }
    // { role: 'quit', label: 'Quit' } // "role": system prepared action menu
  ])
  tray.setToolTip('Clipboard Manager')
  // tray.setTitle('Tray Example') // macOS only
  tray.setContextMenu(menu)

  // Option: some animated web site to tray icon image
  // see: https://electron.atom.io/docs/tutorial/offscreen-rendering/
  icons = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true }
  })
  icons.loadURL('https://trends.google.com/trends/hottrends/visualize')
  icons.webContents.on('paint', (event, dirty, image) => {
    if (tray) tray.setImage(image.resize({ width: 16, height: 16 }))
  })

  global.copiedLimit = getCopiedQty()

  ipcMain.on('initCopied', (event, data) => {
    win.webContents.send('setCopied', getCopiedFromDb())
  })

  ipcMain.on('clearCopied', (event, data) => {
    setCopied([])
  })

  ipcMain.on('updateCopied', (event, data) => {
    setCopied(data)
  })

  ipcMain.on('setClipboard', (events, args) => {
    clipboard.writeText(args)
    persistCopied(args)
    win.close()
  })
}

let watcherId = null

function getCopiedQty() {
  return db.get('copiedQty').value()
}

function getCopiedFromDb() {
  const copiedQty = getCopiedQty()
  let copied = db.get('copied').take(copiedQty).value()
  copied = copied.filter(el => !!el.id)
  const length = copied.length

  return { copied, length }
}

function setCopied(copied = []) {
  db.set('copied', copied).write()
}

function startMonitoringClipboard() {
  let previousText = clipboard.readText()

  const textChanged = () => {
    const newText = clipboard.readText()
    const { copied } = getCopiedFromDb()
    setCopied([
      {
        id: uuid.v4(),
        content: newText,
        pin: false
      },
      ...copied
    ])
    win.webContents.send('setCopied', getCopiedFromDb())
  }

  const isDiffText = (str1, str2) => {
    return str2 && str1 !== str2
  }

  if (!watcherId) {
    watcherId = setInterval(() => {
      if (isDiffText(previousText, (previousText = clipboard.readText()))) textChanged()
    }, 500)
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('ready', () => {
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    global.win.show()
  })
})

// Quit when all windows are closed, except on msacOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
