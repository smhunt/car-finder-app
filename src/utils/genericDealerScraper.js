/**
 * Generic Dealership Scraper
 *
 * Intelligently extracts vehicle listing data from any dealership website.
 * Uses pattern matching and heuristics to identify vehicle attributes.
 */

// Common patterns for extracting vehicle data
const PATTERNS = {
  // Price patterns - matches $XX,XXX or $XX XXX formats
  price: [
    /\$\s*([\d,]+(?:\.\d{2})?)/g,
    /CAD\s*([\d,]+)/gi,
    /price[:\s]*\$?([\d,]+)/gi,
    /([\d,]+)\s*\$/g,
  ],

  // Mileage/Odometer patterns
  mileage: [
    /([\d,]+)\s*(?:km|kms|kilometers?)/gi,
    /([\d,]+)\s*(?:mi|miles?)/gi,
    /(?:odometer|mileage|odo)[:\s]*([\d,]+)/gi,
    /(?:km|mileage)[:\s]*([\d,]+)/gi,
  ],

  // Year patterns (2015-2026)
  year: [
    /\b(20[12]\d)\b/g,
    /(?:year|model year)[:\s]*(20[12]\d)/gi,
  ],

  // VIN patterns (17 characters)
  vin: [
    /\b([A-HJ-NPR-Z0-9]{17})\b/g,
    /(?:vin|vehicle identification)[:\s#]*([A-HJ-NPR-Z0-9]{17})/gi,
  ],

  // Stock number patterns
  stock: [
    /(?:stock|stk)[:\s#]*([A-Z0-9-]+)/gi,
    /#([A-Z0-9]{4,12})\b/gi,
  ],

  // Color patterns
  exteriorColor: [
    /(?:exterior|ext\.?|color)[:\s]*([\w\s]+?)(?:\s*[,|\/]|\s*interior|$)/gi,
    /(?:colour)[:\s]*([\w\s]+)/gi,
  ],

  interiorColor: [
    /(?:interior|int\.?)[:\s]*([\w\s]+?)(?:\s*[,|\/]|$)/gi,
  ],

  // Transmission patterns
  transmission: [
    /\b(automatic|auto|manual|cvt|dct|amt)\b/gi,
    /(?:transmission|trans)[:\s]*([\w\s]+)/gi,
  ],

  // Drivetrain patterns
  drivetrain: [
    /\b(awd|4wd|fwd|rwd|4x4|all[- ]wheel|front[- ]wheel|rear[- ]wheel)\b/gi,
  ],

  // Fuel type patterns
  fuelType: [
    /\b(electric|ev|hybrid|phev|gasoline|gas|diesel|hydrogen)\b/gi,
    /(?:fuel)[:\s]*([\w\s]+)/gi,
  ],

  // Engine patterns
  engine: [
    /(\d+\.?\d*\s*[lL](?:iter|itre)?)/g,
    /([ivIV]+[- ]?\d+)/g, // V6, V8, I4, etc.
    /(turbo|supercharged|naturally aspirated)/gi,
  ],
};

// Known vehicle makes for validation
const KNOWN_MAKES = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chevy', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat',
  'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep',
  'Kia', 'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Lucid',
  'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'Mercedes', 'Benz', 'Mini',
  'Mitsubishi', 'Nissan', 'Polestar', 'Porsche', 'Ram', 'Rivian', 'Rolls-Royce',
  'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'VW', 'Volvo',
];

// Known EV models for the car-finder-app
const EV_MODELS = {
  'Chevrolet': ['Bolt EV', 'Bolt EUV', 'Equinox EV', 'Blazer EV', 'Silverado EV'],
  'Hyundai': ['Kona Electric', 'Ioniq 5', 'Ioniq 6'],
  'Kia': ['Niro EV', 'Soul EV', 'EV6', 'EV9'],
  'Nissan': ['Leaf', 'Ariya'],
  'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  'Ford': ['Mustang Mach-E', 'F-150 Lightning'],
  'Volkswagen': ['ID.4', 'ID.Buzz'],
  'BMW': ['iX', 'i4', 'i5', 'i7', 'iX1', 'iX3'],
  'Polestar': ['Polestar 2', 'Polestar 3', 'Polestar 4'],
  'Rivian': ['R1T', 'R1S'],
  'Lucid': ['Air'],
  'Mercedes-Benz': ['EQS', 'EQE', 'EQB', 'EQA'],
  'Audi': ['e-tron', 'e-tron GT', 'Q4 e-tron', 'Q8 e-tron'],
  'Porsche': ['Taycan'],
  'Volvo': ['XC40 Recharge', 'C40 Recharge', 'EX30', 'EX90'],
  'Toyota': ['bZ4X'],
  'Subaru': ['Solterra'],
  'Mazda': ['MX-30'],
  'Genesis': ['GV60', 'Electrified G80', 'Electrified GV70'],
  'Cadillac': ['Lyriq', 'Celestiq'],
  'Honda': ['Prologue'],
  'Acura': ['ZDX'],
};

/**
 * Extract the first match from text using multiple patterns
 */
function extractFirst(text, patterns) {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract all matches from text using multiple patterns
 */
function extractAll(text, patterns) {
  const results = new Set();
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        results.add(match[1].trim());
      }
    }
  }
  return Array.from(results);
}

