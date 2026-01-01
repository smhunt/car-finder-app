import React, { useState, useMemo } from 'react';
import { Globe, Loader2, Search, CheckCircle, AlertCircle, Plus, ExternalLink, Zap, RefreshCw, Info, Shield, ShieldAlert, MapPin, Calendar, Car, ChevronDown, ChevronUp, X, Save, Eye, Edit3, Sparkles, FileJson, ArrowRight } from 'lucide-react';
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
 * VIN Segment component for visual breakdown
 */
function VINSegment({ chars, label, color, position, tooltip }) {
  const colorClasses = {
    blue: 'bg-tally-blue/15 text-tally-blue border-tally-blue/30',
    coral: 'bg-tally-coral/15 text-tally-coral border-tally-coral/30',
    mint: 'bg-tally-mint/15 text-tally-mint border-tally-mint/30',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    amber: 'bg-amber-100 text-amber-600 border-amber-200',
  };

  return (
    <div className="flex flex-col items-center group relative">
      <div className={`px-1.5 py-1 font-mono text-sm font-medium rounded border ${colorClasses[color]} tracking-wider`}>
        {chars}
      </div>
      <div className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">{label}</div>
      <div className="text-[9px] text-slate-300">{position}</div>
      {tooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-charcoal text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {tooltip}
        </div>
      )}
    </div>
  );
}

/**
 * Detail row component for expanded info
 */
