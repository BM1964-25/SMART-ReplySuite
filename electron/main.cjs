const path = require("node:path");
const { app, BrowserWindow } = require("electron");

const rootDir = path.join(__dirname, "..");
const iconPng = path.join(rootDir, "build", "icon.png");
const iconIco = path.join(rootDir, "build", "icon.ico");

function getWindowIcon() {
  if (process.platform === "win32") return iconIco;
  return iconPng;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 1180,
    minHeight: 780,
    title: "SMART MailResponse",
    icon: getWindowIcon(),
    backgroundColor: "#071a33",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(rootDir, "index.html"));
}

app.whenReady().then(() => {
  if (process.platform === "darwin" && app.dock) {
    app.dock.setIcon(iconPng);
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
