# Changelog

All notable changes to EV Value Scorer will be documented in this file.

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
