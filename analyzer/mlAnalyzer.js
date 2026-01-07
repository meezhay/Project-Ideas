/**
 * Machine Learning-Inspired Conference Analyzer
 * Uses multi-signal feature extraction and weighted scoring
 */

class MLConferenceAnalyzer {
  constructor() {
    // Feature weights (learned from known predatory patterns)
    this.weights = {
      domainQuality: 0.25,
      contentQuality: 0.30,
      suspiciousPatterns: 0.35,
      contactInfo: 0.10
    };

    // Known predatory domains
    this.knownPredatoryDomains = [
      'waset.org', 'omics', 'wasser', 'sciencefather',
      'conferencealerts', 'conferenceseries', 'alliedacademies'
    ];

    // Suspicious TLDs
    this.suspiciousTlds = ['.club', '.xyz', '.site', '.info', '.biz', '.top'];

    // High-quality TLDs (academic)
    this.academicTlds = ['.edu', '.ac.uk', '.ac.', '.edu.'];
  }

  /**
   * Main analysis function
   * @param {string} url - The URL to analyze
   * @param {Object} pageContent - Page content (title, bodyText)
   * @returns {Object} Analysis results with score and features
   */
  analyze(url, pageContent) {
    const features = this.extractFeatures(url, pageContent);
    const score = this.calculateScore(features);
    const riskLevel = this.determineRiskLevel(score);
    const explanation = this.generateExplanation(features);

    return {
      score: Math.round(score),
      riskLevel,
      features,
      flags: explanation.flags,
      positiveSignals: explanation.positiveSignals,
      confidence: this.calculateConfidence(features, pageContent),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Extract multiple features from URL and content
   */
  extractFeatures(url, pageContent) {
    const features = {
      domain: this.analyzeDomain(url),
      content: this.analyzeContent(pageContent),
      patterns: this.detectPatterns(url, pageContent),
      contact: this.analyzeContactInfo(pageContent),
      metadata: this.analyzeMetadata(url, pageContent)
    };

    return features;
  }

  /**
   * Domain Quality Analysis
   */
  analyzeDomain(url) {
    const urlLower = url.toLowerCase();
    const features = {
      isPredatory: false,
      hasSuspiciousTld: false,
      hasAcademicTld: false,
      hasGenericNaming: false,
      hasNumbersInDomain: false,
      domainLength: 0,
      subdomainCount: 0,
      score: 100
    };

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const parts = hostname.split('.');

      features.domainLength = hostname.length;
      features.subdomainCount = Math.max(0, parts.length - 2);

      // Check known predatory domains
      for (const predatory of this.knownPredatoryDomains) {
        if (hostname.includes(predatory)) {
          features.isPredatory = true;
          features.score -= 50;
          break;
        }
      }

      // Check TLD
      for (const tld of this.suspiciousTlds) {
        if (hostname.endsWith(tld)) {
          features.hasSuspiciousTld = true;
          features.score -= 25;
          break;
        }
      }

      for (const tld of this.academicTlds) {
        if (hostname.includes(tld)) {
          features.hasAcademicTld = true;
          features.score += 20;
          break;
        }
      }

      // Check for generic naming patterns
      const genericPatterns = [
        /worldconference/i,
        /internationalconf/i,
        /globalconference/i,
        /conference\d{4}/i,
        /\d{4}conference/i
      ];

      for (const pattern of genericPatterns) {
        if (pattern.test(hostname)) {
          features.hasGenericNaming = true;
          features.score -= 15;
          break;
        }
      }

      // Numbers in domain (suspicious for conferences)
      if (/\d/.test(hostname.replace(/\.(com|org|net)/, ''))) {
        features.hasNumbersInDomain = true;
        features.score -= 10;
      }

      // Very long domains are suspicious
      if (features.domainLength > 40) {
        features.score -= 10;
      }

      // Multiple subdomains can be suspicious
      if (features.subdomainCount > 2) {
        features.score -= 10;
      }

    } catch (error) {
      features.score = 50; // Can't parse URL properly
    }

    features.score = Math.max(0, Math.min(100, features.score));
    return features;
  }

  /**
   * Content Quality Analysis
   */
  analyzeContent(pageContent) {
    const features = {
      hasContent: false,
      textLength: 0,
      wordCount: 0,
      averageWordLength: 0,
      capsRatio: 0,
      punctuationRatio: 0,
      repeatedPhrases: 0,
      professionalismScore: 100,
      score: 100
    };

    if (!pageContent || !pageContent.bodyText) {
      features.score = 60; // Neutral when no content
      return features;
    }

    features.hasContent = true;
    const text = pageContent.bodyText || '';
    const title = pageContent.title || '';
    const fullText = title + ' ' + text;

    features.textLength = text.length;

    if (features.textLength < 200) {
      features.score -= 20; // Very short content is suspicious
    }

    // Word analysis
    const words = fullText.split(/\s+/).filter(w => w.length > 0);
    features.wordCount = words.length;

    if (words.length > 0) {
      const totalLength = words.reduce((sum, word) => sum + word.length, 0);
      features.averageWordLength = totalLength / words.length;
    }

    // Caps ratio (EXCESSIVE CAPS IS UNPROFESSIONAL)
    const capsCount = (fullText.match(/[A-Z]/g) || []).length;
    const letterCount = (fullText.match(/[a-zA-Z]/g) || []).length;
    features.capsRatio = letterCount > 0 ? capsCount / letterCount : 0;

    if (features.capsRatio > 0.3) {
      features.score -= 25; // Too many caps
      features.professionalismScore -= 30;
    }

    // Punctuation quality
    const punctCount = (fullText.match(/[!?]/g) || []).length;
    features.punctuationRatio = features.textLength > 0 ? punctCount / features.textLength : 0;

    if (features.punctuationRatio > 0.02) {
      features.score -= 15; // Too many exclamation marks/questions
      features.professionalismScore -= 20;
    }

    // Detect repeated phrases (spam-like)
    features.repeatedPhrases = this.detectRepeatedPhrases(fullText);
    if (features.repeatedPhrases > 3) {
      features.score -= 20;
      features.professionalismScore -= 25;
    }

    // Check for very short words (low quality)
    const shortWords = words.filter(w => w.length <= 3).length;
    if (words.length > 0 && shortWords / words.length > 0.5) {
      features.score -= 10;
    }

    features.score = Math.max(0, Math.min(100, features.score));
    features.professionalismScore = Math.max(0, Math.min(100, features.professionalismScore));
    return features;
  }

  /**
   * Pattern Detection (predatory indicators)
   */
  detectPatterns(url, pageContent) {
    const text = pageContent ? (pageContent.title + ' ' + pageContent.bodyText).toLowerCase() : '';
    const urlLower = url.toLowerCase();

    const patterns = {
      guaranteedAcceptance: false,
      fastTrack: false,
      easyPublication: false,
      noPeerReview: false,
      payToPresent: false,
      urgentDeadline: false,
      broadScope: false,
      excessivePromises: false,
      count: 0,
      score: 100
    };

    // High-risk patterns
    const highRiskPatterns = [
      { key: 'guaranteedAcceptance', pattern: /guaranteed?.{0,20}(acceptance|publication)/i, penalty: 35 },
      { key: 'noPeerReview', pattern: /no.{0,10}(peer.)?review/i, penalty: 35 },
      { key: 'payToPresent', pattern: /pay.{0,10}to.{0,10}(present|publish)/i, penalty: 30 }
    ];

    // Medium-risk patterns
    const mediumRiskPatterns = [
      { key: 'fastTrack', pattern: /fast.{0,10}track/i, penalty: 20 },
      { key: 'easyPublication', pattern: /easy.{0,10}publication/i, penalty: 20 },
      { key: 'urgentDeadline', pattern: /submit.{0,15}(today|now|immediately|urgent)/i, penalty: 15 }
    ];

    // Check all patterns
    [...highRiskPatterns, ...mediumRiskPatterns].forEach(({ key, pattern, penalty }) => {
      if (pattern.test(text) || pattern.test(urlLower)) {
        patterns[key] = true;
        patterns.count++;
        patterns.score -= penalty;
      }
    });

    // Check for broad scope (multiple unrelated fields)
    if (text) {
      const fields = ['engineering', 'medicine', 'business', 'arts', 'science',
                      'technology', 'education', 'law', 'psychology', 'mathematics'];
      const foundFields = fields.filter(field => text.includes(field));

      if (foundFields.length >= 5) {
        patterns.broadScope = true;
        patterns.count++;
        patterns.score -= 25;
      }
    }

    // Check for excessive promises/hype
    const hypeWords = ['best', 'top', 'world-class', 'prestigious', 'leading', 'premier'];
    const hypeCount = hypeWords.filter(word => text.includes(word)).length;

    if (hypeCount >= 4) {
      patterns.excessivePromises = true;
      patterns.count++;
      patterns.score -= 15;
    }

    patterns.score = Math.max(0, Math.min(100, patterns.score));
    return patterns;
  }

  /**
   * Contact Information Analysis
   */
  analyzeContactInfo(pageContent) {
    const text = pageContent ? pageContent.bodyText || '' : '';

    const features = {
      hasEmail: false,
      hasPhone: false,
      hasAddress: false,
      hasSuspiciousEmail: false,
      emailQuality: 0,
      score: 50 // Neutral by default
    };

    // Email detection
    const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
    const emails = text.match(emailRegex) || [];

    features.hasEmail = emails.length > 0;

    if (features.hasEmail) {
      features.score += 15;

      // Check email quality
      const suspiciousEmailPatterns = [
        /@gmail\.com/i,
        /@yahoo\.com/i,
        /@hotmail\.com/i,
        /@outlook\.com/i
      ];

      for (const email of emails) {
        for (const pattern of suspiciousEmailPatterns) {
          if (pattern.test(email)) {
            features.hasSuspiciousEmail = true;
            features.score -= 20; // Free email services are suspicious for conferences
            break;
          }
        }
      }

      // Professional emails are good
      if (!features.hasSuspiciousEmail && emails.length > 0) {
        features.emailQuality = 80;
        features.score += 10;
      }
    } else {
      features.score -= 15; // No contact email is suspicious
    }

    // Phone number detection
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    features.hasPhone = phoneRegex.test(text);

    if (features.hasPhone) {
      features.score += 10;
    }

    // Address detection (simple check)
    const addressKeywords = ['address', 'location', 'street', 'avenue', 'building'];
    features.hasAddress = addressKeywords.some(keyword => text.toLowerCase().includes(keyword));

    if (features.hasAddress) {
      features.score += 5;
    }

    features.score = Math.max(0, Math.min(100, features.score));
    return features;
  }

  /**
   * Metadata Analysis
   */
  analyzeMetadata(url, pageContent) {
    const features = {
      hasTitle: false,
      titleLength: 0,
      titleQuality: 0,
      urlKeywords: [],
      score: 100
    };

    // Title analysis
    if (pageContent && pageContent.title) {
      features.hasTitle = true;
      features.titleLength = pageContent.title.length;

      if (features.titleLength < 10) {
        features.score -= 15; // Too short
      } else if (features.titleLength > 20 && features.titleLength < 100) {
        features.titleQuality = 80;
        features.score += 10; // Good length
      }
    }

    // URL keyword analysis
    const urlLower = url.toLowerCase();
    const suspiciousKeywords = ['scam', 'fake', 'fraud', 'spam'];

    for (const keyword of suspiciousKeywords) {
      if (urlLower.includes(keyword)) {
        features.urlKeywords.push(keyword);
        features.score -= 40;
      }
    }

    features.score = Math.max(0, Math.min(100, features.score));
    return features;
  }

  /**
   * Calculate final score using weighted features
   */
  calculateScore(features) {
    let score = 0;

    score += features.domain.score * this.weights.domainQuality;
    score += features.content.score * this.weights.contentQuality;
    score += features.patterns.score * this.weights.suspiciousPatterns;
    score += features.contact.score * this.weights.contactInfo;

    // Bonus for academic domains
    if (features.domain.hasAcademicTld) {
      score += 15;
    }

    // Penalty for multiple red flags
    if (features.patterns.count >= 3) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine risk level from score
   */
  determineRiskLevel(score) {
    if (score >= 70) return 'low';
    if (score >= 40) return 'medium';
    return 'high';
  }

  /**
   * Calculate confidence in the analysis
   */
  calculateConfidence(features, pageContent) {
    let confidence = 50;

    // More confidence with page content
    if (pageContent && pageContent.bodyText) {
      confidence += 30;
    }

    // More confidence with multiple signals
    if (features.domain.isPredatory) confidence += 20;
    if (features.patterns.count > 0) confidence += 10;
    if (features.contact.hasEmail) confidence += 10;

    return Math.min(100, confidence);
  }

  /**
   * Generate human-readable explanation
   */
  generateExplanation(features) {
    const flags = [];
    const positiveSignals = [];

    // Domain flags
    if (features.domain.isPredatory) {
      flags.push({ icon: '🚨', text: 'Known predatory conference domain', severity: 'high' });
    }
    if (features.domain.hasSuspiciousTld) {
      flags.push({ icon: '⚠️', text: 'Unusual domain extension for academic conference', severity: 'medium' });
    }
    if (features.domain.hasGenericNaming) {
      flags.push({ icon: '⚠️', text: 'Generic conference naming pattern detected', severity: 'medium' });
    }

    // Domain positives
    if (features.domain.hasAcademicTld) {
      positiveSignals.push({ icon: '✅', text: 'Academic domain (.edu, .ac)', severity: 'positive' });
    }

    // Pattern flags
    if (features.patterns.guaranteedAcceptance) {
      flags.push({ icon: '🚨', text: 'Promises guaranteed acceptance', severity: 'high' });
    }
    if (features.patterns.noPeerReview) {
      flags.push({ icon: '🚨', text: 'Claims no peer review process', severity: 'high' });
    }
    if (features.patterns.fastTrack) {
      flags.push({ icon: '⚠️', text: 'Offers fast-track publication', severity: 'medium' });
    }
    if (features.patterns.broadScope) {
      flags.push({ icon: '⚠️', text: 'Unusually broad conference scope', severity: 'medium' });
    }
    if (features.patterns.urgentDeadline) {
      flags.push({ icon: '⚡', text: 'Urgent submission pressure tactics', severity: 'low' });
    }

    // Content flags
    if (features.content.capsRatio > 0.3) {
      flags.push({ icon: '⚠️', text: 'Excessive capital letters (unprofessional)', severity: 'medium' });
    }
    if (features.content.repeatedPhrases > 3) {
      flags.push({ icon: '⚠️', text: 'Repetitive content detected', severity: 'medium' });
    }
    if (features.content.professionalismScore < 50) {
      flags.push({ icon: '⚠️', text: 'Low content professionalism score', severity: 'medium' });
    }

    // Contact flags
    if (features.contact.hasSuspiciousEmail) {
      flags.push({ icon: '⚠️', text: 'Uses free email service (unprofessional)', severity: 'medium' });
    }
    if (!features.contact.hasEmail && features.content.hasContent) {
      flags.push({ icon: '⚡', text: 'No contact email found', severity: 'low' });
    }

    // Contact positives
    if (features.contact.hasEmail && !features.contact.hasSuspiciousEmail) {
      positiveSignals.push({ icon: '✅', text: 'Professional email contact provided', severity: 'positive' });
    }
    if (features.contact.hasPhone) {
      positiveSignals.push({ icon: '✅', text: 'Phone contact information available', severity: 'positive' });
    }

    // URL metadata flags
    if (features.metadata.urlKeywords.length > 0) {
      flags.push({ icon: '🚨', text: `Suspicious keywords in URL: ${features.metadata.urlKeywords.join(', ')}`, severity: 'high' });
    }

    return { flags, positiveSignals };
  }

  /**
   * Detect repeated phrases (spam detection)
   */
  detectRepeatedPhrases(text) {
    const phrases = text.toLowerCase().match(/\b\w+\s+\w+\s+\w+\b/g) || [];
    const phraseCount = {};
    let repeated = 0;

    phrases.forEach(phrase => {
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
      if (phraseCount[phrase] === 3) {
        repeated++;
      }
    });

    return repeated;
  }
}

// Make available for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MLConferenceAnalyzer;
}
