import { X, FileText, Lightbulb, Map } from 'lucide-react';

export const APP_VERSION = '0.10.0';

export const CHANGELOG = [
  {
    version: '0.10.0',
    date: '2024-12-30',
    changes: [
      'Enhanced VIN decoder with drive type, battery info, and plant details',
      'Tesla VDS decoding (Single/Dual/Tri Motor, battery capacity)',
      'Hyundai/Kia/Ford EV model detection with battery specs',
      'VINDisplay redesign with color-coded segments and tooltips',
      'Confidence bar with High/Medium/Low indicator',
      'Two-column detail grid with manufacturing info',
    ],
  },
  {
    version: '0.9.0',
    date: '2024-12-30',
    changes: [
      'DealerScraper UX overhaul - clear Input → Scrape → Review → Save flow',
      'Field status badges (Auto-detected, Edited, Missing) for scraped data',
      'Review step before saving - edit any field before adding to listings',
      'Extraction summary card with EV badge and confidence score',
      'Advanced JSON paste option tucked in collapsible section',
      'Rebranded from "EV Value Scorer" to "Car Scorer"',
    ],
  },
  {
    version: '0.8.0',
    date: '2024-12-30',
    changes: [
      'VIN Decoder utility - validates and decodes Vehicle Identification Numbers',
      'WMI lookup for 15+ EV manufacturers (Tesla, Rivian, Lucid, etc.)',
      'Tesla-specific model decoding (Model 3, Y, S, X, Cybertruck)',
      'Chevrolet Bolt EV vs Bolt EUV detection from VIN',
      'VIN breakdown display in DealerScraper with color-coded segments',
      'Manufacturing plant and country of origin detection',
    ],
  },
  {
    version: '0.7.1',
    date: '2024-12-30',
    changes: [
      'Added proxy server for direct URL scraping (no more manual copy-paste)',
      'JSON-LD structured data extraction from dealer pages',
      'DOM-based price/mileage extraction with smart selectors',
      'Enhanced CarCard with 12+ vehicle detail fields',
      'Smart make/model detection with URL/title/og:title prioritization',
    ],
  },
  {
    version: '0.7.0',
    date: '2024-12-30',
    changes: [
      'Added Universal Dealer Scraper - extract data from any dealership website',
      'Intelligent pattern matching for price, mileage, VIN, color, and more',
      'Automatic EV detection with known specs lookup (range, heat pump, etc.)',
      'Manual override fields for fine-tuning extracted data',
      'Location preset selection for scraped listings',
      'Confidence scoring shows extraction quality',
    ],
  },
  {
    version: '0.6.0',
    date: '2024-12-30',
    changes: [
      'Added Photo Attachments to save images with each listing',
      'Photo gallery with thumbnail grid in expanded card view',
      'Full-screen lightbox with keyboard navigation (arrows, Esc)',
      'Photo upload in step 3 of Add/Edit form',
      'Images auto-resized to 800px for efficient storage',
    ],
  },
  {
    version: '0.5.0',
    date: '2024-12-30',
    changes: [
      'Added Price History Tracking to monitor price changes over time',
      'Visual sparkline chart showing price trends in expanded view',
      'Price drop/rise indicators on car cards',
      'Automatic price history recording when editing listings',
    ],
  },
  {
    version: '0.4.0',
    date: '2024-12-30',
    changes: [
      'Added Comparison View for side-by-side vehicle comparison',
      'Compare mode with checkbox selection for up to 3 vehicles',
      'Comparison table highlights best values in green',
      'Compare button in header to toggle selection mode',
    ],
  },
  {
    version: '0.3.0',
    date: '2024-12-30',
    changes: [
      'Added Listing URL field to save dealer listing links',
      'URL input added to Add/Edit form (step 2)',
      'Link icon shown on car cards that have a URL',
      '"View Listing" button opens URL in new tab when expanded',
    ],
  },
  {
    version: '0.2.0',
    date: '2024-12-30',
    changes: [
      'Added Import/Export functionality for backing up and restoring listings',
      'Export saves listings and weights to a JSON file',
      'Import loads data from a previously exported JSON file',
      'Data section added to Weights panel for easy access',
    ],
  },
  {
    version: '0.1.0',
    date: '2024-12-30',
    changes: [
      'Initial release with Tally.so inspired design',
      'Multi-criteria decision analysis (MCDA) scoring algorithm',
      'Vehicle database with autocomplete for popular EVs',
      'Configurable weight sliders for 10 scoring criteria',
      'Local storage persistence for listings and weights',
      'Star/favorite functionality for top picks',
      'Add/Edit/Delete car listings with 3-step wizard',
      'Score breakdown visualization per vehicle',
      'Responsive design with mobile support',
    ],
  },
];

