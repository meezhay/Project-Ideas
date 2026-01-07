const express = require('express');
const router = express.Router();
const newsService = require('../services/newsService');
const summaryService = require('../services/summaryService');

// Get today's news summaries
router.get('/today', async (req, res) => {
  try {
    const { language = 'en', category = 'general', country = 'us' } = req.query;

    // Fetch news articles
    const articles = await newsService.getTodayNews(language, category, country);

    // Summarize each article
    const summaries = await summaryService.summarizeArticles(articles, language);

    res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      language,
      category,
      count: summaries.length,
      summaries
    });
  } catch (error) {
    console.error('Error fetching news:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news summaries',
      message: error.message
    });
  }
});

// Get available categories
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: [
      { id: 'general', name: 'General' },
      { id: 'business', name: 'Business' },
      { id: 'technology', name: 'Technology' },
      { id: 'science', name: 'Science' },
      { id: 'health', name: 'Health' },
      { id: 'sports', name: 'Sports' },
      { id: 'entertainment', name: 'Entertainment' }
    ]
  });
});

// Get supported languages
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    languages: [
      { code: 'en', name: 'English', country: 'us' },
      { code: 'es', name: 'Spanish', country: 'es' },
      { code: 'fr', name: 'French', country: 'fr' },
      { code: 'de', name: 'German', country: 'de' },
      { code: 'it', name: 'Italian', country: 'it' },
      { code: 'pt', name: 'Portuguese', country: 'br' },
      { code: 'ar', name: 'Arabic', country: 'ae' },
      { code: 'zh', name: 'Chinese', country: 'cn' }
    ]
  });
});

module.exports = router;
