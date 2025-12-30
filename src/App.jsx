import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Car, Plus, Trash2, Settings, TrendingUp, ChevronDown, ChevronUp, Zap, Gauge, MapPin, Calendar, DollarSign, Thermometer, Smartphone, Ruler, AlertTriangle, Star, X, RotateCcw, Database, Loader2, Edit2, MessageSquare, Download, Upload } from 'lucide-react';
import ChangelogModal, { APP_VERSION } from './components/ChangelogModal';

// ============ STORAGE CONFIGURATION ============
const STORAGE_CONFIG = {
  useLocalStorage: true,
  storageKey: 'evscorer_data',
};

// ============ VEHICLE DATABASE FOR AUTOCOMPLETE ============
const VEHICLE_DATABASE = {
  'Chevrolet': {
    models: {
      'Bolt EV': { range: 417, length: 163, heatPump: false, trims: ['1LT', '2LT', 'Premier'] },
      'Bolt EUV': { range: 397, length: 169, heatPump: false, trims: ['LT', 'Premier'] },
      'Equinox EV': { range: 513, length: 184, heatPump: true, trims: ['1LT', '2LT', '2RS', '3RS'] },
    }
  },
  'Hyundai': {
    models: {
      'Kona Electric': { range: 415, length: 164, heatPump: true, trims: ['Essential', 'Preferred', 'Ultimate'] },
      'Ioniq 5': { range: 488, length: 182, heatPump: true, trims: ['Essential', 'Preferred', 'Ultimate'] },
      'Ioniq 6': { range: 581, length: 191, heatPump: true, trims: ['Essential', 'Preferred', 'Ultimate'] },
    }
  },
  'Kia': {
    models: {
      'Niro EV': { range: 407, length: 171, heatPump: true, trims: ['EX', 'EX+', 'SX Touring', 'Wind', 'Wind+', 'Wave', 'Premium', 'Premium+', 'Limited'] },
      'Soul EV': { range: 391, length: 165, heatPump: true, trims: ['Premium', 'Limited'] },
      'EV6': { range: 499, length: 184, heatPump: true, trims: ['Standard', 'Long Range', 'GT-Line', 'GT'] },
    }
  },
  'Nissan': {
    models: {
      'Leaf': { range: 342, length: 176, heatPump: true, trims: ['S', 'SV', 'SV Plus', 'SL', 'SL Plus'] },
      'Ariya': { range: 482, length: 182, heatPump: true, trims: ['Engage', 'Venture+', 'Evolve+', 'Premiere', 'Platinum+'] },
    }
  },
  'Tesla': {
    models: {
      'Model 3': { range: 438, length: 185, heatPump: true, trims: ['Standard Range', 'Long Range', 'Performance'] },
      'Model Y': { range: 455, length: 187, heatPump: true, trims: ['Standard Range', 'Long Range', 'Performance'] },
    }
  },
  'Ford': {
    models: {
      'Mustang Mach-E': { range: 490, length: 186, heatPump: true, trims: ['Select', 'Premium', 'California Route 1', 'GT'] },
      'F-150 Lightning': { range: 483, length: 233, heatPump: true, trims: ['Pro', 'XLT', 'Lariat', 'Platinum'] },
    }
  },
  'Volkswagen': {
    models: {
      'ID.4': { range: 443, length: 181, heatPump: true, trims: ['Standard', 'Pro', 'Pro S', 'Pro S Plus'] },
      'ID.Buzz': { range: 411, length: 185, heatPump: true, trims: ['Pro S', 'Pro S Plus'] },
    }
  },
  'BMW': {
    models: {
      'iX': { range: 520, length: 195, heatPump: true, trims: ['xDrive40', 'xDrive50', 'M60'] },
      'i4': { range: 484, length: 188, heatPump: true, trims: ['eDrive35', 'eDrive40', 'M50'] },
    }
  },
  'Polestar': {
    models: {
      'Polestar 2': { range: 435, length: 181, heatPump: true, trims: ['Single Motor', 'Long Range', 'Dual Motor'] },
    }
  },
  'Rivian': {
    models: {
      'R1T': { range: 505, length: 217, heatPump: true, trims: ['Adventure', 'Launch Edition'] },
      'R1S': { range: 505, length: 200, heatPump: true, trims: ['Adventure', 'Launch Edition'] },
    }
  },
};

