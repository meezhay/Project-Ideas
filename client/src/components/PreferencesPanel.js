import React from 'react';
import './PreferencesPanel.css';

function PreferencesPanel({ preferences, languages, categories, onChange }) {
  const handleLanguageChange = (e) => {
    const selectedLang = languages.find(lang => lang.code === e.target.value);
    onChange({
      language: e.target.value,
      country: selectedLang ? selectedLang.country : preferences.country
    });
  };

  const handleCategoryChange = (e) => {
    onChange({ category: e.target.value });
  };

  return (
    <div className="preferences-panel">
      <h2 className="preferences-title">Your Preferences</h2>
      <div className="preferences-content">
        <div className="preference-group">
          <label htmlFor="language-select" className="preference-label">
            🌍 Language
          </label>
          <select
            id="language-select"
            value={preferences.language}
            onChange={handleLanguageChange}
            className="preference-select"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="preference-group">
          <label htmlFor="category-select" className="preference-label">
            📑 Category
          </label>
          <select
            id="category-select"
            value={preferences.category}
            onChange={handleCategoryChange}
            className="preference-select"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default PreferencesPanel;
