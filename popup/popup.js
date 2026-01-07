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
    // Use the ML-inspired analyzer
    const analyzer = new MLConferenceAnalyzer();
    const result = analyzer.analyze(url, pageContent);

    // Convert to format expected by display function
    const analysis = {
      url: url,
      riskLevel: result.riskLevel,
      score: result.score,
      confidence: result.confidence,
      timestamp: new Date().toLocaleString(),
      flags: [],
      positiveSignals: [],
      features: result.features,
      conferenceInfo: result.conferenceInfo
    };

    // Combine flags with severity icons
    result.flags.forEach(flag => {
      analysis.flags.push({ text: `${flag.icon} ${flag.text}`, severity: flag.severity });
    });

    // Add positive signals
    result.positiveSignals.forEach(signal => {
      analysis.positiveSignals.push(`${signal.icon} ${signal.text}`);
    });

    // Add informative messages based on analysis type
    if (!pageContent) {
      analysis.flags.push({ text: 'ℹ️ URL-only analysis - Visit site for comprehensive scan', severity: 'info' });
      analysis.flags.push({ text: '💡 Confidence: ' + result.confidence + '%', severity: 'info' });
    } else {
      analysis.flags.push({ text: 'ℹ️ Full page analysis completed', severity: 'info' });
      analysis.flags.push({ text: '💡 Analysis confidence: ' + result.confidence + '%', severity: 'info' });
    }

    // Add no flags message if clean
    if (result.flags.length === 0 && result.positiveSignals.length === 0) {
      if (!pageContent) {
        analysis.flags.push({ text: '⚠️ No page content available for detailed analysis', severity: 'info' });
        analysis.flags.push({ text: '💡 Tip: Visit the site and click "Analyze This Page"', severity: 'info' });
      } else {
        analysis.flags.push({ text: '✓ No major red flags detected', severity: 'info' });
        analysis.flags.push({ text: 'ℹ️ Always verify conference through multiple sources', severity: 'info' });
      }
    }

    return analysis;
  }

  function displayResults(analysis) {
    resultsDiv.classList.remove('hidden');

    const riskClass = `risk-${analysis.riskLevel}`;
    const riskText = analysis.riskLevel.charAt(0).toUpperCase() + analysis.riskLevel.slice(1);

    // Build conference info section
    let conferenceInfoHtml = '';
    if (analysis.conferenceInfo && analysis.conferenceInfo.hasInfo) {
      const info = analysis.conferenceInfo;
      conferenceInfoHtml = `
        <div style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea;">
          <strong style="color: #333;">📋 Conference Information:</strong>
          <div style="margin-top: 8px; font-size: 11px;">
            ${info.conferenceName ? `<div style="margin: 4px 0;"><strong>Name:</strong> ${info.conferenceName}</div>` : ''}
            ${info.registrationFees.length > 0 ? `<div style="margin: 4px 0;"><strong>Fees:</strong> ${info.registrationFees.slice(0, 3).join(', ')}</div>` : ''}
            ${info.submissionDeadlines.length > 0 ? `<div style="margin: 4px 0;"><strong>Deadlines:</strong> ${info.submissionDeadlines.slice(0, 2).join(', ')}</div>` : ''}
            ${info.acceptanceNotification.length > 0 ? `<div style="margin: 4px 0;"><strong>Notification:</strong> ${info.acceptanceNotification[0]}</div>` : ''}
            ${info.committeeInfo.length > 0 ? `<div style="margin: 4px 0;"><strong>Committee:</strong> ${info.committeeInfo[0]}</div>` : ''}
          </div>
        </div>
      `;
    }

    // Build Search Conference button
    const searchQuery = analysis.conferenceInfo && analysis.conferenceInfo.conferenceName ?
      analysis.conferenceInfo.conferenceName + ' ' + new Date().getFullYear() + ' conference' :
      'conference reviews ' + new Date().getFullYear();

    const searchButtonHtml = `
      <div style="margin-top: 15px;">
        <button id="searchConferenceBtn" style="
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
          🔍 Search for "${searchQuery}"
        </button>
      </div>
    `;

    // Build red flags section with color coding
    let flagsHtml = '';
    if (analysis.flags && analysis.flags.length > 0) {
      flagsHtml = '<ul style="margin-top: 10px; padding-left: 20px; list-style: none;">';
      analysis.flags.forEach(flag => {
        const flagText = typeof flag === 'string' ? flag : flag.text;
        const severity = typeof flag === 'object' ? flag.severity : 'info';

        let bgColor = '#f8f9fa';
        let textColor = '#333';
        let borderColor = '#ddd';

        if (severity === 'high') {
          bgColor = '#f8d7da';
          textColor = '#721c24';
          borderColor = '#f5c6cb';
        } else if (severity === 'medium') {
          bgColor = '#fff3cd';
          textColor = '#856404';
          borderColor = '#ffc107';
        }

        flagsHtml += `<li style="
          margin: 5px 0;
          padding: 6px 8px;
          font-size: 12px;
          background: ${bgColor};
          color: ${textColor};
          border-left: 3px solid ${borderColor};
          border-radius: 4px;
        ">${flagText}</li>`;
      });
      flagsHtml += '</ul>';
    }

    // Build positive signals section
    let positiveHtml = '';
    if (analysis.positiveSignals && analysis.positiveSignals.length > 0) {
      positiveHtml = `
        <div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 6px; border-left: 4px solid #28a745;">
          <strong style="color: #155724;">✓ Positive Indicators:</strong>
          <ul style="margin-top: 5px; padding-left: 20px; list-style: none;">
            ${analysis.positiveSignals.map(signal =>
              `<li style="margin: 3px 0; font-size: 11px; color: #155724;">${signal}</li>`
            ).join('')}
          </ul>
        </div>
      `;
    }

    // Build confidence indicator
    const confidenceColor = analysis.confidence >= 80 ? '#28a745' :
                           analysis.confidence >= 60 ? '#ffc107' : '#dc3545';
    const confidenceBar = `
      <div style="margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <strong>Analysis Confidence:</strong>
          <span style="font-size: 12px; color: ${confidenceColor}; font-weight: bold;">${analysis.confidence}%</span>
        </div>
        <div style="width: 100%; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
          <div style="width: ${analysis.confidence}%; height: 100%; background: ${confidenceColor}; transition: width 0.3s;"></div>
        </div>
      </div>
    `;

    // Show analysis method
    const analysisMethod = analysis.features ?
      '<div style="margin-top: 8px; font-size: 11px; color: #666;"><strong>Analysis Method:</strong> ML-Inspired Multi-Signal Detection</div>' :
      '<div style="margin-top: 8px; font-size: 11px; color: #666;"><strong>Analysis Method:</strong> Basic Pattern Matching</div>';

    resultContentDiv.innerHTML = `
      <div>
        <strong>URL:</strong> <span style="font-size: 11px; word-break: break-all;">${analysis.url}</span>
      </div>
      <div style="margin-top: 10px;">
        <strong>Risk Level:</strong> <span class="risk-badge ${riskClass}">${riskText} Risk</span>
      </div>
      <div style="margin-top: 10px;">
        <strong>Trust Score:</strong> <span style="font-size: 18px; font-weight: bold; color: ${analysis.score >= 70 ? '#28a745' : analysis.score >= 40 ? '#ffc107' : '#dc3545'}">${analysis.score}/100</span>
      </div>
      ${analysis.confidence ? confidenceBar : ''}
      ${analysisMethod}
      ${conferenceInfoHtml}
      ${searchButtonHtml}
      ${positiveHtml}
      <div style="margin-top: ${positiveHtml ? '10px' : '15px'};">
        <strong>${analysis.flags.length > 0 ? '⚠️ Findings:' : 'ℹ️ Analysis Results:'}</strong>
        ${flagsHtml}
      </div>
      <div style="margin-top: 10px; font-size: 11px; color: #666;">
        <em>Analyzed: ${analysis.timestamp}</em>
      </div>
      <div style="margin-top: 15px; padding: 10px; background: #e7f3ff; border-radius: 6px; font-size: 11px;">
        <strong>💡 Important:</strong> This uses ML-inspired algorithms. Always verify through multiple sources, check organizer credentials, and consult colleagues.
      </div>
    `;

    // Add event listener for search button
    const searchBtn = document.getElementById('searchConferenceBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        chrome.tabs.create({ url: googleSearchUrl });
      });
    }
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