const LOCATION_PRESETS = [
  { name: 'Springbank', distance: 1 },
  { name: 'Airport', distance: 1 },
  { name: 'Wharncliffe South', distance: 1 },
  { name: 'Downtown', distance: 1 },
  { name: 'Stratford', distance: 3 },
  { name: 'Woodstock', distance: 3 },
  { name: 'Sarnia', distance: 4 },
  { name: 'Paris', distance: 4 },
  { name: 'Kitchener', distance: 5 },
  { name: 'Guelph', distance: 6 },
  { name: 'Hamilton', distance: 7 },
  { name: 'Milton', distance: 10 },
  { name: 'Mississauga', distance: 10 },
  { name: 'Brampton', distance: 10 },
  { name: 'Toronto', distance: 10 },
];

const COLOR_PRESETS = ['White', 'Black', 'Grey', 'Silver', 'Blue', 'Red', 'Green', 'Gravity Blue', 'Cyber Grey'];
const REMOTE_START_OPTIONS = ['Fob, App', 'App', 'Fob', 'None'];

const SAMPLE_CARS = [
  { id: 1, make: 'Chevrolet', model: 'Bolt EUV', year: 2023, trim: 'LT', trimLevel: 2, dealer: 'Park Lane Cadillac', price: 22995, odo: 62000, color: 'Grey', range: 397, length: 169, heatPump: false, remoteStart: 'Fob, App', location: 'Sarnia', distance: 4, damage: 0, notes: '', starred: false },
  { id: 2, make: 'Kia', model: 'Niro EV', year: 2020, trim: 'SX Touring', trimLevel: 3, dealer: 'Titanium Auto Sales', price: 23990, odo: 75000, color: 'Gravity Blue', range: 385, length: 171, heatPump: true, remoteStart: 'App', location: 'Springbank', distance: 1, damage: 0, notes: '', starred: false },
  { id: 3, make: 'Hyundai', model: 'Kona Electric', year: 2021, trim: 'Preferred', trimLevel: 2, dealer: 'Stricklands', price: 24650, odo: 37000, color: 'White', range: 415, length: 164, heatPump: true, remoteStart: 'Fob, App', location: 'Stratford', distance: 3, damage: 0, notes: '', starred: false },
  { id: 4, make: 'Chevrolet', model: 'Bolt EV', year: 2022, trim: '1LT', trimLevel: 2, dealer: 'MacMaster GM', price: 25495, odo: 91000, color: 'White', range: 417, length: 163, heatPump: false, remoteStart: 'Fob, App', location: 'Airport', distance: 1, damage: 0, notes: '', starred: false },
  { id: 5, make: 'Chevrolet', model: 'Bolt EV', year: 2022, trim: '1LT', trimLevel: 2, dealer: 'Audi London', price: 25495, odo: 46450, color: 'Grey', range: 417, length: 163, heatPump: false, remoteStart: 'Fob, App', location: 'Wharncliffe South', distance: 1, damage: 0, notes: '', starred: false },
  { id: 6, make: 'Nissan', model: 'Leaf', year: 2023, trim: 'SL Plus', trimLevel: 3, dealer: 'Stricklands Toyota', price: 26888, odo: 8743, color: 'White', range: 342, length: 176, heatPump: true, remoteStart: 'App', location: 'Stratford', distance: 3, damage: 0, notes: '', starred: false },
];

const DEFAULT_WEIGHTS = {
  price: 35, odo: 16, range: 12, year: 10, trimLevel: 10,
  distance: 10, remoteStart: 10, length: 10, damage: 5, heatPump: 5,
};

const WEIGHT_CONFIG = [
  { key: 'price', label: 'Price', icon: DollarSign, description: 'Lower is better', color: 'text-tally-mint' },
  { key: 'odo', label: 'Odometer', icon: Gauge, description: 'Lower is better', color: 'text-amber-500' },
  { key: 'range', label: 'Range', icon: Zap, description: 'Higher is better', color: 'text-tally-blue' },
  { key: 'year', label: 'Year', icon: Calendar, description: 'Newer is better', color: 'text-violet-500' },
  { key: 'trimLevel', label: 'Trim Level', icon: Star, description: 'Higher is better', color: 'text-tally-pink' },
  { key: 'distance', label: 'Distance', icon: MapPin, description: 'Closer is better', color: 'text-tally-coral' },
  { key: 'remoteStart', label: 'Remote Start', icon: Smartphone, description: 'Fob+App is best', color: 'text-cyan-500' },
  { key: 'length', label: 'Length', icon: Ruler, description: 'Shorter is better', color: 'text-lime-500' },
  { key: 'damage', label: 'Damage', icon: AlertTriangle, description: 'Less is better', color: 'text-orange-500' },
  { key: 'heatPump', label: 'Heat Pump', icon: Thermometer, description: 'Yes is better', color: 'text-teal-500' },
];

