import React from 'react';
import './NewsCard.css';

function NewsCard({ summary }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <article className="news-card">
      {summary.image && (
        <div className="news-card-image-container">
          <img
            src={summary.image}
            alt={summary.title}
            className="news-card-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="news-card-content">
        <h3 className="news-card-title">{summary.title}</h3>
        <p className="news-card-summary">{summary.summary}</p>
        <div className="news-card-footer">
          <span className="news-card-source">{summary.source}</span>
          <span className="news-card-time">{formatDate(summary.publishedAt)}</span>
        </div>
        {summary.url && summary.url !== '#' && (
          <a
            href={summary.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card-link"
          >
            Read full article →
          </a>
        )}
      </div>
    </article>
  );
}

export default NewsCard;
