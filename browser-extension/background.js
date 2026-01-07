/**
 * ListingClipper - Background Service Worker
 * Handles cross-tab communication and storage sync
 */

// ============================================================================
// EXTENSION INSTALLATION
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[ListingClipper] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Initialize storage with empty data
    chrome.storage.local.get('evscorer_data', (result) => {
      if (!result.evscorer_data) {
        chrome.storage.local.set({
          evscorer_data: {
            cars: [],
            weights: {
              price: 35,
              odo: 16,
              range: 12,
              year: 10,
              trimLevel: 10,
              distance: 10,
              remoteStart: 10,
              length: 10,
              damage: 5,
              heatPump: 5
            }
          }
        });
        console.log('[ListingClipper] Initialized empty storage');
      }
    });
  }
});

// ============================================================================
// EXTENSION ICON CLICK - Inject Panel
// ============================================================================

chrome.action.onClicked.addListener(async (tab) => {
  console.log('[ListingClipper] Extension icon clicked for tab:', tab.id, tab.url);

  // Visual feedback - flash badge to show click received
  chrome.action.setBadgeText({ text: '...' });
  chrome.action.setBadgeBackgroundColor({ color: '#f97316' });

  // Check if we can inject into this tab
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    console.log('[ListingClipper] Cannot inject into this URL:', tab.url);
    chrome.action.setBadgeText({ text: 'ERR' });
    return;
  }

  // Simply inject panel.js - it handles toggle vs create internally
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['panel.js']
    });
    console.log('[ListingClipper] Panel script executed');
    chrome.action.setBadgeText({ text: 'OK' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 1000);
  } catch (error) {
    console.error('[ListingClipper] Failed to inject:', error);
    chrome.action.setBadgeText({ text: 'ERR' });
  }
});

// ============================================================================
// MESSAGE ROUTING
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ListingClipper] Background received:', message.type);

  switch (message.type) {
    case 'HIGHLIGHTED_TEXT':
      // Forward highlighted text to popup if it's open
      forwardToPopup(message);
      break;

    case 'GET_STORAGE':
      // Return current storage data
      chrome.storage.local.get(message.key || 'evscorer_data', (result) => {
        sendResponse({ success: true, data: result });
      });
      return true; // Keep channel open for async

    case 'SYNC_TO_APP':
      // Sync data to the main EV Finder app (if running)
      syncToMainApp(message.data);
      break;

    default:
      break;
  }
});

/**
 * Forward message to popup window
 * Note: chrome.extension.getViews is deprecated in MV3, using storage instead
 */
function forwardToPopup(message) {
  // Store highlighted text in session storage for popup to read
  chrome.storage.session.set({ lastHighlightedText: message.text }).catch(() => {});
}

/**
 * Sync data to main EV Finder app
 * This would communicate with the running React app
 */
async function syncToMainApp(data) {
  // Find tabs running EV Finder
  const tabs = await chrome.tabs.query({ url: ['http://localhost:*/*', 'https://*.vercel.app/*'] });

  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'LISTING_CLIPPER_SYNC',
        data
      });
      console.log('[ListingClipper] Synced to app tab:', tab.id);
    } catch (error) {
      // Tab doesn't have our listener, ignore
    }
  }
}

// ============================================================================
// CONTEXT MENU (Right-click menu)
// ============================================================================

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    id: 'save-to-evfinder',
    title: 'Save to EV Finder',
    contexts: ['page', 'link'],
    documentUrlPatterns: [
      '*://www.autotrader.ca/*',
      '*://www.kijiji.ca/*',
      '*://www.cargurus.ca/*',
      '*://www.cargurus.com/*',
      '*://www.cars.com/*',
      '*://*.dealer.com/*',
      '*://*/*vehicle*',
      '*://*/*car*',
      '*://*/*auto*'
    ]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-evfinder') {
    // Inject panel
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['panel.js']
      });
    } catch (error) {
      console.error('[ListingClipper] Failed to inject panel from context menu:', error);
    }
  }
});

// ============================================================================
// BADGE UPDATES
// ============================================================================

/**
 * Update badge with saved vehicle count
 */
async function updateBadge() {
  const result = await chrome.storage.local.get('evscorer_data');
  const count = result.evscorer_data?.cars?.length || 0;

  if (count > 0) {
    chrome.action.setBadgeText({ text: String(count) });
    chrome.action.setBadgeBackgroundColor({ color: '#7c3aed' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Update badge when storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.evscorer_data) {
    updateBadge();
  }
});

// Initial badge update
updateBadge();

console.log('[ListingClipper] Background service worker started');
