import React, { useState, useMemo } from 'react';
import { Globe, Loader2, Search, CheckCircle, AlertCircle, Plus, ExternalLink, Zap, RefreshCw, Info, Shield, ShieldAlert, MapPin, Calendar, Car } from 'lucide-react';
import { validateVIN, decodeVIN, getVINInsights } from '../utils/vinDecoder';

/**
 * Dealer Scraper Component
 *
 * Provides a UI for scraping vehicle listings from any dealership website.
 * Uses a proxy server to fetch pages and intelligent pattern matching to extract vehicle data.
 */

// Proxy API endpoint
const PROXY_API = import.meta.env.DEV
  ? 'http://localhost:3090'
  : 'https://api.carfinder.dev.ecoworks.ca';

// Inline scraper logic (browser-compatible version)
const PATTERNS = {
  price: [
    /\$\s*([\d,]+(?:\.\d{2})?)/g,
    /CAD\s*([\d,]+)/gi,
    /price[:\s]*\$?([\d,]+)/gi,
  ],
  mileage: [
    /([\d,]+)\s*(?:km|kms|kilometers?)/gi,
    /([\d,]+)\s*(?:mi|miles?)/gi,
    /(?:odometer|mileage|odo)[:\s]*([\d,]+)/gi,
  ],
  year: [/\b(20[12]\d)\b/g],
  vin: [/\b([A-HJ-NPR-Z0-9]{17})\b/g],
};

const KNOWN_MAKES = [
  'Chevrolet', 'Chevy', 'Hyundai', 'Kia', 'Nissan', 'Tesla', 'Ford',
  'Volkswagen', 'VW', 'BMW', 'Polestar', 'Rivian', 'Lucid', 'Mercedes-Benz',
  'Audi', 'Porsche', 'Volvo', 'Toyota', 'Honda', 'Mazda', 'Subaru',
  'Genesis', 'Cadillac', 'GMC', 'Buick', 'Chrysler', 'Dodge', 'Jeep',
  'Lexus', 'Infiniti', 'Acura', 'Lincoln',
];

const EV_MODELS = {
  'Chevrolet': ['Bolt EV', 'Bolt EUV', 'Equinox EV', 'Blazer EV'],
  'Hyundai': ['Kona Electric', 'Ioniq 5', 'Ioniq 6'],
  'Kia': ['Niro EV', 'Soul EV', 'EV6', 'EV9'],
  'Nissan': ['Leaf', 'Ariya'],
  'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X'],
  'Ford': ['Mustang Mach-E', 'F-150 Lightning'],
  'Volkswagen': ['ID.4', 'ID.Buzz'],
  'BMW': ['iX', 'i4', 'i5', 'i7'],
  'Polestar': ['Polestar 2', 'Polestar 3'],
  'Rivian': ['R1T', 'R1S'],
};

const EV_SPECS = {
  'Chevrolet': {
    'Bolt EV': { range: 417, length: 163, heatPump: false },
    'Bolt EUV': { range: 397, length: 169, heatPump: false },
    'Equinox EV': { range: 513, length: 184, heatPump: true },
  },
  'Hyundai': {
    'Kona Electric': { range: 415, length: 164, heatPump: true },
    'Ioniq 5': { range: 488, length: 182, heatPump: true },
    'Ioniq 6': { range: 581, length: 191, heatPump: true },
  },
  'Kia': {
    'Niro EV': { range: 407, length: 171, heatPump: true },
    'Soul EV': { range: 391, length: 165, heatPump: true },
    'EV6': { range: 499, length: 184, heatPump: true },
  },
  'Nissan': {
    'Leaf': { range: 342, length: 176, heatPump: true },
    'Ariya': { range: 482, length: 182, heatPump: true },
  },
  'Tesla': {
    'Model 3': { range: 438, length: 185, heatPump: true },
    'Model Y': { range: 455, length: 187, heatPump: true },
  },
  'Ford': {
    'Mustang Mach-E': { range: 490, length: 186, heatPump: true },
    'F-150 Lightning': { range: 483, length: 233, heatPump: true },
  },
  'Volkswagen': {
    'ID.4': { range: 443, length: 181, heatPump: true },
    'ID.Buzz': { range: 411, length: 185, heatPump: true },
  },
};

