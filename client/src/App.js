import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Header from './components/Header';
import PreferencesPanel from './components/PreferencesPanel';
import NewsList from './components/NewsList';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    language: 'en',
    category: 'general',
    country: 'us'
  });
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    // Fetch available languages and categories
    const fetchOptions = async () => {
      try {
        const [langRes, catRes] = await Promise.all([
          axios.get('/api/news/languages'),
          axios.get('/api/news/categories')
        ]);
        setAvailableLanguages(langRes.data.languages);
        setAvailableCategories(catRes.data.categories);
      } catch (err) {
        console.error('Error fetching options:', err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchNews();
  }, [preferences]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/news/today', {
        params: preferences
      });
      setSummaries(response.data.summaries);
    } catch (err) {
      setError('Failed to load news. Please try again later.');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (newPreferences) => {
    setPreferences({ ...preferences, ...newPreferences });
  };

  const handleRefresh = () => {
    fetchNews();
  };

  return (
    <div className="App">
      <Header onRefresh={handleRefresh} />

      <div className="container">
        <PreferencesPanel
          preferences={preferences}
          languages={availableLanguages}
          categories={availableCategories}
          onChange={handlePreferenceChange}
        />

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={handleRefresh} className="retry-button">
              Try Again
            </button>
          </div>
        ) : (
          <NewsList summaries={summaries} />
        )}
      </div>

      <footer className="footer">
        <p>News Summary App - Stay informed, simply</p>
      </footer>
    </div>
  );
}

export default App;
