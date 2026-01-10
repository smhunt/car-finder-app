/**
 * ListingClipper - Injected Side Panel
 * Stays open while user interacts with the page
 */

(function() {
'use strict';

// Check if panel already exists in DOM - if so, just toggle it
const existingPanel = document.getElementById('ev-clipper-panel');
if (existingPanel) {
  existingPanel.classList.toggle('hidden');
  console.log('[EV Clipper] Toggled existing panel:', !existingPanel.classList.contains('hidden') ? 'visible' : 'hidden');
  return; // Exit - don't reinitialize
}

console.log('[EV Clipper] Initializing new panel...');

// Panel state (local to this execution)
let panelVisible = false;
let activeField = null;

// ============================================================================
// VEHICLE DATABASE
// ============================================================================

const VEHICLE_DATABASE = {
  'Chevrolet': {
    'Bolt EV': { range: 417, length: 163, heatPump: false, trims: ['1LT', '2LT', 'Premier'] },
    'Bolt EUV': { range: 397, length: 169, heatPump: false, trims: ['LT', 'Premier'] },
    'Equinox EV': { range: 513, length: 184, heatPump: true, trims: ['1LT', '2LT', '2RS', '3RS'] }
  },
  'Hyundai': {
    'Ioniq 5': { range: 488, length: 183, heatPump: true, trims: ['Essential', 'Preferred', 'Long Range', 'Ultimate'] },
    'Ioniq 6': { range: 581, length: 191, heatPump: true, trims: ['Preferred', 'Ultimate'] },
    'Kona Electric': { range: 415, length: 167, heatPump: true, trims: ['Essential', 'Preferred', 'Ultimate'] }
  },
  'Kia': {
    'EV6': { range: 499, length: 184, heatPump: true, trims: ['Standard', 'Long Range', 'GT-Line', 'GT'] },
    'EV9': { range: 489, length: 201, heatPump: true, trims: ['Light', 'Wind', 'GT-Line'] },
    'Niro EV': { range: 407, length: 172, heatPump: true, trims: ['EX', 'EX+', 'SX Touring'] }
  },
  'Tesla': {
    'Model 3': { range: 438, length: 185, heatPump: true, trims: ['Standard', 'Long Range', 'Performance'] },
    'Model Y': { range: 455, length: 187, heatPump: true, trims: ['Standard', 'Long Range', 'Performance'] },
    'Model S': { range: 652, length: 198, heatPump: true, trims: ['Standard', 'Plaid'] },
    'Model X': { range: 576, length: 199, heatPump: true, trims: ['Standard', 'Plaid'] }
  },
  'Ford': {
    'Mustang Mach-E': { range: 502, length: 186, heatPump: true, trims: ['Select', 'Premium', 'California Route 1', 'GT'] },
    'F-150 Lightning': { range: 515, length: 233, heatPump: false, trims: ['Pro', 'XLT', 'Lariat', 'Platinum'] }
  },
  'Volkswagen': {
    'ID.4': { range: 443, length: 181, heatPump: true, trims: ['Standard', 'Pro', 'Pro S', 'Pro S Plus'] },
    'ID.Buzz': { range: 411, length: 185, heatPump: true, trims: ['Pro S', 'Pro S Plus'] }
  },
  'Nissan': {
    'Leaf': { range: 340, length: 176, heatPump: false, trims: ['S', 'SV', 'SL', 'SV Plus', 'SL Plus'] },
    'Ariya': { range: 482, length: 182, heatPump: true, trims: ['Engage', 'Venture+', 'Evolve+', 'Premiere'] }
  },
  'BMW': {
    'i4': { range: 484, length: 188, heatPump: true, trims: ['eDrive35', 'eDrive40', 'xDrive40', 'M50'] },
    'iX': { range: 521, length: 195, heatPump: true, trims: ['xDrive40', 'xDrive50', 'M60'] }
  },
  'Polestar': {
    'Polestar 2': { range: 480, length: 181, heatPump: true, trims: ['Standard Range', 'Long Range Single Motor', 'Long Range Dual Motor'] }
  },
  'Rivian': {
    'R1T': { range: 505, length: 218, heatPump: true, trims: ['Adventure', 'Launch Edition'] },
    'R1S': { range: 505, length: 201, heatPump: true, trims: ['Adventure', 'Launch Edition'] }
  }
};

// ============================================================================
// PANEL HTML
// ============================================================================

const PANEL_HTML = `
<div id="ev-clipper-panel" class="ev-clipper-panel">
  <div class="ev-clipper-header">
    <div class="ev-clipper-drag">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
        <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
      </svg>
    </div>
    <div class="ev-clipper-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      </svg>
      <span>Vehicle Insights</span>
    </div>
    <button class="ev-clipper-close" id="ev-clipper-close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>

  <div class="ev-clipper-content">
    <div class="ev-clipper-left">
      <div class="ev-clipper-section">
        <div class="ev-clipper-section-header">Keywords</div>
        <div class="ev-clipper-keywords" id="ev-clipper-keywords"></div>
      </div>

      <div class="ev-clipper-section">
        <div class="ev-clipper-section-header">Highlight Mode</div>
        <div class="ev-clipper-highlight-info" id="ev-clipper-highlight-info">
          Click a field, then highlight text on the page to fill it
        </div>
      </div>
    </div>

    <div class="ev-clipper-right">
      <div class="ev-clipper-vehicle-card">
        <div class="ev-clipper-vehicle-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 17h14v-5H5v5z"/><path d="M19 12l-2-5H7l-2 5"/>
            <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <div class="ev-clipper-vehicle-info">
          <div class="ev-clipper-vehicle-name" id="ev-clipper-vehicle-name">Loading...</div>
          <div class="ev-clipper-vehicle-subtitle" id="ev-clipper-vehicle-subtitle">Detecting...</div>
        </div>
      </div>

      <div class="ev-clipper-form">
        <div class="ev-clipper-field">
          <label>Make & Model</label>
          <input type="text" id="ev-clipper-make-model" data-field="make-model" placeholder="e.g. Tesla Model Y">
        </div>

        <div class="ev-clipper-row">
          <div class="ev-clipper-field half">
            <label>Year</label>
            <input type="number" id="ev-clipper-year" data-field="year" placeholder="2023">
          </div>
          <div class="ev-clipper-field half">
            <label>Trim</label>
            <select id="ev-clipper-trim" data-field="trim">
              <option value="">Select trim...</option>
            </select>
          </div>
        </div>

        <div class="ev-clipper-row">
          <div class="ev-clipper-field half">
            <label>Price</label>
            <div class="ev-clipper-input-prefix">
              <span>$</span>
              <input type="text" id="ev-clipper-price" data-field="price" placeholder="42,000">
            </div>
          </div>
          <div class="ev-clipper-field half">
            <label>Odometer</label>
            <div class="ev-clipper-input-suffix">
              <input type="text" id="ev-clipper-odometer" data-field="odometer" placeholder="50,000">
              <span>km</span>
            </div>
          </div>
        </div>

        <div class="ev-clipper-field">
          <label>Dealer</label>
          <input type="text" id="ev-clipper-dealer" data-field="dealer" placeholder="Dealer name">
        </div>

        <div class="ev-clipper-field">
          <label>Location</label>
          <input type="text" id="ev-clipper-location" data-field="location" placeholder="City, Province">
        </div>

        <div class="ev-clipper-field">
          <label>Notes</label>
          <textarea id="ev-clipper-notes" data-field="notes" placeholder="Additional notes..." rows="2"></textarea>
        </div>
      </div>

      <div class="ev-clipper-footer">
        <div class="ev-clipper-save-to">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Saves to: <strong>EV Finder App (localStorage)</strong></span>
        </div>
        <button class="ev-clipper-save-btn" id="ev-clipper-save">
          Save Vehicle
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <div class="ev-clipper-toast hidden" id="ev-clipper-toast"></div>
</div>
`;

// ============================================================================
// PANEL CSS
// ============================================================================

const PANEL_CSS = `
#ev-clipper-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 520px;
  max-height: calc(100vh - 40px);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #111827;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

#ev-clipper-panel.hidden {
  display: none;
}

.ev-clipper-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  cursor: move;
}

.ev-clipper-drag {
  color: #9ca3af;
}

.ev-clipper-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  flex: 1;
}

.ev-clipper-title svg {
  color: #7c3aed;
}

.ev-clipper-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ev-clipper-close:hover {
  background: #e5e7eb;
  color: #111827;
}

.ev-clipper-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.ev-clipper-left {
  width: 160px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  padding: 12px;
  overflow-y: auto;
}

.ev-clipper-section {
  margin-bottom: 16px;
}

.ev-clipper-section-header {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.ev-clipper-keywords {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ev-clipper-keyword {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 11px;
}

.ev-clipper-keyword-count {
  color: #7c3aed;
  font-weight: 600;
}

.ev-clipper-highlight-info {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
  padding: 8px;
  background: #fef3c7;
  border-radius: 6px;
  border: 1px solid #fcd34d;
}

.ev-clipper-highlight-info.active {
  background: #ede9fe;
  border-color: #7c3aed;
  color: #7c3aed;
}

.ev-clipper-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.ev-clipper-vehicle-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.ev-clipper-vehicle-icon {
  width: 40px;
  height: 40px;
  background: #ede9fe;
  color: #7c3aed;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ev-clipper-vehicle-info {
  flex: 1;
  min-width: 0;
}

.ev-clipper-vehicle-name {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ev-clipper-vehicle-subtitle {
  font-size: 11px;
  color: #6b7280;
}

.ev-clipper-form {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ev-clipper-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ev-clipper-field label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
}

.ev-clipper-field input,
.ev-clipper-field select,
.ev-clipper-field textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.ev-clipper-field input:focus,
.ev-clipper-field select:focus,
.ev-clipper-field textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.ev-clipper-field input.highlight-active {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
  background: #fffbeb;
}

.ev-clipper-row {
  display: flex;
  gap: 10px;
}

.ev-clipper-field.half {
  flex: 1;
}

.ev-clipper-input-prefix,
.ev-clipper-input-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.ev-clipper-input-prefix span {
  position: absolute;
  left: 10px;
  color: #6b7280;
  font-weight: 500;
}

.ev-clipper-input-prefix input {
  padding-left: 24px;
}

.ev-clipper-input-suffix span {
  position: absolute;
  right: 10px;
  color: #6b7280;
  font-size: 12px;
}

.ev-clipper-input-suffix input {
  padding-right: 32px;
}

.ev-clipper-footer {
  padding: 12px 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ev-clipper-save-to {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
}

.ev-clipper-save-to strong {
  color: #059669;
}

.ev-clipper-save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.ev-clipper-save-btn:hover {
  background: #6d28d9;
}

.ev-clipper-toast {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 16px;
  background: #111827;
  color: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.ev-clipper-toast.hidden {
  display: none;
}

.ev-clipper-toast.success {
  background: #059669;
}

.ev-clipper-toast.error {
  background: #dc2626;
}
`;

// ============================================================================
// INJECT PANEL
// ============================================================================

function injectPanel() {
  if (document.getElementById('ev-clipper-panel')) {
    togglePanel();
    return;
  }

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);

  // Inject HTML
  const container = document.createElement('div');
  container.innerHTML = PANEL_HTML;
  document.body.appendChild(container.firstElementChild);

  // Initialize
  initPanel();
  extractPageData();
}

function togglePanel() {
  const panel = document.getElementById('ev-clipper-panel');
  if (panel) {
    panel.classList.toggle('hidden');
    panelVisible = !panel.classList.contains('hidden');
  }
}

// ============================================================================
// PANEL LOGIC
// ============================================================================

function initPanel() {
  const panel = document.getElementById('ev-clipper-panel');

  // Close button
  document.getElementById('ev-clipper-close').addEventListener('click', () => {
    clearActiveField();
    panel.classList.add('hidden');
    panelVisible = false;
  });

  // Make draggable
  makeDraggable(panel);

  // Field focus for highlight mode - NO blur handler (sticky activeField)
  panel.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('focus', () => {
      setActiveField(field);
    });
    // No blur handler - activeField stays set until explicitly cleared
    // This prevents race conditions with text selection on the page
  });

  // Make/Model change - update trims
  document.getElementById('ev-clipper-make-model').addEventListener('input', (e) => {
    updateTrimOptions(e.target.value);
    updateVehicleCard();
  });

  document.getElementById('ev-clipper-year').addEventListener('input', updateVehicleCard);

  // Save button
  document.getElementById('ev-clipper-save').addEventListener('click', saveVehicle);

  panelVisible = true;
}

