/**
 * VIN (Vehicle Identification Number) Decoder and Analysis Utility
 *
 * Provides validation, decoding, and analysis of 17-character VINs
 * with specific support for electric vehicles.
 */

// =============================================================================
// VIN Character Positions Reference:
// 1-3: WMI (World Manufacturer Identifier)
// 4-8: VDS (Vehicle Descriptor Section)
// 9:   Check digit
// 10:  Model year
// 11:  Plant code
// 12-17: Vehicle serial number
// =============================================================================

/**
 * Characters that are invalid in VINs (easily confused with numbers)
 */
const INVALID_CHARACTERS = ['I', 'O', 'Q'];

/**
 * World Manufacturer Identifier (WMI) lookup table
 * Maps first 3 characters to manufacturer info
 */
const WMI_DATABASE = {
  // Tesla
  '5YJ': { make: 'Tesla', country: 'USA', plant: 'Fremont, California' },
  'XP7': { make: 'Tesla', country: 'China', plant: 'Shanghai Gigafactory' },
  '7SA': { make: 'Tesla', country: 'USA', plant: 'Austin Gigafactory, Texas' },
  'LRW': { make: 'Tesla', country: 'China', plant: 'Shanghai Gigafactory' },

  // Chevrolet/GM
  '1G1': { make: 'Chevrolet', country: 'USA', division: 'Chevrolet' },
  '1GC': { make: 'Chevrolet', country: 'USA', division: 'Chevrolet Truck' },
  '1GT': { make: 'GMC', country: 'USA', division: 'GMC Truck' },
  '2G1': { make: 'Chevrolet', country: 'Canada', division: 'Chevrolet' },
  '3G1': { make: 'Chevrolet', country: 'Mexico', division: 'Chevrolet' },

  // Ford
  '1FA': { make: 'Ford', country: 'USA', division: 'Ford' },
  '1FB': { make: 'Ford', country: 'USA', division: 'Ford' },
  '1FM': { make: 'Ford', country: 'USA', division: 'Ford Multi-Purpose' },
  '1FT': { make: 'Ford', country: 'USA', division: 'Ford Truck' },
  '3FA': { make: 'Ford', country: 'Mexico', division: 'Ford' },
  '3FM': { make: 'Ford', country: 'Mexico', division: 'Ford Multi-Purpose' },

  // Hyundai
  'KM8': { make: 'Hyundai', country: 'South Korea', division: 'Hyundai' },
  '5NM': { make: 'Hyundai', country: 'USA', plant: 'Montgomery, Alabama' },
  '5NP': { make: 'Hyundai', country: 'USA', plant: 'Montgomery, Alabama' },

  // Kia
  '5XY': { make: 'Kia', country: 'USA', plant: 'West Point, Georgia' },
  'KND': { make: 'Kia', country: 'South Korea', division: 'Kia' },
  'KNA': { make: 'Kia', country: 'South Korea', division: 'Kia' },

  // Nissan
  '1N4': { make: 'Nissan', country: 'USA', division: 'Nissan' },
  '1N6': { make: 'Nissan', country: 'USA', division: 'Nissan Truck' },
  '3N1': { make: 'Nissan', country: 'Mexico', division: 'Nissan' },
  'JN1': { make: 'Nissan', country: 'Japan', division: 'Nissan' },
  'JN8': { make: 'Nissan', country: 'Japan', division: 'Nissan' },

  // BMW
  'WBA': { make: 'BMW', country: 'Germany', division: 'BMW' },
  'WBS': { make: 'BMW', country: 'Germany', division: 'BMW M' },
  'WBY': { make: 'BMW', country: 'Germany', division: 'BMW i' },
  '5UX': { make: 'BMW', country: 'USA', plant: 'Spartanburg, South Carolina' },
  '5UJ': { make: 'BMW', country: 'USA', plant: 'Spartanburg, South Carolina' },

  // Volkswagen
  'WVW': { make: 'Volkswagen', country: 'Germany', division: 'Volkswagen' },
  'WVG': { make: 'Volkswagen', country: 'Germany', division: 'Volkswagen SUV' },
  '3VW': { make: 'Volkswagen', country: 'Mexico', division: 'Volkswagen' },
  '1VW': { make: 'Volkswagen', country: 'USA', plant: 'Chattanooga, Tennessee' },

  // Rivian
  '7FC': { make: 'Rivian', country: 'USA', plant: 'Normal, Illinois' },
  '7PD': { make: 'Rivian', country: 'USA', plant: 'Normal, Illinois' },

  // Polestar (via Volvo)
  'YS3': { make: 'Polestar', country: 'Sweden', note: 'Via Volvo' },
  'LP0': { make: 'Polestar', country: 'China', plant: 'Luqiao, Taizhou' },

  // Lucid
  '7LU': { make: 'Lucid', country: 'USA', plant: 'Casa Grande, Arizona' },

  // Mercedes-Benz
  'WDD': { make: 'Mercedes-Benz', country: 'Germany', division: 'Mercedes-Benz' },
  'WDC': { make: 'Mercedes-Benz', country: 'Germany', division: 'Mercedes-Benz SUV' },
  'WDF': { make: 'Mercedes-Benz', country: 'Germany', division: 'Mercedes-Benz Vans' },
  '4JG': { make: 'Mercedes-Benz', country: 'USA', plant: 'Tuscaloosa, Alabama' },
  'W1K': { make: 'Mercedes-Benz', country: 'Germany', division: 'Mercedes-Benz EQ' },
  'W1N': { make: 'Mercedes-Benz', country: 'Germany', division: 'Mercedes-Benz EQ SUV' },

  // Audi
  'WAU': { make: 'Audi', country: 'Germany', division: 'Audi' },
  'WUA': { make: 'Audi', country: 'Germany', division: 'Audi Quattro' },

  // Porsche
  'WP0': { make: 'Porsche', country: 'Germany', division: 'Porsche' },
  'WP1': { make: 'Porsche', country: 'Germany', division: 'Porsche SUV' },

  // Volvo
  'YV1': { make: 'Volvo', country: 'Sweden', division: 'Volvo' },
  'YV4': { make: 'Volvo', country: 'Sweden', division: 'Volvo SUV' },

  // Toyota
  'JTD': { make: 'Toyota', country: 'Japan', division: 'Toyota' },
  'JTM': { make: 'Toyota', country: 'Japan', division: 'Toyota Multi-Purpose' },
  '2T1': { make: 'Toyota', country: 'Canada', division: 'Toyota' },
  '4T1': { make: 'Toyota', country: 'USA', division: 'Toyota' },
  '5TD': { make: 'Toyota', country: 'USA', division: 'Toyota' },

  // Honda
  'JHM': { make: 'Honda', country: 'Japan', division: 'Honda' },
  '1HG': { make: 'Honda', country: 'USA', division: 'Honda' },
  '2HG': { make: 'Honda', country: 'Canada', division: 'Honda' },
  '5FN': { make: 'Honda', country: 'USA', division: 'Honda' },

  // Genesis
  'KMT': { make: 'Genesis', country: 'South Korea', division: 'Genesis' },

  // Cadillac
  '1GY': { make: 'Cadillac', country: 'USA', division: 'Cadillac' },
};

