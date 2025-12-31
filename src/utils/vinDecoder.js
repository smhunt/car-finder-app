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
  '5YJ': {
    make: 'Tesla',
    fullName: 'Tesla, Inc.',
    country: 'USA',
    plant: 'Fremont, California',
    plantCity: 'Fremont',
    plantState: 'CA',
    established: 2010,
  },
  'XP7': {
    make: 'Tesla',
    fullName: 'Tesla, Inc.',
    country: 'China',
    plant: 'Shanghai Gigafactory',
    plantCity: 'Shanghai',
    established: 2019,
    note: 'Gigafactory 3',
  },
  '7SA': {
    make: 'Tesla',
    fullName: 'Tesla, Inc.',
    country: 'USA',
    plant: 'Austin Gigafactory, Texas',
    plantCity: 'Austin',
    plantState: 'TX',
    established: 2022,
    note: 'Gigafactory Texas',
  },
  'LRW': {
    make: 'Tesla',
    fullName: 'Tesla, Inc.',
    country: 'China',
    plant: 'Shanghai Gigafactory',
    plantCity: 'Shanghai',
    established: 2019,
    note: 'Gigafactory 3',
  },

  // Chevrolet/GM
  '1G1': {
    make: 'Chevrolet',
    fullName: 'General Motors - Chevrolet',
    country: 'USA',
    division: 'Chevrolet Passenger',
    bodyType: 'Passenger Car',
  },
  '1GC': {
    make: 'Chevrolet',
    fullName: 'General Motors - Chevrolet',
    country: 'USA',
    division: 'Chevrolet Truck',
    bodyType: 'Truck/SUV',
  },
  '1GT': {
    make: 'GMC',
    fullName: 'General Motors - GMC',
    country: 'USA',
    division: 'GMC Truck',
    bodyType: 'Truck/SUV',
  },
  '2G1': {
    make: 'Chevrolet',
    fullName: 'General Motors - Chevrolet',
    country: 'Canada',
    division: 'Chevrolet',
    plant: 'Oshawa Assembly',
    plantCity: 'Oshawa',
    plantState: 'ON',
  },
  '3G1': {
    make: 'Chevrolet',
    fullName: 'General Motors - Chevrolet',
    country: 'Mexico',
    division: 'Chevrolet',
  },

  // Ford
  '1FA': {
    make: 'Ford',
    fullName: 'Ford Motor Company',
    country: 'USA',
    division: 'Ford Passenger',
    bodyType: 'Passenger Car',
  },
  '1FB': {
    make: 'Ford',
    fullName: 'Ford Motor Company',
    country: 'USA',
    division: 'Ford Bus/Van',
    bodyType: 'Van/Bus',
  },
  '1FM': {
    make: 'Ford',
    fullName: 'Ford Motor Company',
    country: 'USA',
    division: 'Ford Multi-Purpose',
    bodyType: 'SUV/Crossover',
  },
  '1FT': {
    make: 'Ford',
    fullName: 'Ford Motor Company',
    country: 'USA',
    division: 'Ford Truck',
    bodyType: 'Truck',
  },
  '3FA': {
    make: 'Ford',
    fullName: 'Ford Motor Company',
    country: 'Mexico',
    division: 'Ford',
    plant: 'Hermosillo Assembly',
    plantCity: 'Hermosillo',
  },
  '3FM': {
    make: 'Ford',
    fullName: 'Ford Motor Company',
    country: 'Mexico',
    division: 'Ford Multi-Purpose',
    bodyType: 'SUV/Crossover',
  },

  // Hyundai
  'KM8': {
    make: 'Hyundai',
    fullName: 'Hyundai Motor Company',
    country: 'South Korea',
    division: 'Hyundai',
    plant: 'Ulsan Plant',
    plantCity: 'Ulsan',
  },
  '5NM': {
    make: 'Hyundai',
    fullName: 'Hyundai Motor Company',
    country: 'USA',
    plant: 'Montgomery, Alabama',
    plantCity: 'Montgomery',
    plantState: 'AL',
    established: 2005,
  },
  '5NP': {
    make: 'Hyundai',
    fullName: 'Hyundai Motor Company',
    country: 'USA',
    plant: 'Montgomery, Alabama',
    plantCity: 'Montgomery',
    plantState: 'AL',
    established: 2005,
  },

  // Kia
  '5XY': {
    make: 'Kia',
    fullName: 'Kia Corporation',
    country: 'USA',
    plant: 'West Point, Georgia',
    plantCity: 'West Point',
    plantState: 'GA',
    established: 2009,
  },
  'KND': {
    make: 'Kia',
    fullName: 'Kia Corporation',
    country: 'South Korea',
    division: 'Kia',
    plant: 'Gwangju Plant',
    plantCity: 'Gwangju',
  },
  'KNA': {
    make: 'Kia',
    fullName: 'Kia Corporation',
    country: 'South Korea',
    division: 'Kia',
    plant: 'Hwaseong Plant',
    plantCity: 'Hwaseong',
  },

  // Nissan
  '1N4': {
    make: 'Nissan',
    fullName: 'Nissan Motor Corporation',
    country: 'USA',
    division: 'Nissan Passenger',
    plant: 'Smyrna, Tennessee',
    plantCity: 'Smyrna',
    plantState: 'TN',
  },
  '1N6': {
    make: 'Nissan',
    fullName: 'Nissan Motor Corporation',
    country: 'USA',
    division: 'Nissan Truck',
    bodyType: 'Truck',
    plant: 'Canton, Mississippi',
    plantCity: 'Canton',
    plantState: 'MS',
  },
  '3N1': {
    make: 'Nissan',
    fullName: 'Nissan Motor Corporation',
    country: 'Mexico',
    division: 'Nissan',
    plant: 'Aguascalientes Plant',
    plantCity: 'Aguascalientes',
  },
  'JN1': {
    make: 'Nissan',
    fullName: 'Nissan Motor Corporation',
    country: 'Japan',
    division: 'Nissan',
    plant: 'Oppama Plant',
    plantCity: 'Yokosuka',
  },
  'JN8': {
    make: 'Nissan',
    fullName: 'Nissan Motor Corporation',
    country: 'Japan',
    division: 'Nissan SUV',
    bodyType: 'SUV/Crossover',
  },

  // BMW
  'WBA': {
    make: 'BMW',
    fullName: 'Bayerische Motoren Werke AG',
    country: 'Germany',
    division: 'BMW',
    plant: 'Munich Plant',
    plantCity: 'Munich',
  },
  'WBS': {
    make: 'BMW',
    fullName: 'BMW M GmbH',
    country: 'Germany',
    division: 'BMW M',
    note: 'M Performance Division',
  },
  'WBY': {
    make: 'BMW',
    fullName: 'BMW i',
    country: 'Germany',
    division: 'BMW i',
    note: 'Electric/Hybrid Division',
    isElectric: true,
  },
  '5UX': {
    make: 'BMW',
    fullName: 'BMW Manufacturing Co.',
    country: 'USA',
    plant: 'Spartanburg, South Carolina',
    plantCity: 'Spartanburg',
    plantState: 'SC',
    bodyType: 'SUV/Crossover',
    established: 1994,
  },
  '5UJ': {
    make: 'BMW',
    fullName: 'BMW Manufacturing Co.',
    country: 'USA',
    plant: 'Spartanburg, South Carolina',
    plantCity: 'Spartanburg',
    plantState: 'SC',
    established: 1994,
  },

  // Volkswagen
  'WVW': {
    make: 'Volkswagen',
    fullName: 'Volkswagen AG',
    country: 'Germany',
    division: 'Volkswagen',
    plant: 'Wolfsburg Plant',
    plantCity: 'Wolfsburg',
  },
  'WVG': {
    make: 'Volkswagen',
    fullName: 'Volkswagen AG',
    country: 'Germany',
    division: 'Volkswagen SUV',
    bodyType: 'SUV/Crossover',
  },
  '3VW': {
    make: 'Volkswagen',
    fullName: 'Volkswagen de Mexico',
    country: 'Mexico',
    division: 'Volkswagen',
    plant: 'Puebla Plant',
    plantCity: 'Puebla',
  },
  '1VW': {
    make: 'Volkswagen',
    fullName: 'Volkswagen Group of America',
    country: 'USA',
    plant: 'Chattanooga, Tennessee',
    plantCity: 'Chattanooga',
    plantState: 'TN',
    established: 2011,
  },

  // Rivian
  '7FC': {
    make: 'Rivian',
    fullName: 'Rivian Automotive, LLC',
    country: 'USA',
    plant: 'Normal, Illinois',
    plantCity: 'Normal',
    plantState: 'IL',
    established: 2021,
    isElectric: true,
    note: 'Electric-only manufacturer',
  },
  '7PD': {
    make: 'Rivian',
    fullName: 'Rivian Automotive, LLC',
    country: 'USA',
    plant: 'Normal, Illinois',
    plantCity: 'Normal',
    plantState: 'IL',
    established: 2021,
    isElectric: true,
    note: 'Electric-only manufacturer',
  },

  // Polestar (via Volvo)
  'YS3': {
    make: 'Polestar',
    fullName: 'Polestar Performance AB',
    country: 'Sweden',
    note: 'Via Volvo heritage',
    isElectric: true,
  },
  'LP0': {
    make: 'Polestar',
    fullName: 'Polestar Automotive',
    country: 'China',
    plant: 'Luqiao, Taizhou',
    plantCity: 'Taizhou',
    established: 2020,
    isElectric: true,
  },

  // Lucid
  '7LU': {
    make: 'Lucid',
    fullName: 'Lucid Motors, Inc.',
    country: 'USA',
    plant: 'Casa Grande, Arizona',
    plantCity: 'Casa Grande',
    plantState: 'AZ',
    established: 2021,
    isElectric: true,
    note: 'AMP-1 Advanced Manufacturing Plant',
  },

  // Mercedes-Benz
  'WDD': {
    make: 'Mercedes-Benz',
    fullName: 'Mercedes-Benz AG',
    country: 'Germany',
    division: 'Mercedes-Benz',
    plant: 'Sindelfingen Plant',
    plantCity: 'Sindelfingen',
  },
  'WDC': {
    make: 'Mercedes-Benz',
    fullName: 'Mercedes-Benz AG',
    country: 'Germany',
    division: 'Mercedes-Benz SUV',
    bodyType: 'SUV/Crossover',
  },
  'WDF': {
    make: 'Mercedes-Benz',
    fullName: 'Mercedes-Benz AG',
    country: 'Germany',
    division: 'Mercedes-Benz Vans',
    bodyType: 'Van',
  },
  '4JG': {
    make: 'Mercedes-Benz',
    fullName: 'Mercedes-Benz U.S. International',
    country: 'USA',
    plant: 'Tuscaloosa, Alabama',
    plantCity: 'Tuscaloosa',
    plantState: 'AL',
    bodyType: 'SUV/Crossover',
    established: 1997,
  },
  'W1K': {
    make: 'Mercedes-Benz',
    fullName: 'Mercedes-Benz EQ',
    country: 'Germany',
    division: 'Mercedes-Benz EQ',
    isElectric: true,
    note: 'EQ Electric Division',
  },
  'W1N': {
    make: 'Mercedes-Benz',
    fullName: 'Mercedes-Benz EQ',
    country: 'Germany',
    division: 'Mercedes-Benz EQ SUV',
    bodyType: 'SUV/Crossover',
    isElectric: true,
    note: 'EQ Electric Division',
  },

  // Audi
  'WAU': {
    make: 'Audi',
    fullName: 'Audi AG',
    country: 'Germany',
    division: 'Audi',
    plant: 'Ingolstadt Plant',
    plantCity: 'Ingolstadt',
  },
  'WUA': {
    make: 'Audi',
    fullName: 'Audi AG - quattro GmbH',
    country: 'Germany',
    division: 'Audi Quattro',
    driveType: 'AWD',
    note: 'High-performance quattro variants',
  },

  // Porsche
  'WP0': {
    make: 'Porsche',
    fullName: 'Dr. Ing. h.c. F. Porsche AG',
    country: 'Germany',
    division: 'Porsche',
    plant: 'Zuffenhausen Plant',
    plantCity: 'Stuttgart-Zuffenhausen',
  },
  'WP1': {
    make: 'Porsche',
    fullName: 'Dr. Ing. h.c. F. Porsche AG',
    country: 'Germany',
    division: 'Porsche SUV',
    bodyType: 'SUV/Crossover',
    plant: 'Leipzig Plant',
    plantCity: 'Leipzig',
  },

  // Volvo
  'YV1': {
    make: 'Volvo',
    fullName: 'Volvo Car Corporation',
    country: 'Sweden',
    division: 'Volvo',
    plant: 'Torslanda Plant',
    plantCity: 'Gothenburg',
  },
  'YV4': {
    make: 'Volvo',
    fullName: 'Volvo Car Corporation',
    country: 'Sweden',
    division: 'Volvo SUV',
    bodyType: 'SUV/Crossover',
  },

  // Toyota
  'JTD': {
    make: 'Toyota',
    fullName: 'Toyota Motor Corporation',
    country: 'Japan',
    division: 'Toyota',
  },
  'JTM': {
    make: 'Toyota',
    fullName: 'Toyota Motor Corporation',
    country: 'Japan',
    division: 'Toyota Multi-Purpose',
    bodyType: 'SUV/Crossover',
  },
  '2T1': {
    make: 'Toyota',
    fullName: 'Toyota Motor Manufacturing Canada',
    country: 'Canada',
    division: 'Toyota',
    plant: 'Cambridge, Ontario',
    plantCity: 'Cambridge',
    plantState: 'ON',
  },
  '4T1': {
    make: 'Toyota',
    fullName: 'Toyota Motor Manufacturing USA',
    country: 'USA',
    division: 'Toyota',
    plant: 'Georgetown, Kentucky',
    plantCity: 'Georgetown',
    plantState: 'KY',
  },
  '5TD': {
    make: 'Toyota',
    fullName: 'Toyota Motor Manufacturing USA',
    country: 'USA',
    division: 'Toyota',
    plant: 'Princeton, Indiana',
    plantCity: 'Princeton',
    plantState: 'IN',
  },

  // Honda
  'JHM': {
    make: 'Honda',
    fullName: 'Honda Motor Co., Ltd.',
    country: 'Japan',
    division: 'Honda',
    plant: 'Sayama Plant',
    plantCity: 'Sayama',
  },
  '1HG': {
    make: 'Honda',
    fullName: 'Honda of America Manufacturing',
    country: 'USA',
    division: 'Honda',
    plant: 'Marysville, Ohio',
    plantCity: 'Marysville',
    plantState: 'OH',
    established: 1982,
  },
  '2HG': {
    make: 'Honda',
    fullName: 'Honda Canada Manufacturing',
    country: 'Canada',
    division: 'Honda',
    plant: 'Alliston, Ontario',
    plantCity: 'Alliston',
    plantState: 'ON',
  },
  '5FN': {
    make: 'Honda',
    fullName: 'Honda Manufacturing of Alabama',
    country: 'USA',
    division: 'Honda',
    plant: 'Lincoln, Alabama',
    plantCity: 'Lincoln',
    plantState: 'AL',
  },

  // Genesis
  'KMT': {
    make: 'Genesis',
    fullName: 'Genesis Motor, LLC',
    country: 'South Korea',
    division: 'Genesis',
    plant: 'Ulsan Plant',
    plantCity: 'Ulsan',
    note: 'Hyundai luxury division',
  },

  // Cadillac
  '1GY': {
    make: 'Cadillac',
    fullName: 'General Motors - Cadillac',
    country: 'USA',
    division: 'Cadillac',
    plant: 'Spring Hill, Tennessee',
    plantCity: 'Spring Hill',
    plantState: 'TN',
  },
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
  '3': { model: 'Model 3', bodyType: 'Sedan', generation: 'Highland (2024+) or Original' },
  'Y': { model: 'Model Y', bodyType: 'Crossover SUV', generation: 'Juniper (2025+) or Original' },
  'S': { model: 'Model S', bodyType: 'Sedan', generation: 'Plaid/Refresh (2021+) or Original' },
  'X': { model: 'Model X', bodyType: 'SUV', generation: 'Plaid/Refresh (2021+) or Original' },
  'E': { model: 'Model 3/Y', bodyType: 'Sedan/Crossover', note: 'Early production - may be Model 3 or Model Y' },
  'C': { model: 'Cybertruck', bodyType: 'Pickup Truck', generation: 'First Generation (2023+)' },
  'R': { model: 'Roadster', bodyType: 'Sports Car', generation: 'Next-Gen Roadster' },
  'T': { model: 'Semi', bodyType: 'Semi Truck', generation: 'Production (2022+)' },
};