/**
 * Parse a price string to a number
 */
function parsePrice(priceStr) {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[,$\s]/g, '');
  const num = parseInt(cleaned, 10);
  // Validate reasonable price range for vehicles
  if (num >= 1000 && num <= 500000) {
    return num;
  }
  return null;
}

/**
 * Parse a mileage string to a number
 */
function parseMileage(mileageStr) {
  if (!mileageStr) return null;
  const cleaned = mileageStr.replace(/[,\s]/g, '');
  const num = parseInt(cleaned, 10);
  // Validate reasonable mileage range
  if (num >= 0 && num <= 500000) {
    return num;
  }
  return null;
}

/**
 * Detect vehicle make from text
 */
function detectMake(text) {
  const upperText = text.toUpperCase();
  for (const make of KNOWN_MAKES) {
    if (upperText.includes(make.toUpperCase())) {
      // Normalize some makes
      if (make === 'Chevy') return 'Chevrolet';
      if (make === 'VW') return 'Volkswagen';
      if (make === 'Benz') return 'Mercedes-Benz';
      return make;
    }
  }
  return null;
}

/**
 * Detect vehicle model from text, given a make
 */
function detectModel(text, make) {
  if (!make) return null;

  // Check EV models first
  const evModels = EV_MODELS[make] || [];
  for (const model of evModels) {
    if (text.toLowerCase().includes(model.toLowerCase())) {
      return model;
    }
  }

  // Try to extract model from common patterns
  const makePattern = new RegExp(`${make}\\s+([A-Za-z0-9-]+(?:\\s+[A-Za-z0-9-]+)?)`, 'i');
  const match = text.match(makePattern);
  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

/**
 * Check if a vehicle is electric
 */
function isElectricVehicle(text, make, model) {
  // Check if it's a known EV model
  if (make && EV_MODELS[make]) {
    for (const evModel of EV_MODELS[make]) {
      if (model && model.toLowerCase().includes(evModel.toLowerCase())) {
        return true;
      }
    }
  }

  // Check for EV keywords
  const evKeywords = ['electric', 'ev', 'battery electric', 'bev', 'zero emission'];
  const lowerText = text.toLowerCase();
  return evKeywords.some(kw => lowerText.includes(kw));
}

/**
 * Extract trim level from text
 */
function extractTrim(text, make, model) {
  // Common trim patterns
  const trimPatterns = [
    // Chevrolet Bolt trims
    /\b(1LT|2LT|LT|Premier)\b/gi,
    // Kia/Hyundai trims
    /\b(EX|EX\+|SX|SX Touring|SE|SEL|Limited|Ultimate|Preferred|Essential|Wind|Wave|Premium)\b/gi,
    // Tesla trims
    /\b(Standard Range|Long Range|Performance|Plaid)\b/gi,
    // Generic trims
    /\b(Base|Sport|Touring|Elite|Platinum|GT|GT-Line|S|SV|SL|Plus)\b/gi,
  ];

  for (const pattern of trimPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Main scraper function - extracts vehicle data from page content
 *
 * @param {Object} options - Scraping options
 * @param {string} options.pageText - Full text content of the page
 * @param {string} options.pageUrl - URL of the page
 * @param {string} options.pageTitle - Title of the page
 * @param {Array} options.imageUrls - Array of image URLs found on page
 * @param {Object} options.structuredData - Any JSON-LD or schema.org data
 * @returns {Object} Extracted vehicle data
 */
export function scrapeVehicleData(options) {
  const { pageText = '', pageUrl = '', pageTitle = '', imageUrls = [], structuredData = null } = options;

  const fullText = `${pageTitle} ${pageText}`;

  // Try to extract from structured data first (JSON-LD, schema.org)
  let vehicle = {};

  if (structuredData) {
    vehicle = parseStructuredData(structuredData);
  }

  // Extract basic attributes from text
  const year = extractFirst(fullText, PATTERNS.year);
  const make = detectMake(fullText);
  const model = detectModel(fullText, make);
  const trim = extractTrim(fullText, make, model);

  // Extract pricing - get all prices and pick the most likely one
  const prices = extractAll(fullText, PATTERNS.price).map(parsePrice).filter(Boolean);
  const price = prices.length > 0 ? Math.min(...prices.filter(p => p > 5000)) || prices[0] : null;

  // Extract mileage
  const mileages = extractAll(fullText, PATTERNS.mileage).map(parseMileage).filter(Boolean);
  const mileage = mileages.length > 0 ? mileages[0] : null;

  // Extract VIN
  const vin = extractFirst(fullText, PATTERNS.vin);

  // Extract stock number
  const stockNumber = extractFirst(fullText, PATTERNS.stock);

  // Extract colors
  const exteriorColor = extractFirst(fullText, PATTERNS.exteriorColor);
  const interiorColor = extractFirst(fullText, PATTERNS.interiorColor);

  // Extract drivetrain info
  const transmission = extractFirst(fullText, PATTERNS.transmission);
  const drivetrain = extractFirst(fullText, PATTERNS.drivetrain);
  const fuelType = extractFirst(fullText, PATTERNS.fuelType);
  const engine = extractFirst(fullText, PATTERNS.engine);

  // Check if electric
  const isElectric = isElectricVehicle(fullText, make, model);

  // Build the result
  const result = {
    // Core identifiers
    year: parseInt(year) || vehicle.year || null,
    make: make || vehicle.make || null,
    model: model || vehicle.model || null,
    trim: trim || vehicle.trim || null,

    // Pricing and mileage
    price: price || vehicle.price || null,
    mileage: mileage || vehicle.mileage || null,

    // Identifiers
    vin: vin || vehicle.vin || null,
    stockNumber: stockNumber || vehicle.stockNumber || null,

    // Appearance
    exteriorColor: exteriorColor || vehicle.exteriorColor || null,
    interiorColor: interiorColor || vehicle.interiorColor || null,

    // Mechanical
    transmission: transmission || vehicle.transmission || null,
    drivetrain: drivetrain || vehicle.drivetrain || null,
    fuelType: isElectric ? 'Electric' : (fuelType || vehicle.fuelType || null),
    engine: isElectric ? 'Electric Motor' : (engine || vehicle.engine || null),

    // EV-specific
    isElectric,

    // Metadata
    sourceUrl: pageUrl,
    scrapedAt: new Date().toISOString(),

    // Images (first 10)
    images: imageUrls.slice(0, 10),

    // Raw data for debugging
    _rawTitle: pageTitle,
    _confidence: calculateConfidence({ year, make, model, price, mileage }),
  };

  return result;
}

/**
 * Parse structured data (JSON-LD, schema.org)
 */
function parseStructuredData(data) {
  if (!data) return {};

  // Handle array of structured data
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item['@type'] === 'Vehicle' || item['@type'] === 'Car' || item['@type'] === 'Product') {
        return parseStructuredData(item);
      }
    }
    return {};
  }

  const result = {};

  // Extract from Vehicle/Car schema
  if (data.name) {
    const nameParts = data.name.split(' ');
    if (nameParts.length >= 3) {
      result.year = parseInt(nameParts[0]) || null;
      result.make = nameParts[1];
      result.model = nameParts.slice(2).join(' ');
    }
  }

  if (data.vehicleModelDate) result.year = parseInt(data.vehicleModelDate);
  if (data.brand?.name) result.make = data.brand.name;
  if (data.model) result.model = data.model;
  if (data.vehicleTransmission) result.transmission = data.vehicleTransmission;
  if (data.driveWheelConfiguration) result.drivetrain = data.driveWheelConfiguration;
  if (data.fuelType) result.fuelType = data.fuelType;
  if (data.vehicleIdentificationNumber) result.vin = data.vehicleIdentificationNumber;
  if (data.mileageFromOdometer?.value) result.mileage = parseInt(data.mileageFromOdometer.value);
  if (data.color) result.exteriorColor = data.color;

  // Extract price
  if (data.offers?.price) {
    result.price = parsePrice(String(data.offers.price));
  } else if (data.price) {
    result.price = parsePrice(String(data.price));
  }

  return result;
}

