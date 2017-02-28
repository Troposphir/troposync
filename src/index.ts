import { app, ipcMain, BrowserWindow } from 'electron';
import * as path from "path";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow | null;

const isDevMode = process.execPath.match(/[\\/]electron/);

// Force appdata path to be called "troposync", even in dev mode
// (where by default it would be Electron)
app.setPath("userData", path.join(
    path.dirname(app.getPath("userData")),
    "troposync"
));

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

const createLauncherWindow: () => Promise<any> = async() => {
  let splashWindow: Electron.BrowserWindow | null = new BrowserWindow({
    width: 150,
    height: 150,
    show: false,
    frame: false,
    resizable: false,
    transparent: true
  });
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    show: false,
    frame: false,
    resizable: true,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      experimentalFeatures: true
    }
  });

  splashWindow.loadURL(`file://${__dirname}/splash.html`);
  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  if (isDevMode) {
    mainWindow.webContents.openDevTools();
  }

  // Stop splash screen a little later after the application is done
  // initializing, to prevent flash of unstyled content.
  ipcMain.on("application-started", () => setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    if (mainWindow) {
      mainWindow.show();
    }
  }, 300));

  splashWindow.on("ready-to-show", () => {
    if (splashWindow) {
      splashWindow.show();
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};
app.on('ready', createLauncherWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createLauncherWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