/**
 * Tesla VDS position 5 - Drive unit/motor type
 */
const TESLA_DRIVE_CODES = {
  'A': { driveType: 'Single Motor RWD', note: 'Standard Range' },
  'D': { driveType: 'Dual Motor AWD', note: 'Long Range or Performance' },
  'E': { driveType: 'Dual Motor AWD', note: 'Performance variant' },
  'F': { driveType: 'Single Motor RWD', note: 'Standard Range Plus' },
  'G': { driveType: 'Single Motor RWD', note: 'Standard Range (newer)' },
  'K': { driveType: 'Dual Motor AWD', note: 'Performance (Plaid)' },
  'L': { driveType: 'Dual Motor AWD', note: 'Long Range' },
  'N': { driveType: 'Tri Motor AWD', note: 'Plaid (Model S/X)' },
  'P': { driveType: 'Dual Motor AWD', note: 'Performance' },
  'W': { driveType: 'Single Motor RWD', note: 'Base/Standard' },
};

/**
 * Tesla battery pack codes (extracted from VDS)
 */
const TESLA_BATTERY_CODES = {
  'A': { battery: 'Standard Range', capacity: '~50-54 kWh' },
  'B': { battery: 'Standard Range Plus', capacity: '~54-57 kWh' },
  'C': { battery: 'Mid Range', capacity: '~62 kWh' },
  'E': { battery: 'Long Range', capacity: '~75-82 kWh' },
  'F': { battery: 'Standard Range', capacity: '~50-54 kWh' },
  'H': { battery: 'Long Range', capacity: '~100 kWh' },
  'K': { battery: 'Performance', capacity: '~75-82 kWh' },
  'L': { battery: 'Long Range', capacity: '~75-82 kWh' },
  'N': { battery: 'Long Range Plus', capacity: '~82 kWh' },
  'P': { battery: 'Performance', capacity: '~75-82 kWh' },
  'R': { battery: 'Standard Range', capacity: '~50 kWh' },
  'S': { battery: 'Plaid/Performance', capacity: '~100 kWh' },
  'V': { battery: 'Standard Range', capacity: '~60 kWh' },
};

