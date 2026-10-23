# ODOP Link – Kashmiri Walnuts

## Problem Statement

**Title:** "Developing solutions to effective market linkage and promotion of One District One Product"
*(Govt. of Jammu & Kashmir, Heritage & Culture, Software)*

Kashmiri walnuts suffer from a fragmented multi-tier supply chain. Growers receive only 20–25% of the
terminal retail price while a chain of aggregators, mandi traders, and retailers absorbs the rest. There is
no traceability, no direct buyer contact, and no transparent pricing for the farmer.

**ODOP Link** is a desktop application that tackles this problem in three ways:

1. **Direct linkage** – producers register batches; buyers send quotes; order status is tracked.
2. **Hash-chain traceability** – each batch lifecycle event is SHA-256 linked to the one before it, making
   any post-hoc tampering detectable.
3. **Fair-price view** – a side-by-side bar chart shows farmer revenue under direct sale vs the traditional
   middleman chain, with editable margin sliders.

---

## Product: Kashmiri Walnuts *(Juglans regia)*

J&K produces over 90% of India's walnuts (Shopian, Anantnag, Kupwara, Baramulla, Pulwama).
Grades: Extra Light (A), Light (B), Light Amber (C), Amber (D).

---

## Stakeholder Map

| Stakeholder | Pain point |
|---|---|
| **Producer** | Receives only ~20% of retail price; no visibility into buyer demand or market prices. |
| **Aggregator** | Relies on cash-advance monopolies over farmers; adds no value. |
| **Mandi Trader** | Profits from price opacity between production regions and urban mandis. |
| **Buyer / Retailer** | Pays high prices, gets no harvest-origin guarantee; can't verify grade. |

---

## Architecture

```
Renderer Process (React + Vite)
  └── runs in Chromium, NO access to Node/fs/crypto
  └── only calls window.odopAPI.*
        │
        │  contextBridge (preload.cjs)
        │  ipcRenderer.invoke(channel)
        ▼
IPC Channels
  data:load  | data:save | events:append | events:verify | batch:export
        │
        │  ipcMain.handle(channel)
        ▼
Main Process (main.cjs – Node.js)
  └── fs.readFileSync / fs.writeFileSync  → data.json
  └── crypto.createHash('sha256')         → hash chain
  └── dialog.showSaveDialog               → certificate export
  └── dialog.showMessageBox               → tamper warning
        │
        ▼
data.json  (app.getPath("userData"))
  { producers, batches, events, buyers, inquiries }
```

---

## Run (Development)

```bash
# Install dependencies (once)
npm install

# Terminal 1 – start Vite dev server on :5173
npm run dev

# Terminal 2 – launch Electron (loads http://localhost:5173)
npm run electron
```

## Build for macOS (unsigned DMG)

```bash
npm run dist
# Output: release/ODOP Link-1.0.0-arm64.dmg
```

> **Note:** Because the app is not signed with an Apple Developer certificate, macOS will block it.
> To open: **Right-click → Open → Open** (do this once).

---

## Hash Chain vs Blockchain

The traceability engine is a **hash chain**, not a blockchain. There is no peer-to-peer network,
no consensus mechanism, and no cryptocurrency. It is a sequential list of records where each record
stores the SHA-256 hash of the previous one, making any offline tampering detectable by re-computing
the chain.
