/**
 * ListingClipper - Content Script
 * Intelligent data extraction from vehicle listing pages
 *
 * Supports:
 * - AutoTrader.ca
 * - Kijiji.ca
 * - CarGurus.ca/com
 * - Cars.com
 * - Generic dealer sites
 */

// ============================================================================
// SITE-SPECIFIC EXTRACTORS
// ============================================================================

const SiteExtractors = {
  /**
   * AutoTrader.ca Extractor
   */
  autotrader: {
    match: (url) => url.includes('autotrader.ca'),

    extract: () => {
      const data = {};

      // Title - usually "Year Make Model Trim"
      const title = document.querySelector('h1.hero-title, h1[data-testid="listing-title"], .listing-title h1');
      if (title) {
        const parsed = parseVehicleTitle(title.textContent);
        Object.assign(data, parsed);
      }

      // Price
      const price = document.querySelector('.hero-price, [data-testid="listing-price"], .price-amount');
      if (price) {
        data.price = extractPrice(price.textContent);
      }

      // Odometer
      const specs = document.querySelectorAll('.specs-item, [data-testid="spec-item"], .vehicle-spec');
      specs.forEach(spec => {
        const text = spec.textContent.toLowerCase();
        if (text.includes('km') || text.includes('kilomet')) {
          data.odometer = extractNumber(spec.textContent);
        }
      });

      // Dealer
      const dealer = document.querySelector('.dealer-name, [data-testid="dealer-name"], .dealership-name');
      if (dealer) {
        data.dealer = dealer.textContent.trim();
      }

      // Location
      const location = document.querySelector('.dealer-address, [data-testid="dealer-location"], .location');
      if (location) {
        data.location = location.textContent.trim();
      }

      // Description
      const desc = document.querySelector('.description-text, [data-testid="description"], .seller-notes');
      if (desc) {
        data.description = desc.textContent.trim().substring(0, 500);
      }

      // VIN
      const vin = document.querySelector('[data-testid="vin"], .vin-number');
      if (vin) {
        data.vin = extractVIN(vin.textContent);
      }

      return data;
    }
  },

  /**
   * Kijiji.ca Extractor
   */
  kijiji: {
    match: (url) => url.includes('kijiji.ca'),

    extract: () => {
      const data = {};

      // Title
      const title = document.querySelector('h1[class*="title"], .vip-title h1');
      if (title) {
        const parsed = parseVehicleTitle(title.textContent);
        Object.assign(data, parsed);
      }

      // Price
      const price = document.querySelector('[class*="price-amount"], .price-wrapper span');
      if (price) {
        data.price = extractPrice(price.textContent);
      }

      // Attributes table
      const attrs = document.querySelectorAll('[class*="attribute"], .attributeList li');
      attrs.forEach(attr => {
        const label = attr.querySelector('[class*="label"], dt')?.textContent.toLowerCase() || '';
        const value = attr.querySelector('[class*="value"], dd')?.textContent || '';

        if (label.includes('kilomet') || label.includes('mileage')) {
          data.odometer = extractNumber(value);
        } else if (label.includes('year')) {
          data.year = extractNumber(value);
        } else if (label.includes('make')) {
          data.make = value.trim();
        } else if (label.includes('model')) {
          data.model = value.trim();
        } else if (label.includes('trim')) {
          data.trim = value.trim();
        }
      });

      // Build makeModel if we have parts
      if (data.make && data.model) {
        data.makeModel = `${data.make} ${data.model}`;
      }

      // Location
      const location = document.querySelector('[class*="location"], .location-container');
      if (location) {
        data.location = location.textContent.trim();
      }

      // Description
      const desc = document.querySelector('[class*="description"], .descriptionContainer');
      if (desc) {
        data.description = desc.textContent.trim().substring(0, 500);
      }

      return data;
    }
  },

  /**
   * CarGurus Extractor
   */
  cargurus: {
    match: (url) => url.includes('cargurus.c'),

    extract: () => {
      const data = {};

      // Title
      const title = document.querySelector('h1[class*="listing"], .vdp-title h1, [data-cg-ft="vdp-title"]');
      if (title) {
        const parsed = parseVehicleTitle(title.textContent);
        Object.assign(data, parsed);
      }

      // Price
      const price = document.querySelector('[class*="price"], [data-cg-ft="price"]');
      if (price) {
        data.price = extractPrice(price.textContent);
      }

      // Mileage - CarGurus shows this prominently
      const mileage = document.querySelector('[class*="mileage"], [data-cg-ft="mileage"]');
      if (mileage) {
        data.odometer = extractNumber(mileage.textContent);
      }

      // Dealer info
      const dealer = document.querySelector('[class*="dealer-name"], [data-cg-ft="dealer-name"]');
      if (dealer) {
        data.dealer = dealer.textContent.trim();
      }

      // Location
      const location = document.querySelector('[class*="dealer-address"], [data-cg-ft="dealer-location"]');
      if (location) {
        data.location = location.textContent.trim();
      }

      // Specs list
      const specsList = document.querySelectorAll('[class*="specs"] li, .vehicle-specs li');
      specsList.forEach(spec => {
        const text = spec.textContent.toLowerCase();
        if (text.includes('electric') || text.includes('ev')) {
          data.fuelType = 'Electric';
        }
      });

      return data;
    }
  },

  /**
   * Cars.com Extractor
   */
  carscom: {
    match: (url) => url.includes('cars.com'),

    extract: () => {
      const data = {};

      // Title
      const title = document.querySelector('h1.listing-title, [data-qa="headline"]');
      if (title) {
        const parsed = parseVehicleTitle(title.textContent);
        Object.assign(data, parsed);
      }

      // Price
      const price = document.querySelector('.primary-price, [data-qa="price"]');
      if (price) {
        data.price = extractPrice(price.textContent);
      }

      // Basics list
      const basics = document.querySelectorAll('.fancy-description-list dt, [data-qa="basics"] li');
      basics.forEach((item, index, list) => {
        const label = item.textContent.toLowerCase();
        const value = list[index + 1]?.textContent || '';

        if (label.includes('mileage')) {
          data.odometer = extractNumber(value);
        } else if (label.includes('exterior')) {
          data.color = value.trim();
        }
      });

      // Dealer
      const dealer = document.querySelector('.dealer-name, [data-qa="dealer-name"]');
      if (dealer) {
        data.dealer = dealer.textContent.trim();
      }

      // Location
      const location = document.querySelector('.dealer-address, [data-qa="dealer-address"]');
      if (location) {
        data.location = location.textContent.trim();
      }

      return data;
    }
  },

  /**
   * Generic Extractor - Fallback for unknown sites
   */
  generic: {
    match: () => true,

    extract: () => {
      const data = {};
      const pageText = document.body.innerText;

      // Try to extract from page title and h1
      const title = document.querySelector('h1');
      if (title) {
        const parsed = parseVehicleTitle(title.textContent);
        Object.assign(data, parsed);
      }

      // Look for price patterns in page
      const priceMatch = pageText.match(/\$\s*([\d,]+)/);
      if (priceMatch) {
        data.price = extractPrice(priceMatch[0]);
      }

      // Look for mileage patterns
      const kmMatch = pageText.match(/([\d,]+)\s*(?:km|kms|kilometers)/i);
      if (kmMatch) {
        data.odometer = extractNumber(kmMatch[1]);
      }

      // Look for VIN
      data.vin = extractVIN(pageText);

      // Look for year
      const yearMatch = pageText.match(/\b(20[12]\d)\b/);
      if (yearMatch && !data.year) {
        data.year = yearMatch[1];
      }

      // Store page text for keyword extraction
      data.pageText = pageText.substring(0, 5000);

      return data;
    }
  }
};

