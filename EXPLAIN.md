<!-- Lecture 01 & Lecture 11: Viva Cheat-Sheet and Architecture Explanations -->

# ODOP Link - Viva Cheat-Sheet & Architectural Reference

This document provides clear, concise answers to core technical questions for viva examinations and project evaluations.

---

## 1. IPC Channels: Purpose, Callers, Handlers, and Placement Rationale

| IPC Channel | Who Calls It? | Who Handles It? | Why It Lives in Main? |
| :--- | :--- | :--- | :--- |
| **`data:load`** | Called by `App.jsx` during initial component mounting (`useEffect([])`). | Handled by `ipcMain.handle('data:load')` in `main.cjs`. | Lives in main because the renderer is prohibited from accessing the native operating system filesystem (`fs`) to read `data.json`. |
| **`data:save`** | Called by `App.jsx` whenever application state changes (`useEffect([data, isLoading])`). | Handled by `ipcMain.handle('data:save')` in `main.cjs`. | Lives in main to safely persist data to disk with `fs.writeFileSync` and to protect existing hash chain events by re-merging them from disk rather than accepting arbitrary event lists from the renderer. |
| **`events:append`** | Called by `BatchesTab.jsx` when creating a batch or logging a new lifecycle stage. | Handled by `ipcMain.handle('events:append')` in `main.cjs`. | Lives in main so SHA-256 cryptographic hashes are computed using Node's `crypto` module in a secure context, preventing the client renderer from forging valid event hashes. |
| **`events:verify`** | Called by `BatchesTab.jsx` when the user clicks the "Verify Chain" button. | Handled by `ipcMain.handle('events:verify')` in `main.cjs`. | Lives in main to independently recompute the mathematical hash chain from disk records, compare hashes against stored values, and trigger native operating system warning dialogs (`dialog.showMessageBox`) if tampering is detected. |
| **`batch:export`** | Called by `BatchesTab.jsx` when the user clicks "Export Certificate". | Handled by `ipcMain.handle('batch:export')` in `main.cjs`. | Lives in main to spawn the native OS save file picker (`dialog.showSaveDialog`) and write the structured `.txt` certificate file directly to the user's chosen local directory. |
| **`events:tamper`** *(Dev)* | Called by `BatchesTab.jsx` when clicking the "Tamper Demo" button. | Handled by `ipcMain.handle('events:tamper')` in `main.cjs`. | Lives in main to simulate real-world data corruption by deliberately modifying an event's payload in `data.json` without updating its SHA-256 hash, demonstrating that `events:verify` reliably catches tampering. |

---

## 2. Why are `contextIsolation: true` and `nodeIntegration: false` Set?

1. **`nodeIntegration: false`**:
   - Ensures that Node.js global objects and primitives (such as `require`, `process`, `fs`, `child_process`) are completely absent from the renderer's JavaScript execution context.
   - If a third-party script, injected content, or XSS vulnerability runs in the renderer, the attacker cannot execute shell commands or read arbitrary files from the user's hard drive.

2. **`contextIsolation: true`**:
   - Ensures that the preload script and the renderer page run in completely separate JavaScript execution contexts.
   - Even if the webpage tampers with built-in JavaScript prototypes (e.g., `Array.prototype.push`), it cannot affect the preload script or the native IPC bridge.
   - Communication between the renderer and Electron main process is strictly restricted to safe, immutable methods explicitly exposed via `contextBridge.exposeInMainWorld('odopAPI', {...})`.

---

## 3. Why Does the `isLoading` Guard Exist in `App.jsx`?

In React, state initialization happens synchronously with default values:
```javascript
const [isLoading, setIsLoading] = useState(true);
const [data, setData] = useState({ producers: [], batches: [], events: [], buyers: [], inquiries: [] });
```

The application has two `useEffect` hooks:
1. `useEffect(() => { window.odopAPI.loadData().then(...); }, [])` to load saved records asynchronously.
2. `useEffect(() => { if (isLoading) return; window.odopAPI.saveData(data); }, [data, isLoading])` to persist changes.

**The Guard Rationale:**
- On the very first render, `loadData()` has not yet completed its IPC roundtrip from disk.
- Without the `if (isLoading) return;` guard, the second `useEffect` would execute immediately with the initial empty state `{ producers: [], batches: [], ... }`, triggering `saveData()` and instantly overwriting `data.json` on disk, permanently wiping all previously saved student project data!
- The guard ensures that no saving occurs until `loadData()` finishes, data is placed into state, and `setIsLoading(false)` is invoked.

---

## 4. How Does `verifyChain` Work?

The `events:verify` handler in `main.cjs` validates the integrity of a batch's hash chain through sequential cryptographic induction:

1. **Event Extraction:** It reads `data.json` and filters all events belonging to the requested `batchId`, sorted in exact chronological order.
2. **Genesis Verification (Event #0):**
   - The first event must have `previousHash === "GENESIS"`.
3. **Sequential Chain Pointer Check (Event #i):**
   - For every subsequent event `i > 0`, it verifies that:
     $$\text{current.previousHash} == \text{events}[i - 1]\text{.hash}$$
   - If this pointer does not match, the chain has been severed or an event was deleted/reordered.
4. **Cryptographic Payload Recalculation:**
   - For every event, the handler re-calculates the SHA-256 hash using the canonical formula:
     $$\text{recomputedHash} = \text{SHA256}(\text{previousHash} + \text{batchId} + \text{type} + \text{timestamp} + \text{JSON.stringify(details)})$$
   - It compares `current.hash` against `recomputedHash`.
   - If they do not match, the event data (such as walnut grade, quantity, or notes) was tampered with after the hash was originally minted.
5. **Detection & Warning:**
   - If any event fails either check, verification immediately halts, triggers a native operating system warning box (`dialog.showMessageBox(mainWindow, { type: 'warning', ... })`), and reports the exact index and event ID of the first tampered node.
   - If all events pass, it returns `{ valid: true, count }` confirming end-to-end cryptographic integrity.