/**
 * Year code mapping (position 10)
 * Cycles every 30 years, so context is important
 */
const YEAR_CODES = {
  'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
  'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
  'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
  'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
  'Y': 2030, '1': 2031, '2': 2032, '3': 2033, '4': 2034,
  '5': 2035, '6': 2036, '7': 2037, '8': 2038, '9': 2039,
};

/**
 * Country of origin from first character
 */
const COUNTRY_CODES = {
  '1': 'USA', '4': 'USA', '5': 'USA',
  '2': 'Canada',
  '3': 'Mexico',
  'J': 'Japan',
  'K': 'South Korea',
  'L': 'China',
  'S': 'United Kingdom',
  'T': 'Switzerland',
  'V': 'France',
  'W': 'Germany',
  'X': 'Russia',
  'Y': 'Sweden', // Also Finland
  'Z': 'Italy',
  '6': 'Australia',
  '7': 'New Zealand', // Also 7 = France for some
  '8': 'Argentina',
  '9': 'Brazil',
};

/**
 * Tesla-specific VDS decoding (position 4)
 * Tesla uses position 4 to identify the model line
 */
const TESLA_MODEL_CODES = {
  '3': { model: 'Model 3' },           // Model 3
  'Y': { model: 'Model Y' },           // Model Y
  'S': { model: 'Model S' },           // Model S
  'X': { model: 'Model X' },           // Model X
  'E': { model: 'Model 3/Y', note: 'May be Model 3 or Model Y' }, // Early Model 3
  'C': { model: 'Cybertruck' },        // Cybertruck
  'R': { model: 'Roadster' },          // Roadster
  'T': { model: 'Semi' },              // Tesla Semi
};

/**
 * Chevrolet Bolt VDS decoding
 * Position 4-5 helps identify Bolt EV vs Bolt EUV
 */