// ============ STORAGE HELPERS ============
const storage = {
  async save(data) {
    const payload = JSON.stringify(data);
    if (STORAGE_CONFIG.useLocalStorage) {
      try {
        localStorage.setItem(STORAGE_CONFIG.storageKey, payload);
        return true;
      } catch (e) { console.warn('localStorage save failed:', e); }
    }
    if (window.storage) {
      try {
        const result = await window.storage.set(STORAGE_CONFIG.storageKey, payload);
        return result !== null;
      } catch (e) { return false; }
    }
    return false;
  },
  async load() {
    if (STORAGE_CONFIG.useLocalStorage) {
      try {
        const data = localStorage.getItem(STORAGE_CONFIG.storageKey);
        if (data) return JSON.parse(data);
      } catch (e) { console.warn('localStorage load failed:', e); }
    }
    if (window.storage) {
      try {
        const result = await window.storage.get(STORAGE_CONFIG.storageKey);
        if (result?.value) return JSON.parse(result.value);
      } catch (e) { }
    }
    return null;
  }
};

// ============ SCORING FUNCTIONS ============
const normalize = (value, min, max, inverse = false) => {
  if (max === min) return 0;
  const normalized = (value - min) / (max - min);
  return inverse ? 1 - normalized : normalized;
};

const calculateValueScore = (car, cars, weights) => {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;
  const stats = {
    price: [Math.min(...cars.map(c => c.price)), Math.max(...cars.map(c => c.price))],
    odo: [Math.min(...cars.map(c => c.odo)), Math.max(...cars.map(c => c.odo))],
    range: [Math.min(...cars.map(c => c.range)), Math.max(...cars.map(c => c.range))],
    year: [Math.min(...cars.map(c => c.year)), Math.max(...cars.map(c => c.year))],
    trim: [Math.min(...cars.map(c => c.trimLevel)), Math.max(...cars.map(c => c.trimLevel))],
    dist: [Math.min(...cars.map(c => c.distance)), Math.max(...cars.map(c => c.distance))],
    length: [Math.min(...cars.map(c => c.length)), Math.max(...cars.map(c => c.length))],
    damage: [Math.min(...cars.map(c => c.damage)), Math.max(...cars.map(c => c.damage))],
  };
  let score = 0;
  score += normalize(car.price, ...stats.price, true) * weights.price;
  score += normalize(car.odo, ...stats.odo, true) * weights.odo;
  score += normalize(car.range, ...stats.range, false) * weights.range;
  score += normalize(car.year, ...stats.year, false) * weights.year;
  score += normalize(car.trimLevel, ...stats.trim, false) * weights.trimLevel;
  score += normalize(car.distance, ...stats.dist, true) * weights.distance;
  score += normalize(car.length, ...stats.length, true) * weights.length;
  score += normalize(car.damage, ...stats.damage, true) * weights.damage;
  score += (car.heatPump ? 1 : 0) * weights.heatPump;
  score += (car.remoteStart === 'Fob, App' ? 1 : 0) * weights.remoteStart;
  return (score / totalWeight) * 100;
};

