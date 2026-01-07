// Content Script for Academic Conference Check Extension
// Runs on all web pages to detect and flag suspicious conference indicators

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    enabled: true,
    highlightColor: '#fff3cd',
    warningColor: '#f8d7da'
  };

  // Suspicious keywords and patterns
  const SUSPICIOUS_KEYWORDS = [
    'guaranteed acceptance',
    'guaranteed publication',
    'easy publication',
    'fast track publication',
    'no peer review',
    'instant acceptance',
    'publish quickly',
    'quick acceptance',
    'acceptance guaranteed',
    'no rejection'
  ];

  const WARNING_KEYWORDS = [
    'predatory conference',
    'scam conference',
    'fake conference',
    'wasc conference',
    'omics group'
  ];

  // Initialize the content script
  function init() {
    console.log('Academic Conference Check: Content script loaded');

    // Check if current page might be a conference website
    if (isLikelyConferencePage()) {
      scanPageForSuspiciousContent();
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleMessage);
  }

  // Check if the page is likely a conference website
  function isLikelyConferencePage() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const bodyText = document.body.textContent.toLowerCase();

    const conferenceIndicators = [
      'conference',
      'symposium',
      'workshop',
      'congress',
      'summit',
      'call for papers',
      'cfp',
      'submission'
    ];

    return conferenceIndicators.some(indicator =>
      url.includes(indicator) ||
      title.includes(indicator) ||
      bodyText.includes(indicator)
    );
  }

  // Scan page content for suspicious indicators
  function scanPageForSuspiciousContent() {
    const bodyText = document.body.textContent.toLowerCase();
    const foundSuspiciousKeywords = [];
    const foundWarningKeywords = [];

    // Check for suspicious keywords
    SUSPICIOUS_KEYWORDS.forEach(keyword => {
      if (bodyText.includes(keyword.toLowerCase())) {
        foundSuspiciousKeywords.push(keyword);
      }
    });

    // Check for warning keywords
    WARNING_KEYWORDS.forEach(keyword => {
      if (bodyText.includes(keyword.toLowerCase())) {
        foundWarningKeywords.push(keyword);
      }
    });

    // If suspicious content found, highlight and notify
    if (foundSuspiciousKeywords.length > 0 || foundWarningKeywords.length > 0) {
      const riskLevel = foundWarningKeywords.length > 0 ? 'high' : 'medium';
      displayWarningBanner(riskLevel, foundSuspiciousKeywords, foundWarningKeywords);

      // Notify background script
      chrome.runtime.sendMessage({
        action: 'suspiciousContentDetected',
        url: window.location.href,
        keywords: [...foundSuspiciousKeywords, ...foundWarningKeywords],
        riskLevel: riskLevel
      });
    }
  }

  // Display warning banner on the page
  function displayWarningBanner(riskLevel, suspiciousKeywords, warningKeywords) {
    // Check if banner already exists
    if (document.getElementById('acc-warning-banner')) {
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'acc-warning-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: ${riskLevel === 'high' ? '#f8d7da' : '#fff3cd'};
      color: ${riskLevel === 'high' ? '#721c24' : '#856404'};
      padding: 15px 20px;
      border-bottom: 3px solid ${riskLevel === 'high' ? '#f5c6cb' : '#ffc107'};
      z-index: 999999;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: bold; margin-bottom: 8px; font-size: 16px;';
    title.textContent = riskLevel === 'high' ?
      '⚠️ High Risk: Potential Predatory Conference Detected' :
      '⚠️ Warning: Suspicious Conference Indicators Found';

    const message = document.createElement('div');
    message.style.cssText = 'margin-bottom: 10px;';
    message.textContent = 'This page contains language commonly associated with predatory conferences. Please verify legitimacy carefully.';

    const keywords = document.createElement('div');
    keywords.style.cssText = 'font-size: 12px; margin-bottom: 10px;';
    const allKeywords = [...suspiciousKeywords, ...warningKeywords];
    keywords.innerHTML = `<strong>Detected:</strong> ${allKeywords.join(', ')}`;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Dismiss';
    closeBtn.style.cssText = `
      background: white;
      border: 1px solid ${riskLevel === 'high' ? '#721c24' : '#856404'};
      color: ${riskLevel === 'high' ? '#721c24' : '#856404'};
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      margin-right: 10px;
    `;
    closeBtn.onclick = () => banner.remove();

    const learnMoreBtn = document.createElement('button');
    learnMoreBtn.textContent = 'Learn More';
    learnMoreBtn.style.cssText = `
      background: ${riskLevel === 'high' ? '#721c24' : '#856404'};
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
    `;
    learnMoreBtn.onclick = () => {
      window.open('https://beallslist.net/', '_blank');
    };

    banner.appendChild(title);
    banner.appendChild(message);
    if (allKeywords.length > 0) {
      banner.appendChild(keywords);
    }

    const btnContainer = document.createElement('div');
    btnContainer.appendChild(closeBtn);
    btnContainer.appendChild(learnMoreBtn);
    banner.appendChild(btnContainer);

    document.body.insertBefore(banner, document.body.firstChild);
  }

  // Handle messages from background script or popup
  function handleMessage(request, sender, sendResponse) {
    if (request.action === 'highlightAsChecked') {
      // Visual feedback that page was checked
      console.log('Conference checked:', request.url);
      sendResponse({ success: true });
    }

    if (request.action === 'getPageInfo') {
      const pageInfo = {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.textContent,
        isConferencePage: isLikelyConferencePage()
      };
      sendResponse({ success: true, data: pageInfo });
    }

    return true;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
