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
      features: result.features
    };

    // Combine flags with severity icons
    result.flags.forEach(flag => {
      analysis.flags.push(`${flag.icon} ${flag.text}`);
    });

    // Add positive signals
    result.positiveSignals.forEach(signal => {
      analysis.positiveSignals.push(`${signal.icon} ${signal.text}`);
    });

    // Add informative messages based on analysis type
    if (!pageContent) {
      analysis.flags.push('ℹ️ URL-only analysis - Visit site for comprehensive scan');
      analysis.flags.push('💡 Confidence: ' + result.confidence + '%');
    } else {
      analysis.flags.push('ℹ️ Full page analysis completed');
      analysis.flags.push('💡 Analysis confidence: ' + result.confidence + '%');
    }

    // Add no flags message if clean
    if (result.flags.length === 0 && result.positiveSignals.length === 0) {
      if (!pageContent) {
        analysis.flags.push('⚠️ No page content available for detailed analysis');
        analysis.flags.push('💡 Tip: Visit the site and click "Analyze This Page"');
      } else {
        analysis.flags.push('✓ No major red flags detected');
        analysis.flags.push('ℹ️ Always verify conference through multiple sources');
      }
    }

    return analysis;
  }

  function displayResults(analysis) {
    resultsDiv.classList.remove('hidden');

    const riskClass = `risk-${analysis.riskLevel}`;
    const riskText = analysis.riskLevel.charAt(0).toUpperCase() + analysis.riskLevel.slice(1);

    // Build red flags section
    let flagsHtml = '';
    if (analysis.flags && analysis.flags.length > 0) {
      flagsHtml = '<ul style="margin-top: 10px; padding-left: 20px; list-style: none;">';
      analysis.flags.forEach(flag => {
        flagsHtml += `<li style="margin: 5px 0; font-size: 12px;">${flag}</li>`;
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
      '<div style="margin-top: 8px; font-size: 11px; color: #666;"><strong>Analysis Method:</strong> Machine Learning-Inspired Multi-Signal Detection</div>' :
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
      ${positiveHtml}
      <div style="margin-top: ${positiveHtml ? '10px' : '15px'};">
        <strong>${analysis.flags.length > 0 ? '⚠️ Red Flags & Info:' : 'ℹ️ Analysis Results:'}</strong>
        ${flagsHtml}
      </div>
      <div style="margin-top: 10px; font-size: 11px; color: #666;">
        <em>Analyzed: ${analysis.timestamp}</em>
      </div>
      <div style="margin-top: 15px; padding: 10px; background: #e7f3ff; border-radius: 6px; font-size: 11px;">
        <strong>💡 Important:</strong> This analysis uses ML-inspired algorithms but should not be your only verification method. Always check organizer credentials, consult colleagues, and verify through multiple sources.
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
