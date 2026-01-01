# Changelog

All notable changes to Car Scorer will be documented in this file.

## [0.10.2] - 2025-01-01

### Added
- **Northern Ontario Location Presets** - Extended location coverage:
  - Barrie (~165 min, distance rating: 11)
  - Huntsville (~180 min, distance rating: 12)
  - Ottawa (~225 min, distance rating: 15)

## [0.10.1] - 2024-12-30

### Fixed
- VIN decoder now correctly identifies 2022+ Chevrolet Bolt EV/EUV models
- Added new Bolt VDS codes: FW, FX, FY, FZ for Gen 2 (2022-2023) models
- Fixed VIN position extraction bug (substring indexing) affecting Chevrolet, Hyundai, Kia, and Ford EV detection

## [0.10.0] - 2024-12-30

### Added
- **Enhanced VIN Decoder** with comprehensive vehicle details:
  - Full manufacturer names (e.g., "Tesla, Inc.", "General Motors - Chevrolet")
  - Assembly plant locations with city, state, and establishment year
  - Body type detection (Sedan, Crossover, SUV, Truck, etc.)
  - Drive type detection (RWD, AWD, FWD) from VDS codes
  - Battery pack information with capacity estimates
  - Model generation info (e.g., "Highland (2024+)" for Model 3)
  - Variant identification (Long Range, Performance, Standard Range, etc.)
- **Tesla-specific VDS decoding**:
  - Drive unit codes (Single Motor RWD, Dual Motor AWD, Tri Motor Plaid)
  - Battery pack codes with capacity estimates (~50-100 kWh)
  - Model generation detection for all Tesla models
- **Hyundai/Kia EV detection**: Ioniq 5, Ioniq 6, EV6, Niro EV with battery specs
- **Ford EV detection**: Mustang Mach-E variants, F-150 Lightning with battery info
- **Enhanced VINDisplay component** with card-like visual design:
  - Color-coded VIN segment breakdown with position labels (1-3, 4-8, etc.)
  - Hover tooltips showing segment meanings
  - Two-column detail grid with section headers (Vehicle Info, Manufacturing)
  - Confidence bar with percentage and level indicator (High/Medium/Low)
  - Electric vehicle badge indicator
  - Collapsible expanded view with full decoded details
  - Manufacturing section showing plant details and establishment year

### Changed
- VIN confidence scoring now accounts for drive type, battery info, and body type
- VIN segments now show position ranges for better understanding
- Improved visual hierarchy in VIN display with gradient backgrounds
- Insights now include drive configuration, battery pack, and generation info

## [0.9.0] - 2024-12-30

### Changed
- **DealerScraper UX Overhaul** - Improved the entire scrape-to-save user flow
  - Replaced confusing "URL Input" / "Paste JSON" toggle with clear primary/advanced pattern
  - JSON paste option now tucked in collapsible "Advanced" section for fallback use
  - Added dedicated "Review Scraped Data" step between scrape and save
  - Clear step progression: Input URL -> Scrape -> Review -> Save

### Added
- **Field Status Badges** - Visual indicators showing field detection status:
  - "Auto-detected" (green) - fields extracted automatically from the page
  - "Edited" (purple) - fields you've modified from the detected value
  - "Missing" (amber) - required fields that need manual entry
- **Field Statistics Summary** - Shows count of auto-detected, edited, and missing fields
- **ReviewField Component** - Reusable editable field with status tracking
- **Extraction Summary Card** - Shows vehicle preview with EV badge and confidence score
- **Clear Action Buttons** - "Cancel", "Save & Add Another", and "Save to Listings"
- Back navigation button in review mode header

### Improved
- Header dynamically changes between "Scrape Dealer Listing" and "Review Scraped Data"
- Error messages now include dismiss button
- Better visual hierarchy with grouped form sections (Core Info, Price/Mileage, Details)
- EV specs (Range, Length, Heat Pump) shown as read-only when detected
- Instructions panel updated with supported sites badges

## [0.8.0] - 2024-12-30

### Added
- VIN Decoder utility module with comprehensive analysis capabilities
- Basic VIN validation (17 characters, check digit, no I/O/Q)
- World Manufacturer Identifier (WMI) decoding for major EV manufacturers
  - Tesla (USA/China plants), Chevrolet/GM, Ford, Hyundai, Kia, Nissan
  - BMW, Volkswagen, Rivian, Polestar, Lucid, Mercedes-Benz, Audi, Porsche
