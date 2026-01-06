/**
 * ListingClipper - Intelligent Data Extraction UI
 * Core popup logic - designed for extraction into standalone library
 *
 * Current domain: Vehicles (EV Finder)
 * Extensible to: Jobs, Real Estate, Rentals, Products, etc.
 */

// ============================================================================
// DOMAIN CONFIGURATION - Swap this for different use cases
// ============================================================================

const DOMAIN_CONFIG = {
  name: 'EV Finder',
  version: '2025',
  storageKey: 'evscorer_data',

  // Field definitions for this domain
  fields: {
    'make-model': { label: 'Make & Model', type: 'text', required: true },
    'year': { label: 'Year', type: 'number', min: 2010, max: 2026 },
    'trim': { label: 'Trim', type: 'select', options: [] },
    'price': { label: 'Price', type: 'currency', prefix: '$' },
    'odometer': { label: 'Odometer', type: 'number', suffix: 'km' },
    'dealer': { label: 'Dealer', type: 'text' },
    'location': { label: 'Location', type: 'text' },
    'post-url': { label: 'Post URL', type: 'url', readonly: true },
    'description': { label: 'Description', type: 'textarea' }
  },

  // Keywords to extract and categorize
  keywordCategories: {
    'Vehicle Specs': ['EV', 'Electric', 'AWD', 'FWD', 'RWD', 'Automatic'],
    'Features': ['Heat Pump', 'Sunroof', 'Leather', 'Navigation', 'CarPlay', 'Premium Audio']
  },

  // Format the title display
  formatTitle: (data) => {
    if (data.year && data.makeModel) {
      return `${data.year} ${data.makeModel}`;
    }
    return 'New Vehicle';
  },

  // Format the subtitle
  formatSubtitle: (data) => {
    const parts = [];
    if (data.dealer) parts.push(data.dealer);
    if (data.location) parts.push(data.location);
    return parts.join(' | ') || 'Detecting vehicle info...';
  }
};

// ============================================================================
// VEHICLE DATABASE - EV specs for autocomplete
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
// CORE EXTRACTION ENGINE - Reusable across domains
// ============================================================================

class ListingExtractor {
  constructor(config) {
    this.config = config;
    this.extractedData = {};
    this.keywords = {};
  }

  // Parse extracted data from content script
  parseExtractedData(rawData) {
    this.extractedData = {
      makeModel: rawData.makeModel || '',
      year: rawData.year || '',
      trim: rawData.trim || '',
      price: rawData.price || '',
      odometer: rawData.odometer || '',
      dealer: rawData.dealer || '',
      location: rawData.location || '',
      url: rawData.url || '',
      description: rawData.description || '',
      vin: rawData.vin || '',
      // EV-specific
      range: rawData.range || null,
      heatPump: rawData.heatPump || null,
      length: rawData.length || null
    };

    // Extract keywords
    this.extractKeywords(rawData.pageText || '');

    return this.extractedData;
  }

  // Extract and categorize keywords from page text
  extractKeywords(text) {
    const allKeywords = [];

    for (const [category, terms] of Object.entries(this.config.keywordCategories)) {
      const found = terms.filter(term =>
        text.toLowerCase().includes(term.toLowerCase())
      );
      if (found.length > 0) {
        this.keywords[category] = found;
        allKeywords.push(...found);
      }
    }

    return this.keywords;
  }

  // Match against vehicle database for autocomplete
  matchVehicle(makeModel) {
    const matches = [];
    const search = makeModel.toLowerCase();

    for (const [make, models] of Object.entries(VEHICLE_DATABASE)) {
      for (const [model, specs] of Object.entries(models)) {
        const fullName = `${make} ${model}`.toLowerCase();
        if (fullName.includes(search) || search.includes(make.toLowerCase())) {
          matches.push({
            make,
            model,
            fullName: `${make} ${model}`,
            specs
          });
        }
      }
    }

    return matches;
  }

  // Get trims for a specific make/model
  getTrims(make, model) {
    return VEHICLE_DATABASE[make]?.[model]?.trims || [];
  }

  // Get specs for a specific make/model
  getSpecs(make, model) {
    return VEHICLE_DATABASE[make]?.[model] || null;
  }
}

// ============================================================================
// UI CONTROLLER
// ============================================================================