function extractFirst(text, patterns) {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function parsePrice(str) {
  if (!str) return null;
  const num = parseInt(str.replace(/[,$\s]/g, ''), 10);
  return (num >= 1000 && num <= 500000) ? num : null;
}

function parseMileage(str) {
  if (!str) return null;
  const num = parseInt(str.replace(/[,\s]/g, ''), 10);
  return (num >= 0 && num <= 500000) ? num : null;
}

// Normalize make names
function normalizeMake(make) {
  const aliases = {
    'chevy': 'Chevrolet',
    'vw': 'Volkswagen',
    'mercedes': 'Mercedes-Benz',
    'merc': 'Mercedes-Benz',
  };
  return aliases[make.toLowerCase()] || make;
}

// Smart make/model detection with source prioritization
function detectVehicleInfo(data) {
  const { pageTitle = '', pageUrl = '', pageText = '' } = data;

  // Build candidate list with scores
  const candidates = [];

  // 1. Parse URL (highest priority) - URLs are usually clean
  const urlLower = pageUrl.toLowerCase();
  for (const make of KNOWN_MAKES) {
    const makeLower = make.toLowerCase();
    // Check for /make/ or /make- patterns in URL
    if (urlLower.includes(`/${makeLower}/`) ||
        urlLower.includes(`/${makeLower}-`) ||
        urlLower.includes(`-${makeLower}-`) ||
        urlLower.includes(`-${makeLower}/`)) {
      const normalizedMake = normalizeMake(make);
      // Look for model in URL too
      const models = EV_MODELS[normalizedMake] || [];
      for (const model of models) {
        const modelSlug = model.toLowerCase().replace(/\s+/g, '-');
        const modelNoSpace = model.toLowerCase().replace(/\s+/g, '');
        if (urlLower.includes(modelSlug) || urlLower.includes(modelNoSpace)) {
          candidates.push({ make: normalizedMake, model, score: 100, source: 'url' });
        }
      }
      // Make found in URL without model
      if (!candidates.find(c => c.make === normalizedMake)) {
        candidates.push({ make: normalizedMake, model: null, score: 80, source: 'url' });
      }
    }
  }

  // 2. Parse page title (high priority) - "2024 Tesla Model 3 Long Range"
  const titlePattern = /\b(20[12]\d)\s+([A-Za-z-]+)\s+(.+?)(?:\s+[-|]|$)/i;
  const titleMatch = pageTitle.match(titlePattern);
  if (titleMatch) {
    const [, year, possibleMake, rest] = titleMatch;
    for (const make of KNOWN_MAKES) {
      if (possibleMake.toLowerCase() === make.toLowerCase() ||
          possibleMake.toLowerCase() === make.toLowerCase().replace('-', '')) {
        const normalizedMake = normalizeMake(make);
        const models = EV_MODELS[normalizedMake] || [];
        for (const model of models) {
          if (rest.toLowerCase().startsWith(model.toLowerCase())) {
            candidates.push({ make: normalizedMake, model, year: parseInt(year), score: 95, source: 'title' });
          }
        }
        if (!candidates.find(c => c.make === normalizedMake && c.source === 'title')) {
          candidates.push({ make: normalizedMake, model: null, year: parseInt(year), score: 75, source: 'title' });
        }
      }
    }
  }

  // 3. Look for "Year Make Model" pattern anywhere in title
  for (const make of KNOWN_MAKES) {
    const normalizedMake = normalizeMake(make);
    const models = EV_MODELS[normalizedMake] || [];
    for (const model of models) {
      // Pattern: "2024 Tesla Model 3" or "Tesla Model 3"
      const patterns = [
        new RegExp(`\\b(20[12]\\d)\\s+${make}\\s+${model.replace(/\s+/g, '\\s*')}\\b`, 'i'),
        new RegExp(`\\b${make}\\s+${model.replace(/\s+/g, '\\s*')}\\b`, 'i'),
      ];
      for (const pattern of patterns) {
        if (pattern.test(pageTitle)) {
          const yearMatch = pageTitle.match(/\b(20[12]\d)\b/);
          candidates.push({
            make: normalizedMake,
            model,
            year: yearMatch ? parseInt(yearMatch[1]) : null,
            score: 90,
            source: 'title-pattern'
          });
        }
      }
    }
  }

  // 4. Check first 500 chars of page text (medium priority)
  const headerText = pageText.substring(0, 500);
  for (const make of KNOWN_MAKES) {
    const normalizedMake = normalizeMake(make);
    const models = EV_MODELS[normalizedMake] || [];
    for (const model of models) {
      const pattern = new RegExp(`\\b${make}\\s+${model.replace(/\s+/g, '\\s*')}\\b`, 'i');
      if (pattern.test(headerText)) {
        candidates.push({ make: normalizedMake, model, score: 70, source: 'header' });
      }
    }
  }

  // 5. Fallback: any make/model in full text (lowest priority)
  if (candidates.length === 0) {
    for (const make of KNOWN_MAKES) {
      const normalizedMake = normalizeMake(make);
      // Use word boundary to avoid partial matches
      const makePattern = new RegExp(`\\b${make}\\b`, 'i');
      if (makePattern.test(pageTitle) || makePattern.test(headerText)) {
        const models = EV_MODELS[normalizedMake] || [];
        for (const model of models) {
          const modelPattern = new RegExp(`\\b${model.replace(/\s+/g, '\\s*')}\\b`, 'i');
          if (modelPattern.test(pageTitle) || modelPattern.test(headerText)) {
            candidates.push({ make: normalizedMake, model, score: 50, source: 'fallback' });
          }
        }
        if (!candidates.find(c => c.make === normalizedMake)) {
          candidates.push({ make: normalizedMake, model: null, score: 30, source: 'fallback' });
        }
      }
    }
  }

  // Sort by score and return best match
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    const best = candidates[0];
    console.log('[Scraper] Vehicle detection candidates:', candidates.slice(0, 5));
    console.log('[Scraper] Selected:', best);
    return best;
  }

  return { make: null, model: null, score: 0, source: null };
}

