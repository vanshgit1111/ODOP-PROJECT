/* Lecture 11: React root + IPC persistence pattern */

import React, { useState, useEffect } from 'react';
import Sidebar      from './components/Sidebar.jsx';
import ProducersTab from './components/ProducersTab.jsx';
import BatchesTab   from './components/BatchesTab.jsx';
import BuyersTab    from './components/BuyersTab.jsx';
import FairPriceTab from './components/FairPriceTab.jsx';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('producers');

  const [data, setData] = useState({
    producers: [],
    batches:   [],
    events:    [],
    buyers:    [],
    inquiries: []
  });

  useEffect(() => {
    window.odopAPI.loadData().then(loaded => {
      setData({
        producers: loaded.producers  || [],
        batches:   loaded.batches    || [],
        events:    loaded.events     || [],
        buyers:    loaded.buyers     || [],
        inquiries: loaded.inquiries  || []
      });
      setIsLoading(false);
    });
  }, []);

  /*
   * isLoading guard: on first render data is still the empty default.
   * Without this guard, saveData would run immediately and wipe data.json
   * before loadData has a chance to return.
   */
  useEffect(() => {
    if (isLoading) return;
    window.odopAPI.saveData(data);
  }, [data, isLoading]);

  const refreshData = async () => {
    const fresh = await window.odopAPI.loadData();
    setData({
      producers: fresh.producers  || [],
      batches:   fresh.batches    || [],
      events:    fresh.events     || [],
      buyers:    fresh.buyers     || [],
      inquiries: fresh.inquiries  || []
    });
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading ODOP Link…</p>
      </div>
    );
  }

  const counts = {
    producers: data.producers.length,
    batches:   data.batches.length,
    inquiries: data.inquiries.length
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />

      <main className="app-content">
        {activeTab === 'producers' && <ProducersTab data={data} setData={setData} />}
        {activeTab === 'batches'   && <BatchesTab   data={data} setData={setData} refreshData={refreshData} />}
        {activeTab === 'buyers'    && <BuyersTab    data={data} setData={setData} />}
        {activeTab === 'fairprice' && <FairPriceTab data={data} />}
      </main>
    </div>
  );
}