const getScoreBreakdown = (car, cars, weights) => {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return [];
  const stats = {
    price: [Math.min(...cars.map(c => c.price)), Math.max(...cars.map(c => c.price))],
    odo: [Math.min(...cars.map(c => c.odo)), Math.max(...cars.map(c => c.odo))],
    range: [Math.min(...cars.map(c => c.range)), Math.max(...cars.map(c => c.range))],
    year: [Math.min(...cars.map(c => c.year)), Math.max(...cars.map(c => c.year))],
    trim: [Math.min(...cars.map(c => c.trimLevel)), Math.max(...cars.map(c => c.trimLevel))],
    dist: [Math.min(...cars.map(c => c.distance)), Math.max(...cars.map(c => c.distance))],
    length: [Math.min(...cars.map(c => c.length)), Math.max(...cars.map(c => c.length))],
    damage: [Math.min(...cars.map(c => c.damage)), Math.max(...cars.map(c => c.damage))],
  };
  return [
    { key: 'price', raw: normalize(car.price, ...stats.price, true), weighted: normalize(car.price, ...stats.price, true) * weights.price / totalWeight * 100 },
    { key: 'odo', raw: normalize(car.odo, ...stats.odo, true), weighted: normalize(car.odo, ...stats.odo, true) * weights.odo / totalWeight * 100 },
    { key: 'range', raw: normalize(car.range, ...stats.range, false), weighted: normalize(car.range, ...stats.range, false) * weights.range / totalWeight * 100 },
    { key: 'year', raw: normalize(car.year, ...stats.year, false), weighted: normalize(car.year, ...stats.year, false) * weights.year / totalWeight * 100 },
    { key: 'trimLevel', raw: normalize(car.trimLevel, ...stats.trim, false), weighted: normalize(car.trimLevel, ...stats.trim, false) * weights.trimLevel / totalWeight * 100 },
    { key: 'distance', raw: normalize(car.distance, ...stats.dist, true), weighted: normalize(car.distance, ...stats.dist, true) * weights.distance / totalWeight * 100 },
    { key: 'length', raw: normalize(car.length, ...stats.length, true), weighted: normalize(car.length, ...stats.length, true) * weights.length / totalWeight * 100 },
    { key: 'damage', raw: normalize(car.damage, ...stats.damage, true), weighted: normalize(car.damage, ...stats.damage, true) * weights.damage / totalWeight * 100 },
    { key: 'heatPump', raw: car.heatPump ? 1 : 0, weighted: (car.heatPump ? 1 : 0) * weights.heatPump / totalWeight * 100 },
    { key: 'remoteStart', raw: car.remoteStart === 'Fob, App' ? 1 : 0, weighted: (car.remoteStart === 'Fob, App' ? 1 : 0) * weights.remoteStart / totalWeight * 100 },
  ];
};