const CHEVROLET_BOLT_CODES = {
  'ZE': { model: 'Bolt EV', bodyStyle: 'Hatchback' },
  'ZU': { model: 'Bolt EUV', bodyStyle: 'Crossover' },
  'ZW': { model: 'Bolt EV', bodyStyle: 'Hatchback', note: '2022+ refresh' },
};

/**
 * Transliteration values for check digit calculation
 */
const TRANSLITERATION = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
  'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
  'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
};

/**
 * Position weights for check digit calculation
 */
const POSITION_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Calculate the check digit for a VIN
 * @param {string} vin - The VIN to calculate check digit for
 * @returns {string} The calculated check digit (0-9 or X)
 */
function calculateCheckDigit(vin) {
  const upperVin = vin.toUpperCase();
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    if (i === 8) continue; // Skip check digit position
    const char = upperVin[i];
    const value = TRANSLITERATION[char];
    if (value === undefined) return null;
    sum += value * POSITION_WEIGHTS[i];
  }

  const remainder = sum % 11;
  return remainder === 10 ? 'X' : String(remainder);
}

/**
 * Validate a VIN and return validation results
 * @param {string} vin - The VIN to validate
 * @returns {Object} Validation result with valid boolean and errors array
 */
export function validateVIN(vin) {
  const errors = [];

  // Check for null/undefined
  if (!vin) {
    return { valid: false, errors: ['VIN is required'] };
  }

  const cleanVin = vin.toString().toUpperCase().trim();

  // Check length
  if (cleanVin.length !== 17) {
    errors.push(`VIN must be exactly 17 characters (got ${cleanVin.length})`);
  }

  // Check for invalid characters (I, O, Q)
  for (const char of INVALID_CHARACTERS) {
    if (cleanVin.includes(char)) {
      errors.push(`Invalid character '${char}' found (I, O, Q are not allowed in VINs)`);
    }
  }

  // Check for valid alphanumeric only
  if (!/^[A-HJ-NPR-Z0-9]+$/.test(cleanVin)) {
    errors.push('VIN contains invalid characters (only A-H, J-N, P-R, S-Z, and 0-9 are allowed)');
  }

  // Validate check digit (position 9)
  if (cleanVin.length === 17 && errors.length === 0) {
    const expectedCheckDigit = calculateCheckDigit(cleanVin);
    const actualCheckDigit = cleanVin[8];

    if (expectedCheckDigit && actualCheckDigit !== expectedCheckDigit) {
      errors.push(`Check digit validation failed (expected '${expectedCheckDigit}', got '${actualCheckDigit}')`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Decode a VIN and extract vehicle information
 * @param {string} vin - The VIN to decode
 * @returns {Object} Decoded VIN information
 */
export function decodeVIN(vin) {
  const validation = validateVIN(vin);
  const cleanVin = (vin || '').toString().toUpperCase().trim();

  if (cleanVin.length !== 17) {
    return {
      isValid: false,
      errors: validation.errors,
      rawVin: vin,
    };
  }

  // Extract WMI (positions 1-3)
  const wmi = cleanVin.substring(0, 3);
  const wmiInfo = WMI_DATABASE[wmi] || null;

  // Extract VDS (positions 4-8)
  const vds = cleanVin.substring(3, 8);

  // Extract check digit (position 9)
  const checkDigit = cleanVin[8];

  // Extract year code (position 10)
  const yearCode = cleanVin[9];
  const year = YEAR_CODES[yearCode] || null;

  // Extract plant code (position 11)
  const plantCode = cleanVin[10];

  // Extract serial number (positions 12-17)
  const serialNumber = cleanVin.substring(11);

  // Determine country from first character
  const countryCode = cleanVin[0];
  const country = COUNTRY_CODES[countryCode] || 'Unknown';

  // Manufacturer info
  let make = wmiInfo?.make || null;
  let model = null;
  let modelDetails = null;

  // Tesla-specific decoding
  if (make === 'Tesla') {
    const teslaModelCode = cleanVin[3];
    const teslaInfo = TESLA_MODEL_CODES[teslaModelCode];
    if (teslaInfo) {
      model = teslaInfo.model;
      modelDetails = teslaInfo.note || null;
    }
  }

  // Chevrolet Bolt-specific decoding
  if (make === 'Chevrolet') {
    const boltCode = cleanVin.substring(4, 6);
    const boltInfo = CHEVROLET_BOLT_CODES[boltCode];
    if (boltInfo) {
      model = boltInfo.model;
      modelDetails = boltInfo.bodyStyle;
    }
  }

  // Calculate confidence score
  let confidence = 0;
  if (validation.valid) confidence += 40;
  if (wmiInfo) confidence += 30;
  if (year) confidence += 15;
  if (model) confidence += 15;

  return {
    isValid: validation.valid,
    errors: validation.errors,
    confidence,

    // Decoded data
    year,
    make,
    model,
    modelDetails,
    country,

    // Manufacturing info
    plantCountry: wmiInfo?.country || country,
    plant: wmiInfo?.plant || null,
    division: wmiInfo?.division || null,

    // VIN components
    rawData: {
      vin: cleanVin,
      wmi,
      vds,
      checkDigit,
      yearCode,
      plantCode,
      serialNumber,
    },
  };
}

/**
 * Get human-readable insights about a VIN
 * @param {string} vin - The VIN to analyze
 * @returns {Object} Human-readable analysis
 */
export function getVINInsights(vin) {
  const decoded = decodeVIN(vin);
  const insights = [];
  const warnings = [];

  // Even for invalid VINs, we still try to provide insights
  // since check digits are often transcribed incorrectly
  if (!decoded.isValid) {
    // Add validation errors as warnings, not as blocking errors
    warnings.push(...decoded.errors);
  }

  // Build insights
  if (decoded.make && decoded.model) {
    insights.push(`Vehicle identified as ${decoded.year || 'Unknown year'} ${decoded.make} ${decoded.model}`);
  } else if (decoded.make) {
    insights.push(`Manufacturer: ${decoded.make}`);
  }

  if (decoded.country) {
    insights.push(`Country of origin: ${decoded.country}`);
  }

  if (decoded.plant) {
    insights.push(`Manufactured at: ${decoded.plant}`);
  }

  if (decoded.plantCountry && decoded.plantCountry !== decoded.country) {
    insights.push(`Assembly country: ${decoded.plantCountry}`);
  }

  // EV-specific insights
  const evMakes = ['Tesla', 'Rivian', 'Lucid', 'Polestar'];
  const evModels = ['Bolt EV', 'Bolt EUV', 'Model 3', 'Model Y', 'Model S', 'Model X',
                   'Leaf', 'Ioniq 5', 'Ioniq 6', 'EV6', 'Mustang Mach-E', 'ID.4'];

  if (evMakes.includes(decoded.make) || evModels.includes(decoded.model)) {
    insights.push('This is an electric vehicle (EV)');
  }

  // Warnings for suspicious patterns
  if (decoded.year && decoded.year > new Date().getFullYear() + 1) {
    warnings.push('Year code indicates a future model year - verify VIN is correct');
  }

  if (!decoded.make) {
    warnings.push('Manufacturer not recognized - may be a rare or specialty vehicle');
  }

  // Build summary
  let summary;
  if (decoded.make && decoded.model && decoded.year) {
    summary = `${decoded.year} ${decoded.make} ${decoded.model}`;
    if (decoded.country) {
      summary += ` (${decoded.country})`;
    }
  } else if (decoded.make && decoded.year) {
    summary = `${decoded.year} ${decoded.make} vehicle`;
  } else if (decoded.make) {
    summary = `${decoded.make} vehicle`;
  } else {
    summary = `Vehicle from ${decoded.country || 'unknown origin'}`;
  }

  return {
    summary,
    isValid: decoded.isValid,
    confidence: decoded.confidence,
    insights,
    warnings,
    decoded,
  };
}

/**
 * Check if a string looks like a valid VIN format (without full validation)
 * Useful for quick filtering
 * @param {string} str - The string to check
 * @returns {boolean} True if string matches VIN pattern
 */
export function looksLikeVIN(str) {
  if (!str) return false;
  const clean = str.toString().toUpperCase().trim();
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(clean);
}

/**
 * Extract potential VINs from a block of text
 * @param {string} text - Text to search for VINs
 * @returns {string[]} Array of potential VINs found
 */
export function extractVINsFromText(text) {
  if (!text) return [];
  const pattern = /\b[A-HJ-NPR-Z0-9]{17}\b/g;
  const matches = text.toUpperCase().match(pattern) || [];
  // Filter to only return likely valid VINs
  return matches.filter(vin => {
    const validation = validateVIN(vin);
    return validation.valid;
  });
}

export default {
  validateVIN,
  decodeVIN,
  getVINInsights,
  looksLikeVIN,
  extractVINsFromText,
  // Export constants for advanced use
  WMI_DATABASE,
  YEAR_CODES,
  COUNTRY_CODES,
};
