class SummaryService {
  async summarizeArticles(articles, language = 'en') {
    // Simplify and summarize articles for easy understanding
    return articles.map(article => {
      const summary = this.createSimpleSummary(article, language);
      return {
        title: this.simplifyTitle(article.title),
        summary: summary,
        source: article.source,
        url: article.url,
        publishedAt: article.publishedAt,
        image: article.image
      };
    });
  }

  simplifyTitle(title) {
    // Remove special characters and simplify
    return title
      .replace(/[—–-]/g, '-')
      .replace(/[''""`´]/g, "'")
      .trim();
  }

  createSimpleSummary(article, language) {
    // Extract main content
    let text = article.content || article.description;

    // Remove common noise patterns
    text = text
      .replace(/\[\+\d+ chars\]/g, '')
      .replace(/Read more.*$/i, '')
      .replace(/Continue reading.*$/i, '')
      .trim();

    // Create simple, clear summary
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Take first 2-3 most informative sentences
    const summary = sentences
      .slice(0, 3)
      .join('. ')
      .trim();

    // Add simple language transformations
    const simplifiedSummary = this.simplifyLanguage(summary, language);

    return simplifiedSummary + (simplifiedSummary.endsWith('.') ? '' : '.');
  }

  simplifyLanguage(text, language) {
    // Replace complex words with simpler alternatives for English
    if (language === 'en') {
      const replacements = {
        'approximately': 'about',
        'individuals': 'people',
        'utilize': 'use',
        'demonstrate': 'show',
        'facilitate': 'help',
        'commence': 'start',
        'terminate': 'end',
        'endeavor': 'try',
        'implement': 'put in place',
        'substantial': 'large',
        'numerous': 'many'
      };

      let simplified = text;
      for (const [complex, simple] of Object.entries(replacements)) {
        const regex = new RegExp(`\\b${complex}\\b`, 'gi');
        simplified = simplified.replace(regex, simple);
      }

      return simplified;
    }

    return text;
  }

  async summarizeWithAI(article) {
    // Placeholder for AI-powered summarization
    // This could integrate with OpenAI API if key is provided
    // For now, returns simple summary
    return this.createSimpleSummary(article, 'en');
  }
}

module.exports = new SummaryService();
