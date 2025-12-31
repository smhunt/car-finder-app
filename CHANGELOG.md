# Changelog

All notable changes to EV Value Scorer will be documented in this file.

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
