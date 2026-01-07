import React from 'react';
import NewsCard from './NewsCard';
import './NewsList.css';

function NewsList({ summaries }) {
  if (!summaries || summaries.length === 0) {
    return (
      <div className="no-news">
        <p>No news available at the moment. Try changing your preferences or check back later.</p>
      </div>
    );
  }

  return (
    <div className="news-list">
      <div className="news-grid">
        {summaries.map((summary, index) => (
          <NewsCard key={index} summary={summary} />
        ))}
      </div>
    </div>
  );
}

export default NewsList;