/**
 * Calculate confidence score for extracted data
 */
function calculateConfidence(data) {
  let score = 0;
  const weights = {
    year: 20,
    make: 25,
    model: 25,
    price: 15,
    mileage: 15,
  };

  for (const [key, weight] of Object.entries(weights)) {
    if (data[key]) {
      score += weight;
    }
  }

  return score;
}

/**
 * Format extracted data for the car-finder-app
 */
export function formatForCarFinder(scrapedData, dealerInfo = {}) {
  const { name: dealerName, location: dealerLocation, distance = 5 } = dealerInfo;

  // Map trim to trim level (1-3 scale)
  const trimLevel = mapTrimLevel(scrapedData.trim);

  // Estimate range for EVs
  const estimatedRange = estimateEVRange(scrapedData.make, scrapedData.model, scrapedData.year);

  // Estimate length
  const estimatedLength = estimateVehicleLength(scrapedData.make, scrapedData.model);

  // Check for heat pump (model/year dependent)
  const hasHeatPump = checkHeatPump(scrapedData.make, scrapedData.model, scrapedData.year);

  return {
    id: Date.now(),
    make: scrapedData.make || 'Unknown',
    model: scrapedData.model || 'Unknown',
    year: scrapedData.year || new Date().getFullYear(),
    trim: scrapedData.trim || '',
    trimLevel,
    dealer: dealerName || extractDealerFromUrl(scrapedData.sourceUrl),
    price: scrapedData.price || 0,
    odo: scrapedData.mileage || 0,
    color: scrapedData.exteriorColor || 'Unknown',
    range: estimatedRange,
    length: estimatedLength,
    heatPump: hasHeatPump,
    remoteStart: 'App', // Default assumption for modern EVs
    location: dealerLocation || '',
    distance,
    damage: 0,
    notes: `VIN: ${scrapedData.vin || 'N/A'}\nStock: ${scrapedData.stockNumber || 'N/A'}`,
    url: scrapedData.sourceUrl,
    starred: false,
    priceHistory: scrapedData.price ? [{ price: scrapedData.price, date: new Date().toISOString().split('T')[0] }] : [],
    photos: scrapedData.images || [],
  };
}