// ============================================================================
// EXTRACTION HELPERS
// ============================================================================

/**
 * Parse vehicle title into components
 * Handles formats like "2023 Chevrolet Bolt EV 2LT" or "Chevrolet Bolt EV 2023"
 */
function parseVehicleTitle(title) {
  const result = {};
  const clean = title.trim().replace(/\s+/g, ' ');

  // Common EV makes and models
  const evMakes = ['Chevrolet', 'Chevy', 'Tesla', 'Ford', 'Hyundai', 'Kia', 'Nissan', 'BMW', 'Volkswagen', 'VW', 'Polestar', 'Rivian'];
  const evModels = {
    'Chevrolet': ['Bolt EV', 'Bolt EUV', 'Equinox EV', 'Blazer EV'],
    'Chevy': ['Bolt EV', 'Bolt EUV', 'Equinox EV', 'Blazer EV'],
    'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X'],
    'Ford': ['Mustang Mach-E', 'Mach-E', 'F-150 Lightning', 'Lightning'],
    'Hyundai': ['Ioniq 5', 'Ioniq 6', 'Kona Electric', 'Kona EV'],
    'Kia': ['EV6', 'EV9', 'Niro EV'],
    'Nissan': ['Leaf', 'Ariya'],
    'BMW': ['i4', 'iX', 'i7', 'iX3'],
    'Volkswagen': ['ID.4', 'ID.Buzz'],
    'VW': ['ID.4', 'ID.Buzz'],
    'Polestar': ['Polestar 2', '2'],
    'Rivian': ['R1T', 'R1S']
  };

  // Extract year
  const yearMatch = clean.match(/\b(20[12]\d)\b/);
  if (yearMatch) {
    result.year = yearMatch[1];
  }

  // Find make
  for (const make of evMakes) {
    if (clean.toLowerCase().includes(make.toLowerCase())) {
      result.make = make === 'Chevy' ? 'Chevrolet' : (make === 'VW' ? 'Volkswagen' : make);

      // Find model
      const models = evModels[make] || [];
      for (const model of models) {
        if (clean.toLowerCase().includes(model.toLowerCase())) {
          result.model = model;
          result.makeModel = `${result.make} ${model}`;
          break;
        }
      }
      break;
    }
  }

  // Try to extract trim (text after model, before any price/location info)
  if (result.model) {
    const afterModel = clean.split(result.model)[1];
    if (afterModel) {
      const trimMatch = afterModel.match(/^\s*([A-Za-z0-9]+(?:\s*[A-Za-z0-9]+)?)/);
      if (trimMatch && !trimMatch[1].match(/^\d{4}$/) && trimMatch[1].length < 20) {
        result.trim = trimMatch[1].trim();
      }
    }
  }

  return result;
}

