/* Lecture 03: sidebar navigation component */

import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, counts }) {
  const tabs = [
    { id: 'producers', label: 'Producers',      badge: counts.producers },
    { id: 'batches',   label: 'Batches',         badge: counts.batches },
    { id: 'buyers',    label: 'Buyers & Quotes', badge: counts.inquiries },
    { id: 'fairprice', label: 'Fair Price',      badge: null }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">🌰</span>
        <div>
          <div className="brand-title">ODOP Link</div>
          <div className="brand-sub">Kashmiri Walnuts</div>
        </div>
      </div>

      <div className="sidebar-gov">Govt. of J&amp;K | ODOP Initiative</div>

      <nav>
        {tabs.map(t => (
          <button
            key={t.id}
            className={'nav-btn' + (activeTab === t.id ? ' active' : '')}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.badge !== null && t.badge > 0 && (
              <span className="nav-badge">{t.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="dot-green"></span> SHA-256 Hash Chain Active
      </div>
    </aside>
  );
}
