/* Lecture 11: persistence via preload + IPC */

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow = null;

function dataPath() {
  return path.join(app.getPath('userData'), 'data.json');
}

function emptyData() {
  return { producers: [], batches: [], events: [], buyers: [], inquiries: [] };
}

function readData() {
  const p = dataPath();
  if (!fs.existsSync(p)) return emptyData();
  try {
    const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return {
      producers:  parsed.producers  || [],
      batches:    parsed.batches    || [],
      events:     parsed.events     || [],
      buyers:     parsed.buyers     || [],
      inquiries:  parsed.inquiries  || []
    };
  } catch (_) {
    return emptyData();
  }
}

function writeData(d) {
  fs.writeFileSync(dataPath(), JSON.stringify(d, null, 2), 'utf-8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 950,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function registerHandlers() {

  ipcMain.handle('data:load', () => {
    return readData();
  });

  /*
   * data:save intentionally does NOT trust the renderer's events array.
   * Events are only ever written by events:append (in main, with real SHA-256).
   * So we always keep the on-disk events and ignore whatever the renderer sent.
   * This means a rogue renderer cannot forge or delete events.
   */
  ipcMain.handle('data:save', (_, incoming) => {
    const onDisk = readData();

    const choice = (() => {
      const wasDeleted =
        incoming.producers.length < onDisk.producers.length ||
        incoming.buyers.length    < onDisk.buyers.length    ||
        incoming.batches.length   < onDisk.batches.length   ||
        incoming.inquiries.length < onDisk.inquiries.length;

      if (!wasDeleted) return 1;

      return dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['Cancel', 'Delete'],
        defaultId: 1,
        cancelId: 0,
        title: 'Confirm Delete',
        message: 'Delete this record? This cannot be undone.'
      });
    })();

    if (choice === 0) return { cancelled: true };

    writeData({
      producers:  incoming.producers  || [],
      batches:    incoming.batches    || [],
      events:     onDisk.events,
      buyers:     incoming.buyers     || [],
      inquiries:  incoming.inquiries  || []
    });

    return { ok: true };
  });

  ipcMain.handle('events:append', (_, batchId, ev) => {
    const d = readData();
    const forBatch = d.events.filter(e => e.batchId === batchId);

    const prevHash = forBatch.length > 0
      ? forBatch[forBatch.length - 1].hash
      : 'GENESIS';

    const ts      = ev.timestamp || new Date().toISOString();
    const type    = ev.type;
    const details = ev.details || {};

    const raw  = prevHash + batchId + type + ts + JSON.stringify(details);
    const hash = crypto.createHash('sha256').update(raw).digest('hex');

    const newEv = {
      id: 'EVT-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      batchId,
      type,
      timestamp: ts,
      details,
      previousHash: prevHash,
      hash
    };

    d.events.push(newEv);
    writeData(d);
    return { ok: true, event: newEv };
  });

  ipcMain.handle('events:verify', async (_, batchId) => {
    const d = readData();
    const evs = d.events.filter(e => e.batchId === batchId);

    if (evs.length === 0) {
      return { valid: true, count: 0 };
    }

    for (let i = 0; i < evs.length; i++) {
      const cur          = evs[i];
      const expectedPrev = i === 0 ? 'GENESIS' : evs[i - 1].hash;

      if (cur.previousHash !== expectedPrev) {
        await dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'Tamper Detected',
          message: `Event #${i + 1} (${cur.type}) has a broken chain link.\n\nExpected prev: ${expectedPrev.slice(0, 20)}...\nFound: ${cur.previousHash.slice(0, 20)}...`
        });
        return { valid: false, tamperedIndex: i, eventType: cur.type, reason: 'Chain link broken' };
      }

      const raw          = cur.previousHash + cur.batchId + cur.type + cur.timestamp + JSON.stringify(cur.details);
      const recomputed   = crypto.createHash('sha256').update(raw).digest('hex');

      if (cur.hash !== recomputed) {
        await dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'Tamper Detected',
          message: `Event #${i + 1} (${cur.type}) data was modified after signing.\n\nStored:     ${cur.hash.slice(0, 20)}...\nRecomputed: ${recomputed.slice(0, 20)}...`
        });
        return { valid: false, tamperedIndex: i, eventType: cur.type, reason: 'Hash mismatch – data altered' };
      }
    }

    return { valid: true, count: evs.length };
  });

  ipcMain.handle('batch:export', async (_, batchId) => {
    const d       = readData();
    const batch   = d.batches.find(b => b.id === batchId);
    if (!batch) return { ok: false, error: 'Batch not found' };

    const producer = d.producers.find(p => p.id === batch.producerId) || {
      name: 'Unknown', village: '-', district: '-', contact: '-'
    };

    const evs = d.events.filter(e => e.batchId === batchId);

    let cert = '';
    cert += '='.repeat(80) + '\n';
    cert += '      GOVT. OF J&K – ODOP TRACEABILITY CERTIFICATE\n';
    cert += '      KASHMIRI WALNUTS (Juglans regia)\n';
    cert += '='.repeat(80) + '\n\n';
    cert += `Certificate ID : CERT-${batch.id}-${Date.now()}\n`;
    cert += `Issued         : ${new Date().toLocaleString()}\n\n`;
    cert += '-'.repeat(80) + '\n';
    cert += 'BATCH\n';
    cert += '-'.repeat(80) + '\n';
    cert += `Batch ID     : ${batch.id}\n`;
    cert += `Producer     : ${producer.name}\n`;
    cert += `Village      : ${producer.village}\n`;
    cert += `District     : ${producer.district}, J&K\n`;
    cert += `Contact      : ${producer.contact}\n`;
    cert += `Quantity     : ${batch.quantityKg} kg\n`;
    cert += `Grade        : ${batch.grade}\n`;
    cert += `Harvest Date : ${batch.harvestDate}\n\n`;
    cert += '-'.repeat(80) + '\n';
    cert += 'HASH CHAIN AUDIT TRAIL (SHA-256)\n';
    cert += '-'.repeat(80) + '\n';

    if (evs.length === 0) {
      cert += 'No events recorded yet.\n';
    } else {
      evs.forEach((ev, i) => {
        cert += `\n[EVENT #${i + 1}] ${ev.type.toUpperCase()}\n`;
        cert += `  Time         : ${ev.timestamp}\n`;
        cert += `  Details      : ${JSON.stringify(ev.details)}\n`;
        cert += `  Prev Hash    : ${ev.previousHash}\n`;
        cert += `  Current Hash : ${ev.hash}\n`;
      });
    }

    cert += '\n' + '='.repeat(80) + '\n';
    cert += 'Hash chain generated by ODOP Link. Not a blockchain.\n';
    cert += '='.repeat(80) + '\n';

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Traceability Certificate',
      defaultPath: `ODOP_Cert_${batch.id}.txt`,
      filters: [{ name: 'Text File', extensions: ['txt'] }]
    });

    if (result.canceled) return { cancelled: true };

    fs.writeFileSync(result.filePath, cert, 'utf-8');
    return { ok: true, filePath: result.filePath };
  });

  /*
   * events:tamper is a demo-only handler.
   * It mutates the details of the first event in data.json WITHOUT
   * updating the SHA-256 hash, so verifyChain will catch it.
   */
  ipcMain.handle('events:tamper', (_, batchId) => {
    const d   = readData();
    const evs = d.events.filter(e => e.batchId === batchId);
    if (evs.length === 0) return { ok: false, error: 'No events to tamper' };

    evs[0].details = {
      ...evs[0].details,
      _TAMPERED: true,
      note: 'Grade secretly changed by middleman'
    };

    writeData(d);
    return { ok: true };
  });
}