/**
 * Map trim name to numeric level (1-3)
 */
function mapTrimLevel(trim) {
  if (!trim) return 2;

  const lowTrims = ['base', 'standard', 's', 'se', 'essential', '1lt', 'lt'];
  const highTrims = ['limited', 'ultimate', 'premium', 'platinum', 'gt', 'performance', 'plaid', 'touring', 'premier', '2lt'];

  const lowerTrim = trim.toLowerCase();

  if (lowTrims.some(t => lowerTrim.includes(t))) return 1;
  if (highTrims.some(t => lowerTrim.includes(t))) return 3;
  return 2;
}

/**
 * Estimate EV range based on make/model/year
 */
function estimateEVRange(make, model, year) {
  const ranges = {
    'Chevrolet': { 'Bolt EV': 417, 'Bolt EUV': 397, 'Equinox EV': 513 },
    'Hyundai': { 'Kona Electric': 415, 'Ioniq 5': 488, 'Ioniq 6': 581 },
    'Kia': { 'Niro EV': 407, 'Soul EV': 391, 'EV6': 499 },
    'Nissan': { 'Leaf': 342, 'Ariya': 482 },
    'Tesla': { 'Model 3': 438, 'Model Y': 455, 'Model S': 560, 'Model X': 480 },
    'Ford': { 'Mustang Mach-E': 490, 'F-150 Lightning': 483 },
    'Volkswagen': { 'ID.4': 443, 'ID.Buzz': 411 },
  };

  if (make && model && ranges[make]?.[model]) {
    return ranges[make][model];
  }

  // Default estimate for unknown EVs
  return 400;
}

/**
 * Estimate vehicle length based on make/model
 */