// Legacy functions for backward compatibility
function detectMake(text) {
  const result = detectVehicleInfo({ pageTitle: text, pageText: text, pageUrl: '' });
  return result.make;
}

function detectModel(text, make) {
  if (!make || !EV_MODELS[make]) return null;
  for (const model of EV_MODELS[make]) {
    if (text.toLowerCase().includes(model.toLowerCase())) return model;
  }
  return null;
}

function extractTrim(text) {
  const patterns = [
    /\b(1LT|2LT|LT|Premier)\b/gi,
    /\b(EX|EX\+|SX|SX Touring|SE|SEL|Limited|Ultimate|Preferred|Essential)\b/gi,
    /\b(Standard Range|Long Range|Performance|Plaid)\b/gi,
    /\b(Base|Sport|Touring|Elite|Platinum|GT|GT-Line)\b/gi,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

function extractColor(text) {
  const colors = ['White', 'Black', 'Grey', 'Gray', 'Silver', 'Blue', 'Red', 'Green', 'Brown', 'Orange', 'Yellow'];
  for (const c of colors) {
    if (text.toLowerCase().includes(c.toLowerCase())) return c;
  }
  return null;
}

function extractDealerFromUrl(url) {
  try {
    let name = new URL(url).hostname
      .replace(/^www\./, '')
      .replace(/\.(com|ca|net|org|auto|cars|dealer).*$/, '')
      .replace(/[-_]/g, ' ');
    return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  } catch {
    return 'Unknown Dealer';
  }
}

// Parse scraped page data into vehicle object
function parseScrapedData(data) {
  const { pageText = '', pageTitle = '', pageUrl = '', priceFromDom, mileageFromDom, ogTitle = '', h1Text = '' } = data;

  // Use structured sources for vehicle detection (prioritized)
  const titleForDetection = ogTitle || pageTitle || h1Text;
  const vehicleInfo = detectVehicleInfo({
    pageTitle: titleForDetection,
    pageUrl,
    pageText: pageText.substring(0, 2000), // Only use first 2000 chars
  });

  const { make, model, year: detectedYear } = vehicleInfo;

  // Get year from detection or fallback to pattern matching
  let year = detectedYear;
  if (!year) {
    const yearStr = extractFirst(titleForDetection, PATTERNS.year) ||
                    extractFirst(pageText.substring(0, 500), PATTERNS.year);
    year = yearStr ? parseInt(yearStr) : null;
  }

  // Extract trim from title first (most reliable)
  const trim = extractTrim(titleForDetection) || extractTrim(pageText.substring(0, 500));

  // VIN from full text
  const vin = extractFirst(pageText, PATTERNS.vin);

  // Get price - prefer DOM extraction, then title, then text
  let price = priceFromDom ? parsePrice(priceFromDom) : null;
  if (!price) {
    const priceStr = extractFirst(titleForDetection, PATTERNS.price) ||
                     extractFirst(pageText.substring(0, 1000), PATTERNS.price);
    price = parsePrice(priceStr);
  }

  // Get mileage - prefer DOM extraction
  let mileage = mileageFromDom ? parseMileage(mileageFromDom) : null;
  if (!mileage) {
    const mileageStr = extractFirst(titleForDetection, PATTERNS.mileage) ||
                       extractFirst(pageText.substring(0, 1000), PATTERNS.mileage);
    mileage = parseMileage(mileageStr);
  }

  // Color from title or early page text
  const color = extractColor(titleForDetection) || extractColor(pageText.substring(0, 1000));

  // Dealer name
  const dealer = data.dealerName || extractDealerFromUrl(pageUrl);

  // Get EV specs if known model
  const specs = make && model && EV_SPECS[make]?.[model];

  console.log('[Scraper] Parsed data:', { year, make, model, trim, price, mileage, color, dealer });

  return {
    year,
    make,
    model,
    trim,
    price,
    mileage,
    vin,
    color,
    dealer,
    url: pageUrl,
    range: specs?.range || 400,
    length: specs?.length || 175,
    heatPump: specs?.heatPump ?? true,
    isElectric: !!model,
    confidence: calculateConfidence({ year, make, model, price, mileage }),
    detectionSource: vehicleInfo.source,
  };
}

function calculateConfidence(data) {
  let score = 0;
  if (data.year) score += 20;
  if (data.make) score += 25;
  if (data.model) score += 25;
  if (data.price) score += 15;
  if (data.mileage) score += 15;
  return score;
}

// Convert to car-finder-app format
function formatForApp(data, locationInfo = {}) {
  const trimLevel = data.trim ?
    (['base', 's', 'se', '1lt', 'lt'].some(t => data.trim.toLowerCase().includes(t)) ? 1 :
     ['limited', 'ultimate', 'platinum', 'gt', 'performance'].some(t => data.trim.toLowerCase().includes(t)) ? 3 : 2) : 2;

  return {
    id: Date.now(),
    make: data.make || 'Unknown',
    model: data.model || 'Unknown',
    year: data.year || new Date().getFullYear(),
    trim: data.trim || '',
    trimLevel,
    dealer: data.dealer || 'Unknown',
    price: data.price || 0,
    odo: data.mileage || 0,
    color: data.color || 'Unknown',
    range: data.range,
    length: data.length,
    heatPump: data.heatPump,
    remoteStart: 'App',
    location: locationInfo.location || '',
    distance: locationInfo.distance || 5,
    damage: 0,
    notes: data.vin ? `VIN: ${data.vin}` : '',
    url: data.url,
    starred: false,
    priceHistory: data.price ? [{ price: data.price, date: new Date().toISOString().split('T')[0] }] : [],
    photos: data.images || [],
  };
}

/**
 * VIN Display Component with decoded information
 */
function VINDisplay({ vin }) {
  const [expanded, setExpanded] = useState(false);

  const vinAnalysis = useMemo(() => {
    if (!vin) return null;
    return getVINInsights(vin);
  }, [vin]);

  if (!vin || !vinAnalysis) return null;

  const { isValid, summary, confidence, insights, warnings, decoded } = vinAnalysis;

  return (
    <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
      {/* VIN Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-wide">VIN</span>
          {isValid ? (
            <Shield size={14} className="text-tally-mint" />
          ) : (
            <ShieldAlert size={14} className="text-amber-500" />
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-tally-blue hover:text-tally-blue-dark flex items-center gap-1"
        >
          <Info size={12} />
          {expanded ? 'Less' : 'More'}
        </button>
      </div>

      {/* VIN Number */}
      <div className="mt-2 font-mono text-sm text-charcoal tracking-wider select-all">
        {vin}
      </div>

      {/* Quick Summary */}
      <div className="mt-2 text-xs text-slate-500">
        {summary}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {/* Confidence Score */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  confidence >= 70 ? 'bg-tally-mint' :
                  confidence >= 40 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{confidence}% confidence</span>
          </div>

          {/* Decoded Info Grid */}
          {decoded && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {decoded.year && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={12} className="text-slate-400" />
                  <span>Year: {decoded.year}</span>
                </div>
              )}
              {decoded.make && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Car size={12} className="text-slate-400" />
                  <span>Make: {decoded.make}</span>
                </div>
              )}
              {decoded.country && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={12} className="text-slate-400" />
                  <span>Origin: {decoded.country}</span>
                </div>
              )}
              {decoded.plant && (
                <div className="flex items-center gap-2 text-slate-600 col-span-2">
                  <MapPin size={12} className="text-slate-400" />
                  <span>Plant: {decoded.plant}</span>
                </div>
              )}
            </div>
          )}

          {/* Insights */}
          {insights && insights.length > 0 && (
            <div className="space-y-1">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                  <CheckCircle size={12} className="text-tally-mint mt-0.5 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-600">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Raw VIN Components */}
          {decoded?.rawData && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-400 mb-2">VIN Breakdown:</div>
              <div className="flex gap-1 font-mono text-xs">
                <span className="px-1.5 py-0.5 bg-tally-blue/10 text-tally-blue rounded" title="World Manufacturer ID">
                  {decoded.rawData.wmi}
                </span>
                <span className="px-1.5 py-0.5 bg-tally-coral/10 text-tally-coral rounded" title="Vehicle Descriptor Section">
                  {decoded.rawData.vds}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded" title="Check Digit">
                  {decoded.rawData.checkDigit}
                </span>
                <span className="px-1.5 py-0.5 bg-tally-mint/10 text-tally-mint rounded" title="Year Code">
                  {decoded.rawData.yearCode}
                </span>
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded" title="Plant Code">
                  {decoded.rawData.plantCode}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded" title="Serial Number">
                  {decoded.rawData.serialNumber}
                </span>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-slate-400">
                <span>WMI</span>
                <span>VDS</span>
                <span>Chk</span>
                <span>Yr</span>
                <span>Plt</span>
                <span>Serial</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DealerScraper({ onAddCar, onClose, locationPresets = [] }) {
  const [url, setUrl] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'json'
  const [status, setStatus] = useState('idle'); // idle, scraping, success, error
  const [scrapedData, setScrapedData] = useState(null);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [manualOverrides, setManualOverrides] = useState({});

  const [useBrowser, setUseBrowser] = useState(false);

  const handleScrape = async () => {
    if (!url) return;

    setStatus('scraping');
    setError('');
    setScrapedData(null);

    try {
      // Try simple fetch first, fallback to browser if needed
      const endpoint = useBrowser ? '/api/scrape-browser' : '/api/scrape';
      const response = await fetch(`${PROXY_API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const { html, url: finalUrl } = result;

      // Check if we got blocked (minimal HTML with bot protection)
      if (html.length < 1000 && (html.includes('Incapsula') || html.includes('challenge') || html.includes('captcha'))) {
        if (!useBrowser) {
          setError('Site has bot protection. Try "Use Browser" mode for better results.');
          setStatus('error');
          return;
        }
      }

      // Parse HTML in browser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract text content
      const pageTitle = doc.title || '';
      const pageText = doc.body?.innerText || '';

      // Extract og:title (often has clean "Year Make Model" format)
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';

      // Extract h1 text (usually the vehicle title)
      const h1Text = doc.querySelector('h1')?.textContent?.trim() || '';

      // Extract structured data (JSON-LD)
      let structuredData = {};
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          // Handle array of items
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Vehicle' || item['@type'] === 'Car' ||
                item['@type'] === 'Product' || item['@type'] === 'Offer') {
              structuredData = { ...structuredData, ...item };
            }
            // Check for nested items
            if (item['@graph']) {
              for (const nested of item['@graph']) {
                if (nested['@type'] === 'Vehicle' || nested['@type'] === 'Car' || nested['@type'] === 'Product') {
                  structuredData = { ...structuredData, ...nested };
                }
              }
            }
          }
        } catch {}
      });

      console.log('[Scraper] Extracted metadata:', { pageTitle, ogTitle, h1Text, structuredData });

      // Try to extract price from DOM
      let priceFromDom = null;
      const priceSelectors = [
        '[data-price]', '.price', '.vehicle-price', '.listing-price',
        '[class*="price"]', '.sale-price', '.asking-price'
      ];
      for (const sel of priceSelectors) {
        const el = doc.querySelector(sel);
        if (el) {
          const text = el.getAttribute('data-price') || el.textContent;
          const match = text?.match(/\$?([\d,]+)/);
          if (match) {
            priceFromDom = match[1];
            break;
          }
        }
      }

      // Try to extract mileage from DOM
      let mileageFromDom = null;
      const mileageSelectors = [
        '[data-mileage]', '[data-odometer]', '.mileage', '.odometer',
        '[class*="mileage"]', '[class*="odometer"]', '[class*="kilometer"]'
      ];
      for (const sel of mileageSelectors) {
        const el = doc.querySelector(sel);
        if (el) {
          const text = el.getAttribute('data-mileage') || el.getAttribute('data-odometer') || el.textContent;
          const match = text?.match(/([\d,]+)\s*(?:km|mi)/i);
          if (match) {
            mileageFromDom = match[1];
            break;
          }
        }
      }

      // Extract dealer name from DOM
      let dealerName = null;
      const dealerSelectors = [
        '[class*="dealer-name"]', '[class*="dealership"]', '.dealer',
        'h1', 'header h1', '[itemtype*="LocalBusiness"] [itemprop="name"]'
      ];
      for (const sel of dealerSelectors) {
        const el = doc.querySelector(sel);
        if (el?.textContent?.length < 100) {
          dealerName = el.textContent.trim();
          break;
        }
      }

      // Parse the data using our pattern matching
      const parsed = parseScrapedData({
        pageText,
        pageTitle,
        pageUrl: finalUrl || url,
        priceFromDom,
        mileageFromDom,
        dealerName,
        structuredData,
        ogTitle,
        h1Text,
      });

      // Merge with structured data if available
      if (structuredData.offers?.price) parsed.price = parseInt(structuredData.offers.price);
      if (structuredData.mileageFromOdometer?.value) parsed.mileage = parseInt(structuredData.mileageFromOdometer.value);
      if (structuredData.vehicleIdentificationNumber) parsed.vin = structuredData.vehicleIdentificationNumber;
      if (structuredData.color || structuredData.vehicleExteriorColor) parsed.color = structuredData.color || structuredData.vehicleExteriorColor;

      setScrapedData(parsed);
      setStatus('success');

    } catch (err) {
      console.error('Scrape error:', err);

      // Check if proxy is running
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError(
          'Could not connect to scraper proxy.\n\n' +
          'Make sure the proxy server is running:\n' +
          '  npm run proxy\n\n' +
          'Or use "Paste JSON" mode with manual browser scraping.'
        );
      } else {
        setError(err.message || 'Failed to scrape URL');
      }
      setStatus('error');
    }
  };

  // Handle JSON paste input
  const handleJsonPaste = () => {
    if (!jsonInput.trim()) return;

    setStatus('scraping');
    setError('');

    try {
      const data = JSON.parse(jsonInput);

      // Handle different JSON formats
      const extracted = data.extracted || data.carFinderFormat || data;

      // Parse the data
      const parsed = {
        year: extracted.year || null,
        make: extracted.make || null,
        model: extracted.model || null,
        trim: extracted.trim || null,
        price: extracted.price || extracted.odo || null,
        mileage: extracted.mileage || extracted.odo || null,
        vin: extracted.vin || null,
        color: extracted.color || extracted.exteriorColor || null,
        dealer: extracted.dealer || null,
        url: extracted.url || extracted.sourceUrl || url,
        range: extracted.range || EV_SPECS[extracted.make]?.[extracted.model]?.range || 400,
        length: extracted.length || EV_SPECS[extracted.make]?.[extracted.model]?.length || 175,
        heatPump: extracted.heatPump ?? EV_SPECS[extracted.make]?.[extracted.model]?.heatPump ?? true,
        isElectric: extracted.isElectric ?? true,
        confidence: extracted.confidence || 100,
      };

      setScrapedData(parsed);
      setStatus('success');
    } catch (err) {
      setError('Invalid JSON format. Paste the output from browser console scraper.');
      setStatus('error');
    }
  };

  // This function is called when data is received from external scraper
  const processScrapedData = (rawData) => {
    try {
      const parsed = parseScrapedData(rawData);
      setScrapedData(parsed);
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Failed to parse data');
      setStatus('error');
    }
  };

  const handleAddToList = (keepOpen = false) => {
    if (!scrapedData) return;

    const locationInfo = locationPresets.find(l => l.name === selectedLocation) || {};
    const carData = formatForApp({
      ...scrapedData,
      ...manualOverrides,
    }, {
      location: selectedLocation,
      distance: locationInfo.distance || 5,
    });

    onAddCar(carData);

    if (keepOpen) {
      // Reset for another entry
      setUrl('');
      setJsonInput('');
      setScrapedData(null);
      setStatus('idle');
      setError('');
      setManualOverrides({});
    } else {
      onClose();
    }
  };

  const updateOverride = (key, value) => {
    setManualOverrides(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-tally-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <h2 className="font-display font-semibold text-charcoal flex items-center gap-2">
            <Globe size={20} className="text-tally-blue" />
            Scrape Dealer Listing
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <span className="text-xl">&times;</span>
          </button>
        </div>

        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode('url')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                inputMode === 'url'
                  ? 'bg-tally-blue text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              URL Input
            </button>
            <button
              onClick={() => setInputMode('json')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                inputMode === 'json'
                  ? 'bg-tally-blue text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Paste JSON
            </button>
          </div>

          {/* URL Input Mode */}
          {inputMode === 'url' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">Listing URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://dealer.com/inventory/vehicle/12345"
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tally-blue focus:border-tally-blue outline-none transition-all"
                />
                <button
                  onClick={handleScrape}
                  disabled={!url || status === 'scraping'}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    !url || status === 'scraping'
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-tally-blue text-white hover:bg-tally-blue-dark'
                  }`}
                >
                  {status === 'scraping' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                  Scrape
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400">
                  Paste any dealer listing URL to extract vehicle data automatically
                </p>
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useBrowser}
                    onChange={(e) => setUseBrowser(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>Use Browser</span>
                  <span className="text-slate-400">(for protected sites)</span>
                </label>
              </div>
            </div>
          )}

          {/* JSON Paste Mode */}
          {inputMode === 'json' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">Paste Scraped JSON</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"year": 2024, "make": "Chevrolet", "model": "Bolt EV", "price": 25000, "mileage": 30000, ...}'
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tally-blue focus:border-tally-blue outline-none transition-all font-mono text-sm h-32 resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-400">
                  Paste JSON from browser console scraper
                </p>
                <button
                  onClick={handleJsonPaste}
                  disabled={!jsonInput.trim() || status === 'scraping'}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                    !jsonInput.trim() || status === 'scraping'
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-tally-blue text-white hover:bg-tally-blue-dark'
                  }`}
                >
                  {status === 'scraping' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Parse JSON
                </button>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {status === 'success' && scrapedData && (
            <>
              {/* Confidence Indicator */}
              <div className="mb-6 p-4 bg-tally-mint/10 border border-tally-mint/30 rounded-xl flex items-center gap-3">
                <CheckCircle size={20} className="text-tally-mint" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">
                    Data extracted successfully
                  </p>
                  <p className="text-xs text-slate-500">
                    Confidence: {scrapedData.confidence}% - {scrapedData.isElectric ? 'Electric Vehicle Detected' : 'Vehicle Detected'}
                  </p>
                </div>
                {scrapedData.isElectric && <Zap size={20} className="text-tally-blue" />}
              </div>

              {/* Extracted Data Preview */}
              <div className="mb-6 bg-fog rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-500 mb-3">Extracted Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Year</label>
                    <input
                      type="number"
                      value={manualOverrides.year ?? scrapedData.year ?? ''}
                      onChange={(e) => updateOverride('year', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Make</label>
                    <input
                      type="text"
                      value={manualOverrides.make ?? scrapedData.make ?? ''}
                      onChange={(e) => updateOverride('make', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Model</label>
                    <input
                      type="text"
                      value={manualOverrides.model ?? scrapedData.model ?? ''}
                      onChange={(e) => updateOverride('model', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Trim</label>
                    <input
                      type="text"
                      value={manualOverrides.trim ?? scrapedData.trim ?? ''}
                      onChange={(e) => updateOverride('trim', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={manualOverrides.price ?? scrapedData.price ?? ''}
                      onChange={(e) => updateOverride('price', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Mileage (km)</label>
                    <input
                      type="number"
                      value={manualOverrides.mileage ?? scrapedData.mileage ?? ''}
                      onChange={(e) => updateOverride('mileage', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Color</label>
                    <input
                      type="text"
                      value={manualOverrides.color ?? scrapedData.color ?? ''}
                      onChange={(e) => updateOverride('color', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Dealer</label>
                    <input
                      type="text"
                      value={manualOverrides.dealer ?? scrapedData.dealer ?? ''}
                      onChange={(e) => updateOverride('dealer', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Location Selection */}
                {locationPresets.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-xs text-slate-400 mb-2">Location</label>
                    <div className="grid grid-cols-4 gap-2">
                      {locationPresets.slice(0, 8).map(loc => (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => setSelectedLocation(loc.name)}
                          className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                            selectedLocation === loc.name
                              ? 'bg-tally-coral text-white border-tally-coral'
                              : 'border-slate-200 hover:border-tally-coral'
                          }`}
                        >
                          {loc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIN Display with Decoded Info */}
                {scrapedData.vin && (
                  <VINDisplay vin={scrapedData.vin} />
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={scrapedData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <ExternalLink size={16} /> View Original
                </a>
                <div className="flex-1" />
                <button
                  onClick={() => handleAddToList(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-tally-mint border border-tally-mint rounded-xl hover:bg-tally-mint/10 transition-all"
                >
                  <Plus size={16} /> Add & Continue
                </button>
                <button
                  onClick={() => handleAddToList(false)}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-tally-mint rounded-xl hover:bg-tally-mint/90 transition-all"
                >
                  <Plus size={16} /> Add & Close
                </button>
              </div>
            </>
          )}

          {/* Instructions */}
          {status === 'idle' && (
            <div className="bg-fog rounded-xl p-6 text-center">
              <Globe size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-charcoal mb-2">Universal Dealer Scraper</h3>
              <p className="text-sm text-slate-500 mb-4">
                Paste any dealership listing URL and we'll automatically extract:<br />
                Year, Make, Model, Trim, Price, Mileage, VIN, Color, and more.
              </p>
              <div className="text-xs text-slate-400">
                Works with most dealer websites including AutoTrader, Kijiji, CarGurus,<br />
                Clutch, CanadaDrives, and individual dealership sites.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export the parsing functions for external use
export { parseScrapedData, formatForApp };