class PopupUI {
  constructor(extractor) {
    this.extractor = extractor;
    this.activeHighlightField = null;
    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.loadCurrentTab();
  }

  bindElements() {
    // Form fields
    this.els = {
      vehicleName: document.getElementById('vehicle-name'),
      vehicleSubtitle: document.getElementById('vehicle-subtitle'),
      makeModel: document.getElementById('make-model'),
      makeModelDropdown: document.getElementById('make-model-dropdown'),
      year: document.getElementById('year'),
      trim: document.getElementById('trim'),
      price: document.getElementById('price'),
      odometer: document.getElementById('odometer'),
      dealer: document.getElementById('dealer'),
      location: document.getElementById('location'),
      postUrl: document.getElementById('post-url'),
      description: document.getElementById('description'),
      saveBtn: document.getElementById('save-btn'),
      boardSelector: document.getElementById('board-selector'),
      specKeywords: document.getElementById('spec-keywords'),
      featureKeywords: document.getElementById('feature-keywords'),
      highlightMode: document.getElementById('highlight-mode'),
      activeField: document.getElementById('active-field'),
      toast: document.getElementById('toast')
    };
  }

  bindEvents() {
    // Make/Model autocomplete
    this.els.makeModel.addEventListener('input', (e) => this.onMakeModelInput(e));
    this.els.makeModel.addEventListener('focus', () => this.showDropdown());
    this.els.makeModel.addEventListener('blur', () => {
      setTimeout(() => this.hideDropdown(), 200);
    });

    // Save button
    this.els.saveBtn.addEventListener('click', () => this.saveVehicle());

    // Section toggles
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.toggleSection(e));
    });

    // Field focus for highlight mode
    Object.keys(DOMAIN_CONFIG.fields).forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el && !el.readOnly) {
        el.addEventListener('focus', () => this.setHighlightField(fieldId));
        el.addEventListener('blur', () => this.clearHighlightField());
      }
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'HIGHLIGHTED_TEXT') {
        this.handleHighlightedText(message.text);
      }
    });
  }

  async loadCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab?.url) {
        this.els.postUrl.value = tab.url;

        // Request extraction from content script
        chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_DATA' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Content script not loaded, using URL-only extraction');
            this.extractFromUrl(tab.url);
          } else if (response?.data) {
            this.populateForm(response.data);
          }
        });
      }
    } catch (error) {
      console.error('Error loading tab:', error);
    }
  }

  extractFromUrl(url) {
    // Basic extraction from URL patterns
    const data = { url };

    // Try to extract year from URL
    const yearMatch = url.match(/\b(20[12]\d)\b/);
    if (yearMatch) data.year = yearMatch[1];

    // Try to extract make/model from common URL patterns
    const makes = Object.keys(VEHICLE_DATABASE);
    for (const make of makes) {
      if (url.toLowerCase().includes(make.toLowerCase())) {
        data.make = make;
        // Look for model
        const models = Object.keys(VEHICLE_DATABASE[make]);
        for (const model of models) {
          const modelSlug = model.toLowerCase().replace(/\s+/g, '-');
          if (url.toLowerCase().includes(modelSlug) || url.toLowerCase().includes(model.toLowerCase().replace(/\s+/g, ''))) {
            data.model = model;
            data.makeModel = `${make} ${model}`;
            break;
          }
        }
        break;
      }
    }

    this.populateForm(data);
  }

  populateForm(data) {
    const parsed = this.extractor.parseExtractedData(data);

    // Populate fields
    if (parsed.makeModel) this.els.makeModel.value = parsed.makeModel;
    if (parsed.year) this.els.year.value = parsed.year;
    if (parsed.price) this.els.price.value = this.formatNumber(parsed.price);
    if (parsed.odometer) this.els.odometer.value = this.formatNumber(parsed.odometer);
    if (parsed.dealer) this.els.dealer.value = parsed.dealer;
    if (parsed.location) this.els.location.value = parsed.location;
    if (parsed.description) this.els.description.value = parsed.description;

    // Update title card
    this.updateTitleCard(parsed);

    // Populate trim dropdown if we have make/model
    if (parsed.makeModel) {
      this.updateTrimOptions(parsed.makeModel);
      if (parsed.trim) {
        this.els.trim.value = parsed.trim;
      }
    }

    // Populate keywords
    this.populateKeywords(this.extractor.keywords);
  }

  updateTitleCard(data) {
    this.els.vehicleName.textContent = DOMAIN_CONFIG.formatTitle(data);
    this.els.vehicleSubtitle.textContent = DOMAIN_CONFIG.formatSubtitle(data);
  }

  populateKeywords(keywords) {
    // Spec keywords
    if (keywords['Vehicle Specs']) {
      this.els.specKeywords.innerHTML = keywords['Vehicle Specs']
        .map(kw => `<div class="keyword-item"><span class="keyword-count">1</span><span class="keyword-label">${kw}</span></div>`)
        .join('');
    }

    // Feature keywords
    if (keywords['Features']) {
      this.els.featureKeywords.innerHTML = keywords['Features']
        .map(kw => `<div class="keyword-item"><span class="keyword-count">1</span><span class="keyword-label">${kw}</span></div>`)
        .join('');
    }
  }

  onMakeModelInput(e) {
    const value = e.target.value;
    const matches = this.extractor.matchVehicle(value);

    if (matches.length > 0 && value.length >= 2) {
      this.renderDropdown(matches);
      this.showDropdown();
    } else {
      this.hideDropdown();
    }

    // Update title card live
    this.updateTitleCard({
      year: this.els.year.value,
      makeModel: value,
      dealer: this.els.dealer.value,
      location: this.els.location.value
    });
  }

  renderDropdown(matches) {
    this.els.makeModelDropdown.innerHTML = matches.slice(0, 5).map(m => `
      <div class="dropdown-item" data-make="${m.make}" data-model="${m.model}">
        <div class="dropdown-item-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 17h14v-5H5v5z"/><path d="M19 12l-2-5H7l-2 5"/>
            <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <div class="dropdown-item-text">
          <div class="dropdown-item-title">${m.fullName}</div>
          <div class="dropdown-item-subtitle">${m.specs.range}km range • ${m.specs.heatPump ? 'Heat Pump' : 'No HP'}</div>
        </div>
      </div>
    `).join('');

    // Bind click events
    this.els.makeModelDropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const make = item.dataset.make;
        const model = item.dataset.model;
        this.selectVehicle(make, model);
      });
    });
  }

  selectVehicle(make, model) {
    this.els.makeModel.value = `${make} ${model}`;
    this.hideDropdown();
    this.updateTrimOptions(`${make} ${model}`);

    // Auto-fill specs
    const specs = this.extractor.getSpecs(make, model);
    if (specs) {
      this.extractor.extractedData.range = specs.range;
      this.extractor.extractedData.heatPump = specs.heatPump;
      this.extractor.extractedData.length = specs.length;
    }

    this.updateTitleCard({
      year: this.els.year.value,
      makeModel: `${make} ${model}`,
      dealer: this.els.dealer.value,
      location: this.els.location.value
    });
  }

  updateTrimOptions(makeModel) {
    const parts = makeModel.split(' ');
    const make = parts[0];
    const model = parts.slice(1).join(' ');
    const trims = this.extractor.getTrims(make, model);

    this.els.trim.innerHTML = '<option value="">Select trim...</option>' +
      trims.map(t => `<option value="${t}">${t}</option>`).join('');
  }

  showDropdown() {
    this.els.makeModelDropdown.classList.remove('hidden');
  }

  hideDropdown() {
    this.els.makeModelDropdown.classList.add('hidden');
  }

  toggleSection(e) {
    const btn = e.currentTarget;
    const section = btn.dataset.section;
    const content = document.getElementById(`${section}-content`);

    if (content) {
      content.classList.toggle('hidden');
      btn.classList.toggle('expanded');
    }
  }

  // Highlight mode for unsupported sites
  setHighlightField(fieldId) {
    this.activeHighlightField = fieldId;
    const fieldConfig = DOMAIN_CONFIG.fields[fieldId];
    if (fieldConfig) {
      this.els.activeField.textContent = fieldConfig.label;
      this.els.highlightMode.classList.remove('hidden');
    }
  }

  clearHighlightField() {
    this.activeHighlightField = null;
    this.els.highlightMode.classList.add('hidden');
  }

  handleHighlightedText(text) {
    if (this.activeHighlightField) {
      const el = document.getElementById(this.activeHighlightField);
      if (el) {
        el.value = text.trim();
        // Move to next field
        this.focusNextField(this.activeHighlightField);
      }
    }
  }

  focusNextField(currentId) {
    const fieldIds = Object.keys(DOMAIN_CONFIG.fields);
    const currentIndex = fieldIds.indexOf(currentId);
    if (currentIndex < fieldIds.length - 1) {
      const nextId = fieldIds[currentIndex + 1];
      const nextEl = document.getElementById(nextId);
      if (nextEl && !nextEl.readOnly) {
        nextEl.focus();
      }
    }
  }

  formatNumber(value) {
    if (!value) return '';
    const num = String(value).replace(/[^\d]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  parseNumber(value) {
    return parseInt(String(value).replace(/[^\d]/g, ''), 10) || 0;
  }

  async saveVehicle() {
    const makeModel = this.els.makeModel.value.trim();
    if (!makeModel) {
      this.showToast('Please enter make and model', 'error');
      return;
    }

    // Parse make/model
    const parts = makeModel.split(' ');
    const make = parts[0];
    const model = parts.slice(1).join(' ');

    // Get specs from database
    const specs = this.extractor.getSpecs(make, model) || {};

    // Build vehicle object matching EV Finder format
    const vehicle = {
      id: Date.now(),
      make,
      model,
      year: parseInt(this.els.year.value, 10) || new Date().getFullYear(),
      trim: this.els.trim.value || '',
      trimLevel: this.getTrimLevel(this.els.trim.value, specs.trims),
      price: this.parseNumber(this.els.price.value),
      odo: this.parseNumber(this.els.odometer.value),
      range: specs.range || 400,
      length: specs.length || 180,
      heatPump: specs.heatPump || false,
      remoteStart: 'App',
      dealer: this.els.dealer.value.trim(),
      location: this.els.location.value.trim(),
      distance: this.estimateDistance(this.els.location.value),
      color: '',
      damage: 0,
      url: this.els.postUrl.value,
      notes: this.els.description.value.trim(),
      starred: false,
      priceHistory: [{
        price: this.parseNumber(this.els.price.value),
        date: new Date().toISOString().split('T')[0]
      }],
      photos: []
    };

    // Save to storage
    try {
      const result = await chrome.storage.local.get(DOMAIN_CONFIG.storageKey);
      const data = result[DOMAIN_CONFIG.storageKey] || { cars: [], weights: {} };
      data.cars.push(vehicle);

      await chrome.storage.local.set({ [DOMAIN_CONFIG.storageKey]: data });

      this.showToast('Vehicle saved to EV Finder!', 'success');

      // Close popup after brief delay
      setTimeout(() => window.close(), 1500);
    } catch (error) {
      console.error('Save error:', error);
      this.showToast('Error saving vehicle', 'error');
    }
  }

  getTrimLevel(trim, trims) {
    if (!trim || !trims || trims.length === 0) return 2;
    const index = trims.indexOf(trim);
    if (index === -1) return 2;
    // Map to 1-3 scale
    const ratio = index / (trims.length - 1);
    return Math.round(ratio * 2) + 1;
  }

  estimateDistance(location) {
    // Simple distance estimation based on Ontario locations
    const locationDistances = {
      'london': 1, 'st thomas': 2, 'stratford': 3, 'woodstock': 3,
      'kitchener': 5, 'waterloo': 5, 'cambridge': 4, 'guelph': 5,
      'hamilton': 6, 'burlington': 7, 'oakville': 8,
      'mississauga': 9, 'brampton': 9, 'toronto': 10,
      'windsor': 7, 'sarnia': 4, 'chatham': 5
    };

    const loc = location.toLowerCase();
    for (const [city, dist] of Object.entries(locationDistances)) {
      if (loc.includes(city)) return dist;
    }
    return 5; // Default medium distance
  }

  showToast(message, type = 'info') {
    this.els.toast.querySelector('.toast-message')?.remove();
    const msgEl = document.createElement('span');
    msgEl.className = 'toast-message';
    msgEl.textContent = message;
    this.els.toast.appendChild(msgEl);

    this.els.toast.className = `toast ${type}`;

    setTimeout(() => {
      this.els.toast.classList.add('hidden');
    }, 3000);
  }
}

// ============================================================================
// INITIALIZE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const extractor = new ListingExtractor(DOMAIN_CONFIG);
  const ui = new PopupUI(extractor);
});
