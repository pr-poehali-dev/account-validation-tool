const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:5173';
const PORT = 41789;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.map': 'application/json',
};

let server = null;

function startStaticServer(root) {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let pathname = decodeURIComponent(url.parse(req.url).pathname);
      let filePath = path.join(root, pathname);

      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.stat(filePath, (err, stats) => {
        if (err || stats.isDirectory()) {
          filePath = path.join(root, 'index.html');
        }
        fs.readFile(filePath, (readErr, data) => {
          if (readErr) {
            const indexHtml = path.join(root, 'index.html');
            fs.readFile(indexHtml, (e2, fallback) => {
              if (e2) {
                res.writeHead(404);
                res.end('Not found');
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(fallback);
              }
            });
            return;
          }
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          res.end(data);
        });
      });
    });
    server.listen(PORT, '127.0.0.1', () => resolve(`http://127.0.0.1:${PORT}`));
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a0a0f',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    await win.loadURL(DEV_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const root = path.join(__dirname, '..', 'dist');
    const localUrl = await startStaticServer(root);
    await win.loadURL(localUrl);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
