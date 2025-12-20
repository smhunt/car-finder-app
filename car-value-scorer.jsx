import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Car, Plus, Trash2, Settings, TrendingUp, ChevronDown, ChevronUp, Zap, Gauge, MapPin, Calendar, DollarSign, Thermometer, Smartphone, Ruler, AlertTriangle, Star, Info, X, RotateCcw, Database, Loader2, Edit2, MessageSquare } from 'lucide-react';

// ============ STORAGE CONFIGURATION ============
const STORAGE_CONFIG = {
  useLocalStorage: false,
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
  { id: 7, make: 'Hyundai', model: 'Kona Electric', year: 2021, trim: 'Ultimate', trimLevel: 3, dealer: 'Maple Auto', price: 26990, odo: 55000, color: 'Grey', range: 415, length: 164, heatPump: true, remoteStart: 'Fob, App', location: 'Wharncliffe South', distance: 1, damage: 0, notes: '', starred: false },
  { id: 8, make: 'Hyundai', model: 'Kona Electric', year: 2024, trim: 'Preferred', trimLevel: 2, dealer: 'Woodstock Chrysler', price: 29995, odo: 29643, color: 'Grey', range: 420, length: 171, heatPump: true, remoteStart: 'Fob, App', location: 'Woodstock', distance: 3, damage: 25000, notes: 'Has hail damage on roof', starred: false },
  { id: 9, make: 'Hyundai', model: 'Kona Electric', year: 2021, trim: 'Ultimate', trimLevel: 3, dealer: 'London Airport Hyundai', price: 32995, odo: 70000, color: 'Red', range: 415, length: 164, heatPump: true, remoteStart: 'Fob, App', location: 'Airport', distance: 1, damage: 0, notes: '', starred: false },
  { id: 10, make: 'Kia', model: 'Niro EV', year: 2024, trim: 'Wind+', trimLevel: 2, dealer: 'Milton Kia', price: 33995, odo: 30683, color: 'Grey', range: 407, length: 174, heatPump: true, remoteStart: 'Fob, App', location: 'Milton', distance: 10, damage: 0, notes: '', starred: false },
  { id: 11, make: 'Kia', model: 'Niro EV', year: 2023, trim: 'Premium Plus', trimLevel: 2, dealer: '401 Dixie Kia', price: 29998, odo: 51336, color: 'Grey', range: 407, length: 174, heatPump: true, remoteStart: 'Fob, App', location: 'Mississauga', distance: 10, damage: 0, notes: '', starred: false },
  { id: 12, make: 'Kia', model: 'Niro EV', year: 2021, trim: 'EX', trimLevel: 1, dealer: 'Brampton Autopark', price: 21990, odo: 81054, color: 'Black', range: 385, length: 171, heatPump: true, remoteStart: 'Fob, App', location: 'Brampton', distance: 10, damage: 0, notes: '', starred: false },
];

const DEFAULT_WEIGHTS = {
  price: 35, odo: 16, range: 12, year: 10, trimLevel: 10,
  distance: 10, remoteStart: 10, length: 10, damage: 5, heatPump: 5,
};

const WEIGHT_CONFIG = [
  { key: 'price', label: 'Price', icon: DollarSign, description: 'Lower is better', color: '#10b981' },
  { key: 'odo', label: 'Odometer', icon: Gauge, description: 'Lower is better', color: '#f59e0b' },
  { key: 'range', label: 'Range', icon: Zap, description: 'Higher is better', color: '#3b82f6' },
  { key: 'year', label: 'Year', icon: Calendar, description: 'Newer is better', color: '#8b5cf6' },
  { key: 'trimLevel', label: 'Trim Level', icon: Star, description: 'Higher is better', color: '#ec4899' },
  { key: 'distance', label: 'Distance', icon: MapPin, description: 'Closer is better', color: '#ef4444' },
  { key: 'remoteStart', label: 'Remote Start', icon: Smartphone, description: 'Fob+App is best', color: '#06b6d4' },
  { key: 'length', label: 'Length', icon: Ruler, description: 'Shorter is better', color: '#84cc16' },
  { key: 'damage', label: 'Damage', icon: AlertTriangle, description: 'Less is better', color: '#f97316' },
  { key: 'heatPump', label: 'Heat Pump', icon: Thermometer, description: 'Yes is better', color: '#14b8a6' },
];

