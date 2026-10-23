/* Lecture 06: buyers, inquiries, order lifecycle */

import React, { useState } from 'react';

export default function BuyersTab({ data, setData }) {
  const [buyerName,    setBuyerName]    = useState('');
  const [buyerType,    setBuyerType]    = useState('Wholesaler');
  const [location,     setLocation]     = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerErr,     setBuyerErr]     = useState('');

  const [selBuyerId,  setSelBuyerId]  = useState('');
  const [selBatchId,  setSelBatchId]  = useState('');
  const [iqQty,       setIqQty]       = useState('');
  const [iqPrice,     setIqPrice]     = useState('');
  const [iqNotes,     setIqNotes]     = useState('');
  const [iqErr,       setIqErr]       = useState('');

  function addBuyer(e) {
    e.preventDefault();
    if (!buyerName.trim() || !location.trim() || !buyerContact.trim()) {
      setBuyerErr('Fill all buyer fields.');
      return;
    }
    const b = {
      id:        'BUY-' + Date.now().toString().slice(-6),
      name:      buyerName.trim(),
      buyerType,
      location:  location.trim(),
      contact:   buyerContact.trim(),
      date:      new Date().toISOString().split('T')[0]
    };
    setData(prev => ({ ...prev, buyers: [b, ...prev.buyers] }));
    setBuyerName(''); setLocation(''); setBuyerContact(''); setBuyerErr('');
  }

  function sendQuote(e) {
    e.preventDefault();
    if (!selBuyerId)  { setIqErr('Select a buyer.');  return; }
    if (!selBatchId)  { setIqErr('Select a batch.');  return; }

    const q = parseFloat(iqQty);
    const p = parseFloat(iqPrice);
    if (!q || q <= 0) { setIqErr('Enter valid quantity.'); return; }
    if (!p || p <= 0) { setIqErr('Enter valid price.');    return; }

    const batch = data.batches.find(b => b.id === selBatchId);
    if (batch && q > batch.quantityKg) {
      setIqErr(`Qty exceeds batch size (${batch.quantityKg} kg).`);
      return;
    }

    const inq = {
      id:              'INQ-' + Date.now().toString().slice(-6),
      buyerId:         selBuyerId,
      batchId:         selBatchId,
      quantityKg:      q,
      pricePerKg:      p,
      total:           q * p,
      notes:           iqNotes.trim() || 'Direct inquiry via ODOP Link.',
      status:          'Pending',
      date:            new Date().toISOString().split('T')[0]
    };
    setData(prev => ({ ...prev, inquiries: [inq, ...prev.inquiries] }));
    setIqQty(''); setIqPrice(''); setIqNotes(''); setIqErr('');
  }

  function updateStatus(id, status) {
    setData(prev => ({
      ...prev,
      inquiries: prev.inquiries.map(i => i.id === id ? { ...i, status } : i)
    }));
  }

  return (
    <div className="tab-pane">
      <div className="tab-header">
        <div>
          <h2>Buyers &amp; Quotes</h2>
          <p className="tab-sub">Direct linkage between producers and buyers. No middlemen.</p>
        </div>
        <span className="pill">{data.inquiries.length} inquiries</span>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Register Buyer</h3>

          {buyerErr && <div className="err-box">{buyerErr}</div>}

          <form onSubmit={addBuyer}>
            <div className="field">
              <label>Buyer Name</label>
              <input value={buyerName} onChange={e => setBuyerName(e.target.value)}
                placeholder="e.g. Royal Kashmiri Dry Fruits Pvt Ltd" />
            </div>
            <div className="row2">
              <div className="field">
                <label>Type</label>
                <select value={buyerType} onChange={e => setBuyerType(e.target.value)}>
                  <option>Wholesaler</option>
                  <option>Retail Chain</option>
                  <option>Exporter</option>
                  <option>Food Processor</option>
                </select>
              </div>
              <div className="field">
                <label>City / Market</label>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Azadpur Mandi, Delhi" />
              </div>
            </div>
            <div className="field">
              <label>Contact</label>
              <input value={buyerContact} onChange={e => setBuyerContact(e.target.value)}
                placeholder="email or phone" />
            </div>
            <button className="btn-blue">Register Buyer</button>
          </form>

          <hr className="sep" />

          <h3>Send Inquiry &amp; Quote</h3>

          {iqErr && <div className="err-box">{iqErr}</div>}

          {data.buyers.length === 0 || data.batches.length === 0 ? (
            <div className="warn-box">Need at least 1 buyer and 1 batch.</div>
          ) : (
            <form onSubmit={sendQuote}>
              <div className="field">
                <label>Buyer</label>
                <select value={selBuyerId} onChange={e => setSelBuyerId(e.target.value)}>
                  <option value="">-- select --</option>
                  {data.buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Batch</label>
                <select value={selBatchId} onChange={e => setSelBatchId(e.target.value)}>
                  <option value="">-- select --</option>
                  {data.batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.id} · {b.quantityKg} kg · {b.grade.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row2">
                <div className="field">
                  <label>Qty (kg)</label>
                  <input type="number" min="1" value={iqQty}
                    onChange={e => setIqQty(e.target.value)} placeholder="200" />
                </div>
                <div className="field">
                  <label>Price (₹/kg)</label>
                  <input type="number" min="1" value={iqPrice}
                    onChange={e => setIqPrice(e.target.value)} placeholder="850" />
                </div>
              </div>
              <div className="field">
                <label>Notes / Terms</label>
                <input value={iqNotes} onChange={e => setIqNotes(e.target.value)}
                  placeholder="e.g. 50% advance on dispatch" />
              </div>
              <button className="btn-green">Send Quote</button>
            </form>
          )}
        </div>

        <div className="card">
          <h3>Order Tracking</h3>
          <p className="tab-sub" style={{marginBottom:12}}>
            Pending → Accepted → Shipped
          </p>

          {data.inquiries.length === 0 ? (
            <p className="muted">No inquiries yet.</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th><th>Buyer</th><th>Batch</th>
                    <th>Qty</th><th>₹/kg</th><th>Total</th>
                    <th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inquiries.map(inq => {
                    const buyer = data.buyers.find(b => b.id === inq.buyerId);
                    return (
                      <tr key={inq.id}>
                        <td><code>{inq.id}</code></td>
                        <td>{buyer ? buyer.name : '—'}</td>
                        <td><code>{inq.batchId}</code></td>
                        <td>{inq.quantityKg}</td>
                        <td>{inq.pricePerKg}</td>
                        <td>₹{inq.total.toLocaleString()}</td>
                        <td>
                          <span className={'status-tag s-' + inq.status.toLowerCase()}>
                            {inq.status}
                          </span>
                        </td>
                        <td>
                          {inq.status === 'Pending' && (
                            <button className="btn-blue-sm" onClick={() => updateStatus(inq.id, 'Accepted')}>
                              Accept
                            </button>
                          )}
                          {inq.status === 'Accepted' && (
                            <button className="btn-green-sm" onClick={() => updateStatus(inq.id, 'Shipped')}>
                              Shipped
                            </button>
                          )}
                          {inq.status === 'Shipped' && <span>✓</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