function makeDraggable(panel) {
  const header = panel.querySelector('.ev-clipper-header');
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('.ev-clipper-close')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    panel.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    panel.style.left = startLeft + dx + 'px';
    panel.style.top = startTop + dy + 'px';
    panel.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    panel.style.transition = '';
  });
}

function setActiveField(field) {
  // Clear previous
  document.querySelectorAll('.highlight-active').forEach(f => f.classList.remove('highlight-active'));

  activeField = field;
  field.classList.add('highlight-active');

  const info = document.getElementById('ev-clipper-highlight-info');
  const fieldName = field.previousElementSibling?.textContent || field.dataset.field || 'field';
  info.textContent = `Highlight text to fill: ${fieldName}`;
  info.classList.add('active');

  console.log('[EV Clipper] Highlight mode: activated for field', field.dataset.field);
}

function clearActiveField() {
  console.log('[EV Clipper] Highlight mode: deactivated');
  activeField = null;
  document.querySelectorAll('.highlight-active').forEach(f => f.classList.remove('highlight-active'));

  const info = document.getElementById('ev-clipper-highlight-info');
  info.textContent = 'Click a field, then highlight text on the page to fill it';
  info.classList.remove('active');
}

// ============================================================================
// TEXT SELECTION HANDLER
// ============================================================================