export const HOW_IT_WORKS = [
  {
    title: 'Add Your Listings',
    description: 'Use the Add Listing button to enter vehicle details. The 3-step wizard guides you through vehicle selection, specs, and location.',
    icon: '1',
  },
  {
    title: 'Adjust Your Priorities',
    description: 'Use the weight sliders to tell the algorithm what matters most to you - price, range, distance, or any of the 10 criteria.',
    icon: '2',
  },
  {
    title: 'Compare Scores',
    description: 'Each car gets a 0-100 Value Score based on your weights. Higher scores mean better value according to your preferences.',
    icon: '3',
  },
  {
    title: 'Star Your Favorites',
    description: 'Click the star icon to mark top picks. Starred vehicles always appear at the top of the list.',
    icon: '4',
  },
];

export const ROADMAP = [
  {
    category: 'Completed',
    icon: '✅',
    items: [
      { title: 'Universal Dealer Scraper', description: 'Automatically extract vehicle data from any dealership website', priority: 'high' },
      { title: 'Photo Attachments', description: 'Attach photos to each listing with gallery view and lightbox', priority: 'high' },
      { title: 'Price History Tracking', description: 'Track price changes over time with sparkline visualization', priority: 'high' },
      { title: 'Comparison View', description: 'Side-by-side comparison of 2-3 selected vehicles', priority: 'high' },
      { title: 'Listing URL Links', description: 'Save the dealer listing URL with each vehicle for quick access', priority: 'high' },
      { title: 'Import/Export Data', description: 'Export your listings to JSON and import them on another device', priority: 'high' },
    ],
  },
  {
    category: 'Planned',
    icon: '📋',
    items: [
      { title: 'Auto-Scrape Browser Extension', description: 'One-click scraping directly from dealer pages', priority: 'medium' },
      { title: 'Custom Criteria', description: 'Add your own scoring criteria beyond the default 10', priority: 'low' },
    ],
  },
  {
    category: 'Ideas',
    icon: '💡',
    items: [
      { title: 'Market Price Integration', description: 'Compare listing prices against market averages', priority: 'low' },
      { title: 'Depreciation Calculator', description: 'Estimate future value based on age and mileage trends', priority: 'low' },
    ],
  },
];

const ChangelogModal = ({ isOpen, onClose, activeTab = 'changelog', onTabChange }) => {
  if (!isOpen) return null;

  const tabs = [
    { id: 'changelog', label: 'Changelog', icon: FileText },
    { id: 'howItWorks', label: 'How It Works', icon: Lightbulb },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-tally-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-tally-blue text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Changelog Tab */}
          {activeTab === 'changelog' && (
            <div className="space-y-6">
              {CHANGELOG.map((release, idx) => (
                <div key={release.version}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-lg bg-tally-blue text-white text-sm font-semibold">
                      v{release.version}
                    </span>
                    <span className="text-sm text-slate-400">{release.date}</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {release.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-tally-mint mt-0.5">+</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                  {idx < CHANGELOG.length - 1 && <hr className="mt-6 border-slate-100" />}
                </div>
              ))}
            </div>
          )}

          {/* How It Works Tab */}
          {activeTab === 'howItWorks' && (
            <div className="space-y-6">
              <p className="text-slate-500 text-sm">
                Car Scorer uses Multi-Criteria Decision Analysis (MCDA) to help you find the best value used vehicle.
              </p>
              <div className="space-y-4">
                {HOW_IT_WORKS.map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl bg-fog border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-tally-blue text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-charcoal mb-1">{step.title}</h4>
                      <p className="text-sm text-slate-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-tally-blue/5 border border-tally-blue/20">
                <h4 className="font-semibold text-tally-blue mb-2">Scoring Algorithm</h4>
                <p className="text-sm text-slate-600">
                  Each attribute is normalized to a 0-1 scale across all your listings. Your weights determine how much each criterion contributes to the final score. Lower is better for price, odometer, distance, length, and damage. Higher is better for range, year, and trim level.
                </p>
              </div>
            </div>
          )}

          {/* Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <p className="text-slate-500 text-sm">
                Upcoming features and improvements planned for Car Scorer.
              </p>
              {ROADMAP.map(category => (
                <div key={category.category}>
                  <h3 className="font-semibold text-charcoal flex items-center gap-2 mb-3">
                    <span>{category.icon}</span> {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.items.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-fog border border-slate-100">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="font-medium text-charcoal">{item.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            item.priority === 'high'
                              ? 'bg-tally-blue/10 text-tally-blue'
                              : item.priority === 'medium'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