// ============ STORAGE HELPERS ============
const storage = {
  async save(data) {
    const payload = JSON.stringify(data);
    console.log('Attempting to save, payload size:', payload.length);
    
    // Try localStorage first if enabled
    if (STORAGE_CONFIG.useLocalStorage) {
      try {
        localStorage.setItem(STORAGE_CONFIG.storageKey, payload);
        console.log('localStorage save success');
        return true;
      } catch (e) { console.warn('localStorage save failed:', e); }
    }
    
    // Try window.storage
    if (window.storage) {
      try {
        console.log('Calling window.storage.set...');
        const result = await window.storage.set(STORAGE_CONFIG.storageKey, payload);
        console.log('window.storage.set result:', result);
        return result !== null;
      } catch (e) {
        console.error('window.storage save failed:', e);
        return false;
      }
    }
    
    console.warn('No storage mechanism available');
    return false;
  },
  
  async load() {
    console.log('Attempting to load data...');
    
    // Try localStorage first if enabled
    if (STORAGE_CONFIG.useLocalStorage) {
      try {
        const data = localStorage.getItem(STORAGE_CONFIG.storageKey);
        if (data) {
          console.log('localStorage load success');
          return JSON.parse(data);
        }
      } catch (e) { console.warn('localStorage load failed:', e); }
    }
    
    // Try window.storage
    if (window.storage) {
      try {
        console.log('Calling window.storage.get...');
        const result = await window.storage.get(STORAGE_CONFIG.storageKey);
        console.log('window.storage.get result:', result);
        if (result?.value) return JSON.parse(result.value);
      } catch (e) { 
        console.log('window.storage load error (may be first run):', e.message || e); 
      }
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
  <div className="form-group quick-select-group">
    <label>{label}</label>
    <div className="quick-select" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((opt, i) => (
        <button key={i} type="button" className={`quick-btn ${value === opt ? 'active' : ''}`} onClick={() => onChange(opt)}>
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
    <div className="weight-slider">
      <div className="weight-header">
        <div className="weight-label"><Icon size={16} style={{ color: config.color }} /><span>{config.label}</span></div>
        <div className="weight-value"><span className="weight-number">{value}</span><span className="weight-percent">({percentage}%)</span></div>
      </div>
      <input type="range" min="0" max="50" value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="slider" style={{ '--accent': config.color }} />
      <div className="weight-description">{config.description}</div>
    </div>
  );
};

const CarCard = ({ car, rank, score, isExpanded, onToggle, onDelete, onStar, onEdit, breakdown }) => {
  const getScoreColor = (s) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
  const config = WEIGHT_CONFIG.reduce((acc, c) => ({ ...acc, [c.key]: c }), {});
  return (
    <div className={`car-card ${isExpanded ? 'expanded' : ''} ${car.starred ? 'starred' : ''}`}>
      <div className="car-main" onClick={onToggle}>
        <button className={`star-btn ${car.starred ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onStar(); }}>
          <Star size={18} fill={car.starred ? '#f59e0b' : 'none'} />
        </button>
        <div className="car-rank" style={{ background: rank <= 3 ? getScoreColor(score) : '#64748b' }}>#{rank}</div>
        <div className="car-info">
          <div className="car-title">
            <h3>{car.year} {car.make} {car.model}</h3>
            <span className="car-trim">{car.trim}</span>
            {car.notes && <MessageSquare size={14} className="has-notes-icon" />}
          </div>
          <div className="car-details">
            <span><DollarSign size={14} /> ${car.price.toLocaleString()}</span>
            <span><Gauge size={14} /> {car.odo.toLocaleString()} km</span>
            <span><Zap size={14} /> {car.range} km</span>
            <span><MapPin size={14} /> {car.location}</span>
          </div>
        </div>
        <div className="car-score">
          <div className="score-circle" style={{ '--score-color': getScoreColor(score) }}>
            <svg viewBox="0 0 36 36">
              <path className="score-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="score-fill" strokeDasharray={`${score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="score-text">{score.toFixed(1)}</span>
          </div>
          <span className="score-label">Value Score</span>
        </div>
        <button className="expand-btn">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
      </div>
      {isExpanded && (
        <div className="car-expanded">
          {car.notes && (
            <div className="car-notes">
              <MessageSquare size={14} />
              <span>{car.notes}</span>
            </div>
          )}
          <div className="car-full-details">
            <div className="detail-group">
              <h4>Vehicle Details</h4>
              <div className="detail-grid">
                <div><strong>Dealer:</strong> {car.dealer}</div>
                <div><strong>Color:</strong> {car.color}</div>
                <div><strong>Length:</strong> {car.length}"</div>
                <div><strong>Heat Pump:</strong> {car.heatPump ? '✓ Yes' : '✗ No'}</div>
                <div><strong>Remote Start:</strong> {car.remoteStart}</div>
                <div><strong>Damage:</strong> {car.damage > 0 ? `$${car.damage.toLocaleString()}` : 'None'}</div>
              </div>
            </div>
            <div className="detail-group">
              <h4>Score Breakdown</h4>
              <div className="breakdown-bars">
                {breakdown.map(item => {
                  const cfg = config[item.key];
                  return (
                    <div key={item.key} className="breakdown-item">
                      <div className="breakdown-label">
                        <cfg.icon size={14} style={{ color: cfg.color }} />
                        <span>{cfg.label}</span>
                        <span className="breakdown-value">+{item.weighted.toFixed(1)}</span>
                      </div>
                      <div className="breakdown-bar"><div className="breakdown-fill" style={{ width: `${item.raw * 100}%`, background: cfg.color }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="card-actions">
            <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }}><Edit2 size={16} /> Edit</button>
            <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 size={16} /> Remove</button>
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
  const [manualNav, setManualNav] = useState(false); // Prevents auto-advance after Back button
  const availableModels = formData.make && VEHICLE_DATABASE[formData.make] ? Object.keys(VEHICLE_DATABASE[formData.make].models) : [];
  const vehicleSpecs = formData.make && formData.model && VEHICLE_DATABASE[formData.make]?.models[formData.model];
  const availableTrims = vehicleSpecs?.trims || [];

  useEffect(() => {
    // Don't auto-advance if user manually navigated back, or if editing
    if (manualNav || isEditing) return;
    if (step === 1 && formData.make && formData.model && formData.year) {
      if (availableTrims.length === 0 || formData.trim) {
        const timer = setTimeout(() => setStep(2), 400);
        return () => clearTimeout(timer);
      }
    }
  }, [formData.make, formData.model, formData.year, formData.trim, availableTrims.length, step, isEditing, manualNav]);

  // Reset manualNav flag when user makes a new selection on step 1
  useEffect(() => {
    if (step === 1 && manualNav) {
      setManualNav(false);
    }
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

  // Validation rules
  const validation = {
    price: { min: 500, max: 120000, msg: 'Price must be $500 - $120,000' },
    odo: { min: 500, max: 300000, msg: 'Odometer must be 500 - 300,000 km' },
    range: { min: 50, max: 800, msg: 'Range must be 50 - 800 km' },
    length: { min: 120, max: 260, msg: 'Length must be 120 - 260 inches' },
    year: { min: 2010, max: 2026, msg: 'Year must be 2010 - 2026' },
    damage: { min: 0, max: 100000, msg: 'Damage must be $0 - $100,000' },
  };

  const validateField = (field, value) => {
    const v = validation[field];
    if (!v) return true;
    const num = parseInt(value);
    if (isNaN(num)) return false;
    return num >= v.min && num <= v.max;
  };

  const getFieldError = (field, value) => {
    if (!value && value !== 0) return null;
    const v = validation[field];
    if (!v) return null;
    const num = parseInt(value);
    if (isNaN(num)) return v.msg;
    if (num < v.min || num > v.max) return v.msg;
    return null;
  };

  const isStep2Valid = () => {
    return formData.price && formData.odo && 
           validateField('price', formData.price) && 
           validateField('odo', formData.odo) &&
           (!formData.range || validateField('range', formData.range)) &&
           (!formData.length || validateField('length', formData.length)) &&
           (!formData.damage || validateField('damage', formData.damage));
  };

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? <><Edit2 size={20} /> Edit Listing</> : <><Plus size={20} /> Add New Listing</>}</h2>
          <div className="step-indicator">
            <span className={step >= 1 ? 'active' : ''} onClick={() => { if (step > 1) setManualNav(true); setStep(1); }}>{step > 1 ? '✓' : '1'} Vehicle</span>
            <span className={step >= 2 ? 'active' : ''} onClick={() => { if (formData.make && formData.model) { if (step > 2) setManualNav(true); setStep(2); } }}>{step > 2 ? '✓' : '2'} Details</span>
            <span className={step >= 3 ? 'active' : ''} onClick={() => isStep2Valid() && setStep(3)}>3 Location</span>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="form-step">
              <h3>Select Vehicle</h3>
              <QuickSelect label="Make" options={makes} value={formData.make} onChange={(v) => setFormData({ ...formData, make: v, model: '', trim: '' })} columns={3} />
              {formData.make && <QuickSelect label="Model" options={availableModels} value={formData.model} onChange={(v) => setFormData({ ...formData, model: v, trim: '' })} columns={2} />}
              <QuickSelect label="Year" options={years} value={formData.year} onChange={(v) => setFormData({ ...formData, year: v })} columns={4} />
              {availableTrims.length > 0 && <QuickSelect label="Trim" options={availableTrims} value={formData.trim} onChange={(v) => setFormData({ ...formData, trim: v })} columns={3} />}
              {!availableTrims.length && formData.model && (
                <div className="form-group"><label>Trim (custom)</label><input type="text" value={formData.trim} onChange={(e) => setFormData({ ...formData, trim: e.target.value })} placeholder="e.g., LT, Premium" /></div>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="form-step">
              <h3>{isEditing ? 'Edit Details' : 'Vehicle Details'}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="500 - 120,000" min="500" max="120000" className={getFieldError('price', formData.price) ? 'input-error' : ''} />
                  {getFieldError('price', formData.price) && <span className="field-error">{getFieldError('price', formData.price)}</span>}
                </div>
                <div className="form-group">
                  <label>Odometer (km) *</label>
                  <input type="number" value={formData.odo} onChange={(e) => setFormData({ ...formData, odo: e.target.value })} placeholder="500 - 300,000" min="500" max="300000" className={getFieldError('odo', formData.odo) ? 'input-error' : ''} />
                  {getFieldError('odo', formData.odo) && <span className="field-error">{getFieldError('odo', formData.odo)}</span>}
                </div>
              </div>
              <div className="form-group"><label>Dealer</label><input type="text" value={formData.dealer} onChange={(e) => setFormData({ ...formData, dealer: e.target.value })} placeholder="e.g., City Motors" list="dealers" /><datalist id="dealers">{existingDealers.map(d => <option key={d} value={d} />)}</datalist></div>
              <QuickSelect label="Color" options={COLOR_PRESETS} value={formData.color} onChange={(v) => setFormData({ ...formData, color: v })} columns={3} />
              <div className="form-row">
                <div className="form-group">
                  <label>Range (km)</label>
                  <input type="number" value={formData.range} onChange={(e) => setFormData({ ...formData, range: e.target.value })} placeholder="50 - 800" min="50" max="800" className={getFieldError('range', formData.range) ? 'input-error' : ''} />
                  {getFieldError('range', formData.range) && <span className="field-error">{getFieldError('range', formData.range)}</span>}
                </div>
                <div className="form-group">
                  <label>Length (inches)</label>
                  <input type="number" value={formData.length} onChange={(e) => setFormData({ ...formData, length: e.target.value })} placeholder="120 - 260" min="120" max="260" className={getFieldError('length', formData.length) ? 'input-error' : ''} />
                  {getFieldError('length', formData.length) && <span className="field-error">{getFieldError('length', formData.length)}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Damage ($)</label>
                  <input type="number" value={formData.damage} onChange={(e) => setFormData({ ...formData, damage: e.target.value })} placeholder="0 - 100,000" min="0" max="100000" className={getFieldError('damage', formData.damage) ? 'input-error' : ''} />
                  {getFieldError('damage', formData.damage) && <span className="field-error">{getFieldError('damage', formData.damage)}</span>}
                </div>
                <div className="form-group"><label>Trim Level</label><div className="trim-level-buttons">{[1, 2, 3].map(n => (<button key={n} type="button" className={`trim-btn ${formData.trimLevel === n ? 'active' : ''}`} onClick={() => setFormData({ ...formData, trimLevel: n })}>{n === 1 ? 'Base' : n === 2 ? 'Mid' : 'Top'}</button>))}</div></div>
              </div>
              <div className="form-row features-row">
                <div className={`feature-toggle ${formData.heatPump ? 'active' : ''}`} onClick={() => setFormData({ ...formData, heatPump: !formData.heatPump })}><Thermometer size={20} /><span>Heat Pump</span><div className="toggle-indicator">{formData.heatPump ? '✓' : '✗'}</div></div>
                <div className="form-group remote-start-group"><label>Remote Start</label><div className="remote-options">{REMOTE_START_OPTIONS.map(opt => (<button key={opt} type="button" className={`remote-btn ${formData.remoteStart === opt ? 'active' : ''}`} onClick={() => setFormData({ ...formData, remoteStart: opt })}>{opt}</button>))}</div></div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="form-step">
              <h3>Location & Notes</h3>
              <div className="location-grid">
                {LOCATION_PRESETS.map(loc => (<button key={loc.name} type="button" className={`location-btn ${formData.location === loc.name ? 'active' : ''}`} onClick={() => handleLocationSelect(loc.name)}><span className="loc-name">{loc.name}</span><span className="loc-distance">{loc.distance === 1 ? 'Local' : `~${loc.distance * 15}m`}</span></button>))}
              </div>
              <div className="form-row">
                <div className="form-group"><label>Custom Location</label><input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Or enter custom" /></div>
                <div className="form-group"><label>Distance (1-10)</label><input type="range" min="1" max="10" value={formData.distance} onChange={(e) => setFormData({ ...formData, distance: parseInt(e.target.value) })} className="distance-slider" /><div className="distance-labels"><span>Local</span><span className="distance-value">{formData.distance}</span><span>Far</span></div></div>
              </div>
              <div className="form-group"><label><MessageSquare size={14} style={{display: 'inline', marginRight: 6}} />Notes</label><textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any notes about this vehicle..." rows={3} /></div>
              <div className="summary-preview"><h4>Summary</h4><div className="summary-content"><strong>{formData.year} {formData.make} {formData.model} {formData.trim}</strong><span>${parseInt(formData.price || 0).toLocaleString()} • {parseInt(formData.odo || 0).toLocaleString()} km</span><span>{formData.location || 'No location'} • {formData.dealer || 'No dealer'}</span></div></div>
            </div>
          )}
          <div className="modal-actions">
            {step > 1 && <button type="button" className="btn-secondary" onClick={() => { setManualNav(true); setStep(step - 1); }}>Back</button>}
            <div className="flex-spacer" />
            {step === 1 && (<button type="button" className="btn-primary" onClick={() => setStep(2)} disabled={!formData.make || !formData.model}>Next</button>)}
            {step === 2 && (<button type="button" className="btn-primary" onClick={() => setStep(3)} disabled={!isStep2Valid()}>Next</button>)}
            {step === 3 && (<button type="submit" className="btn-primary">{isEditing ? <><Edit2 size={16} /> Save Changes</> : <><Plus size={16} /> Add Listing</>}</button>)}
          </div>
        </form>
      </div>
    </div>
  );
};

const InfoModal = ({ onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal info-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header"><h2><Info size={20} /> About Value Scoring</h2><button onClick={onClose}><X size={20} /></button></div>
      <div className="info-content">
        <h3>Multi-Criteria Decision Analysis (MCDA)</h3>
        <p>This tool uses weighted normalization to calculate an overall "Value Score" for each car. The algorithm normalizes each attribute to a 0-1 scale, applies your weights, and sums them for a final score from 0-100.</p>
        <h3>How Attributes Are Scored</h3>
        <ul>
          <li><strong>Price, Odometer, Distance, Length, Damage:</strong> Lower is better</li>
          <li><strong>Range, Year, Trim Level:</strong> Higher is better</li>
          <li><strong>Heat Pump:</strong> Yes = 1, No = 0</li>
          <li><strong>Remote Start:</strong> Fob+App = 1, Other = 0</li>
        </ul>
        <h3>Data Persistence</h3>
        <p>Your listings and weights are automatically saved and will be here when you return!</p>
      </div>
      <div className="modal-actions"><button onClick={onClose} className="btn-primary">Got it!</button></div>
    </div>
  </div>
);

// ============ MAIN APP ============
export default function CarValueScorer() {
  const [cars, setCars] = useState([]);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showWeights, setShowWeights] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
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
          // First time user or empty data - use sample data
          setCars(SAMPLE_CARS);
        }
      } catch (e) {
        console.error('Failed to load:', e);
        setCars(SAMPLE_CARS);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    // Create a hash of the current data to detect actual changes
    const currentHash = JSON.stringify({ cars, weights });
    if (lastSavedRef.current === currentHash) return; // No changes
    
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus('saving');
    
    // Debounce the save
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
        console.error('Save error:', e);
        setSaveStatus('error');
      }
    }, 2000); // 2 second debounce
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cars, weights, isLoading]);

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const scoredCars = useMemo(() => {
    if (cars.length === 0) return [];
    return cars
      .map(car => ({ ...car, score: calculateValueScore(car, cars, weights), breakdown: getScoreBreakdown(car, cars, weights) }))
      .sort((a, b) => {
        if (a.starred !== b.starred) return b.starred ? 1 : -1; // Starred first
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

  if (isLoading) {
    return <div className="app loading-screen"><Loader2 className="spinner" size={48} /><p>Loading your data...</p></div>;
  }

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .app { min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); font-family: 'Space Grotesk', sans-serif; color: #e2e8f0; padding: 20px; }
        .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .header { max-width: 1200px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .header-left h1 { font-size: 24px; font-weight: 700; background: linear-gradient(135deg, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .header-left .logo { width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #3b82f6); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
        .save-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; padding: 4px 10px; background: #1e293b; border-radius: 20px; }
        .save-status.saved { color: #10b981; }
        .save-status.saving { color: #f59e0b; }
        .save-status.error { color: #ef4444; }
        .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; border-radius: 10px; font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: white; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: #334155; color: #e2e8f0; }
        .btn-secondary:hover { background: #475569; }
        .btn-ghost { background: transparent; color: #94a3b8; border: 1px solid #334155; }
        .btn-ghost:hover { background: #1e293b; color: #e2e8f0; }
        .main-content { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 900px) { .main-content { grid-template-columns: 320px 1fr; } }
        .weights-panel { background: #1e293b; border-radius: 16px; padding: 24px; border: 1px solid #334155; height: fit-content; position: sticky; top: 20px; }
        .weights-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .weights-header h2 { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .weights-total { font-size: 14px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
        .weight-slider { margin-bottom: 14px; }
        .weight-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .weight-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; }
        .weight-value { font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        .weight-number { color: #e2e8f0; font-weight: 600; }
        .weight-percent { color: #64748b; margin-left: 4px; }
        .slider { width: 100%; height: 6px; border-radius: 3px; background: #334155; outline: none; -webkit-appearance: none; cursor: pointer; }
        .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--accent, #10b981); cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: transform 0.2s; }
        .slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .weight-description { font-size: 11px; color: #64748b; margin-top: 2px; }
        @media (max-width: 899px) { .weight-description { display: none; } }
        .reset-btn { width: 100%; margin-top: 16px; }
        .cars-panel { display: flex; flex-direction: column; gap: 16px; }
        .cars-header { display: flex; align-items: center; justify-content: space-between; }
        .cars-header h2 { font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .cars-count { color: #64748b; font-size: 14px; }
        .car-card { background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; transition: all 0.3s; }
        .car-card:hover { border-color: #475569; }
        .car-card.expanded { border-color: #10b981; }
        .car-main { display: flex; align-items: center; gap: 16px; padding: 16px; cursor: pointer; }
        .car-rank { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: white; flex-shrink: 0; }
        .car-info { flex: 1; min-width: 0; }
        .car-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .car-title h3 { font-size: 16px; font-weight: 600; }
        .car-trim { font-size: 12px; color: #94a3b8; background: #334155; padding: 2px 8px; border-radius: 4px; }
        .car-details { display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap; }
        .car-details span { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #94a3b8; }
        .car-score { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .score-circle { width: 56px; height: 56px; position: relative; }
        .score-circle svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .score-bg { fill: none; stroke: #334155; stroke-width: 3; }
        .score-fill { fill: none; stroke: var(--score-color); stroke-width: 3; stroke-linecap: round; }
        .score-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 14px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
        .score-label { font-size: 11px; color: #64748b; }
        .expand-btn { background: none; border: none; color: #64748b; cursor: pointer; padding: 8px; border-radius: 8px; transition: all 0.2s; }
        .expand-btn:hover { background: #334155; color: #e2e8f0; }
        .car-expanded { border-top: 1px solid #334155; padding: 20px; background: #162032; }
        .car-full-details { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 600px) { .car-full-details { grid-template-columns: 1fr 1fr; } }
        .detail-group h4 { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #94a3b8; }
        .detail-grid { display: grid; gap: 8px; font-size: 13px; }
        .detail-grid strong { color: #64748b; }
        .breakdown-bars { display: flex; flex-direction: column; gap: 8px; }
        .breakdown-item { display: flex; flex-direction: column; gap: 3px; }
        .breakdown-label { display: flex; align-items: center; gap: 6px; font-size: 11px; }
        .breakdown-value { margin-left: auto; font-family: 'JetBrains Mono', monospace; color: #10b981; }
        .breakdown-bar { height: 4px; background: #334155; border-radius: 2px; overflow: hidden; }
        .breakdown-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
        .delete-btn { padding: 8px 16px; background: transparent; border: 1px solid #ef4444; color: #ef4444; border-radius: 8px; font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .delete-btn:hover { background: #ef4444; color: white; }
        .edit-btn { padding: 8px 16px; background: transparent; border: 1px solid #3b82f6; color: #3b82f6; border-radius: 8px; font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .edit-btn:hover { background: #3b82f6; color: white; }
        .card-actions { display: flex; gap: 12px; margin-top: 16px; }
        .star-btn { background: none; border: none; color: #64748b; cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.2s; flex-shrink: 0; }
        .star-btn:hover { color: #f59e0b; transform: scale(1.1); }
        .star-btn.active { color: #f59e0b; }
        .car-card.starred { border-color: #f59e0b; border-width: 2px; }
        .car-notes { background: #0f172a; border-radius: 8px; padding: 12px; margin-bottom: 16px; display: flex; gap: 8px; align-items: flex-start; font-size: 13px; color: #94a3b8; }
        .car-notes svg { flex-shrink: 0; margin-top: 2px; color: #64748b; }
        .has-notes-icon { color: #64748b; margin-left: 4px; }
        textarea { padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #e2e8f0; font-family: inherit; font-size: 14px; resize: vertical; width: 100%; }
        textarea:focus { outline: none; border-color: #10b981; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
        .modal { background: #1e293b; border-radius: 20px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; border: 1px solid #334155; }
        .add-modal { max-width: 650px; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #334155; position: sticky; top: 0; background: #1e293b; z-index: 10; }
        .modal-header h2 { font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 10px; }
        .modal-header button { background: none; border: none; color: #64748b; cursor: pointer; padding: 4px; }
        .modal-header button:hover { color: #e2e8f0; }
        .step-indicator { display: flex; gap: 8px; font-size: 12px; }
        .step-indicator span { padding: 4px 10px; background: #334155; border-radius: 12px; color: #64748b; transition: all 0.3s; cursor: pointer; }
        .step-indicator span:hover { background: #475569; }
        .step-indicator span.active { background: #10b981; color: white; }
        form { padding: 24px; }
        .form-step { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        .form-step h3 { font-size: 16px; font-weight: 600; margin-bottom: 20px; color: #94a3b8; }
        .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .form-group label { font-size: 13px; color: #94a3b8; font-weight: 500; }
        .form-group input, .form-group select { padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #e2e8f0; font-family: inherit; font-size: 14px; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #10b981; }
        .form-group input.input-error { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .field-error { font-size: 11px; color: #ef4444; margin-top: 4px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .quick-select-group { margin-bottom: 20px; }
        .quick-select { display: grid; gap: 8px; }
        .quick-btn { padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #94a3b8; font-family: inherit; font-size: 13px; cursor: pointer; transition: all 0.2s; text-align: center; }
        .quick-btn:hover { border-color: #475569; color: #e2e8f0; }
        .quick-btn.active { background: #10b981; border-color: #10b981; color: white; }
        .trim-level-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .trim-btn { padding: 8px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #94a3b8; font-family: inherit; font-size: 12px; cursor: pointer; transition: all 0.2s; }
        .trim-btn.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }
        .features-row { display: flex; gap: 16px; align-items: stretch; }
        .feature-toggle { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 16px; background: #0f172a; border: 2px solid #334155; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .feature-toggle:hover { border-color: #475569; }
        .feature-toggle.active { border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .feature-toggle .toggle-indicator { font-size: 18px; }
        .feature-toggle.active .toggle-indicator { color: #10b981; }
        .remote-start-group { flex: 2; }
        .remote-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
        .remote-btn { padding: 8px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #94a3b8; font-family: inherit; font-size: 11px; cursor: pointer; transition: all 0.2s; }
        .remote-btn.active { background: #06b6d4; border-color: #06b6d4; color: white; }
        .location-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px; }
        .location-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 8px; background: #0f172a; border: 1px solid #334155; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .location-btn:hover { border-color: #475569; }
        .location-btn.active { background: #ef4444; border-color: #ef4444; }
        .loc-name { font-size: 12px; color: #e2e8f0; font-weight: 500; }
        .loc-distance { font-size: 10px; color: #64748b; }
        .location-btn.active .loc-name, .location-btn.active .loc-distance { color: white; }
        .distance-slider { width: 100%; margin: 8px 0; }
        .distance-labels { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
        .distance-value { background: #10b981; color: white; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
        .summary-preview { background: #0f172a; border-radius: 12px; padding: 16px; margin-top: 16px; }
        .summary-preview h4 { font-size: 12px; color: #64748b; margin-bottom: 8px; }
        .summary-content { display: flex; flex-direction: column; gap: 4px; }
        .summary-content strong { font-size: 16px; color: #10b981; }
        .summary-content span { font-size: 13px; color: #94a3b8; }
        .modal-actions { display: flex; gap: 12px; padding: 20px 24px; border-top: 1px solid #334155; position: sticky; bottom: 0; background: #1e293b; }
        .flex-spacer { flex: 1; }
        .info-content { padding: 24px; }
        .info-content h3 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; color: #10b981; }
        .info-content h3:first-child { margin-top: 0; }
        .info-content p, .info-content li { font-size: 14px; color: #94a3b8; line-height: 1.6; }
        .info-content ul { padding-left: 20px; margin: 8px 0; }
        .info-content li { margin: 4px 0; }
        .info-content strong { color: #e2e8f0; }
        .empty-state { text-align: center; padding: 60px 20px; color: #64748b; }
        .empty-state svg { opacity: 0.3; margin-bottom: 16px; }
        @media (max-width: 899px) {
          .weights-panel { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 100; border-radius: 0; overflow-y: auto; transform: translateX(-100%); transition: transform 0.3s ease; padding-bottom: 100px; }
          .weights-panel.open { transform: translateX(0); }
          .mobile-weights-toggle { display: flex; }
          .close-weights { display: block; }
          .reset-btn { position: fixed; bottom: 20px; left: 20px; right: 20px; width: auto; z-index: 101; }
        }
        @media (min-width: 900px) { .close-weights { display: none; } .mobile-weights-toggle { display: none; } }
        .close-weights { position: absolute; top: 16px; right: 16px; background: #334155; border: none; border-radius: 8px; padding: 8px; color: #e2e8f0; cursor: pointer; z-index: 102; }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } .location-grid { grid-template-columns: repeat(2, 1fr); } .features-row { flex-direction: column; } }
      `}</style>
      <header className="header">
        <div className="header-left">
          <div className="logo"><Car size={28} /></div>
          <h1>Used Car Value Scorer</h1>
          <div className={`save-status ${saveStatus}`} onClick={saveStatus === 'error' ? async () => { 
            setSaveStatus('saving'); 
            try {
              const ok = await storage.save({cars, weights}); 
              setSaveStatus(ok ? 'saved' : 'error'); 
              if (ok) lastSavedRef.current = JSON.stringify({cars, weights});
            } catch(e) { setSaveStatus('error'); }
          } : undefined} style={saveStatus === 'error' ? {cursor: 'pointer'} : {}}>
            {saveStatus === 'saving' && <><Loader2 size={12} className="spinner" /> Saving...</>}
            {saveStatus === 'saved' && <><Database size={12} /> Saved</>}
            {saveStatus === 'error' && <><AlertTriangle size={12} /> Tap to retry</>}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => setShowInfoModal(true)}><Info size={18} /> How it Works</button>
          <button className="btn btn-ghost" onClick={resetToSampleData}><RotateCcw size={18} /> Reset</button>
          <button className="btn btn-secondary mobile-weights-toggle" onClick={() => setShowWeights(true)}><Settings size={18} /> Weights</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={18} /> Add Listing</button>
        </div>
      </header>
      <main className="main-content">
        <aside className={`weights-panel ${showWeights ? 'open' : ''}`}>
          <button className="close-weights" onClick={() => setShowWeights(false)}><X size={20} /></button>
          <div className="weights-header"><h2><Settings size={18} /> Weights</h2><span className="weights-total">Total: {totalWeight}</span></div>
          {WEIGHT_CONFIG.map(config => (<WeightSlider key={config.key} config={config} value={weights[config.key]} onChange={(val) => setWeights(prev => ({ ...prev, [config.key]: val }))} totalWeight={totalWeight} />))}
          <button className="btn btn-secondary reset-btn" onClick={() => setWeights(DEFAULT_WEIGHTS)}><RotateCcw size={16} /> Reset Weights</button>
        </aside>
        <section className="cars-panel">
          <div className="cars-header"><h2><TrendingUp size={18} /> Ranked Listings</h2><span className="cars-count">{cars.length} vehicles</span></div>
          {scoredCars.length === 0 ? (
            <div className="empty-state"><Car size={64} /><p>No listings yet. Add your first car to get started!</p></div>
          ) : (
            scoredCars.map((car, index) => (<CarCard key={car.id} car={car} rank={index + 1} score={car.score} breakdown={car.breakdown} isExpanded={expandedCard === car.id} onToggle={() => setExpandedCard(expandedCard === car.id ? null : car.id)} onDelete={() => { setCars(prev => prev.filter(c => c.id !== car.id)); setExpandedCard(null); }} onStar={() => handleStarCar(car.id)} onEdit={() => handleEditCar(car)} />))
          )}
        </section>
      </main>
      {showAddModal && <AddCarModal onClose={() => { setShowAddModal(false); setEditCar(null); }} onAdd={(car) => setCars(prev => [...prev, car])} onUpdate={handleUpdateCar} existingDealers={existingDealers} editCar={editCar} />}
      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
    </div>
  );
}