let lastMouseupTime = 0;
document.addEventListener('mouseup', (e) => {
  // Debounce - prevent rapid-fire processing
  const now = Date.now();
  if (now - lastMouseupTime < 100) return;
  lastMouseupTime = now;
  // Don't capture selections inside the panel
  if (e.target.closest('#ev-clipper-panel')) return;

  // Check actual DOM state instead of variable (variable gets stale after toggle)
  const panel = document.getElementById('ev-clipper-panel');
  if (!panel || panel.classList.contains('hidden')) return;

  const selection = window.getSelection();
  const text = selection?.toString().trim();

  // If no active field but user selected text, show a preview toast
  if (!activeField) {
    if (text && text.length > 0 && text.length < 1000) {
      showToast(`Selected: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}" - Click a field to fill it`);
    }
    return;
  }

  if (text && text.length > 0 && text.length < 1000) {
    // User selected text - fill the active field
    console.log('[EV Clipper] Highlight mode: captured text for field', activeField.dataset.field, ':', text);
    activeField.value = text;
    activeField.dispatchEvent(new Event('input'));
    showToast(`Filled: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);

    // Move to next field
    const fields = Array.from(document.querySelectorAll('#ev-clipper-panel input, #ev-clipper-panel textarea'));
    const currentIndex = fields.indexOf(activeField);
    if (currentIndex < fields.length - 1) {
      fields[currentIndex + 1].focus();
    }
  } else {
    // User clicked without selecting text - clear highlight mode
    clearActiveField();
  }
});

// ============================================================================
// SITE-SPECIFIC EXTRACTORS
// ============================================================================

/**
 * AutoTrader.ca extraction
 * Title format: "YEAR MAKE MODEL | $PRICE | ODOMETER km | TYPE for sale by DEALER | LOCATION"
 */
function extractAutoTrader(data, pageTitle, pageText) {
  // Parse the structured title: "2021 Polestar 2 | $29,995 | 59,156 km | Electric Hatchback for sale by HGrégoire | St-Eustache, QC"
  const parts = pageTitle.split('|').map(p => p.trim());

  if (parts.length >= 4) {
    // First part: Year Make Model
    const firstPart = parts[0];
    const yearMatch = firstPart.match(/^(\d{4})\s+(.+)$/);
    if (yearMatch) {
      data.year = yearMatch[1];
      data.makeModel = yearMatch[2];
    }

    // Second part: Price
    const priceMatch = parts[1].match(/\$\s*([\d,]+)/);
    if (priceMatch) {
      data.price = priceMatch[1].replace(/,/g, '');
    }

    // Third part: Odometer
    const odometerMatch = parts[2].match(/([\d,]+)\s*km/i);
    if (odometerMatch) {
      data.odometer = odometerMatch[1].replace(/,/g, '');
    }

    // Fourth part: "TYPE for sale by DEALER"
    if (parts[3]) {
      const dealerMatch = parts[3].match(/for sale by\s+(.+)$/i);
      if (dealerMatch) {
        data.dealer = dealerMatch[1].trim();
      }
    }

    // Fifth part: Location
    if (parts[4]) {
      data.location = parts[4].trim();
    }
  }

  // Fallback: try to get location from page if not in title
  if (!data.location) {
    const locationEl = document.querySelector('[class*="location"], [class*="address"]');
    if (locationEl) {
      data.location = locationEl.textContent.trim().substring(0, 100);
    }
  }
}

/**
 * Kijiji.ca extraction
 */
function extractKijiji(data, pageTitle, pageText) {
  // Kijiji title format varies, try to extract from page elements
  const h1 = document.querySelector('h1');
  if (h1) {
    const title = h1.textContent;
    const yearMatch = title.match(/\b(20[12]\d)\b/);
    if (yearMatch) data.year = yearMatch[1];
  }

  // Price
  const priceEl = document.querySelector('[class*="price"], [itemprop="price"]');
  if (priceEl) {
    const priceMatch = priceEl.textContent.match(/\$\s*([\d,]+)/);
    if (priceMatch) data.price = priceMatch[1].replace(/,/g, '');
  }

  // Odometer - look for km in attributes section
  const kmMatch = pageText.match(/(\d{1,3}(?:,\d{3})*)\s*km/i);
  if (kmMatch) data.odometer = kmMatch[1].replace(/,/g, '');

  // Location
  const locationEl = document.querySelector('[class*="location"]');
  if (locationEl) data.location = locationEl.textContent.trim();
}

/**
 * CarGurus extraction
 */
function extractCarGurus(data, pageTitle, pageText) {
  // CarGurus title: "Used YEAR MAKE MODEL for Sale"
  const yearMatch = pageTitle.match(/\b(20[12]\d)\b/);
  if (yearMatch) data.year = yearMatch[1];

  // Price
  const priceEl = document.querySelector('[class*="price"], [data-testid*="price"]');
  if (priceEl) {
    const priceMatch = priceEl.textContent.match(/\$\s*([\d,]+)/);
    if (priceMatch) data.price = priceMatch[1].replace(/,/g, '');
  }

  // Odometer
  const kmMatch = pageText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:km|mi)/i);
  if (kmMatch) data.odometer = kmMatch[1].replace(/,/g, '');

  // Dealer
  const dealerEl = document.querySelector('[class*="dealer"]');
  if (dealerEl) data.dealer = dealerEl.textContent.trim();
}

/**
 * Generic extraction for unsupported sites
 */
function extractGeneric(data, pageTitle, pageText) {
  const title = document.querySelector('h1')?.textContent || pageTitle;

  // Year
  const yearMatch = title.match(/\b(20[12]\d)\b/) || pageText.match(/\b(20[12]\d)\b/);
  if (yearMatch) data.year = yearMatch[1];

  // Price
  const priceMatch = pageText.match(/\$\s*([\d,]+)/);
  if (priceMatch) data.price = priceMatch[1].replace(/,/g, '');

  // Odometer
  const kmMatch = pageText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:km|kms|kilometers|mi|miles)/i);
  if (kmMatch) data.odometer = kmMatch[1].replace(/,/g, '');

  // Dealer
  const dealerEl = document.querySelector('[class*="dealer"], [data-testid*="dealer"]');
  if (dealerEl) data.dealer = dealerEl.textContent.trim().substring(0, 100);

  // Location
  const locationEl = document.querySelector('[class*="location"], [class*="address"]');
  if (locationEl) data.location = locationEl.textContent.trim().substring(0, 100);
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

function extractPageData() {
  const data = {};
  const url = window.location.href;
  const pageText = document.body.innerText;
  const pageTitle = document.title;

  // Site-specific extraction
  if (url.includes('autotrader.ca') || url.includes('autohebdo.net')) {
    extractAutoTrader(data, pageTitle, pageText);
  } else if (url.includes('kijiji.ca')) {
    extractKijiji(data, pageTitle, pageText);
  } else if (url.includes('cargurus')) {
    extractCarGurus(data, pageTitle, pageText);
  } else {
    extractGeneric(data, pageTitle, pageText);
  }

  // Make/Model detection from vehicle database
  if (!data.makeModel) {
    const title = document.querySelector('h1')?.textContent || pageTitle;
    for (const [make, models] of Object.entries(VEHICLE_DATABASE)) {
      for (const model of Object.keys(models)) {
        if (title.toLowerCase().includes(make.toLowerCase()) &&
            title.toLowerCase().includes(model.toLowerCase())) {
          data.makeModel = `${make} ${model}`;
          break;
        }
      }
      if (data.makeModel) break;
    }
  }

  // Keywords
  const keywords = [];
  const keywordTerms = ['EV', 'Electric', 'AWD', 'FWD', 'RWD', 'Automatic', 'Heat Pump', 'Sunroof', 'Leather', 'Navigation'];
  keywordTerms.forEach(term => {
    if (pageText.toLowerCase().includes(term.toLowerCase())) {
      keywords.push(term);
    }
  });

  // Populate form
  if (data.makeModel) document.getElementById('ev-clipper-make-model').value = data.makeModel;
  if (data.year) document.getElementById('ev-clipper-year').value = data.year;
  if (data.price) document.getElementById('ev-clipper-price').value = formatNumber(data.price);
  if (data.odometer) document.getElementById('ev-clipper-odometer').value = formatNumber(data.odometer);
  if (data.dealer) document.getElementById('ev-clipper-dealer').value = data.dealer;
  if (data.location) document.getElementById('ev-clipper-location').value = data.location;

  // Update trim options
  if (data.makeModel) {
    updateTrimOptions(data.makeModel);
  }

  // Populate keywords
  const keywordsEl = document.getElementById('ev-clipper-keywords');
  keywordsEl.innerHTML = keywords.map(kw =>
    `<div class="ev-clipper-keyword"><span class="ev-clipper-keyword-count">1</span>${kw}</div>`
  ).join('');

  // Update vehicle card
  updateVehicleCard();
}

function updateTrimOptions(makeModel) {
  const select = document.getElementById('ev-clipper-trim');
  const parts = makeModel.split(' ');
  const make = parts[0];
  const model = parts.slice(1).join(' ');

  const trims = VEHICLE_DATABASE[make]?.[model]?.trims || [];

  select.innerHTML = '<option value="">Select trim...</option>' +
    trims.map(t => `<option value="${t}">${t}</option>`).join('');
}

function updateVehicleCard() {
  const makeModel = document.getElementById('ev-clipper-make-model').value;
  const year = document.getElementById('ev-clipper-year').value;
  const dealer = document.getElementById('ev-clipper-dealer').value;
  const location = document.getElementById('ev-clipper-location').value;

  document.getElementById('ev-clipper-vehicle-name').textContent =
    (year && makeModel) ? `${year} ${makeModel}` : (makeModel || 'New Vehicle');

  document.getElementById('ev-clipper-vehicle-subtitle').textContent =
    [dealer, location].filter(Boolean).join(' • ') || 'Add vehicle details...';
}

// ============================================================================
// SAVE FUNCTIONALITY
// ============================================================================

function saveVehicle() {
  const makeModel = document.getElementById('ev-clipper-make-model').value.trim();
  if (!makeModel) {
    showToast('Please enter make and model', 'error');
    return;
  }

  const parts = makeModel.split(' ');
  const make = parts[0];
  const model = parts.slice(1).join(' ');
  const specs = VEHICLE_DATABASE[make]?.[model] || {};

  const vehicle = {
    id: Date.now(),
    make,
    model,
    year: parseInt(document.getElementById('ev-clipper-year').value, 10) || new Date().getFullYear(),
    trim: document.getElementById('ev-clipper-trim').value || '',
    trimLevel: 2,
    price: parseNumber(document.getElementById('ev-clipper-price').value),
    odo: parseNumber(document.getElementById('ev-clipper-odometer').value),
    range: specs.range || 400,
    length: specs.length || 180,
    heatPump: specs.heatPump || false,
    remoteStart: 'App',
    dealer: document.getElementById('ev-clipper-dealer').value.trim(),
    location: document.getElementById('ev-clipper-location').value.trim(),
    distance: 5,
    color: '',
    damage: 0,
    url: window.location.href,
    notes: document.getElementById('ev-clipper-notes').value.trim(),
    starred: false,
    priceHistory: [{
      price: parseNumber(document.getElementById('ev-clipper-price').value),
      date: new Date().toISOString().split('T')[0]
    }],
    photos: []
  };

  // Save to localStorage (syncs with EV Finder app)
  try {
    const storageKey = 'evscorer_data';
    const existing = JSON.parse(localStorage.getItem(storageKey) || '{"cars":[],"weights":{}}');
    existing.cars.push(vehicle);
    localStorage.setItem(storageKey, JSON.stringify(existing));

    showToast('Saved to EV Finder!', 'success');
    clearActiveField();

    // Close panel after delay
    setTimeout(() => {
      document.getElementById('ev-clipper-panel').classList.add('hidden');
      panelVisible = false;
    }, 1500);
  } catch (error) {
    console.error('Save error:', error);
    showToast('Error saving vehicle', 'error');
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatNumber(value) {
  if (!value) return '';
  const num = String(value).replace(/[^\d]/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parseNumber(value) {
  return parseInt(String(value).replace(/[^\d]/g, ''), 10) || 0;
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('ev-clipper-toast');
  toast.textContent = message;
  toast.className = `ev-clipper-toast ${type}`;

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Create and show the panel
injectPanel();
console.log('[EV Clipper] Panel created and ready!');

})(); // End IIFE
