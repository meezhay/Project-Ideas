document.addEventListener('DOMContentLoaded', function() {
  const checkBtn = document.getElementById('checkBtn');
  const checkCurrentPageBtn = document.getElementById('checkCurrentPage');
  const conferenceUrlInput = document.getElementById('conferenceUrl');
  const resultsDiv = document.getElementById('results');
  const resultContentDiv = document.getElementById('resultContent');
  const currentPageUrlDiv = document.getElementById('currentPageUrl');

  // Get current tab URL and display it
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      const currentUrl = tabs[0].url;
      currentPageUrlDiv.textContent = `Current page: ${currentUrl}`;
    }
  });

  // Check manually entered URL
  checkBtn.addEventListener('click', function() {
    const url = conferenceUrlInput.value.trim();
    if (!url) {
      showError('Please enter a conference URL');
      return;
    }

    if (!isValidUrl(url)) {
      showError('Please enter a valid URL (including http:// or https://)');
      return;
    }

    analyzeConference(url);
  });

  // Check current page
  checkCurrentPageBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        analyzeConference(tabs[0].url);
      }
    });
  });

  // Allow Enter key to trigger check
  conferenceUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkBtn.click();
    }
  });

  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  function analyzeConference(url) {
    showLoading();

    // Try to get content from the current tab if URL matches
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url === url) {
        // Get page info from content script
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageInfo' }, function(response) {
          let pageContent = null;
          if (chrome.runtime.lastError) {
            console.log('Could not get page content:', chrome.runtime.lastError);
          } else if (response && response.success) {
            pageContent = response.data;
          }

          const analysis = performBasicAnalysis(url, pageContent);
          displayResults(analysis);
        });
      } else {
        // Analyze URL only
        const analysis = performBasicAnalysis(url, null);
        displayResults(analysis);
      }
    });
  }

  function performBasicAnalysis(url, pageContent) {
    const analysis = {
      url: url,
      riskLevel: 'low',
      flags: [],
      score: 100,
      timestamp: new Date().toLocaleString()
    };

    const urlLower = url.toLowerCase();
    let pageText = '';
    let pageTitle = '';

    if (pageContent) {
      pageText = (pageContent.title + ' ' + pageContent.bodyText || '').toLowerCase();
      pageTitle = (pageContent.title || '').toLowerCase();
    }

    // Check for high-risk patterns (each -30 points)
    const highRiskPatterns = [
      { pattern: /guaranteed?.{0,20}acceptance/i, text: 'Promises guaranteed acceptance' },
      { pattern: /guaranteed?.{0,20}publication/i, text: 'Guarantees publication' },
      { pattern: /no.{0,10}(peer.)?review/i, text: 'Claims no peer review' },
      { pattern: /instant.{0,10}acceptance/i, text: 'Promises instant acceptance' },
      { pattern: /accept.{0,10}all.{0,10}papers?/i, text: 'Accepts all submissions' },
      { pattern: /pay.{0,10}to.{0,10}present/i, text: 'Pay-to-present model detected' }
    ];

    // Check for medium-risk patterns (each -15 points)
    const mediumRiskPatterns = [
      { pattern: /fast.{0,10}track/i, text: 'Fast-track publication offered' },
      { pattern: /quick.{0,10}publication/i, text: 'Emphasizes quick publication' },
      { pattern: /easy.{0,10}publication/i, text: 'Claims easy publication' },
      { pattern: /publish.{0,10}(quickly|fast)/i, text: 'Promotes rapid publishing' },
      { pattern: /(high|100%).{0,10}acceptance.{0,10}rate/i, text: 'Very high acceptance rate advertised' },
      { pattern: /only.{0,10}\$?\d+.{0,10}(usd|dollars|euros)/i, text: 'Emphasizes low fees suspiciously' }
    ];

    // Check for warning signs (each -10 points)
    const warningPatterns = [
      { pattern: /submit.{0,20}(today|now|immediately)/i, text: 'Urgent submission pressure' },
      { pattern: /limited.{0,10}slots?/i, text: 'Artificial scarcity tactics' },
      { pattern: /world.?class/i, text: 'Excessive self-promotion' },
      { pattern: /prestigious/i, text: 'Claims of prestige without evidence' }
    ];

    // Known predatory indicators in URL
    const suspiciousUrlPatterns = [
      { pattern: /waset\.org/i, text: 'Domain associated with predatory conferences (WASET)' },
      { pattern: /omics/i, text: 'Domain associated with predatory publishers' },
      { pattern: /\.club$/i, text: 'Unusual TLD (.club) for academic conference' },
      { pattern: /\d{4}\.com/i, text: 'Suspicious domain pattern with year' }
    ];

    // Check URL patterns
    suspiciousUrlPatterns.forEach(({ pattern, text }) => {
      if (pattern.test(urlLower)) {
        analysis.flags.push('⚠️ ' + text);
        analysis.score -= 35;
      }
    });

    // Check high-risk patterns
    highRiskPatterns.forEach(({ pattern, text }) => {
      if (pattern.test(pageText) || pattern.test(urlLower)) {
        analysis.flags.push('🚨 ' + text);
        analysis.score -= 30;
      }
    });

    // Check medium-risk patterns
    mediumRiskPatterns.forEach(({ pattern, text }) => {
      if (pattern.test(pageText) || pattern.test(urlLower)) {
        analysis.flags.push('⚠️ ' + text);
        analysis.score -= 15;
      }
    });

    // Check warning patterns
    warningPatterns.forEach(({ pattern, text }) => {
      if (pattern.test(pageText)) {
        analysis.flags.push('⚡ ' + text);
        analysis.score -= 10;
      }
    });

    // Check for very broad scope (multiple unrelated fields)
    if (pageText) {
      const broadFields = ['engineering', 'medicine', 'business', 'arts', 'science', 'technology', 'education', 'law'];
      const foundFields = broadFields.filter(field => pageText.includes(field));
      if (foundFields.length >= 4) {
        analysis.flags.push('⚠️ Unusually broad scope (covers ' + foundFields.length + ' different fields)');
        analysis.score -= 20;
      }
    }

    // Determine risk level based on score
    analysis.score = Math.max(0, Math.min(100, analysis.score));

    if (analysis.score >= 70) {
      analysis.riskLevel = 'low';
    } else if (analysis.score >= 40) {
      analysis.riskLevel = 'medium';
    } else {
      analysis.riskLevel = 'high';
    }

    // Add default message if no flags
    if (analysis.flags.length === 0) {
      if (!pageContent) {
        analysis.flags.push('✓ No immediate URL red flags detected');
        analysis.flags.push('ℹ️ Note: Could not analyze page content. Visit the site and check current page for full analysis');
      } else {
        analysis.flags.push('✓ No major red flags detected in initial scan');
        analysis.flags.push('ℹ️ Manual verification still recommended');
      }
    }

    return analysis;
  }

  function displayResults(analysis) {
    resultsDiv.classList.remove('hidden');

    const riskClass = `risk-${analysis.riskLevel}`;
    const riskText = analysis.riskLevel.charAt(0).toUpperCase() + analysis.riskLevel.slice(1);

    let flagsHtml = '<ul style="margin-top: 10px; padding-left: 20px;">';
    analysis.flags.forEach(flag => {
      flagsHtml += `<li style="margin: 5px 0; font-size: 12px;">${flag}</li>`;
    });
    flagsHtml += '</ul>';

    resultContentDiv.innerHTML = `
      <div>
        <strong>URL:</strong> <span style="font-size: 11px; word-break: break-all;">${analysis.url}</span>
      </div>
      <div style="margin-top: 10px;">
        <strong>Risk Level:</strong> <span class="risk-badge ${riskClass}">${riskText} Risk</span>
      </div>
      <div style="margin-top: 10px;">
        <strong>Trust Score:</strong> ${analysis.score}/100
      </div>
      <div style="margin-top: 10px;">
        <strong>Findings:</strong>
        ${flagsHtml}
      </div>
      <div style="margin-top: 10px; font-size: 11px; color: #666;">
        <em>Analyzed: ${analysis.timestamp}</em>
      </div>
      <div style="margin-top: 15px; padding: 10px; background: #e7f3ff; border-radius: 6px; font-size: 11px;">
        <strong>Note:</strong> This is a basic analysis. Always verify conference legitimacy through multiple sources, check organizer credentials, and consult with colleagues.
      </div>
    `;
  }

  function showLoading() {
    resultsDiv.classList.remove('hidden');
    resultContentDiv.innerHTML = '<div class="loading">Analyzing conference...</div>';
  }

  function showError(message) {
    resultsDiv.classList.remove('hidden');
    resultContentDiv.innerHTML = `<div class="error">${message}</div>`;
  }
});
