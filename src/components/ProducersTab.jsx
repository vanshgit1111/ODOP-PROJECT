/* Lecture 04: form state, CRUD operations, producers tab */

import React, { useState } from 'react';

const DISTRICTS = ['Shopian','Anantnag','Kupwara','Baramulla','Pulwama','Kulgam','Budgam','Ganderbal'];

export default function ProducersTab({ data, setData }) {
  const [name,     setName]     = useState('');
  const [village,  setVillage]  = useState('');
  const [district, setDistrict] = useState('Shopian');
  const [contact,  setContact]  = useState('');
  const [err,      setErr]      = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim() || !village.trim() || !contact.trim()) {
      setErr('Fill in name, village, and contact.');
      return;
    }

    const p = {
      id:             'PROD-' + Date.now().toString().slice(-6),
      name:           name.trim(),
      village:        village.trim(),
      district,
      contact:        contact.trim(),
      registeredDate: new Date().toISOString().split('T')[0]
    };

    setData(prev => ({ ...prev, producers: [p, ...prev.producers] }));
    setName(''); setVillage(''); setContact(''); setErr('');
  }

  function handleDelete(id) {
    const linked = (data.batches || []).filter(b => b.producerId === id).length;
    if (linked > 0) {
      alert(`Cannot delete: ${linked} batch(es) linked to this producer.`);
      return;
    }
    setData(prev => ({ ...prev, producers: prev.producers.filter(p => p.id !== id) }));
  }

  return (
    <div className="tab-pane">
      <div className="tab-header">
        <div>
          <h2>Producers Directory</h2>
          <p className="tab-sub">Register walnut orchardists for direct market linkage.</p>
        </div>
        <span className="pill">{data.producers.length} registered</span>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Register Producer</h3>

          {err && <div className="err-box">{err}</div>}

          <form onSubmit={handleAdd}>
            <div className="field">
              <label>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ghulam Hassan Lone" />
            </div>

            <div className="row2">
              <div className="field">
                <label>Village</label>
                <input value={village} onChange={e => setVillage(e.target.value)} placeholder="e.g. Sedow" />
              </div>
              <div className="field">
                <label>District</label>
                <select value={district} onChange={e => setDistrict(e.target.value)}>
                  {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Contact</label>
              <input value={contact} onChange={e => setContact(e.target.value)} placeholder="+91 94190 00000" />
            </div>

            <button className="btn-green">Register</button>
          </form>
        </div>

        <div className="card">
          <h3>Registered ({data.producers.length})</h3>

          {data.producers.length === 0 ? (
            <p className="muted">No producers yet.</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Location</th><th>Contact</th><th>Batches</th><th></th>
                </tr>
              </thead>
              <tbody>
                {data.producers.map(p => {
                  const cnt = (data.batches || []).filter(b => b.producerId === p.id).length;
                  return (
                    <tr key={p.id}>
                      <td><code>{p.id}</code></td>
                      <td>{p.name}</td>
                      <td>{p.village}, {p.district}</td>
                      <td>{p.contact}</td>
                      <td>{cnt}</td>
                      <td>
                        <button className="btn-red-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
