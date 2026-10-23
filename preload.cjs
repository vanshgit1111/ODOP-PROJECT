/* Lecture 11: preload bridge – contextBridge.exposeInMainWorld */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('odopAPI', {
  loadData:          ()           => ipcRenderer.invoke('data:load'),
  saveData:          (data)       => ipcRenderer.invoke('data:save', data),
  appendEvent:       (id, ev)     => ipcRenderer.invoke('events:append', id, ev),
  verifyChain:       (id)         => ipcRenderer.invoke('events:verify', id),
  exportCertificate: (id)         => ipcRenderer.invoke('batch:export', id),
  tamperEvent:       (id)         => ipcRenderer.invoke('events:tamper', id)
});
