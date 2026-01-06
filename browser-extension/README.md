# EV Finder Browser Extension

**Intelligent Data Extraction UI** for quickly saving vehicle listings to EV Finder.

Inspired by [Huntr's](https://huntr.co) job tracking extension - this extension scans vehicle listing pages and extracts relevant data, showing you a preview before saving.

## Features

### Intelligent Data Extraction
- **Auto-detect supported sites**: AutoTrader.ca, Kijiji.ca, CarGurus, Cars.com
- **Smart parsing**: Extracts year, make, model, trim, price, odometer, dealer, location
- **EV database matching**: Auto-fills range, heat pump status, and vehicle length for known EVs
- **VIN detection**: Automatically finds and validates VINs on the page

### Highlight Mode (Unsupported Sites)
For sites we don't have specific scrapers for:
1. Click a form field in the popup
2. Highlight text on the page
3. Text automatically fills into the selected field
4. Focus moves to the next field

### Keywords Panel
Extracts and categorizes relevant keywords from the listing:
- Vehicle specs (EV, AWD, FWD, etc.)
- Features (Heat Pump, Sunroof, Leather, etc.)

## Installation

### Development Mode
1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder

### Creating Icons
The extension needs PNG icons. Convert the SVG:
```bash
# Using ImageMagick
convert -background none icons/icon.svg -resize 16x16 icons/icon16.png
convert -background none icons/icon.svg -resize 32x32 icons/icon32.png
convert -background none icons/icon.svg -resize 48x48 icons/icon48.png
convert -background none icons/icon.svg -resize 128x128 icons/icon128.png
```

Or use an online SVG to PNG converter.

## Usage

1. Navigate to a vehicle listing page (AutoTrader, Kijiji, etc.)
2. Click the EV Finder extension icon
3. Review the auto-extracted data
4. Edit any fields as needed
5. Click "Save to Board"

## Supported Sites

| Site | Auto-Extract | Status |
|------|--------------|--------|
| AutoTrader.ca | ✅ Full | Production |
| Kijiji.ca | ✅ Full | Production |
| CarGurus.ca/com | ✅ Full | Production |
| Cars.com | ✅ Full | Production |
| Generic dealer sites | ⚠️ Partial | Uses highlight mode |

## Architecture

```
browser-extension/
├── manifest.json      # Extension configuration
├── popup.html         # Main popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup logic & domain config
├── content.js         # Content script (extraction)
├── content-styles.css # Page injection styles
├── background.js      # Service worker
└── icons/             # Extension icons
```

### Designed for Reuse

The codebase is structured to be extractable into a standalone library:

- **`DOMAIN_CONFIG`** in popup.js defines field schemas, keywords, and formatters
- **`SiteExtractors`** in content.js contains site-specific scraping rules
- Core extraction logic is domain-agnostic

To adapt for other domains (jobs, real estate, etc.), modify:
1. `DOMAIN_CONFIG` - field definitions and formatting
2. `SiteExtractors` - site-specific extraction rules
3. CSS theme variables for branding

## Development

### Testing Extraction
Open the browser console on a vehicle listing page to see extraction logs:
```
[ListingClipper] Using autotrader extractor
[ListingClipper] Extracted data: {...}
```

### Storage
Data is stored in `chrome.storage.local` under the key `evscorer_data`, matching the main EV Finder app format for seamless sync.

## Future Enhancements

- [ ] Firefox/Safari support
- [ ] Price history tracking from multiple visits
- [ ] Photo extraction
- [ ] Direct sync to EV Finder web app
- [ ] Bulk import from saved listings
- [ ] AI-powered extraction for unknown sites

## Library Extraction Roadmap

This extension is designed to be spun out into a standalone library called **ListingClipper** that can be configured for any listing domain:

```javascript
// Example: Job listings
const config = {
  name: 'Job Tracker',
  fields: {
    'title': { label: 'Job Title', type: 'text' },
    'company': { label: 'Company', type: 'text' },
    'salary': { label: 'Salary', type: 'currency' },
    // ...
  },
  extractors: {
    linkedin: { match: /linkedin.com/, extract: () => {...} },
    indeed: { match: /indeed.com/, extract: () => {...} },
  }
};
```

---

Built for [EV Finder](https://github.com/your-repo/car-finder-app) | Inspired by [Huntr](https://huntr.co)
