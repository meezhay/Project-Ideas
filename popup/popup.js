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

    // NEW: Risk spectrum visualization - granular categories
    let riskCategory, riskDescription, spectrumColor, spectrumPosition;

    if (analysis.score >= 80) {
      riskCategory = 'Highly Trustworthy';
      riskDescription = 'Strong legitimacy indicators detected';
      spectrumColor = '#28a745';
      spectrumPosition = 90;
    } else if (analysis.score >= 70) {
      riskCategory = 'Likely Legitimate';
      riskDescription = 'Positive signals outweigh concerns';
      spectrumColor = '#5cb85c';
      spectrumPosition = 75;
    } else if (analysis.score >= 55) {
      riskCategory = 'Moderate - Verify Carefully';
      riskDescription = 'Mixed signals - additional verification recommended';
      spectrumColor = '#ffc107';
      spectrumPosition = 60;
    } else if (analysis.score >= 40) {
      riskCategory = 'Concerning - Exercise Caution';
      riskDescription = 'Multiple warning signs detected';
      spectrumColor = '#ff9800';
      spectrumPosition = 40;
    } else if (analysis.score >= 25) {
      riskCategory = 'High Risk - Likely Predatory';
      riskDescription = 'Strong predatory conference indicators';
      spectrumColor = '#f44336';
      spectrumPosition = 20;
    } else {
      riskCategory = 'Critical Risk - Avoid';
      riskDescription = 'Severe red flags - likely scam';
      spectrumColor = '#d32f2f';
      spectrumPosition = 10;
    }

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

      <!-- NEW: Risk Spectrum Visualization -->
      <div style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="font-size: 16px; font-weight: bold; color: ${spectrumColor}; margin-bottom: 5px;">
            ${riskCategory}
          </div>
          <div style="font-size: 11px; color: #555; font-style: italic;">
            ${riskDescription}
          </div>
        </div>

        <!-- Risk Spectrum Bar -->
        <div style="margin: 15px 0; position: relative;">
          <div style="height: 20px; background: linear-gradient(to right, #d32f2f 0%, #f44336 20%, #ff9800 40%, #ffc107 55%, #5cb85c 70%, #28a745 100%); border-radius: 10px; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
            <div style="position: absolute; left: ${spectrumPosition}%; top: -8px; transform: translateX(-50%);">
              <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 12px solid ${spectrumColor}; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));"></div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 9px; color: #666;">
            <span>0<br>Critical</span>
            <span>25<br>High Risk</span>
            <span>40<br>Caution</span>
            <span>55<br>Moderate</span>
            <span>70<br>Likely OK</span>
            <span>100<br>Trusted</span>
          </div>
        </div>

        <!-- Trust Score Display -->
        <div style="text-align: center; margin-top: 12px;">
          <strong>Trust Score:</strong>
          <span style="font-size: 24px; font-weight: bold; color: ${spectrumColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
            ${analysis.score}/100
          </span>
        </div>
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