// ============ COMPONENTS ============
const QuickSelect = ({ options, value, onChange, label, columns = 4 }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((opt, i) => (
        <button
          key={i}
          type="button"
          className={`px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 ${
            value === opt
              ? 'bg-tally-blue text-white border-tally-blue'
              : 'bg-white text-slate-600 border-slate-200 hover:border-tally-blue hover:text-tally-blue'
          }`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const WeightSlider = ({ config, value, onChange, totalWeight }) => {
  const Icon = config.icon;
  const percentage = totalWeight > 0 ? ((value / totalWeight) * 100).toFixed(1) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <Icon size={16} className={config.color} />
          <span className="text-sm font-medium text-charcoal">{config.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm font-semibold text-charcoal">{value}</span>
          <span className="font-mono text-xs text-slate-400">({percentage}%)</span>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="50"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-tally-blue [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
      />
      <div className="text-xs text-slate-400 mt-1">{config.description}</div>
    </div>
  );
};

const CarCard = ({ car, rank, score, isExpanded, onToggle, onDelete, onStar, onEdit, breakdown }) => {
  const getScoreColor = (s) => s >= 70 ? 'text-tally-mint' : s >= 50 ? 'text-amber-500' : 'text-tally-coral';
  const getRankBg = (r) => r === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-500' : r === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400' : r === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700' : 'bg-slate-500';
  const config = WEIGHT_CONFIG.reduce((acc, c) => ({ ...acc, [c.key]: c }), {});

  return (
    <div className={`tally-card mb-4 ${isExpanded ? 'ring-2 ring-tally-blue' : ''} ${car.starred ? 'ring-2 ring-amber-400' : ''}`}>
      <div className="flex items-center gap-4 cursor-pointer" onClick={onToggle}>
        <button
          className={`p-1 rounded-lg transition-all ${car.starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
          onClick={(e) => { e.stopPropagation(); onStar(); }}
        >
          <Star size={18} fill={car.starred ? 'currentColor' : 'none'} />
        </button>

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${getRankBg(rank)}`}>
          #{rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-charcoal">{car.year} {car.make} {car.model}</h3>
            <span className="tally-badge-blue text-xs">{car.trim}</span>
            {car.notes && <MessageSquare size={14} className="text-slate-400" />}
          </div>
          <div className="flex gap-4 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <DollarSign size={14} /> ${car.price.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Gauge size={14} /> {car.odo.toLocaleString()} km
            </span>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Zap size={14} /> {car.range} km
            </span>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={14} /> {car.location}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="relative w-14 h-14">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-slate-200"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${score >= 70 ? 'stroke-tally-mint' : score >= 50 ? 'stroke-amber-500' : 'stroke-tally-coral'}`}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono font-bold text-sm ${getScoreColor(score)}`}>
              {score.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-slate-400">Value Score</span>
        </div>

        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-charcoal transition-all">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {car.notes && (
            <div className="bg-fog rounded-xl p-3 mb-4 flex items-start gap-2">
              <MessageSquare size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-600">{car.notes}</span>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-500 mb-3">Vehicle Details</h4>
              <div className="grid gap-2 text-sm">
                <div><span className="text-slate-400">Dealer:</span> <span className="text-charcoal">{car.dealer}</span></div>
                <div><span className="text-slate-400">Color:</span> <span className="text-charcoal">{car.color}</span></div>
                <div><span className="text-slate-400">Length:</span> <span className="text-charcoal">{car.length}"</span></div>
                <div><span className="text-slate-400">Heat Pump:</span> <span className={car.heatPump ? 'text-tally-mint' : 'text-slate-400'}>{car.heatPump ? 'Yes' : 'No'}</span></div>
                <div><span className="text-slate-400">Remote Start:</span> <span className="text-charcoal">{car.remoteStart}</span></div>
                <div><span className="text-slate-400">Damage:</span> <span className={car.damage > 0 ? 'text-tally-coral' : 'text-tally-mint'}>{car.damage > 0 ? `$${car.damage.toLocaleString()}` : 'None'}</span></div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-500 mb-3">Score Breakdown</h4>
              <div className="space-y-2">
                {breakdown.map(item => {
                  const cfg = config[item.key];
                  return (
                    <div key={item.key} className="flex items-center gap-2">
                      <cfg.icon size={14} className={cfg.color} />
                      <span className="text-xs text-slate-500 w-20">{cfg.label}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-tally-blue rounded-full transition-all duration-500"
                          style={{ width: `${item.raw * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-tally-mint w-10 text-right">+{item.weighted.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-tally-blue border border-tally-blue rounded-xl hover:bg-tally-blue hover:text-white transition-all"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Edit2 size={16} /> Edit
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-tally-coral border border-tally-coral rounded-xl hover:bg-tally-coral hover:text-white transition-all"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 size={16} /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Add/Edit Car Modal with Autocomplete
const AddCarModal = ({ onClose, onAdd, onUpdate, existingDealers, editCar }) => {
  const isEditing = !!editCar;
  const [formData, setFormData] = useState(editCar || {
    make: '', model: '', year: 2024, trim: '', trimLevel: 2,
    dealer: '', price: '', odo: '', color: 'White',
    range: '', length: '', heatPump: true, remoteStart: 'Fob, App',
    location: '', distance: 1, damage: 0, notes: '', starred: false
  });
  const [step, setStep] = useState(isEditing ? 2 : 1);
  const [manualNav, setManualNav] = useState(false);
  const availableModels = formData.make && VEHICLE_DATABASE[formData.make] ? Object.keys(VEHICLE_DATABASE[formData.make].models) : [];
  const vehicleSpecs = formData.make && formData.model && VEHICLE_DATABASE[formData.make]?.models[formData.model];
  const availableTrims = vehicleSpecs?.trims || [];

  useEffect(() => {
    if (manualNav || isEditing) return;
    if (step === 1 && formData.make && formData.model && formData.year) {
      if (availableTrims.length === 0 || formData.trim) {
        const timer = setTimeout(() => setStep(2), 400);
        return () => clearTimeout(timer);
      }
    }
  }, [formData.make, formData.model, formData.year, formData.trim, availableTrims.length, step, isEditing, manualNav]);

  useEffect(() => {
    if (step === 1 && manualNav) setManualNav(false);
  }, [formData.make, formData.model, formData.trim]);

  useEffect(() => {
    if (vehicleSpecs && !isEditing) {
      setFormData(prev => ({ ...prev, range: vehicleSpecs.range, length: vehicleSpecs.length, heatPump: vehicleSpecs.heatPump }));
    }
  }, [formData.make, formData.model, isEditing]);

  useEffect(() => {
    if (formData.trim && availableTrims.length > 0 && !isEditing) {
      const trimIndex = availableTrims.indexOf(formData.trim);
      if (trimIndex !== -1) {
        const level = Math.ceil(((trimIndex + 1) / availableTrims.length) * 3);
        setFormData(prev => ({ ...prev, trimLevel: Math.max(1, Math.min(3, level)) }));
      }
    }
  }, [formData.trim, availableTrims, isEditing]);

  const isStep2Valid = () => formData.price && formData.odo;

  const handleLocationSelect = (loc) => {
    const preset = LOCATION_PRESETS.find(l => l.name === loc);
    setFormData(prev => ({ ...prev, location: loc, distance: preset?.distance || prev.distance }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sanitizedData = {
      ...formData, id: formData.id || Date.now(),
      year: parseInt(formData.year) || 2024, trimLevel: parseInt(formData.trimLevel) || 2,
      price: parseInt(formData.price) || 25000, odo: parseInt(formData.odo) || 50000,
      range: parseInt(formData.range) || 400, length: parseInt(formData.length) || 170,
      distance: parseInt(formData.distance) || 1, damage: parseInt(formData.damage) || 0,
      notes: formData.notes || '', starred: formData.starred || false,
    };
    isEditing ? onUpdate(sanitizedData) : onAdd(sanitizedData);
    onClose();
  };

  const makes = Object.keys(VEHICLE_DATABASE);
  const years = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

  return (
    <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-tally-xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <h2 className="font-display font-semibold text-charcoal flex items-center gap-2">
            {isEditing ? <><Edit2 size={20} /> Edit Listing</> : <><Plus size={20} /> Add New Listing</>}
          </h2>
          <div className="flex gap-2">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                  step >= n ? 'bg-tally-blue text-white' : 'bg-slate-100 text-slate-400'
                }`}
                onClick={() => n < step && setStep(n)}
              >
                {step > n ? '✓' : n}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 && (
            <div className="animate-fade-up">
              <h3 className="text-sm font-semibold text-slate-500 mb-4">Select Vehicle</h3>
              <QuickSelect label="Make" options={makes} value={formData.make} onChange={(v) => setFormData({ ...formData, make: v, model: '', trim: '' })} columns={3} />
              {formData.make && <QuickSelect label="Model" options={availableModels} value={formData.model} onChange={(v) => setFormData({ ...formData, model: v, trim: '' })} columns={2} />}
              <QuickSelect label="Year" options={years} value={formData.year} onChange={(v) => setFormData({ ...formData, year: v })} columns={4} />
              {availableTrims.length > 0 && <QuickSelect label="Trim" options={availableTrims} value={formData.trim} onChange={(v) => setFormData({ ...formData, trim: v })} columns={3} />}
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-up">
              <h3 className="text-sm font-semibold text-slate-500 mb-4">Vehicle Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Price ($) *</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tally-blue focus:border-tally-blue outline-none transition-all" placeholder="25000" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Odometer (km) *</label>
                  <input type="number" value={formData.odo} onChange={(e) => setFormData({ ...formData, odo: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tally-blue focus:border-tally-blue outline-none transition-all" placeholder="50000" required />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">Dealer</label>
                <input type="text" value={formData.dealer} onChange={(e) => setFormData({ ...formData, dealer: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tally-blue focus:border-tally-blue outline-none transition-all" list="dealers" placeholder="City Motors" />
                <datalist id="dealers">{existingDealers.map(d => <option key={d} value={d} />)}</datalist>
              </div>
              <QuickSelect label="Color" options={COLOR_PRESETS} value={formData.color} onChange={(v) => setFormData({ ...formData, color: v })} columns={3} />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Range (km)</label>
                  <input type="number" value={formData.range} onChange={(e) => setFormData({ ...formData, range: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tally-blue focus:border-tally-blue outline-none transition-all" placeholder="400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Length (inches)</label>
                  <input type="number" value={formData.length} onChange={(e) => setFormData({ ...formData, length: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tally-blue focus:border-tally-blue outline-none transition-all" placeholder="170" />
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.heatPump ? 'border-tally-mint bg-tally-mint/10' : 'border-slate-200'}`}
                  onClick={() => setFormData({ ...formData, heatPump: !formData.heatPump })}
                >
                  <Thermometer size={24} className={formData.heatPump ? 'text-tally-mint' : 'text-slate-400'} />
                  <span className="text-sm font-medium">Heat Pump</span>
                  <span className="text-lg">{formData.heatPump ? '✓' : '✗'}</span>
                </button>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Remote Start</label>
                  <div className="grid grid-cols-2 gap-2">
                    {REMOTE_START_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`px-3 py-2 text-xs rounded-lg border transition-all ${formData.remoteStart === opt ? 'bg-cyan-500 text-white border-cyan-500' : 'border-slate-200 hover:border-cyan-500'}`}
                        onClick={() => setFormData({ ...formData, remoteStart: opt })}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-up">
              <h3 className="text-sm font-semibold text-slate-500 mb-4">Location & Notes</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {LOCATION_PRESETS.map(loc => (
                  <button
                    key={loc.name}
                    type="button"
                    className={`p-3 rounded-xl border text-center transition-all ${formData.location === loc.name ? 'bg-tally-coral text-white border-tally-coral' : 'border-slate-200 hover:border-tally-coral'}`}
                    onClick={() => handleLocationSelect(loc.name)}
                  >
                    <div className="text-xs font-medium">{loc.name}</div>
                    <div className="text-[10px] opacity-70">{loc.distance === 1 ? 'Local' : `~${loc.distance * 15}m`}</div>
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tally-blue focus:border-tally-blue outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Any notes about this vehicle..."
                />
              </div>
              <div className="bg-fog rounded-xl p-4">
                <h4 className="text-xs text-slate-400 mb-2">Summary</h4>
                <div className="font-display font-semibold text-tally-blue">{formData.year} {formData.make} {formData.model} {formData.trim}</div>
                <div className="text-sm text-slate-500">${parseInt(formData.price || 0).toLocaleString()} • {parseInt(formData.odo || 0).toLocaleString()} km</div>
                <div className="text-sm text-slate-500">{formData.location || 'No location'} • {formData.dealer || 'No dealer'}</div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
            {step > 1 && (
              <button type="button" className="tally-btn tally-btn-ghost" onClick={() => { setManualNav(true); setStep(step - 1); }}>
                Back
              </button>
            )}
            <div className="flex-1" />
            {step < 3 && (
              <button
                type="button"
                className="tally-btn tally-btn-primary"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !formData.make || !formData.model : !isStep2Valid()}
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button type="submit" className="tally-btn tally-btn-primary">
                {isEditing ? 'Save Changes' : 'Add Listing'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ============ MAIN APP ============
export default function App() {
  const [cars, setCars] = useState([]);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showWeights, setShowWeights] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [changelogTab, setChangelogTab] = useState('changelog');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [editCar, setEditCar] = useState(null);
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await storage.load();
        if (saved && saved.cars && saved.cars.length > 0) {
          setCars(saved.cars);
          if (saved.weights) setWeights(saved.weights);
        } else {
          setCars(SAMPLE_CARS);
        }
      } catch (e) {
        setCars(SAMPLE_CARS);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const currentHash = JSON.stringify({ cars, weights });
    if (lastSavedRef.current === currentHash) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const success = await storage.save({ cars, weights });
        if (success) {
          lastSavedRef.current = currentHash;
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch (e) {
        setSaveStatus('error');
      }
    }, 1000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [cars, weights, isLoading]);

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const scoredCars = useMemo(() => {
    if (cars.length === 0) return [];
    return cars
      .map(car => ({ ...car, score: calculateValueScore(car, cars, weights), breakdown: getScoreBreakdown(car, cars, weights) }))
      .sort((a, b) => {
        if (a.starred !== b.starred) return b.starred ? 1 : -1;
        return b.score - a.score;
      });
  }, [cars, weights]);
  const existingDealers = useMemo(() => [...new Set(cars.map(c => c.dealer).filter(Boolean))], [cars]);

  const handleUpdateCar = (updatedCar) => {
    setCars(prev => prev.map(c => c.id === updatedCar.id ? updatedCar : c));
    setEditCar(null);
  };

  const handleStarCar = (id) => {
    setCars(prev => prev.map(c => c.id === id ? { ...c, starred: !c.starred } : c));
  };

  const handleEditCar = (car) => {
    setEditCar(car);
    setShowAddModal(true);
  };

  const resetToSampleData = async () => {
    if (confirm('Reset to sample data? This will replace your current listings.')) {
      setCars(SAMPLE_CARS);
      setWeights(DEFAULT_WEIGHTS);
    }
  };

  // Export data as JSON file
  const handleExport = () => {
    const exportData = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      cars,
      weights,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ev-scorer-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data from JSON file
  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result);
        if (data.cars && Array.isArray(data.cars)) {
          const confirmMsg = `Import ${data.cars.length} listings${data.weights ? ' and weights' : ''}? This will replace your current data.`;
          if (confirm(confirmMsg)) {
            setCars(data.cars);
            if (data.weights) setWeights(data.weights);
          }
        } else {
          alert('Invalid file format. Expected a JSON file with cars array.');
        }
      } catch (err) {
        alert('Failed to parse file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // Ref for hidden file input
  const fileInputRef = useRef(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-fog tally-bg-mesh flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-tally-blue animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fog tally-bg-mesh">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-tally-blue to-tally-pink rounded-xl flex items-center justify-center">
                <Car size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-charcoal">EV Value Scorer</h1>
                <div className={`flex items-center gap-1 text-xs ${saveStatus === 'saved' ? 'text-tally-mint' : saveStatus === 'saving' ? 'text-amber-500' : 'text-tally-coral'}`}>
                  {saveStatus === 'saving' && <Loader2 size={12} className="animate-spin" />}
                  {saveStatus === 'saved' && <Database size={12} />}
                  {saveStatus === 'error' && <AlertTriangle size={12} />}
                  <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Error'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChangelogModal(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-tally-blue/10 text-tally-blue hover:bg-tally-blue/20 transition-all"
              >
                v{APP_VERSION}
              </button>
              <button onClick={resetToSampleData} className="tally-btn tally-btn-ghost">
                <RotateCcw size={18} />
              </button>
              <button onClick={() => setShowWeights(!showWeights)} className={`tally-btn ${showWeights ? 'tally-btn-primary' : 'tally-btn-secondary'}`}>
                <Settings size={18} /> Weights
              </button>
              <button onClick={() => { setEditCar(null); setShowAddModal(true); }} className="tally-btn tally-btn-primary">
                <Plus size={18} /> Add Listing
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Weights Panel */}
          <aside className={`lg:block ${showWeights ? 'block' : 'hidden'}`}>
            <div className="tally-card sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-charcoal flex items-center gap-2">
                  <Settings size={18} /> Weights
                </h2>
                <span className="font-mono text-sm text-slate-400">Total: {totalWeight}</span>
              </div>
              {WEIGHT_CONFIG.map(config => (
                <WeightSlider
                  key={config.key}
                  config={config}
                  value={weights[config.key]}
                  onChange={(val) => setWeights(prev => ({ ...prev, [config.key]: val }))}
                  totalWeight={totalWeight}
                />
              ))}
              <button onClick={() => setWeights(DEFAULT_WEIGHTS)} className="tally-btn tally-btn-ghost w-full mt-4">
                <RotateCcw size={16} /> Reset Weights
              </button>

              {/* Import/Export Section */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Data</h3>
                <div className="flex gap-2">
                  <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-tally-blue border border-tally-blue rounded-xl hover:bg-tally-blue hover:text-white transition-all">
                    <Download size={16} /> Export
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-tally-mint border border-tally-mint rounded-xl hover:bg-tally-mint hover:text-white transition-all">
                    <Upload size={16} /> Import
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">Backup or restore your listings</p>
              </div>
            </div>
          </aside>

          {/* Cars List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-charcoal flex items-center gap-2">
                <TrendingUp size={18} /> Ranked Listings
              </h2>
              <span className="text-sm text-slate-400">{cars.length} vehicles</span>
            </div>

            {scoredCars.length === 0 ? (
              <div className="tally-card text-center py-12">
                <Car size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No listings yet. Add your first car to get started!</p>
              </div>
            ) : (
              scoredCars.map((car, index) => (
                <CarCard
                  key={car.id}
                  car={car}
                  rank={index + 1}
                  score={car.score}
                  breakdown={car.breakdown}
                  isExpanded={expandedCard === car.id}
                  onToggle={() => setExpandedCard(expandedCard === car.id ? null : car.id)}
                  onDelete={() => { setCars(prev => prev.filter(c => c.id !== car.id)); setExpandedCard(null); }}
                  onStar={() => handleStarCar(car.id)}
                  onEdit={() => handleEditCar(car)}
                />
              ))
            )}
          </section>
        </div>
      </main>

      {showAddModal && (
        <AddCarModal
          onClose={() => { setShowAddModal(false); setEditCar(null); }}
          onAdd={(car) => setCars(prev => [...prev, car])}
          onUpdate={handleUpdateCar}
          existingDealers={existingDealers}
          editCar={editCar}
        />
      )}
      <ChangelogModal
        isOpen={showChangelogModal}
        onClose={() => setShowChangelogModal(false)}
        activeTab={changelogTab}
        onTabChange={setChangelogTab}
      />

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />
    </div>
  );
}