- Model year decoding from VIN position 10 (2010-2039 support)
- Country of origin detection (USA, Canada, Mexico, Japan, Korea, Germany, etc.)
- Tesla-specific model decoding (Model 3, Y, S, X, Cybertruck, Semi)
- Chevrolet Bolt EV vs Bolt EUV detection
- VIN insights with confidence scoring and human-readable analysis
- VINDisplay component in DealerScraper showing decoded info
- Expandable VIN breakdown with color-coded segments (WMI, VDS, check, year, plant, serial)
- Validation warnings for check digit mismatches (still shows decoded info)

## [0.7.1] - 2024-12-30

### Added
- Proxy server for server-side page fetching (bypasses CORS)
- Direct URL scraping - just paste URL and click Scrape
- JSON-LD structured data extraction from pages
- DOM-based price/mileage extraction with smart selectors
- Enhanced CarCard expanded view with 12+ vehicle detail fields
- Smart make/model detection with prioritized sources (URL > og:title > title > header)
- Detection scoring system to pick best match (prevents wrong make detection)

## [0.7.0] - 2024-12-30

### Added
- Universal Dealer Scraper - extract vehicle data from any dealership website
- Intelligent pattern matching for price, mileage, VIN, year, make, model, color
- Automatic EV detection with known specs lookup (range, length, heat pump)
- Manual override fields for fine-tuning extracted data before adding
- Location preset selection for scraped listings
- Confidence scoring shows extraction quality (0-100%)
- Scraper utility module with browser-injectable script

## [0.6.0] - 2024-12-30

### Added
- Photo Attachments to save images with each listing
- Photo gallery with thumbnail grid in expanded card view
- Full-screen lightbox viewer with keyboard navigation (left/right arrows, Escape)
- Photo upload in step 3 of Add/Edit form with multi-file support
- Auto-resize images to 800px max dimension for efficient localStorage usage
- Camera icon indicator on car cards that have photos

## [0.5.0] - 2024-12-30

### Added
- Price History Tracking to monitor price changes over time
- Visual sparkline chart showing price trends in expanded card view
- Price drop/rise indicators on car cards (green down arrow for drops, red up for increases)
- Automatic price history recording when editing listings
- Total price change summary with percentage

## [0.4.0] - 2024-12-30

### Added
- Comparison View for side-by-side vehicle comparison (up to 3 vehicles)
- Compare mode with checkbox selection on car cards
- Comparison table highlights best values in green
- Compare button in header to toggle selection mode

## [0.3.0] - 2024-12-30

### Added
- Listing URL field to save dealer listing links with each vehicle
- URL input field in Add/Edit form (step 2 - Vehicle Details)
- Link icon indicator on car cards that have a URL saved
- "View Listing" button in expanded card view opens URL in new tab

## [0.2.0] - 2024-12-30

### Added
- Import/Export functionality for backing up and restoring listings
- Export saves listings and weights to a JSON file with timestamp
- Import loads data from a previously exported JSON file with validation
- Data section added to Weights panel for easy access to import/export

## [0.1.0] - 2024-12-30

### Added
- Initial release with Tally.so inspired design system
- Multi-criteria decision analysis (MCDA) scoring algorithm
- Vehicle database with autocomplete for popular EVs (Chevrolet, Hyundai, Kia, Nissan, Tesla, Ford, VW, BMW, Polestar, Rivian)
- Configurable weight sliders for 10 scoring criteria:
  - Price (lower is better)
  - Odometer (lower is better)
  - Range (higher is better)
  - Year (newer is better)
  - Trim Level (higher is better)
  - Distance (closer is better)
  - Remote Start (Fob+App is best)
  - Length (shorter is better)
  - Damage (less is better)
  - Heat Pump (yes is better)
- Local storage persistence for listings and weights
- Star/favorite functionality for top picks
- Add/Edit/Delete car listings with 3-step wizard modal
- Score breakdown visualization per vehicle
- Responsive design with mobile support
- Tally-inspired UI with Plus Jakarta Sans, Inter, and JetBrains Mono fonts
