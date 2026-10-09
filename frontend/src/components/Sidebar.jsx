import React from 'react';

const NAV = [
  { icon: '◈', label: 'Console',   active: true },
  { icon: '◉', label: 'History',   active: false },
  { icon: '◎', label: 'Analytics', active: false },
  { icon: '◌', label: 'Settings',  active: false },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">L</div>
        <div className="logo-text">
          <span className="logo-name">Laya</span>
          <span className="logo-sub">Support AI</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(n => (
          <div key={n.label} className={`nav-item ${n.active ? 'nav-item--active' : ''}`}>
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
            {n.active && <span className="nav-active-bar" />}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-model">
          <span className="model-dot" />
          <div>
            <div className="model-name">GPT-OSS 120B</div>
            <div className="model-via">via Groq</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
