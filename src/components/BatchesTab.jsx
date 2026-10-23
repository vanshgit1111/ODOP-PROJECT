/* Lecture 05: hash chain events, QR code, batch management */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function BatchesTab({ data, setData, refreshData }) {
  const [prodId,      setProdId]      = useState('');
  const [qty,         setQty]         = useState('');
  const [grade,       setGrade]       = useState('Extra Light (Grade A)');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [createErr,   setCreateErr]   = useState('');

  const [selBatchId,  setSelBatchId]  = useState('');
  const [evType,      setEvType]      = useState('Graded');
  const [evNotes,     setEvNotes]     = useState('');
  const [facility,    setFacility]    = useState('Shopian Grading Unit');

  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying,    setVerifying]    = useState(false);
  const [qrUrl,        setQrUrl]        = useState('');
  const [toast,        setToast]        = useState('');

  useEffect(() => {
    if (!prodId && data.producers.length > 0) setProdId(data.producers[0].id);
  }, [data.producers]);

  useEffect(() => {
    if (!selBatchId && data.batches.length > 0) setSelBatchId(data.batches[0].id);
  }, [data.batches]);

  const selBatch    = data.batches.find(b => b.id === selBatchId) || null;
  const selProducer = selBatch ? data.producers.find(p => p.id === selBatch.producerId) : null;
  const batchEvs    = data.events.filter(e => e.batchId === selBatchId);

  useEffect(() => {
    setVerifyResult(null);
    if (!selBatch) { setQrUrl(''); return; }

    const payload = JSON.stringify({
      batchId:    selBatch.id,
      product:    'Kashmiri Walnuts',
      grade:      selBatch.grade,
      quantityKg: selBatch.quantityKg,
      harvest:    selBatch.harvestDate
    });
    QRCode.toDataURL(payload, { width: 160, margin: 2 }, (err, url) => {
      if (!err) setQrUrl(url);
    });
  }, [selBatchId]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  async function handleCreateBatch(e) {
    e.preventDefault();
    if (!prodId) { setCreateErr('Select a producer.'); return; }
    const qtyNum = parseFloat(qty);
    if (!qtyNum || qtyNum <= 0) { setCreateErr('Enter a valid quantity.'); return; }

    const batchId = 'BATCH-' + Date.now().toString().slice(-6);
    const newBatch = { id: batchId, producerId: prodId, quantityKg: qtyNum, grade, harvestDate };

    setData(prev => ({ ...prev, batches: [newBatch, ...prev.batches] }));

    await window.odopAPI.appendEvent(batchId, {
      type:    'Harvested',
      details: { grade, quantityKg: qtyNum, harvestDate, note: 'Initial harvest event.' }
    });

    await refreshData();
    setSelBatchId(batchId);
    setQty(''); setCreateErr('');
    flash('Batch created – genesis event hashed.');
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    if (!selBatchId) return;

    await window.odopAPI.appendEvent(selBatchId, {
      type:    evType,
      details: { facility: facility.trim(), notes: evNotes.trim() || evType }
    });

    setEvNotes('');
    setVerifyResult(null);
    await refreshData();
    flash(`Event "${evType}" appended.`);
  }

  async function handleVerify() {
    if (!selBatchId) return;
    setVerifying(true);
    setVerifyResult(null);
    const res = await window.odopAPI.verifyChain(selBatchId);
    setVerifyResult(res);
    setVerifying(false);
  }

  async function handleExport() {
    if (!selBatchId) return;
    const res = await window.odopAPI.exportCertificate(selBatchId);
    if (res.ok) flash('Certificate saved: ' + res.filePath);
  }

  async function handleTamper() {
    if (batchEvs.length === 0) { alert('Add at least one event first.'); return; }
    const res = await window.odopAPI.tamperEvent(selBatchId);
    if (res.ok) {
      await refreshData();
      flash('Tamper done – event #1 modified in data.json. Click Verify to detect it.');
    }
  }

  return (
    <div className="tab-pane">
      <div className="tab-header">
        <div>
          <h2>Batches &amp; Hash Chain</h2>
          <p className="tab-sub">Each event is SHA-256 linked to the previous one.</p>
        </div>
        <span className="pill">{data.batches.length} batches</span>
      </div>

      {toast && (
        <div className="toast">
          {toast}
          <button onClick={() => setToast('')}>×</button>
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <h3>Create Batch</h3>

          {createErr && <div className="err-box">{createErr}</div>}

          {data.producers.length === 0 ? (
            <div className="warn-box">Register a producer first.</div>
          ) : (
            <form onSubmit={handleCreateBatch}>
              <div className="field">
                <label>Producer</label>
                <select value={prodId} onChange={e => setProdId(e.target.value)}>
                  {data.producers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} – {p.village}</option>
                  ))}
                </select>
              </div>

              <div className="row2">
                <div className="field">
                  <label>Quantity (kg)</label>
                  <input type="number" min="1" step="0.5" value={qty}
                    onChange={e => setQty(e.target.value)} placeholder="e.g. 500" />
                </div>
                <div className="field">
                  <label>Grade</label>
                  <select value={grade} onChange={e => setGrade(e.target.value)}>
                    <option>Extra Light (Grade A)</option>
                    <option>Light (Grade B)</option>
                    <option>Light Amber (Grade C)</option>
                    <option>Amber (Grade D)</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Harvest Date</label>
                <input type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} />
              </div>

              <button className="btn-green">Create Batch</button>
            </form>
          )}

          <hr className="sep" />

          <h3>Batches ({data.batches.length})</h3>
          <div className="batch-list">
            {data.batches.map(b => {
              const prod = data.producers.find(p => p.id === b.producerId);
              return (
                <div
                  key={b.id}
                  className={'batch-item' + (b.id === selBatchId ? ' selected' : '')}
                  onClick={() => setSelBatchId(b.id)}
                >
                  <strong>{b.id}</strong>
                  <span className="grade-tag">{b.grade.split(' ')[0]}</span>
                  <div className="batch-meta">{b.quantityKg} kg · {prod ? prod.name : '—'}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          {!selBatch ? (
            <p className="muted">Select a batch to view its hash chain.</p>
          ) : (
            <>
              <div className="batch-hero">
                <div>
                  <span className="tag-green">Walnut Batch</span>
                  <h3 style={{margin:'4px 0'}}>{selBatch.id}</h3>
                  <div className="meta-row">
                    <span>Producer: <strong>{selProducer ? selProducer.name : '—'}</strong></span>
                    <span>Qty: <strong>{selBatch.quantityKg} kg</strong></span>
                    <span>Grade: <strong>{selBatch.grade}</strong></span>
                    <span>Harvest: <strong>{selBatch.harvestDate}</strong></span>
                  </div>
                </div>
                {qrUrl && (
                  <div className="qr-box">
                    <img src={qrUrl} alt="QR" />
                    <small>Scan for batch info</small>
                  </div>
                )}
              </div>

              <div className="toolbar">
                <button className="btn-blue" onClick={handleVerify} disabled={verifying}>
                  {verifying ? 'Verifying…' : '✓ Verify Chain'}
                </button>
                <button className="btn-grey" onClick={handleExport}>Export Certificate</button>
                <button className="btn-warn" onClick={handleTamper} title="Dev only">⚠ Tamper Demo</button>
              </div>

              {verifyResult && (
                <div className={verifyResult.valid ? 'banner-ok' : 'banner-bad'}>
                  {verifyResult.valid
                    ? `✓ All ${verifyResult.count} event(s) verified – chain intact.`
                    : `✕ Tamper at event #${verifyResult.tamperedIndex + 1} (${verifyResult.eventType}): ${verifyResult.reason}`
                  }
                </div>
              )}

              <div className="subcard">
                <h4>Add Event</h4>
                <form onSubmit={handleAddEvent}>
                  <div className="row2">
                    <div className="field">
                      <label>Event Type</label>
                      <select value={evType} onChange={e => setEvType(e.target.value)}>
                        <option>Graded</option>
                        <option>Packed</option>
                        <option>Shipped</option>
                        <option>Delivered</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Facility</label>
                      <input value={facility} onChange={e => setFacility(e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Notes</label>
                    <input value={evNotes} onChange={e => setEvNotes(e.target.value)}
                      placeholder="Optional notes…" />
                  </div>
                  <button className="btn-green-sm">Compute SHA-256 &amp; Append</button>
                </form>
              </div>

              <h4>Hash Chain ({batchEvs.length} events)</h4>
              {batchEvs.length === 0 && <p className="muted">No events yet.</p>}
              <div className="chain">
                {batchEvs.map((ev, i) => {
                  const tampered = verifyResult && !verifyResult.valid && verifyResult.tamperedIndex === i;
                  return (
                    <div key={ev.id} className={'chain-node' + (tampered ? ' tampered' : '')}>
                      <div className="node-num">{i + 1}</div>
                      <div className="node-body">
                        <div className="node-top">
                          <strong>{ev.type}</strong>
                          <span className="node-ts">{new Date(ev.timestamp).toLocaleString()}</span>
                        </div>
                        <ul className="details">
                          {Object.entries(ev.details).map(([k, v]) => (
                            <li key={k}><b>{k}:</b> {String(v)}</li>
                          ))}
                        </ul>
                        <div className="hashblock">
                          <div><span className="hl">Prev:</span>
                            {ev.previousHash === 'GENESIS'
                              ? <span className="genesis-tag">GENESIS</span>
                              : <code>{ev.previousHash}</code>}
                          </div>
                          <div><span className="hl">Hash:</span> <code className="cur-hash">{ev.hash}</code></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
