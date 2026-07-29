const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Sistema POS",
    webPreferences: {
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 2000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  const backendDir = app.isPackaged 
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, 'backend');
    
  // USAR EL NODE.EXE INCLUIDO EN LA CARPETA BACKEND!
  const nodeExecutable = path.join(backendDir, 'node.exe');
  
  serverProcess = spawn(nodeExecutable, ['server.js'], { cwd: backendDir });
  
  serverProcess.stdout.on('data', (data) => console.log(data.toString()));
  serverProcess.stderr.on('data', (data) => console.error(data.toString()));

  createWindow();
});

app.on('window-all-closed', function () {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