/**
 * Chevrolet Bolt VDS decoding
 * Position 4-5 helps identify Bolt EV vs Bolt EUV
 */
const CHEVROLET_BOLT_CODES = {
  'ZE': {
    model: 'Bolt EV',
    bodyType: 'Hatchback',
    driveType: 'FWD',
    battery: '65 kWh (usable 60 kWh)',
    generation: 'Gen 1 (2017-2021)',
  },
  'ZU': {
    model: 'Bolt EUV',
    bodyType: 'Crossover',
    driveType: 'FWD',
    battery: '65 kWh (usable 60 kWh)',
    generation: 'Gen 1 (2022-2023)',
    note: 'Extended Utility Vehicle - larger than Bolt EV',
  },
  'ZW': {
    model: 'Bolt EV',
    bodyType: 'Hatchback',
    driveType: 'FWD',
    battery: '65 kWh (usable 60 kWh)',
    generation: 'Gen 1 Refresh (2022-2023)',
    note: 'Refreshed exterior and interior',
  },
};

/**
 * Hyundai/Kia EV model codes
 */
const HYUNDAI_KIA_EV_CODES = {
  // Hyundai Ioniq 5
  'C3': { model: 'Ioniq 5', bodyType: 'Crossover', battery: '77.4 kWh', driveType: 'RWD or AWD' },
  'C4': { model: 'Ioniq 5', bodyType: 'Crossover', battery: '58 kWh', driveType: 'RWD' },
  // Hyundai Ioniq 6
  'C5': { model: 'Ioniq 6', bodyType: 'Sedan', battery: '77.4 kWh', driveType: 'RWD or AWD' },
  // Kia EV6
  'E6': { model: 'EV6', bodyType: 'Crossover', battery: '77.4 kWh', driveType: 'RWD or AWD' },
  'E4': { model: 'EV6', bodyType: 'Crossover', battery: '58 kWh', driveType: 'RWD' },
  // Kia Niro EV
  'E2': { model: 'Niro EV', bodyType: 'Crossover', battery: '64.8 kWh', driveType: 'FWD' },
};

