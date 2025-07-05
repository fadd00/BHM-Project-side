const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Enable live reload for Electron in development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (_) {}
}

class BrowserApp {
  constructor() {
    this.mainWindow = null;
    this.bookmarks = [];
    this.history = [];
    this.userDataPath = path.join(app.getPath('userData'), 'bhm-browser');
    
    this.ensureUserDataDir();
    this.loadUserData();
    this.setupApp();
  }

  ensureUserDataDir() {
    if (!fs.existsSync(this.userDataPath)) {
      fs.mkdirSync(this.userDataPath, { recursive: true });
    }
  }

  loadUserData() {
    try {
      const bookmarksPath = path.join(this.userDataPath, 'bookmarks.json');
      const historyPath = path.join(this.userDataPath, 'history.json');
      
      if (fs.existsSync(bookmarksPath)) {
        this.bookmarks = JSON.parse(fs.readFileSync(bookmarksPath, 'utf8'));
      }
      
      if (fs.existsSync(historyPath)) {
        this.history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  saveUserData() {
    try {
      const bookmarksPath = path.join(this.userDataPath, 'bookmarks.json');
      const historyPath = path.join(this.userDataPath, 'history.json');
      
      fs.writeFileSync(bookmarksPath, JSON.stringify(this.bookmarks, null, 2));
      fs.writeFileSync(historyPath, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  setupApp() {
    app.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();
      this.setupIpcHandlers();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.saveUserData();
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('before-quit', () => {
      this.saveUserData();
    });
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false
      },
      icon: path.join(__dirname, 'assets', 'icon.svg'),
      titleBarStyle: 'hidden',
      show: false
    });

    this.mainWindow.loadFile('src/index.html');

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  }

  setupMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Tab',
            accelerator: 'CmdOrCtrl+T',
            click: () => {
              this.mainWindow.webContents.send('new-tab');
            }
          },
          {
            label: 'New Window',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.createWindow();
            }
          },
          { type: 'separator' },
          {
            label: 'Close Tab',
            accelerator: 'CmdOrCtrl+W',
            click: () => {
              this.mainWindow.webContents.send('close-tab');
            }
          },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Bookmarks',
        submenu: [
          {
            label: 'Add Bookmark',
            accelerator: 'CmdOrCtrl+D',
            click: () => {
              this.mainWindow.webContents.send('add-bookmark');
            }
          },
          {
            label: 'Show Bookmarks',
            accelerator: 'CmdOrCtrl+Shift+O',
            click: () => {
              this.mainWindow.webContents.send('show-bookmarks');
            }
          }
        ]
      },
      {
        label: 'History',
        submenu: [
          {
            label: 'Show History',
            accelerator: 'CmdOrCtrl+H',
            click: () => {
              this.mainWindow.webContents.send('show-history');
            }
          },
          {
            label: 'Clear History',
            click: () => {
              this.clearHistory();
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIpcHandlers() {
    ipcMain.handle('get-bookmarks', () => {
      return this.bookmarks;
    });

    ipcMain.handle('add-bookmark', (event, bookmark) => {
      this.bookmarks.push({
        ...bookmark,
        id: Date.now(),
        createdAt: new Date().toISOString()
      });
      this.saveUserData();
      return true;
    });

    ipcMain.handle('remove-bookmark', (event, id) => {
      this.bookmarks = this.bookmarks.filter(bookmark => bookmark.id !== id);
      this.saveUserData();
      return true;
    });

    ipcMain.handle('get-history', () => {
      return this.history;
    });

    ipcMain.handle('add-history', (event, historyItem) => {
      // Remove duplicate entries
      this.history = this.history.filter(item => item.url !== historyItem.url);
      
      this.history.unshift({
        ...historyItem,
        id: Date.now(),
        visitedAt: new Date().toISOString()
      });

      // Keep only last 1000 entries
      if (this.history.length > 1000) {
        this.history = this.history.slice(0, 1000);
      }

      this.saveUserData();
      return true;
    });

    ipcMain.handle('clear-history', () => {
      this.history = [];
      this.saveUserData();
      return true;
    });

    ipcMain.handle('show-message-box', async (event, options) => {
      const result = await dialog.showMessageBox(this.mainWindow, options);
      return result;
    });
  }

  clearHistory() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'warning',
      buttons: ['Clear', 'Cancel'],
      defaultId: 1,
      title: 'Clear History',
      message: 'Are you sure you want to clear all browsing history?'
    }).then((result) => {
      if (result.response === 0) {
        this.history = [];
        this.saveUserData();
        this.mainWindow.webContents.send('history-cleared');
      }
    });
  }
}

// Create the browser application
new BrowserApp();
