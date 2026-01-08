/**
 * Machine Learning-Inspired Conference Analyzer
 * Uses multi-signal feature extraction and weighted scoring
 * SCORING: Starts at 50 (neutral), goes down for red flags, up only for strong legitimacy signals
 */

class MLConferenceAnalyzer {
  constructor() {
    // Feature weights
    this.weights = {
      domainQuality: 0.30,
      contentQuality: 0.25,
      suspiciousPatterns: 0.30,
      contactInfo: 0.15
    };

    // Known predatory domains
    this.knownPredatoryDomains = [
      'waset.org', 'omics', 'wasser', 'sciencefather',
      'conferencealerts', 'conferenceseries', 'alliedacademies'
    ];

    // Suspicious TLDs
    this.suspiciousTlds = ['.club', '.xyz', '.site', '.info', '.biz', '.top', '.online'];

    // Academic/Legitimate TLDs (only these get positive points)
    this.academicTlds = ['.edu', '.ac.uk', '.ac.', '.edu.'];

    // Legitimate conference organizers
    this.legitimateOrganizers = ['ieee', 'acm', 'springer', 'elsevier', 'wiley'];
  }

  /**
   * Main analysis function
   * @param {string} url - The URL to analyze
   * @param {Object} pageContent - Page content (title, bodyText)
   * @returns {Object} Analysis results with score and features
   */
  analyze(url, pageContent) {
    const features = this.extractFeatures(url, pageContent);
    const conferenceInfo = this.extractConferenceInfo(pageContent);
    const score = this.calculateScore(features);
    const riskLevel = this.determineRiskLevel(score);
    const explanation = this.generateExplanation(features);

    return {
      score: Math.round(score),
      riskLevel,
      features,
      conferenceInfo,
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
   * Starts at 50 (neutral), only goes up for academic domains
   */
  analyzeDomain(url) {
    const urlLower = url.toLowerCase();
    const features = {
      isPredatory: false,
      hasSuspiciousTld: false,
      hasAcademicTld: false,
      hasLegitimateOrganizer: false,
      hasGenericNaming: false,
      hasNumbersInDomain: false,
      domainLength: 0,
      subdomainCount: 0,
      score: 50  // Start neutral
    };

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const parts = hostname.split('.');

      features.domainLength = hostname.length;
      features.subdomainCount = Math.max(0, parts.length - 2);

      // Check known predatory domains - MAJOR penalty
      for (const predatory of this.knownPredatoryDomains) {
        if (hostname.includes(predatory)) {
          features.isPredatory = true;
          features.score -= 40;
          break;
        }
      }

      // Check for legitimate organizers - MAJOR bonus
      for (const legit of this.legitimateOrganizers) {
        if (hostname.includes(legit)) {
          features.hasLegitimateOrganizer = true;
          features.score += 30;
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

      // Academic TLDs - significant bonus
      for (const tld of this.academicTlds) {
        if (hostname.includes(tld)) {
          features.hasAcademicTld = true;
          features.score += 35;
          break;
        }
      }

      // Check for generic naming patterns - HIGH RISK
      const genericPatterns = [
        /worldconference/i,
        /internationalconf/i,
        /globalconference/i,
        /conference\d{4}/i,
        /\d{4}conference/i,
        /register(now)?\./, // Registration subdomain
        /registration\./
      ];

      for (const pattern of genericPatterns) {
        if (pattern.test(hostname)) {
          features.hasGenericNaming = true;
          features.score -= 20;
          break;
        }
      }

      // Numbers in domain (suspicious)
      if (/\d/.test(hostname.replace(/\.(com|org|net)/, ''))) {
        features.hasNumbersInDomain = true;
        features.score -= 15;
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
      features.score = 30; // Can't parse URL - suspicious
    }

    features.score = Math.max(0, Math.min(100, features.score));
    return features;
  }

  /**
   * Content Quality Analysis
   * Starts at 50 (neutral)
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
      professionalismScore: 50,
      hasMissingTitle: false,
      isRegistrationPage: false,
      hasRegisterUrgency: false,
      score: 50  // Start neutral
    };

    if (!pageContent || !pageContent.bodyText) {
      features.score = 40; // Suspicious when no content
      return features;
    }

    features.hasContent = true;
    const text = pageContent.bodyText || '';
    const title = pageContent.title || '';
    const fullText = title + ' ' + text;
    const textLower = fullText.toLowerCase();

    features.textLength = text.length;

    // CRITICAL: Missing conference title/name - MAJOR red flag
    if (!title || title.length < 10 || !/conference|symposium|workshop|congress/i.test(title)) {
      features.hasMissingTitle = true;
      features.score -= 25;
    }

    // CRITICAL: Registration page as landing page - MAJOR red flag
    const registrationIndicators = [
      /register\s*(now|today|here)/i,
      /registration\s*(form|page)/i,
      /payment\s*(details|information)/i,
      /credit\s*card/i,
      /total\s*(amount|fee|cost)/i
    ];

    let regIndicatorCount = 0;
    registrationIndicators.forEach(pattern => {
      if (pattern.test(textLower)) regIndicatorCount++;
    });

    if (regIndicatorCount >= 2 && features.textLength < 1000) {
      features.isRegistrationPage = true;
      features.score -= 30; // Bare registration form is HIGHLY suspicious
    }

    // Register now urgency - HIGH RISK
    if (/register\s*now|register\s*today|limited\s*slots?|hurry|act\s*now/i.test(textLower)) {
      features.hasRegisterUrgency = true;
      features.score -= 20;
    }

    if (features.textLength < 200) {
      features.score -= 15; // Very short content is suspicious
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
      rapidAcceptance: false,
      count: 0,
      score: 50  // CHANGED: Start at neutral 50, not 100
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
      { key: 'urgentDeadline', pattern: /submit.{0,15}(today|now|immediately|urgent)/i, penalty: 15 },
      { key: 'rapidAcceptance', pattern: /(fast|quick|rapid).{0,15}(review|acceptance|decision|notification)|submit.{0,10}anytime|rolling.{0,10}(submission|deadline)|accept.{0,10}within.{0,10}\d+.{0,10}(days|hours)/i, penalty: 18 }
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
   * Starts at 50 (neutral)
   * Generic emails (gmail, yahoo, etc.) are HIGH RISK, not positive
   */
  analyzeContactInfo(pageContent) {
    const text = pageContent ? pageContent.bodyText || '' : '';
    const textLower = text.toLowerCase();

    const features = {
      hasEmail: false,
      hasPhone: false,
      hasAddress: false,
      hasGenericEmail: false, // Changed from hasSuspiciousEmail
      hasWhatsApp: false,
      whatsAppNumbers: [],
      hasInstitutionalEmail: false,
      score: 50 // Neutral by default
    };

    // WhatsApp detection (MAJOR RED FLAG for academic conferences)
    const whatsappPatterns = [
      /whatsapp/i,
      /what'?s\s*app/i,
      /wa\.me\//i,
      /api\.whatsapp\.com/i,
      /contact.{0,20}whatsapp/i,
      /whatsapp.{0,20}(number|contact)/i,
      /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}.{0,30}whatsapp/i
    ];

    for (const pattern of whatsappPatterns) {
      if (pattern.test(text)) {
        features.hasWhatsApp = true;
        features.score -= 40; // HUGE penalty - very unprofessional
        break;
      }
    }

    // Extract WhatsApp numbers if found
    if (features.hasWhatsApp) {
      const whatsappNumberMatch = text.match(/\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g);
      if (whatsappNumberMatch) {
        features.whatsAppNumbers = whatsappNumberMatch.slice(0, 3); // Keep first 3
      }
    }

    // Email detection
    const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
    const emails = text.match(emailRegex) || [];

    features.hasEmail = emails.length > 0;

    if (features.hasEmail) {
      // Check for generic/free email services - HIGH RISK for conferences
      const genericEmailPatterns = [
        /@gmail\.com/i,
        /@yahoo\.com/i,
        /@hotmail\.com/i,
        /@outlook\.com/i,
        /@aol\.com/i,
        /@mail\.com/i,
        /@protonmail\.com/i
      ];

      for (const email of emails) {
        for (const pattern of genericEmailPatterns) {
          if (pattern.test(email)) {
            features.hasGenericEmail = true;
            features.score -= 25; // MAJOR penalty - unprofessional
            break;
          }
        }
        if (features.hasGenericEmail) break;
      }

      // Check for institutional email - POSITIVE signal
      const institutionalPatterns = [
        /@.+\.edu/i,
        /@.+\.ac\./i,
        /@.+university/i,
        /@.+college/i,
        /@ieee\.org/i,
        /@acm\.org/i
      ];

      for (const email of emails) {
        for (const pattern of institutionalPatterns) {
          if (pattern.test(email)) {
            features.hasInstitutionalEmail = true;
            features.score += 20; // Bonus for institutional email
            break;
          }
        }
        if (features.hasInstitutionalEmail) break;
      }
    } else {
      features.score -= 10; // No email is suspicious
    }

    // Phone and address are NEUTRAL - don't add or subtract points

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
   * Extract Conference Information (fees, deadlines, committee)
   */
  extractConferenceInfo(pageContent) {
    const text = pageContent ? pageContent.bodyText || '' : '';
    const title = pageContent ? pageContent.title || '' : '';

    const info = {
      conferenceName: '',
      registrationFees: [],
      submissionDeadlines: [],
      acceptanceNotification: [],
      committeeInfo: [],
      hasIdenticalDeadlines: false,
      hasCloseDeadlines: false,
      hasInfo: false
    };

    if (!text) return info;

    // Extract conference name from title
    const confNameMatch = title.match(/(.{5,100})(conference|symposium|workshop|congress)/i);
    if (confNameMatch) {
      info.conferenceName = confNameMatch[0].trim();
      info.hasInfo = true;
    }

    // Extract registration fees
    const feePatterns = [
      /registration.{0,30}(\$|€|£|USD|EUR|GBP)\s*\d+/gi,
      /(\$|€|£|USD|EUR|GBP)\s*\d+.{0,30}registration/gi,
      /fee.{0,20}(\$|€|£|USD|EUR|GBP)\s*\d+/gi,
      /(\$|€|£)\s*\d{2,5}/g
    ];

    feePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!info.registrationFees.includes(match) && info.registrationFees.length < 5) {
            info.registrationFees.push(match.trim());
            info.hasInfo = true;
          }
        });
      }
    });

    // Extract submission deadlines
    const deadlinePatterns = [
      /submission.{0,20}deadline.{0,5}[:–-]?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/gi,
      /deadline.{0,20}submission.{0,5}[:–-]?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/gi,
      /paper.{0,20}submission.{0,10}[:–-]?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/gi,
      /submit.{0,10}by.{0,10}[:–-]?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/gi,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi
    ];

    deadlinePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!info.submissionDeadlines.includes(match) && info.submissionDeadlines.length < 5) {
            info.submissionDeadlines.push(match.trim());
            info.hasInfo = true;
          }
        });
      }
    });

    // Extract acceptance notification dates
    const notificationPatterns = [
      /notification.{0,20}(date|by).{0,5}[:–-]?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/gi,
      /acceptance.{0,20}notification.{0,10}[:–-]?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/gi,
      /author.{0,10}notification.{0,10}[:–-]?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/gi
    ];

    notificationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!info.acceptanceNotification.includes(match) && info.acceptanceNotification.length < 3) {
            info.acceptanceNotification.push(match.trim());
            info.hasInfo = true;
          }
        });
      }
    });

    // Extract committee information
    const committeePatterns = [
      /(organizing|program|technical|scientific)\s+(committee|chair|co-chair)/gi,
      /(chair|co-chair).{0,30}(committee|program)/gi,
      /committee.{0,50}(Dr\.|Prof\.|Professor)/gi
    ];

    committeePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!info.committeeInfo.includes(match) && info.committeeInfo.length < 5) {
            info.committeeInfo.push(match.trim());
            info.hasInfo = true;
          }
        });
      }
    });

    // Check for identical or suspiciously close deadlines (HIGH RISK)
    if (info.submissionDeadlines.length >= 2) {
      const deadlines = info.submissionDeadlines.map(d => d.toLowerCase());

      // Check for identical deadlines
      const uniqueDeadlines = new Set(deadlines);
      if (uniqueDeadlines.size < deadlines.length) {
        info.hasIdenticalDeadlines = true;
      }

      // Check if submission and notification are within 1-2 days
      if (info.acceptanceNotification.length > 0) {
        const allDates = [...deadlines, ...info.acceptanceNotification.map(d => d.toLowerCase())];
        // If multiple deadlines mention same dates or very close dates, it's suspicious
        const dateNumbers = allDates.join(' ').match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g);
        if (dateNumbers && dateNumbers.length >= 2) {
          const uniqueDates = new Set(dateNumbers);
          if (uniqueDates.size === 1) {
            info.hasCloseDeadlines = true;
          }
        }
      }
    }

    return info;
  }

  /**
   * Calculate final score using weighted features
   * FIXED: Neutral baseline (50) with penalties for bad signals
   */
  calculateScore(features) {
    let score = 0;

    // Weighted combination of all feature scores (each starts at 50 neutral)
    score += features.domain.score * this.weights.domainQuality;
    score += features.content.score * this.weights.contentQuality;
    score += features.patterns.score * this.weights.suspiciousPatterns;
    score += features.contact.score * this.weights.contactInfo;

    // Penalty for multiple red flags (3+ suspicious patterns)
    if (features.patterns.count >= 3) {
      score -= 20;
    }

    // Additional penalty for identical/close deadlines (MAJOR red flag)
    if (features.conferenceInfo && (features.conferenceInfo.hasIdenticalDeadlines || features.conferenceInfo.hasCloseDeadlines)) {
      score -= 25;
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
   * FIXED: Generic emails and phone are NOT positive signals
   * Only academic domains, institutional emails, and known organizers get positive points
   */
  generateExplanation(features) {
    const flags = [];
    const positiveSignals = [];

    // Domain flags
    if (features.domain.isPredatory) {
      flags.push({ icon: '🚨', text: 'Known predatory conference domain', severity: 'high' });
    }
    if (features.domain.hasSuspiciousTld) {
      flags.push({ icon: '🚨', text: 'Unusual domain extension for academic conference (.club, .xyz, etc.)', severity: 'high' });
    }
    if (features.domain.hasGenericNaming) {
      flags.push({ icon: '🚨', text: 'Generic conference naming pattern or registration subdomain', severity: 'high' });
    }

    // Domain positives - ONLY academic/legitimate
    if (features.domain.hasAcademicTld) {
      positiveSignals.push({ icon: '✅', text: 'Academic domain (.edu, .ac)', severity: 'positive' });
    }
    if (features.domain.hasLegitimateOrganizer) {
      positiveSignals.push({ icon: '✅', text: 'Legitimate conference organizer (IEEE, ACM, Springer, etc.)', severity: 'positive' });
    }

    // Content flags - NEW CRITICAL FLAGS
    if (features.content.hasMissingTitle) {
      flags.push({ icon: '🚨', text: 'Missing conference title/name in page title', severity: 'high' });
    }
    if (features.content.isRegistrationPage) {
      flags.push({ icon: '🚨', text: 'Bare registration page as landing page (MAJOR RED FLAG)', severity: 'high' });
    }
    if (features.content.hasRegisterUrgency) {
      flags.push({ icon: '🚨', text: '"Register now" urgency language detected', severity: 'high' });
    }
    if (features.content.capsRatio > 0.3) {
      flags.push({ icon: '⚠️', text: 'Excessive capital letters (unprofessional)', severity: 'medium' });
    }
    if (features.content.repeatedPhrases > 3) {
      flags.push({ icon: '⚠️', text: 'Repetitive content detected', severity: 'medium' });
    }
    if (features.content.professionalismScore < 40) {
      flags.push({ icon: '⚠️', text: 'Low content professionalism score', severity: 'medium' });
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
    if (features.patterns.rapidAcceptance) {
      flags.push({ icon: '⚠️', text: 'Rapid acceptance language (fast review, quick decision, submit anytime)', severity: 'medium' });
    }
    if (features.patterns.broadScope) {
      flags.push({ icon: '⚠️', text: 'Unusually broad conference scope', severity: 'medium' });
    }
    if (features.patterns.urgentDeadline) {
      flags.push({ icon: '⚡', text: 'Urgent submission pressure tactics', severity: 'low' });
    }

    // Contact flags - WhatsApp and generic email are HIGH RISK
    if (features.contact.hasWhatsApp) {
      flags.push({ icon: '🚨', text: 'Uses WhatsApp for contact (MAJOR RED FLAG - highly unprofessional)', severity: 'high' });
    }
    if (features.contact.hasGenericEmail) {
      flags.push({ icon: '🚨', text: 'Uses generic free email (Gmail, Yahoo, Outlook) instead of institutional', severity: 'high' });
    }
    if (!features.contact.hasEmail && features.content.hasContent) {
      flags.push({ icon: '⚡', text: 'No contact email found', severity: 'low' });
    }

    // Contact positives - ONLY institutional email
    if (features.contact.hasInstitutionalEmail) {
      positiveSignals.push({ icon: '✅', text: 'Institutional email contact (.edu, .ac, @ieee.org, @acm.org)', severity: 'positive' });
    }

    // Conference info flags - Identical/close deadlines (CRITICAL)
    if (features.conferenceInfo && features.conferenceInfo.hasIdenticalDeadlines) {
      flags.push({ icon: '🚨', text: 'Identical submission and notification deadlines (MAJOR RED FLAG)', severity: 'high' });
    } else if (features.conferenceInfo && features.conferenceInfo.hasCloseDeadlines) {
      flags.push({ icon: '🚨', text: 'Suspiciously close deadlines (within 1-2 days)', severity: 'high' });
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