function DetailRow({ icon: Icon, label, value, highlight = false }) {
  if (!value) return null;
  return (
    <div className={`flex items-start gap-2 py-1.5 ${highlight ? 'bg-tally-mint/5 -mx-2 px-2 rounded' : ''}`}>
      <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
        <div className="text-xs text-charcoal font-medium">{value}</div>
      </div>
    </div>
  );
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

  // Confidence level label
  const confidenceLabel = confidence >= 80 ? 'High' : confidence >= 50 ? 'Medium' : 'Low';
  const confidenceColor = confidence >= 80 ? 'text-tally-mint' : confidence >= 50 ? 'text-amber-500' : 'text-red-400';

  return (
    <div className="mt-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isValid ? (
            <div className="w-6 h-6 rounded-full bg-tally-mint/20 flex items-center justify-center">
              <Shield size={14} className="text-tally-mint" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
              <ShieldAlert size={14} className="text-amber-500" />
            </div>
          )}
          <div>
            <span className="text-xs font-medium text-charcoal">VIN Decoded</span>
            <span className={`ml-2 text-[10px] ${confidenceColor}`}>
              {confidenceLabel} Confidence ({confidence}%)
            </span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-tally-blue hover:bg-tally-blue/10 rounded-lg transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* VIN Number with visual breakdown */}
      <div className="px-4 py-4">
        {/* VIN String */}
        <div className="font-mono text-base text-charcoal tracking-[0.15em] select-all text-center mb-3 font-medium">
          {vin}
        </div>

        {/* Quick Summary */}
        <div className="text-sm text-center text-slate-600 mb-4">
          {summary}
          {decoded?.isElectric && (
            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-tally-blue/10 text-tally-blue text-xs rounded-full">
              <Zap size={10} /> Electric
            </span>
          )}
        </div>

        {/* Visual VIN Breakdown - Always Visible */}
        {decoded?.rawData && (
          <div className="flex justify-center gap-1.5 flex-wrap">
            <VINSegment
              chars={decoded.rawData.wmi}
              label="WMI"
              position="1-3"
              color="blue"
              tooltip={`Manufacturer: ${decoded.fullManufacturerName || decoded.make || 'Unknown'}`}
            />
            <VINSegment
              chars={decoded.rawData.vds}
              label="VDS"
              position="4-8"
              color="coral"
              tooltip={`Vehicle Attributes${decoded.model ? `: ${decoded.model}` : ''}`}
            />
            <VINSegment
              chars={decoded.rawData.checkDigit}
              label="Check"
              position="9"
              color={isValid ? 'slate' : 'amber'}
              tooltip={isValid ? 'Check digit valid' : 'Check digit mismatch'}
            />
            <VINSegment
              chars={decoded.rawData.yearCode}
              label="Year"
              position="10"
              color="mint"
              tooltip={decoded.year ? `Model Year: ${decoded.year}` : 'Year code'}
            />
            <VINSegment
              chars={decoded.rawData.plantCode}
              label="Plant"
              position="11"
              color="purple"
              tooltip={decoded.plant || 'Assembly plant code'}
            />
            <VINSegment
              chars={decoded.rawData.serialNumber}
              label="Serial"
              position="12-17"
              color="slate"
              tooltip="Production sequence number"
            />
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Confidence Bar */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Decode Confidence</span>
              <span className={`text-xs font-bold ${confidenceColor}`}>{confidence}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  confidence >= 80 ? 'bg-tally-mint' :
                  confidence >= 50 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {/* Details Grid */}
          {decoded && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {/* Vehicle Info Section */}
              <div className="col-span-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-2 mb-1 border-b border-slate-100 pb-1">
                Vehicle Information
              </div>
              <DetailRow
                icon={Calendar}
                label="Model Year"
                value={decoded.year ? `${decoded.year}${decoded.generation ? ` - ${decoded.generation}` : ''}` : null}
              />
              <DetailRow
                icon={Car}
                label="Make / Model"
                value={decoded.make ? `${decoded.make}${decoded.model ? ` ${decoded.model}` : ''}` : null}
              />
              <DetailRow
                icon={Info}
                label="Body Type"
                value={decoded.bodyType}
              />
              <DetailRow
                icon={Zap}
                label="Drive Type"
                value={decoded.driveType}
                highlight={!!decoded.driveType}
              />
              {decoded.batteryInfo && (
                <DetailRow
                  icon={Zap}
                  label="Battery"
                  value={`${decoded.batteryInfo.type || 'Battery'}${decoded.batteryInfo.capacity ? ` (${decoded.batteryInfo.capacity})` : ''}`}
                  highlight
                />
              )}
              {decoded.variant && (
                <DetailRow
                  icon={Sparkles}
                  label="Variant"
                  value={decoded.variant}
                />
              )}

              {/* Manufacturing Section */}
              <div className="col-span-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-3 mb-1 border-b border-slate-100 pb-1">
                Manufacturing
              </div>
              <DetailRow
                icon={Info}
                label="Manufacturer"
                value={decoded.fullManufacturerName}
              />
              <DetailRow
                icon={Globe}
                label="Country of Origin"
                value={decoded.country}
              />
              <DetailRow
                icon={MapPin}
                label="Assembly Plant"
                value={decoded.plant}
              />
              {decoded.plantEstablished && (
                <DetailRow
                  icon={Calendar}
                  label="Plant Established"
                  value={decoded.plantEstablished}
                />
              )}
              {decoded.manufacturerNote && (
                <DetailRow
                  icon={Info}
                  label="Note"
                  value={decoded.manufacturerNote}
                />
              )}
            </div>
          )}

          {/* Insights */}
          {insights && insights.length > 0 && (
            <div className="bg-tally-mint/5 rounded-lg p-3">
              <div className="text-[10px] font-semibold text-tally-mint uppercase tracking-wide mb-2">
                Insights
              </div>
              <div className="space-y-1.5">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle size={12} className="text-tally-mint mt-0.5 flex-shrink-0" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-2">
                Warnings
              </div>
              <div className="space-y-1.5">
                {warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Data Reference */}
          {decoded?.rawData && (
            <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
              <span className="font-mono">{decoded.rawData.vin}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Field Status Badge Component
 * Shows whether a field was auto-detected, manually entered, or is missing
 */
function FieldStatusBadge({ status, className = '' }) {
  const badges = {
    'auto': { label: 'Auto-detected', className: 'bg-tally-mint/20 text-tally-mint border-tally-mint/30' },
    'manual': { label: 'Manual', className: 'bg-tally-blue/20 text-tally-blue border-tally-blue/30' },
    'missing': { label: 'Missing', className: 'bg-amber-100 text-amber-600 border-amber-200' },
    'edited': { label: 'Edited', className: 'bg-purple-100 text-purple-600 border-purple-200' },
  };
  const badge = badges[status] || badges.missing;

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${badge.className} ${className}`}>
      {badge.label}
    </span>
  );
}

/**
 * Editable Field Component for Review Panel
 */
function ReviewField({ label, value, originalValue, onChange, type = 'text', placeholder = '', required = false }) {
  const hasValue = value !== null && value !== undefined && value !== '';
  const wasEdited = originalValue !== undefined && value !== originalValue;
  const status = !hasValue ? 'missing' : wasEdited ? 'edited' : 'auto';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <FieldStatusBadge status={status} />
      </div>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? (e.target.value ? parseInt(e.target.value) : null) : e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-lg transition-all focus:ring-2 focus:ring-tally-blue/20 focus:border-tally-blue outline-none ${
          !hasValue && required ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'
        }`}
      />
    </div>
  );
}

export default function DealerScraper({ onAddCar, onClose, locationPresets = [] }) {
  const [url, setUrl] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false); // For JSON paste mode
  const [status, setStatus] = useState('idle'); // idle, scraping, reviewing, error
  const [scrapedData, setScrapedData] = useState(null);
  const [originalScrapedData, setOriginalScrapedData] = useState(null); // Track original for edit detection
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [manualOverrides, setManualOverrides] = useState({});

  const [useBrowser, setUseBrowser] = useState(false);

  // Current step in the flow
  const currentStep = status === 'idle' || status === 'scraping' ? 'input' :
                      status === 'reviewing' ? 'review' : 'input';

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
      setOriginalScrapedData({ ...parsed }); // Save original for edit tracking
      setStatus('reviewing');

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
      setOriginalScrapedData({ ...parsed }); // Save original for edit tracking
      setStatus('reviewing');
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
      setOriginalScrapedData({ ...parsed });
      setStatus('reviewing');
    } catch (err) {
      setError(err.message || 'Failed to parse data');
      setStatus('error');
    }
  };

  // Go back to input step
  const handleBackToInput = () => {
    setStatus('idle');
    setScrapedData(null);
    setOriginalScrapedData(null);
    setManualOverrides({});
    setError('');
  };

  // Reset everything for a new entry
  const handleReset = () => {
    setUrl('');
    setJsonInput('');
    setScrapedData(null);
    setOriginalScrapedData(null);
    setStatus('idle');
    setError('');
    setManualOverrides({});
    setSelectedLocation('');
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
      handleReset();
    } else {
      onClose();
    }
  };

  // Get current value (with override if exists)
  const getValue = (key) => manualOverrides[key] ?? scrapedData?.[key];
  const getOriginal = (key) => originalScrapedData?.[key];

  // Count auto-detected vs missing fields
  const fieldStats = useMemo(() => {
    if (!scrapedData) return { auto: 0, missing: 0, edited: 0 };
    const requiredFields = ['year', 'make', 'model', 'price', 'mileage'];
    let auto = 0, missing = 0, edited = 0;
    requiredFields.forEach(field => {
      const value = getValue(field);
      const original = getOriginal(field);
      if (!value && value !== 0) {
        missing++;
      } else if (original !== undefined && value !== original) {
        edited++;
      } else {
        auto++;
      }
    });
    return { auto, missing, edited };
  }, [scrapedData, manualOverrides, originalScrapedData]);

  const updateOverride = (key, value) => {
    setManualOverrides(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-tally-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {status === 'reviewing' && (
              <button
                onClick={handleBackToInput}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                title="Back to input"
              >
                <ChevronDown size={18} className="rotate-90" />
              </button>
            )}
            <h2 className="font-display font-semibold text-charcoal flex items-center gap-2">
              {status === 'reviewing' ? (
                <>
                  <Eye size={20} className="text-tally-blue" />
                  Review Scraped Data
                </>
              ) : (
                <>
                  <Globe size={20} className="text-tally-blue" />
                  Scrape Dealer Listing
                </>
              )}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* ===== STEP 1: INPUT ===== */}
          {currentStep === 'input' && (
            <>
              {/* URL Input (Primary Method) */}
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
                    {status === 'scraping' ? 'Scraping...' : 'Scrape'}
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
                    <span>Browser mode</span>
                    <span className="text-slate-400">(for protected sites)</span>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {status === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
                  </div>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Advanced: JSON Paste (Collapsible) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileJson size={16} />
                    Advanced: Paste JSON Data
                  </span>
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showAdvanced && (
                  <div className="p-4 pt-0 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-3">
                      If URL scraping fails, you can manually copy JSON data from browser dev tools.
                    </p>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='{"year": 2024, "make": "Chevrolet", "model": "Bolt EV", "price": 25000, "mileage": 30000, ...}'
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tally-blue focus:border-tally-blue outline-none transition-all font-mono text-xs h-24 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleJsonPaste}
                        disabled={!jsonInput.trim()}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                          !jsonInput.trim()
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-800 text-white hover:bg-slate-700'
                        }`}
                      >
                        <ArrowRight size={14} />
                        Parse JSON
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions (shown in idle state) */}
              {status === 'idle' && !showAdvanced && (
                <div className="mt-6 bg-fog rounded-xl p-6 text-center">
                  <Sparkles size={40} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="font-medium text-charcoal mb-2">Smart Vehicle Extraction</h3>
                  <p className="text-sm text-slate-500 mb-3">
                    Automatically extracts Year, Make, Model, Trim, Price, Mileage, VIN, and Color
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-400">
                    <span className="px-2 py-1 bg-white rounded-full">AutoTrader</span>
                    <span className="px-2 py-1 bg-white rounded-full">Kijiji</span>
                    <span className="px-2 py-1 bg-white rounded-full">CarGurus</span>
                    <span className="px-2 py-1 bg-white rounded-full">Clutch</span>
                    <span className="px-2 py-1 bg-white rounded-full">CanadaDrives</span>
                    <span className="px-2 py-1 bg-white rounded-full">+ Most Dealers</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== STEP 2: REVIEW ===== */}
          {currentStep === 'review' && scrapedData && (
            <>
              {/* Extraction Summary */}
              <div className="mb-6 p-4 bg-gradient-to-r from-tally-mint/10 to-tally-blue/10 border border-tally-mint/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {scrapedData.isElectric ? (
                        <Zap size={20} className="text-tally-blue" />
                      ) : (
                        <Car size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">
                        {getValue('year') || '????'} {getValue('make') || 'Unknown'} {getValue('model') || 'Vehicle'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {scrapedData.isElectric ? 'Electric Vehicle' : 'Vehicle'} - Confidence: {scrapedData.confidence}%
                      </p>
                    </div>
                  </div>
                  {scrapedData.url && (
                    <a
                      href={scrapedData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                    >
                      <ExternalLink size={12} /> View Listing
                    </a>
                  )}
                </div>

                {/* Field Statistics */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-white/50">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-tally-mint"></span>
                    <span className="text-slate-600">{fieldStats.auto} auto-detected</span>
                  </div>
                  {fieldStats.edited > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span className="text-slate-600">{fieldStats.edited} edited</span>
                    </div>
                  )}
                  {fieldStats.missing > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span className="text-amber-600">{fieldStats.missing} missing</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Fields */}
              <div className="mb-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Edit3 size={14} />
                  Vehicle Details
                  <span className="text-xs font-normal text-slate-400">- Edit any field before saving</span>
                </h3>

                {/* Core Vehicle Info */}
                <div className="grid grid-cols-2 gap-3">
                  <ReviewField
                    label="Year"
                    value={getValue('year')}
                    originalValue={getOriginal('year')}
                    onChange={(v) => updateOverride('year', v)}
                    type="number"
                    placeholder="2024"
                    required
                  />
                  <ReviewField
                    label="Make"
                    value={getValue('make')}
                    originalValue={getOriginal('make')}
                    onChange={(v) => updateOverride('make', v)}
                    placeholder="Chevrolet"
                    required
                  />
                  <ReviewField
                    label="Model"
                    value={getValue('model')}
                    originalValue={getOriginal('model')}
                    onChange={(v) => updateOverride('model', v)}
                    placeholder="Bolt EV"
                    required
                  />
                  <ReviewField
                    label="Trim"
                    value={getValue('trim')}
                    originalValue={getOriginal('trim')}
                    onChange={(v) => updateOverride('trim', v)}
                    placeholder="2LT"
                  />
                </div>

                {/* Price & Mileage */}
                <div className="grid grid-cols-2 gap-3">
                  <ReviewField
                    label="Price ($)"
                    value={getValue('price')}
                    originalValue={getOriginal('price')}
                    onChange={(v) => updateOverride('price', v)}
                    type="number"
                    placeholder="25000"
                    required
                  />
                  <ReviewField
                    label="Odometer (km)"
                    value={getValue('mileage')}
                    originalValue={getOriginal('mileage')}
                    onChange={(v) => updateOverride('mileage', v)}
                    type="number"
                    placeholder="30000"
                    required
                  />
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-3">
                  <ReviewField
                    label="Color"
                    value={getValue('color')}
                    originalValue={getOriginal('color')}
                    onChange={(v) => updateOverride('color', v)}
                    placeholder="White"
                  />
                  <ReviewField
                    label="Dealer"
                    value={getValue('dealer')}
                    originalValue={getOriginal('dealer')}
                    onChange={(v) => updateOverride('dealer', v)}
                    placeholder="ABC Motors"
                  />
                </div>

                {/* EV Specs (if applicable) */}
                {scrapedData.isElectric && (
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Range (km)</label>
                      <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                        {getValue('range') || 400}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Length (in)</label>
                      <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                        {getValue('length') || 175}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Heat Pump</label>
                      <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                        {getValue('heatPump') ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Location Selection */}
              {locationPresets.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <MapPin size={14} />
                    Location
                  </label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {locationPresets.slice(0, 8).map(loc => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => setSelectedLocation(loc.name)}
                        className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                          selectedLocation === loc.name
                            ? 'bg-tally-coral text-white border-tally-coral'
                            : 'border-slate-200 hover:border-tally-coral hover:bg-tally-coral/5'
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
                <VINDisplay vin={scrapedData.vin} />
              )}

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={handleBackToInput}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <X size={16} />
                  Cancel
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => handleAddToList(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-tally-mint border border-tally-mint rounded-xl hover:bg-tally-mint/10 transition-all"
                >
                  <Plus size={16} />
                  Save & Add Another
                </button>
                <button
                  onClick={() => handleAddToList(false)}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-tally-mint rounded-xl hover:bg-tally-mint/90 transition-all shadow-sm"
                >
                  <Save size={16} />
                  Save to Listings
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Export the parsing functions for external use
export { parseScrapedData, formatForApp };
