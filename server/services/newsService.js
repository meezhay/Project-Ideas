const axios = require('axios');
const NodeCache = require('node-cache');

// Cache news for 1 hour (3600 seconds)
const newsCache = new NodeCache({ stdTTL: 3600 });

class NewsService {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY;
    this.baseUrl = 'https://newsapi.org/v2';
  }

  async getTodayNews(language = 'en', category = 'general', country = 'us') {
    const cacheKey = `news_${language}_${category}_${country}`;

    // Check cache first
    const cached = newsCache.get(cacheKey);
    if (cached) {
      console.log('Returning cached news');
      return cached;
    }

    if (!this.apiKey) {
      // Return mock data if no API key is provided
      return this.getMockNews(category);
    }

    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const response = await axios.get(`${this.baseUrl}/top-headlines`, {
        params: {
          country: country,
          category: category,
          language: language,
          apiKey: this.apiKey,
          pageSize: 10
        }
      });

      const articles = response.data.articles
        .filter(article => article.title && article.description)
        .map(article => ({
          title: article.title,
          description: article.description,
          content: article.content || article.description,
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          image: article.urlToImage
        }));

      // Cache the results
      newsCache.set(cacheKey, articles);

      return articles;
    } catch (error) {
      console.error('NewsAPI error:', error.message);
      // Return mock data on error
      return this.getMockNews(category);
    }
  }

  getMockNews(category) {
    const mockArticles = {
      general: [
        {
          title: 'Global Climate Summit Reaches Historic Agreement',
          description: 'World leaders agree on new measures to combat climate change with concrete targets for 2030.',
          content: 'In a landmark decision, over 190 countries have committed to reducing carbon emissions by 50% within the next decade. The agreement includes provisions for renewable energy investment and protection of natural habitats.',
          url: '#',
          source: 'Global News Network',
          publishedAt: new Date().toISOString(),
          image: null
        },
        {
          title: 'New Technology Revolutionizes Clean Water Access',
          description: 'Scientists develop affordable water purification system for developing nations.',
          content: 'Researchers have created a solar-powered water purification device that can provide clean drinking water to remote communities. The technology is both affordable and easy to maintain.',
          url: '#',
          source: 'Science Today',
          publishedAt: new Date().toISOString(),
          image: null
        }
      ],
      technology: [
        {
          title: 'AI Assistant Breakthrough in Natural Language Understanding',
          description: 'New AI model shows unprecedented ability to understand context and nuance.',
          content: 'The latest generation of AI language models demonstrates remarkable improvements in understanding complex human communication patterns and providing helpful responses.',
          url: '#',
          source: 'Tech Review',
          publishedAt: new Date().toISOString(),
          image: null
        }
      ],
      business: [
        {
          title: 'Global Markets Show Strong Recovery',
          description: 'Stock markets worldwide see positive trends as economic indicators improve.',
          content: 'Major stock indices across the world are showing signs of recovery with technology and renewable energy sectors leading the growth.',
          url: '#',
          source: 'Business Wire',
          publishedAt: new Date().toISOString(),
          image: null
        }
      ]
    };

    return mockArticles[category] || mockArticles.general;
  }
}

module.exports = new NewsService();
