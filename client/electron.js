const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

// Disabilita accelerazione hardware per evitare crash su Windows
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("--disable-gpu");
app.commandLine.appendSwitch("--disable-software-rasterizer");
app.commandLine.appendSwitch("--no-sandbox");

function findIndexHtml(dir, depth = 0) {
  if (depth > 8) return null;
  try {
    const files = fs.readdirSync(dir);
    if (files.includes("index.html")) return path.join(dir, "index.html");
    for (const f of files) {
      const full = path.join(dir, f);
      try {
        if (fs.statSync(full).isDirectory()) {
          const found = findIndexHtml(full, depth + 1);
          if (found) return found;
        }
      } catch (e) {}
    }
  } catch (e) {}
  return null;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    title: "BradlyStronghold", backgroundColor: "#0f1420",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false
    }
  });
  win.setMenuBarVisibility(false);

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
    return;
  }

  const resourcesPath = process.resourcesPath;
  const appPath = app.getAppPath();

  const candidates = [
    path.join(resourcesPath, "dist", "index.html"),
    path.join(resourcesPath, "app", "dist", "index.html"),
    path.join(appPath, "dist", "index.html"),
    path.join(__dirname, "dist", "index.html"),
    path.join(__dirname, "..", "dist", "index.html"),
  ];

  let indexPath = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) { indexPath = p; break; }
  }

  if (!indexPath) {
    indexPath = findIndexHtml(resourcesPath) || findIndexHtml(appPath);
  }

  if (indexPath) {
    win.loadFile(indexPath);
  } else {
    win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(
      "<html><body style='background:#0f1420;color:#f87171;font-family:monospace;padding:40px'>" +
      "<h2>index.html non trovato</h2><p>resourcesPath: " + resourcesPath + "</p></body></html>"
    ));
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });