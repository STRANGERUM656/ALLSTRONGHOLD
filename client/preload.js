const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("bradly", { version: "2.0.0" });
