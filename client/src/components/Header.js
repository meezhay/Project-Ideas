import React from 'react';
import './Header.css';

function Header({ onRefresh }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-text">
          <h1 className="header-title">📰 Today's News</h1>
          <p className="header-date">{today}</p>
        </div>
        <button onClick={onRefresh} className="refresh-button" title="Refresh news">
          🔄 Refresh
        </button>
      </div>
    </header>
  );
}

export default Header;