function estimateVehicleLength(make, model) {
  const lengths = {
    'Chevrolet': { 'Bolt EV': 163, 'Bolt EUV': 169, 'Equinox EV': 184 },
    'Hyundai': { 'Kona Electric': 164, 'Ioniq 5': 182, 'Ioniq 6': 191 },
    'Kia': { 'Niro EV': 171, 'Soul EV': 165, 'EV6': 184 },
    'Nissan': { 'Leaf': 176, 'Ariya': 182 },
    'Tesla': { 'Model 3': 185, 'Model Y': 187, 'Model S': 196, 'Model X': 198 },
    'Ford': { 'Mustang Mach-E': 186, 'F-150 Lightning': 233 },
    'Volkswagen': { 'ID.4': 181, 'ID.Buzz': 185 },
  };

  if (make && model && lengths[make]?.[model]) {
    return lengths[make][model];
  }

  // Default estimate
  return 175;
}

/**
 * Check if vehicle has heat pump (model/year dependent)
 */
function checkHeatPump(make, model, year) {
  // Most modern EVs (2021+) have heat pumps, except Bolts
  if (make === 'Chevrolet' && (model?.includes('Bolt'))) {
    return false;
  }

  // Tesla Model 3 got heat pump in 2021
  if (make === 'Tesla' && model === 'Model 3' && year < 2021) {
    return false;
  }

  // Default to true for modern EVs
  return year >= 2021;
}

/**
 * Extract dealer name from URL
 */
function extractDealerFromUrl(url) {
  if (!url) return 'Unknown Dealer';

  try {
    const hostname = new URL(url).hostname;
    // Remove common prefixes/suffixes
    let name = hostname
      .replace(/^www\./, '')
      .replace(/\.(com|ca|net|org|auto|cars|dealer).*$/, '')
      .replace(/[-_]/g, ' ');

    // Capitalize words
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return 'Unknown Dealer';
  }
}

/**
 * Browser-executable scraper function
 * This is designed to be injected and run in the browser context
 */
export const BROWSER_SCRAPER_SCRIPT = `
(function() {
  // Get all text content
  const pageText = document.body.innerText;
  const pageTitle = document.title;
  const pageUrl = window.location.href;

  // Get all image URLs
  const images = Array.from(document.querySelectorAll('img'))
    .map(img => img.src)
    .filter(src => src && !src.includes('data:') && !src.includes('placeholder'))
    .filter(src => {
      // Filter for likely vehicle images
      const lower = src.toLowerCase();
      return lower.includes('vehicle') || lower.includes('car') || lower.includes('auto') ||
             lower.includes('inventory') || lower.includes('stock') || lower.includes('photo') ||
             /\\d{4,}/.test(src); // Contains numbers (likely stock/VIN based)
    });

  // Try to find structured data (JSON-LD)
  let structuredData = null;
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data['@type'] === 'Vehicle' || data['@type'] === 'Car' || data['@type'] === 'Product') {
        structuredData = data;
        break;
      }
      if (Array.isArray(data)) {
        const vehicle = data.find(d => d['@type'] === 'Vehicle' || d['@type'] === 'Car');
        if (vehicle) {
          structuredData = vehicle;
          break;
        }
      }
    } catch (e) {}
  }

  // Look for price in common selectors
  const priceSelectors = [
    '[data-price]', '.price', '.vehicle-price', '.sale-price', '.asking-price',
    '.listing-price', '[itemprop="price"]', '.msrp', '.final-price'
  ];
  let priceFromDom = null;
  for (const sel of priceSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent || el.getAttribute('data-price');
      const match = text?.match(/\\$?([\\d,]+)/);
      if (match) {
        priceFromDom = match[1].replace(/,/g, '');
        break;
      }
    }
  }

  // Look for mileage in common selectors
  const mileageSelectors = [
    '[data-mileage]', '.mileage', '.odometer', '.kilometers', '.km',
    '[itemprop="mileageFromOdometer"]'
  ];
  let mileageFromDom = null;
  for (const sel of mileageSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent || el.getAttribute('data-mileage');
      const match = text?.match(/([\\d,]+)/);
      if (match) {
        mileageFromDom = match[1].replace(/,/g, '');
        break;
      }
    }
  }

  return {
    pageText,
    pageTitle,
    pageUrl,
    images,
    structuredData,
    priceFromDom,
    mileageFromDom,
    dealerName: document.querySelector('.dealer-name, .dealership-name, [itemprop="name"]')?.textContent?.trim(),
  };
})();
`;

export default {
  scrapeVehicleData,
  formatForCarFinder,
  BROWSER_SCRAPER_SCRIPT,
  PATTERNS,
  KNOWN_MAKES,
  EV_MODELS,
};