/**
 * Ford EV model codes
 */
const FORD_EV_CODES = {
  // Mustang Mach-E
  'AA': { model: 'Mustang Mach-E', bodyType: 'Crossover', variant: 'Select RWD', battery: '68 kWh', driveType: 'RWD' },
  'AB': { model: 'Mustang Mach-E', bodyType: 'Crossover', variant: 'Select AWD', battery: '68 kWh', driveType: 'AWD' },
  'AC': { model: 'Mustang Mach-E', bodyType: 'Crossover', variant: 'Premium', battery: '88 kWh', driveType: 'RWD or AWD' },
  'AD': { model: 'Mustang Mach-E', bodyType: 'Crossover', variant: 'California Route 1', battery: '88 kWh', driveType: 'RWD' },
  'AE': { model: 'Mustang Mach-E', bodyType: 'Crossover', variant: 'GT', battery: '88 kWh', driveType: 'AWD' },
  // F-150 Lightning
  'K8': { model: 'F-150 Lightning', bodyType: 'Pickup Truck', variant: 'Standard Range', battery: '98 kWh', driveType: 'AWD' },
  'K9': { model: 'F-150 Lightning', bodyType: 'Pickup Truck', variant: 'Extended Range', battery: '131 kWh', driveType: 'AWD' },
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
  let fullManufacturerName = wmiInfo?.fullName || null;
  let model = null;
  let modelDetails = null;
  let bodyType = wmiInfo?.bodyType || null;
  let driveType = wmiInfo?.driveType || null;
  let batteryInfo = null;
  let generation = null;
  let variant = null;
  let isElectric = wmiInfo?.isElectric || false;

  // Tesla-specific decoding
  if (make === 'Tesla') {
    isElectric = true;
    const teslaModelCode = cleanVin[3];
    const teslaInfo = TESLA_MODEL_CODES[teslaModelCode];
    if (teslaInfo) {
      model = teslaInfo.model;
      modelDetails = teslaInfo.note || null;
      bodyType = teslaInfo.bodyType || bodyType;
      generation = teslaInfo.generation || null;
    }

    // Tesla drive type from position 5
    const teslaDriveCode = cleanVin[4];
    const teslaDriveInfo = TESLA_DRIVE_CODES[teslaDriveCode];
    if (teslaDriveInfo) {
      driveType = teslaDriveInfo.driveType;
      variant = teslaDriveInfo.note;
    }

    // Tesla battery info from position 6 or 7
    const teslaBatteryCode = cleanVin[5];
    const teslaBatteryInfo = TESLA_BATTERY_CODES[teslaBatteryCode];
    if (teslaBatteryInfo) {
      batteryInfo = {
        type: teslaBatteryInfo.battery,
        capacity: teslaBatteryInfo.capacity,
      };
    }
  }

  // Chevrolet Bolt-specific decoding
  if (make === 'Chevrolet') {
    const boltCode = cleanVin.substring(4, 6);
    const boltInfo = CHEVROLET_BOLT_CODES[boltCode];
    if (boltInfo) {
      isElectric = true;
      model = boltInfo.model;
      modelDetails = boltInfo.note || null;
      bodyType = boltInfo.bodyType || bodyType;
      driveType = boltInfo.driveType || driveType;
      generation = boltInfo.generation || null;
      if (boltInfo.battery) {
        batteryInfo = { capacity: boltInfo.battery };
      }
    }
  }

  // Hyundai/Kia EV decoding
  if (make === 'Hyundai' || make === 'Kia') {
    const evCode = cleanVin.substring(4, 6);
    const evInfo = HYUNDAI_KIA_EV_CODES[evCode];
    if (evInfo) {
      isElectric = true;
      model = evInfo.model;
      bodyType = evInfo.bodyType || bodyType;
      driveType = evInfo.driveType || driveType;
      if (evInfo.battery) {
        batteryInfo = { capacity: evInfo.battery };
      }
    }
  }

  // Ford EV decoding
  if (make === 'Ford') {
    const fordEvCode = cleanVin.substring(4, 6);
    const fordEvInfo = FORD_EV_CODES[fordEvCode];
    if (fordEvInfo) {
      isElectric = true;
      model = fordEvInfo.model;
      bodyType = fordEvInfo.bodyType || bodyType;
      driveType = fordEvInfo.driveType || driveType;
      variant = fordEvInfo.variant || variant;
      if (fordEvInfo.battery) {
        batteryInfo = { capacity: fordEvInfo.battery };
      }
    }
  }

  // Calculate confidence score
  let confidence = 0;
  if (validation.valid) confidence += 35;
  if (wmiInfo) confidence += 25;
  if (year) confidence += 10;
  if (model) confidence += 15;
  if (driveType) confidence += 5;
  if (batteryInfo) confidence += 5;
  if (bodyType) confidence += 5;

  // Format plant location nicely
  let plantLocation = null;
  if (wmiInfo?.plant) {
    plantLocation = wmiInfo.plant;
  } else if (wmiInfo?.plantCity) {
    plantLocation = wmiInfo.plantCity;
    if (wmiInfo.plantState) {
      plantLocation += `, ${wmiInfo.plantState}`;
    }
  }

  return {
    isValid: validation.valid,
    errors: validation.errors,
    confidence,

    // Decoded data
    year,
    make,
    fullManufacturerName,
    model,
    modelDetails,
    country,

    // Vehicle details
    bodyType,
    driveType,
    batteryInfo,
    generation,
    variant,
    isElectric,

    // Manufacturing info
    plantCountry: wmiInfo?.country || country,
    plant: plantLocation,
    plantCity: wmiInfo?.plantCity || null,
    plantState: wmiInfo?.plantState || null,
    plantEstablished: wmiInfo?.established || null,
    division: wmiInfo?.division || null,
    manufacturerNote: wmiInfo?.note || null,

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

  // Drive type insight
  if (decoded.driveType) {
    insights.push(`Drive configuration: ${decoded.driveType}`);
  }

  // Battery info insight
  if (decoded.batteryInfo) {
    const batteryDesc = decoded.batteryInfo.type || 'Battery';
    const capacity = decoded.batteryInfo.capacity ? ` - ${decoded.batteryInfo.capacity}` : '';
    insights.push(`Battery pack: ${batteryDesc}${capacity}`);
  }

  // Body type insight
  if (decoded.bodyType) {
    insights.push(`Body style: ${decoded.bodyType}`);
  }

  // Generation info
  if (decoded.generation) {
    insights.push(`Generation: ${decoded.generation}`);
  }

  // EV-specific insights - now using the isElectric flag from decoder
  if (decoded.isElectric) {
    insights.push('This is an electric vehicle (EV)');
  } else {
    // Fallback to pattern matching for EVs not detected via VDS
    const evMakes = ['Tesla', 'Rivian', 'Lucid', 'Polestar'];
    const evModels = ['Bolt EV', 'Bolt EUV', 'Model 3', 'Model Y', 'Model S', 'Model X',
                     'Leaf', 'Ioniq 5', 'Ioniq 6', 'EV6', 'Mustang Mach-E', 'ID.4', 'F-150 Lightning'];

    if (evMakes.includes(decoded.make) || evModels.includes(decoded.model)) {
      insights.push('This is an electric vehicle (EV)');
    }
  }

  // Plant establishment date
  if (decoded.plantEstablished) {
    const yearsOld = new Date().getFullYear() - decoded.plantEstablished;
    insights.push(`Assembly plant operating for ${yearsOld}+ years (est. ${decoded.plantEstablished})`);
  }

  // Manufacturer note
  if (decoded.manufacturerNote) {
    insights.push(decoded.manufacturerNote);
  }

  // Warnings for suspicious patterns
  if (decoded.year && decoded.year > new Date().getFullYear() + 1) {
    warnings.push('Year code indicates a future model year - verify VIN is correct');
  }

  if (!decoded.make) {
    warnings.push('Manufacturer not recognized - may be a rare or specialty vehicle');
  }

  // Build summary - include drive type in summary if available
  let summary;
  if (decoded.make && decoded.model && decoded.year) {
    summary = `${decoded.year} ${decoded.make} ${decoded.model}`;
    if (decoded.variant) {
      summary += ` ${decoded.variant}`;
    }
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