/**
 * Extract price from text
 */
function extractPrice(text) {
  const match = text.match(/[\$CAD]?\s*([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return null;
}

/**
 * Extract number from text
 */
function extractNumber(text) {
  const match = text.match(/([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return null;
}

/**
 * Extract VIN from text
 */
function extractVIN(text) {
  const match = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  return match ? match[1] : null;
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Handle extraction request from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_DATA') {
    const url = window.location.href;

    // Find matching extractor
    let extractor = SiteExtractors.generic;
    for (const [name, ext] of Object.entries(SiteExtractors)) {
      if (name !== 'generic' && ext.match(url)) {
        extractor = ext;
        console.log(`[ListingClipper] Using ${name} extractor`);
        break;
      }
    }

    // Extract data
    const data = extractor.extract();
    data.url = url;

    // Add page text for keyword extraction if not already present
    if (!data.pageText) {
      data.pageText = document.body.innerText.substring(0, 5000);
    }

    console.log('[ListingClipper] Extracted data:', data);
    sendResponse({ success: true, data });
  }

  return true; // Keep message channel open for async response
});

// ============================================================================
// HIGHLIGHT MODE - For unsupported sites
// ============================================================================

let highlightModeActive = false;

/**
 * Enable highlight mode - send selected text to popup
 */
document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  const text = selection?.toString().trim();

  if (text && text.length > 0 && text.length < 500) {
    // Send to popup
    chrome.runtime.sendMessage({
      type: 'HIGHLIGHTED_TEXT',
      text: text
    });
  }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('[ListingClipper] Content script loaded on:', window.location.hostname);
