// Background Service Worker for Academic Conference Check Extension

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Academic Conference Check extension installed');

    // Set default settings
    chrome.storage.sync.set({
      enabled: true,
      autoCheck: false,
      notificationsEnabled: true
    });
  } else if (details.reason === 'update') {
    console.log('Academic Conference Check extension updated');
  }

  // Create context menu
  try {
    chrome.contextMenus.create({
      id: 'checkConference',
      title: 'Check this conference with Academic Conference Check',
      contexts: ['link', 'page']
    });
  } catch (error) {
    console.error('Error creating context menu:', error);
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeConference') {
    analyzeConferenceUrl(request.url)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }

  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['enabled', 'autoCheck', 'notificationsEnabled'], (settings) => {
      sendResponse({ success: true, data: settings });
    });
    return true;
  }

  if (request.action === 'updateSettings') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Analyze conference URL
async function analyzeConferenceUrl(url) {
  try {
    // Placeholder for actual analysis logic
    const analysis = {
      url: url,
      timestamp: new Date().toISOString(),
      riskLevel: 'low',
      score: 85,
      flags: []
    };

    // Basic pattern matching for suspicious indicators
    const suspiciousPatterns = [
      { pattern: /guaranteed.*acceptance/i, flag: 'Promises guaranteed acceptance', risk: 'high' },
      { pattern: /fast.*track/i, flag: 'Fast-track publication claims', risk: 'medium' },
      { pattern: /no.*review/i, flag: 'Claims no review process', risk: 'high' },
      { pattern: /predatory/i, flag: 'Mentioned as predatory', risk: 'high' },
      { pattern: /scam/i, flag: 'Flagged as potential scam', risk: 'high' }
    ];

    for (const { pattern, flag, risk } of suspiciousPatterns) {
      if (pattern.test(url)) {
        analysis.flags.push(flag);
        if (risk === 'high' && analysis.riskLevel !== 'high') {
          analysis.riskLevel = 'high';
          analysis.score = Math.min(analysis.score, 30);
        } else if (risk === 'medium' && analysis.riskLevel === 'low') {
          analysis.riskLevel = 'medium';
          analysis.score = Math.min(analysis.score, 60);
        }
      }
    }

    // Store analysis in local storage
    const storageKey = `analysis_${hashUrl(url)}`;
    await chrome.storage.local.set({ [storageKey]: analysis });

    return analysis;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Simple hash function for URL keys
function hashUrl(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Context menu click handler
if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'checkConference') {
      const urlToCheck = info.linkUrl || info.pageUrl;

      // Send message to content script
      chrome.tabs.sendMessage(tab.id, {
        action: 'highlightAsChecked',
        url: urlToCheck
      }).catch(error => {
        console.log('Error sending message to tab:', error);
      });
    }
  });
}

console.log('Academic Conference Check background service worker loaded');
