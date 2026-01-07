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

    // Simulate analysis (placeholder for future implementation)
    setTimeout(() => {
      const analysis = performBasicAnalysis(url);
      displayResults(analysis);
    }, 1000);
  }

  function performBasicAnalysis(url) {
    // Placeholder analysis - this will be enhanced later
    const suspiciousKeywords = [
      'guaranteed acceptance',
      'easy publication',
      'fast track',
      'no review',
      'instant acceptance',
      'predatory'
    ];

    const analysis = {
      url: url,
      riskLevel: 'low',
      flags: [],
      score: 85,
      timestamp: new Date().toLocaleString()
    };

    // Basic URL analysis
    const urlLower = url.toLowerCase();

    if (urlLower.includes('scam') || urlLower.includes('fake')) {
      analysis.flags.push('Suspicious keywords in URL');
      analysis.riskLevel = 'high';
      analysis.score = 25;
    }

    if (!urlLower.includes('http')) {
      analysis.flags.push('Invalid URL format');
      analysis.riskLevel = 'medium';
      analysis.score = 50;
    }

    if (analysis.flags.length === 0) {
      analysis.flags.push('No immediate red flags detected');
      analysis.flags.push('Manual review recommended');
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
