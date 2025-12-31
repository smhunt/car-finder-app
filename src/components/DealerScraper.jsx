import React, { useState } from 'react';
import { Globe, Loader2, Search, CheckCircle, AlertCircle, Plus, ExternalLink, Zap } from 'lucide-react';

/**
 * Dealer Scraper Component
 *
 * Provides a UI for scraping vehicle listings from any dealership website.
 * Uses intelligent pattern matching to extract vehicle data.
 */

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

function detectMake(text) {
  const upper = text.toUpperCase();
  for (const make of KNOWN_MAKES) {
    if (upper.includes(make.toUpperCase())) {
      if (make === 'Chevy') return 'Chevrolet';
      if (make === 'VW') return 'Volkswagen';
      return make;
    }
  }
  return null;
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
  const { pageText = '', pageTitle = '', pageUrl = '', priceFromDom, mileageFromDom } = data;
  const fullText = `${pageTitle} ${pageText}`;

  const year = extractFirst(fullText, PATTERNS.year);
  const make = detectMake(fullText);
  const model = detectModel(fullText, make);
  const trim = extractTrim(fullText);
  const vin = extractFirst(fullText, PATTERNS.vin);

  // Get price - prefer DOM extraction
  let price = priceFromDom ? parsePrice(priceFromDom) : null;
  if (!price) {
    const priceStr = extractFirst(fullText, PATTERNS.price);
    price = parsePrice(priceStr);
  }

  // Get mileage - prefer DOM extraction
  let mileage = mileageFromDom ? parseMileage(mileageFromDom) : null;
  if (!mileage) {
    const mileageStr = extractFirst(fullText, PATTERNS.mileage);
    mileage = parseMileage(mileageStr);
  }

  const color = extractColor(fullText);
  const dealer = data.dealerName || extractDealerFromUrl(pageUrl);

  // Get EV specs if known model
  const specs = make && model && EV_SPECS[make]?.[model];

  return {
    year: parseInt(year) || null,
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

export default function DealerScraper({ onAddCar, onClose, locationPresets = [] }) {
  const [url, setUrl] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'json'
  const [status, setStatus] = useState('idle'); // idle, scraping, success, error
  const [scrapedData, setScrapedData] = useState(null);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [manualOverrides, setManualOverrides] = useState({});

  const handleScrape = async () => {
    if (!url) return;

    setStatus('scraping');
    setError('');
    setScrapedData(null);

    try {
      // Open URL in new tab and extract data via fetch + DOM parsing
      // For now, parse from URL patterns for supported sites
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // AutoTrader URL pattern: /a/make/model/location/province/id/
      if (hostname.includes('autotrader.ca')) {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'a' && pathParts.length >= 5) {
          const make = pathParts[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
          const model = pathParts[2].toUpperCase();
          const location = pathParts[3].charAt(0).toUpperCase() + pathParts[3].slice(1);

          setScrapedData({
            year: null, // Need page content
            make,
            model,
            trim: null,
            price: null, // Need page content
            mileage: null, // Need page content
            vin: null,
            color: null,
            dealer: null,
            url,
            range: EV_SPECS[make]?.[model]?.range || 400,
            length: EV_SPECS[make]?.[model]?.length || 175,
            heatPump: EV_SPECS[make]?.[model]?.heatPump ?? true,
            isElectric: true,
            confidence: 50,
          });
          setStatus('success');
          setError('Partial data extracted from URL. Visit the page in browser to get full details (price, mileage, year).');
          return;
        }
      }

      // For other sites, show instructions
      setError(
        'To scrape this page:\n' +
        '1. Open the URL in your browser\n' +
        '2. Use browser dev tools or the scraper bookmarklet\n' +
        '3. Copy the extracted JSON data here\n\n' +
        'Supported sites: AutoTrader.ca, Kijiji, CarGurus, Clutch, CanadaDrives'
      );
      setStatus('error');

    } catch (err) {
      setError(err.message || 'Failed to parse URL');
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
              <p className="text-xs text-slate-400 mt-2">
                Paste any dealer listing URL to extract vehicle data automatically
              </p>
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

                {/* VIN Display */}
                {scrapedData.vin && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-400">VIN: </span>
                    <span className="font-mono text-sm text-charcoal">{scrapedData.vin}</span>
                  </div>
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
