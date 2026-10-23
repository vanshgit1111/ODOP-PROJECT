/* Lecture 07: fair price comparison, plain CSS bars, editable margins */

import React, { useState } from 'react';

export default function FairPriceTab({ data }) {
  const [selBatchId,           setSelBatchId]           = useState(data.batches.length > 0 ? data.batches[0].id : '');
  const [retailPrice,          setRetailPrice]          = useState(1200);
  const [aggregatorPct,        setAggregatorPct]        = useState(15);
  const [wholesalerPct,        setWholesalerPct]        = useState(20);
  const [traderPct,            setTraderPct]            = useState(18);
  const [retailerPct,          setRetailerPct]          = useState(27);
  const [directLogisticsPct,   setDirectLogisticsPct]   = useState(10);

  const selBatch    = data.batches.find(b => b.id === selBatchId) || null;
  const selProducer = selBatch ? data.producers.find(p => p.id === selBatch.producerId) : null;

  const totalMiddlemen  = aggregatorPct + wholesalerPct + traderPct + retailerPct;
  const tradProdPct     = Math.max(0, 100 - totalMiddlemen);
  const directProdPct   = Math.max(0, 100 - directLogisticsPct);

  const rp = retailPrice;
  const tradProd   = (rp * tradProdPct   / 100).toFixed(0);
  const aggR       = (rp * aggregatorPct / 100).toFixed(0);
  const whoR       = (rp * wholesalerPct / 100).toFixed(0);
  const traR       = (rp * traderPct     / 100).toFixed(0);
  const retR       = (rp * retailerPct   / 100).toFixed(0);
  const directProd = (rp * directProdPct / 100).toFixed(0);
  const logR       = (rp * directLogisticsPct / 100).toFixed(0);

  const gainRs  = (parseFloat(directProd) - parseFloat(tradProd)).toFixed(0);
  const gainPct = tradProdPct > 0
    ? Math.round((gainRs / parseFloat(tradProd)) * 100)
    : 0;

  function Slider({ label, value, setter, min, max, rupees }) {
    return (
      <div className="slider-row">
        <div className="slider-label">
          <span>{label}</span>
          <strong>{value}% (₹{rupees}/kg)</strong>
        </div>
        <input type="range" min={min} max={max} value={value}
          onChange={e => setter(parseInt(e.target.value))} />
      </div>
    );
  }

  return (
    <div className="tab-pane">
      <div className="tab-header">
        <div>
          <h2>Fair Price Calculator</h2>
          <p className="tab-sub">Direct sale vs multi-middleman supply chain.</p>
        </div>
        <span className="pill highlight">+{gainPct}% · +₹{gainRs}/kg for farmer</span>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Parameters</h3>

          <div className="field">
            <label>Batch</label>
            <select value={selBatchId} onChange={e => setSelBatchId(e.target.value)}>
              <option value="">Generic 500 kg batch</option>
              {data.batches.map(b => (
                <option key={b.id} value={b.id}>{b.id} · {b.grade.split(' ')[0]} ({b.quantityKg} kg)</option>
              ))}
            </select>
          </div>

          {selBatch && (
            <div className="context-box">
              <b>{selBatch.id}</b> · {selBatch.grade} · {selBatch.quantityKg} kg
              <br />{selProducer ? selProducer.name + ', ' + selProducer.district : ''}
            </div>
          )}

          <div className="field">
            <label>Retail Price (₹/kg)</label>
            <input type="number" min="200" step="50" value={retailPrice}
              onChange={e => setRetailPrice(parseFloat(e.target.value) || 0)} />
          </div>

          <hr className="sep" />
          <h4>Middleman Margins</h4>

          <Slider label="Village Aggregator"     value={aggregatorPct} setter={setAggregatorPct} min={0} max={30} rupees={aggR} />
          <Slider label="Mandi Wholesaler"        value={wholesalerPct} setter={setWholesalerPct} min={0} max={35} rupees={whoR} />
          <Slider label="Secondary Trader"        value={traderPct}     setter={setTraderPct}     min={0} max={35} rupees={traR} />
          <Slider label="Urban Retailer"          value={retailerPct}   setter={setRetailerPct}   min={0} max={45} rupees={retR} />

          <hr className="sep" />
          <h4>Direct Sale Overhead</h4>
          <Slider label="Logistics &amp; Packaging" value={directLogisticsPct} setter={setDirectLogisticsPct} min={0} max={25} rupees={logR} />
        </div>

        <div className="card">
          <h3>Value Distribution</h3>

          <div className="compare-block">
            <div className="compare-label">
              <span className="tag-green">DIRECT SALE (ODOP Link)</span>
              <span>Farmer gets ₹{directProd}/kg ({directProdPct}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar bar-farmer-d" style={{width: directProdPct + '%'}} title={`Farmer ${directProdPct}%`}>
                {directProdPct > 12 ? `${directProdPct}%` : ''}
              </div>
              <div className="bar bar-logistics" style={{width: directLogisticsPct + '%'}} title={`Logistics ${directLogisticsPct}%`}>
                {directLogisticsPct > 8 ? `${directLogisticsPct}%` : ''}
              </div>
            </div>
            <div className="legend">
              <span><span className="dot-sq farmer-d"></span> Farmer ₹{directProd}</span>
              <span><span className="dot-sq logist"></span> Logistics ₹{logR}</span>
            </div>
          </div>

          <div className="compare-block">
            <div className="compare-label">
              <span className="tag-orange">TRADITIONAL CHAIN</span>
              <span>Farmer gets ₹{tradProd}/kg ({tradProdPct}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar bar-farmer-t" style={{width: tradProdPct + '%'}} title={`Farmer ${tradProdPct}%`}>
                {tradProdPct > 8 ? `${tradProdPct}%` : ''}
              </div>
              <div className="bar bar-agg"  style={{width: aggregatorPct + '%'}} title={`Aggregator ${aggregatorPct}%`}>
                {aggregatorPct > 8 ? `${aggregatorPct}%` : ''}
              </div>
              <div className="bar bar-who"  style={{width: wholesalerPct + '%'}} title={`Wholesaler ${wholesalerPct}%`}>
                {wholesalerPct > 8 ? `${wholesalerPct}%` : ''}
              </div>
              <div className="bar bar-tra"  style={{width: traderPct + '%'}} title={`Trader ${traderPct}%`}>
                {traderPct > 8 ? `${traderPct}%` : ''}
              </div>
              <div className="bar bar-ret"  style={{width: retailerPct + '%'}} title={`Retailer ${retailerPct}%`}>
                {retailerPct > 8 ? `${retailerPct}%` : ''}
              </div>
            </div>
            <div className="legend">
              <span><span className="dot-sq farmer-t"></span> Farmer ₹{tradProd}</span>
              <span><span className="dot-sq agg"></span> Aggregator ₹{aggR}</span>
              <span><span className="dot-sq who"></span> Wholesaler ₹{whoR}</span>
              <span><span className="dot-sq tra"></span> Trader ₹{traR}</span>
              <span><span className="dot-sq ret"></span> Retailer ₹{retR}</span>
            </div>
          </div>

          <div className="impact-box">
            <h4>Farmer Impact (ODOP Link)</h4>
            <div className="impact-row">
              <div className="metric">
                <span>Extra per kg</span>
                <strong>+₹{gainRs}</strong>
              </div>
              <div className="metric">
                <span>Income rise</span>
                <strong>+{gainPct}%</strong>
              </div>
              <div className="metric">
                <span>Batch total gain</span>
                <strong>+₹{(parseFloat(gainRs) * (selBatch ? selBatch.quantityKg : 500)).toLocaleString()}</strong>
                <small>for {selBatch ? selBatch.quantityKg : 500} kg</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
