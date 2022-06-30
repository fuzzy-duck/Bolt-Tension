// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')
const IPAddress = require('quick-local-ip')
const menu = require("./menu.cjs")
// TODO: Implement server for sock
const startServer = require('./server.cjs')

const isProduction = process.env.NODE_ENV === "production" || !process || !process.env || !process.env.NODE_ENV
const isDevelopment = !isProduction
// Hardcoded; needs to match webpack.development.js and package.json
const port = 1337
const selfHost = `http://localhost:${port}`;


const externalIPAddress = IPAddress.getLocalIP4()

async function createWindow () {
  // If you'd like to set up auto-updating for your app,
  // I'd recommend looking at https://github.com/iffy/electron-updater-example
  // to use the method most suitable for you.
  // eg. autoUpdater.checkForUpdatesAndNotify();
  
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  // Create the browser window.
  let mainWindow = new BrowserWindow({
    width: 1024,
    height: 800,
    minWidth: 360,
    minHeight: 450,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      // Two properties below are here for demo purposes, and are
      // security hazard. Make sure you know what you're doing
      // in your production app.
      // nodeIntegration: true,
      // contextIsolation: false,

      // To allow sockets to get out
      // webSecurity: false,
      // allowRunningInsecureContent: true,

      // Spectron needs access to remote module
      enableRemoteModule: true,
      //
      preload: path.join(__dirname, 'preload.cjs')
    }
  })
  // connect web sockets?
  const server = await startServer( 1337, externalIPAddress )

  console.log("Server started!", server )
  console.log( "WebSockets available at : "+externalIPAddress  )

  // and load the index.html of the app.?port=1337
  // mainWindow.loadFile('index.html')
  mainWindow.loadURL(selfHost)
}


// Events called via JS if wanted
ipcMain.on("showDialog", () => {
  dialog.showMessageBoxSync({
    type: "info",
    message: "Hi I'm a dialog from Electron"
  })
})

ipcMain.on("toMain", (event, { data }) => {
  event.reply("fromMain", data)
  //win.webContents.send("fromMain", reply);
})

// Open the DevTools.
// Only do these things when in development
if (isDevelopment) {
  // Reload
  try {
    require("electron-reloader")(module)
  } catch (_) {}
  
  // Errors are thrown if the dev tools are opened
  // before the DOM is ready
  mainWindow.webContents.once("dom-ready", async () => {
    require("electron-debug")(); // https://github.com/sindresorhus/electron-debug
    mainWindow.webContents.openDevTools()
  })

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0){ 
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin'){ app.quit()}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {

    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit()
      }
    })

  } else {
    process.on("SIGTERM", () => {
      app.quit()
    })
  }
}