import React, { useState, useMemo, useEffect } from 'react';
import { Car, Plus, Trash2, Settings, TrendingUp, ChevronDown, ChevronUp, Zap, Gauge, MapPin, Calendar, DollarSign, Thermometer, Smartphone, Ruler, AlertTriangle, Star, Info, X, Edit2, Check, RotateCcw, Save, Upload } from 'lucide-react';

// Default criteria weights from the article
const DEFAULT_WEIGHTS = {
  price: 20,
  odo: 15,
  year: 15,
  range: 15,
  trimLevel: 10,
  heatPump: 5,
  remoteStart: 5,
  length: 5,
  distance: 5,
  damage: 5
};

// Criteria metadata
const CRITERIA_INFO = {
  price: { name: 'Price', icon: DollarSign, unit: '$', direction: 'lower', description: 'Lower price is better' },
  odo: { name: 'Odometer', icon: Gauge, unit: 'km', direction: 'lower', description: 'Lower mileage is better' },
  year: { name: 'Year', icon: Calendar, unit: '', direction: 'higher', description: 'Newer year is better' },
  range: { name: 'Range', icon: Zap, unit: 'km', direction: 'higher', description: 'Higher range is better' },
  trimLevel: { name: 'Trim Level', icon: Star, unit: '', direction: 'higher', description: '1=Base, 2=Mid, 3=Top' },
  heatPump: { name: 'Heat Pump', icon: Thermometer, unit: '', direction: 'higher', description: 'Heat pump is more efficient' },
  remoteStart: { name: 'Remote Start', icon: Smartphone, unit: '', direction: 'higher', description: 'App+Fob=2, App or Fob=1, None=0' },
  length: { name: 'Length', icon: Ruler, unit: 'in', direction: 'higher', description: 'More cargo space is better' },
  distance: { name: 'Distance', icon: MapPin, unit: '', direction: 'lower', description: 'Closer dealer is better' },
  damage: { name: 'Damage', icon: AlertTriangle, unit: '', direction: 'lower', description: '0=None, 1=Some, 2=Major' }
};

// Location presets with distance ratings
const LOCATION_PRESETS = [
  { name: 'Airport', distance: 1 },
  { name: 'Springbank', distance: 1 },
  { name: 'Wharncliffe South', distance: 1 },
  { name: 'Downtown', distance: 2 },
  { name: 'Stratford', distance: 3 },
  { name: 'Sarnia', distance: 4 },
  { name: 'Kitchener', distance: 5 },
  { name: 'Guelph', distance: 6 },
  { name: 'Hamilton', distance: 7 },
  { name: 'Milton', distance: 10 },
  { name: 'Mississauga', distance: 10 },
  { name: 'Toronto', distance: 10 },
];

// Sample data from the article
const SAMPLE_CARS = [
  { id: 1, make: 'Chevrolet', model: 'Bolt EUV', year: 2023, trim: 'LT', trimLevel: 2, dealer: 'Park Lane Cadillac', price: 22995, odo: 62000, color: 'Grey', range: 397, length: 169, heatPump: false, remoteStart: 'Fob, App', location: 'Sarnia', distance: 4, damage: 0 },
  { id: 2, make: 'Kia', model: 'Niro EV', year: 2020, trim: 'SX Touring', trimLevel: 3, dealer: 'Titanium Auto Sales', price: 23990, odo: 75000, color: 'Gravity Blue', range: 385, length: 171, heatPump: true, remoteStart: 'App', location: 'Springbank', distance: 1, damage: 0 },
  { id: 3, make: 'Hyundai', model: 'Kona Electric', year: 2021, trim: 'Preferred', trimLevel: 2, dealer: 'Stricklands', price: 24650, odo: 37000, color: 'White', range: 415, length: 164, heatPump: true, remoteStart: 'Fob, App', location: 'Stratford', distance: 3, damage: 0 },
  { id: 4, make: 'Chevrolet', model: 'Bolt EV', year: 2022, trim: '1LT', trimLevel: 2, dealer: 'MacMaster GM', price: 25495, odo: 91000, color: 'White', range: 417, length: 163, heatPump: false, remoteStart: 'Fob, App', location: 'Airport', distance: 1, damage: 0 },
  { id: 5, make: 'Chevrolet', model: 'Bolt EV', year: 2022, trim: '1LT', trimLevel: 2, dealer: 'Audi London', price: 25495, odo: 46450, color: 'Grey', range: 417, length: 163, heatPump: false, remoteStart: 'Fob, App', location: 'Wharncliffe South', distance: 1, damage: 0 },
  { id: 6, make: 'Nissan', model: 'Leaf', year: 2023, trim: 'SL Plus', trimLevel: 3, dealer: 'Stricklands Toyota', price: 26888, odo: 8743, color: 'White', range: 342, length: 176, heatPump: true, remoteStart: 'App', location: 'Stratford', distance: 3, damage: 0 },
  { id: 7, make: 'Hyundai', model: 'Kona Electric', year: 2021, trim: 'Ultimate', trimLevel: 3, dealer: 'Maple Auto', price: 26990, odo: 55000, color: 'Grey', range: 415, length: 164, heatPump: true, remoteStart: 'Fob, App', location: 'Mississauga', distance: 10, damage: 0 },
  { id: 8, make: 'Hyundai', model: 'Kona Electric', year: 2022, trim: 'Preferred', trimLevel: 2, dealer: 'Auto Gallery', price: 27800, odo: 27700, color: 'White', range: 415, length: 164, heatPump: true, remoteStart: 'Fob, App', location: 'Milton', distance: 10, damage: 0 },
  { id: 9, make: 'Hyundai', model: 'Kona Electric', year: 2024, trim: 'Preferred', trimLevel: 2, dealer: 'Georgian Chevrolet', price: 37995, odo: 3500, color: 'Grey', range: 418, length: 171, heatPump: true, remoteStart: 'Fob, App', location: 'Toronto', distance: 10, damage: 0 },
  { id: 10, make: 'Hyundai', model: 'Kona Electric', year: 2024, trim: 'Ultimate', trimLevel: 3, dealer: 'Georgian Chevrolet', price: 42995, odo: 500, color: 'Cyber Grey', range: 418, length: 171, heatPump: true, remoteStart: 'Fob, App', location: 'Toronto', distance: 10, damage: 0 },
];

// Remote start value conversion
const remoteStartValue = (rs) => {
  if (rs === 'Fob, App' || rs === 'App, Fob') return 2;
  if (rs === 'App' || rs === 'Fob') return 1;
  return 0;
};

// MCDA Scoring Algorithm
const calculateScores = (cars, weights) => {
  if (cars.length === 0) return [];
  
  // Get numeric values for each criterion
  const criteriaValues = {
    price: cars.map(c => c.price),
    odo: cars.map(c => c.odo),
    year: cars.map(c => c.year),
    range: cars.map(c => c.range),
    trimLevel: cars.map(c => c.trimLevel),
    heatPump: cars.map(c => c.heatPump ? 1 : 0),
    remoteStart: cars.map(c => remoteStartValue(c.remoteStart)),
    length: cars.map(c => c.length),
    distance: cars.map(c => c.distance),
    damage: cars.map(c => c.damage)
  };
  
  // Normalize each criterion (0-1 scale)
  const normalized = {};
  Object.keys(criteriaValues).forEach(key => {
    const values = criteriaValues[key];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const info = CRITERIA_INFO[key];
    
    normalized[key] = values.map(v => {
      const norm = (v - min) / range;
      return info.direction === 'lower' ? (1 - norm) : norm;
    });
  });
  
  // Calculate total weight
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  
  // Calculate weighted scores
  return cars.map((car, idx) => {
    let score = 0;
    const breakdown = {};
    
    Object.keys(weights).forEach(key => {
      const weightedScore = (normalized[key][idx] * weights[key]) / totalWeight;
      breakdown[key] = weightedScore;
      score += weightedScore;
    });
    
    return {
      ...car,
      score: score * 100,
      breakdown
    };
  }).sort((a, b) => b.score - a.score);
};

// Storage key
const STORAGE_KEY = 'car-value-scorer-data';

export default function CarValueScorer() {
  const [cars, setCars] = useState([]);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [sortField, setSortField] = useState('score');
  const [sortDir, setSortDir] = useState('desc');
  
  // Form state
  const [formData, setFormData] = useState({
    make: '', model: '', year: 2024, trim: '', trimLevel: 2,
    dealer: '', price: '', odo: '', color: 'White',
    range: '', length: '', heatPump: false, remoteStart: 'Fob, App',
    location: '', distance: 1, damage: 0
  });

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await window.storage?.get('car-scorer-data');
        if (result?.value) {
          const data = JSON.parse(result.value);
          if (data.cars) setCars(data.cars);
          if (data.weights) setWeights(data.weights);
        } else {
          setCars(SAMPLE_CARS);
        }
      } catch {
        setCars(SAMPLE_CARS);
      }
    };
    loadData();
  }, []);

  // Save data to storage when cars or weights change
  useEffect(() => {
    const saveData = async () => {
      try {
        await window.storage?.set('car-scorer-data', JSON.stringify({ cars, weights }));
      } catch (e) {
        console.log('Storage not available');
      }
    };
    if (cars.length > 0) saveData();
  }, [cars, weights]);

  // Calculate scores
  const scoredCars = useMemo(() => calculateScores(cars, weights), [cars, weights]);
  
  // Sort cars
  const sortedCars = useMemo(() => {
    return [...scoredCars].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'name') {
        aVal = `${a.make} ${a.model}`;
        bVal = `${b.make} ${b.model}`;
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [scoredCars, sortField, sortDir]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const newCar = {
      ...formData,
      id: editingId || Date.now(),
      price: Number(formData.price),
      odo: Number(formData.odo),
      range: Number(formData.range),
      length: Number(formData.length),
      year: Number(formData.year),
      trimLevel: Number(formData.trimLevel),
      distance: Number(formData.distance),
      damage: Number(formData.damage)
    };
    
    if (editingId) {
      setCars(cars.map(c => c.id === editingId ? newCar : c));
      setEditingId(null);
    } else {
      setCars([...cars, newCar]);
    }
    
    setFormData({
      make: '', model: '', year: 2024, trim: '', trimLevel: 2,
      dealer: '', price: '', odo: '', color: 'White',
      range: '', length: '', heatPump: false, remoteStart: 'Fob, App',
      location: '', distance: 1, damage: 0
    });
    setShowAddForm(false);
  };

  // Edit car
  const handleEdit = (car) => {
    setFormData(car);
    setEditingId(car.id);
    setShowAddForm(true);
  };

  // Delete car
  const handleDelete = (id) => {
    setCars(cars.filter(c => c.id !== id));
    if (selectedCar?.id === id) setSelectedCar(null);
  };

  // Reset to sample data
  const handleReset = () => {
    setCars(SAMPLE_CARS);
    setWeights(DEFAULT_WEIGHTS);
  };

  // Get score color
  const getScoreColor = (score, maxScore) => {
    const ratio = score / maxScore;
    if (ratio >= 0.9) return 'text-emerald-400';
    if (ratio >= 0.75) return 'text-lime-400';
    if (ratio >= 0.5) return 'text-amber-400';
    return 'text-rose-400';
  };

  // Get rank badge
  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black';
    if (rank === 2) return 'bg-gradient-to-r from-slate-300 to-slate-400 text-black';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
    return 'bg-slate-700 text-slate-300';
  };

  const maxScore = scoredCars.length > 0 ? Math.max(...scoredCars.map(c => c.score)) : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        .score-bar {
          background: linear-gradient(90deg, #10b981 0%, #22c55e 25%, #84cc16 50%, #eab308 75%, #ef4444 100%);
        }
        
        .glass {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .glow-line {
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          height: 1px;
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          background: transparent;
        }
        
        input[type="range"]::-webkit-slider-track {
          height: 4px;
          background: #334155;
          border-radius: 2px;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          margin-top: -6px;
        }
        
        .animate-in {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Car className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">EV Value Scorer</h1>
                <p className="text-xs text-slate-500">Multi-Criteria Decision Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWeights(!showWeights)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  showWeights ? 'bg-blue-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Weights</span>
              </button>
              
              <button
                onClick={() => { setShowAddForm(true); setEditingId(null); setFormData({
                  make: '', model: '', year: 2024, trim: '', trimLevel: 2,
                  dealer: '', price: '', odo: '', color: 'White',
                  range: '', length: '', heatPump: false, remoteStart: 'Fob, App',
                  location: '', distance: 1, damage: 0
                }); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Car</span>
              </button>
              
              <button
                onClick={handleReset}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-all"
                title="Reset to sample data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Weights Panel */}
      {showWeights && (
        <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur animate-in">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Criteria Weights</h2>
              <button
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Reset to defaults
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(weights).map(([key, value]) => {
                const info = CRITERIA_INFO[key];
                const Icon = info.icon;
                return (
                  <div key={key} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-300">{info.name}</span>
                      <span className="ml-auto mono text-xs text-blue-400">{value}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={value}
                      onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">{info.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Car' : 'Add New Car'}</h2>
              <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Make</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Hyundai"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Kona Electric"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mono"
                    min="2015"
                    max="2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Trim</label>
                  <input
                    type="text"
                    value={formData.trim}
                    onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Preferred"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Trim Level (1-3)</label>
                  <select
                    value={formData.trimLevel}
                    onChange={(e) => setFormData({ ...formData, trimLevel: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value={1}>1 - Base</option>
                    <option value={2}>2 - Mid</option>
                    <option value={3}>3 - Top</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mono"
                    placeholder="25000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    value={formData.odo}
                    onChange={(e) => setFormData({ ...formData, odo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mono"
                    placeholder="50000"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Range (km)</label>
                  <input
                    type="number"
                    value={formData.range}
                    onChange={(e) => setFormData({ ...formData, range: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mono"
                    placeholder="415"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Length (inches)</label>
                  <input
                    type="number"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mono"
                    placeholder="164"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Dealer</label>
                <input
                  type="text"
                  value={formData.dealer}
                  onChange={(e) => setFormData({ ...formData, dealer: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Stricklands"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => {
                      const loc = LOCATION_PRESETS.find(l => l.name === e.target.value);
                      setFormData({ 
                        ...formData, 
                        location: e.target.value,
                        distance: loc?.distance || formData.distance
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select location...</option>
                    {LOCATION_PRESETS.map(loc => (
                      <option key={loc.name} value={loc.name}>{loc.name} (Distance: {loc.distance})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Distance Rating (1-10)</label>
                  <input
                    type="number"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mono"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="White"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Remote Start</label>
                  <select
                    value={formData.remoteStart}
                    onChange={(e) => setFormData({ ...formData, remoteStart: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Fob, App">Fob + App</option>
                    <option value="App">App Only</option>
                    <option value="Fob">Fob Only</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Damage (0-2)</label>
                  <select
                    value={formData.damage}
                    onChange={(e) => setFormData({ ...formData, damage: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value={0}>0 - None</option>
                    <option value={1}>1 - Minor</option>
                    <option value={2}>2 - Major</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.heatPump}
                    onChange={(e) => setFormData({ ...formData, heatPump: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">Has Heat Pump</span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingId ? 'Save Changes' : 'Add Car'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Cars</div>
            <div className="text-2xl font-semibold mono">{cars.length}</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avg Price</div>
            <div className="text-2xl font-semibold mono">
              ${cars.length > 0 ? Math.round(cars.reduce((a, c) => a + c.price, 0) / cars.length).toLocaleString() : 0}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Top Score</div>
            <div className="text-2xl font-semibold mono text-emerald-400">
              {scoredCars.length > 0 ? scoredCars[0].score.toFixed(1) : 0}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Best Value</div>
            <div className="text-lg font-semibold truncate">
              {scoredCars.length > 0 ? `${scoredCars[0].make} ${scoredCars[0].model}` : '-'}
            </div>
          </div>
        </div>

        {/* Car Table */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="text-left p-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-12">#</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Vehicle</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Price</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Odo</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Range</th>
                  <th className="text-center p-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Features</th>
                  <th className="text-right p-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Score</th>
                  <th className="p-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {sortedCars.map((car, idx) => {
                  const rank = scoredCars.findIndex(c => c.id === car.id) + 1;
                  return (
                    <tr 
                      key={car.id} 
                      className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                        selectedCar?.id === car.id ? 'bg-blue-500/10' : ''
                      }`}
                      onClick={() => setSelectedCar(selectedCar?.id === car.id ? null : car)}
                    >
                      <td className="p-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getRankBadge(rank)}`}>
                          {rank}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{car.year} {car.make} {car.model}</div>
                        <div className="text-xs text-slate-500">{car.trim} • {car.dealer}</div>
                      </td>
                      <td className="p-3 text-right mono text-sm">${car.price.toLocaleString()}</td>
                      <td className="p-3 text-right mono text-sm text-slate-400">{car.odo.toLocaleString()} km</td>
                      <td className="p-3 text-right mono text-sm">{car.range} km</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {car.heatPump && (
                            <span className="p-1 bg-emerald-500/20 rounded" title="Heat Pump">
                              <Thermometer className="w-3 h-3 text-emerald-400" />
                            </span>
                          )}
                          {car.remoteStart !== 'None' && (
                            <span className="p-1 bg-blue-500/20 rounded" title={`Remote: ${car.remoteStart}`}>
                              <Smartphone className="w-3 h-3 text-blue-400" />
                            </span>
                          )}
                          {car.damage > 0 && (
                            <span className="p-1 bg-rose-500/20 rounded" title={`Damage: ${car.damage}`}>
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full score-bar rounded-full transition-all"
                              style={{ width: `${(car.score / maxScore) * 100}%` }}
                            />
                          </div>
                          <span className={`mono text-sm font-semibold ${getScoreColor(car.score, maxScore)}`}>
                            {car.score.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(car)}
                            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(car.id)}
                            className="p-1.5 hover:bg-rose-500/20 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Car Detail */}
        {selectedCar && (
          <div className="mt-6 bg-slate-900/50 rounded-xl border border-slate-800 p-6 animate-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedCar.year} {selectedCar.make} {selectedCar.model}
                </h3>
                <p className="text-slate-400">{selectedCar.trim} • {selectedCar.dealer} • {selectedCar.location}</p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold mono ${getScoreColor(selectedCar.score, maxScore)}`}>
                  {selectedCar.score.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500">VALUE SCORE</div>
              </div>
            </div>
            
            <div className="glow-line mb-4" />
            
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <DollarSign className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <div className="mono font-semibold">${selectedCar.price.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Price</div>
              </div>
              <div className="text-center">
                <Gauge className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <div className="mono font-semibold">{selectedCar.odo.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Odometer (km)</div>
              </div>
              <div className="text-center">
                <Zap className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <div className="mono font-semibold">{selectedCar.range}</div>
                <div className="text-xs text-slate-500">Range (km)</div>
              </div>
              <div className="text-center">
                <Ruler className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <div className="mono font-semibold">{selectedCar.length}"</div>
                <div className="text-xs text-slate-500">Length</div>
              </div>
              <div className="text-center">
                <MapPin className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <div className="mono font-semibold">{selectedCar.distance}</div>
                <div className="text-xs text-slate-500">Distance Rating</div>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Score Breakdown</h4>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(selectedCar.breakdown).map(([key, value]) => {
                const info = CRITERIA_INFO[key];
                const Icon = info.icon;
                const contribution = (value * 100).toFixed(1);
                return (
                  <div key={key} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-300">{info.name}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="h-12 w-full bg-slate-700 rounded overflow-hidden flex items-end">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded transition-all"
                          style={{ height: `${value * 100}%` }}
                        />
                      </div>
                      <span className="mono text-xs text-blue-400 ml-2">{contribution}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {cars.length === 0 && (
          <div className="text-center py-16">
            <Car className="w-16 h-16 mx-auto text-slate-700 mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">No cars added yet</h3>
            <p className="text-slate-500 mb-4">Add your first car to start comparing values</p>
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm font-medium transition-all"
            >
              Add Your First Car
            </button>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-slate-500">
          <span>EV Value Scorer • Multi-Criteria Decision Analysis Tool</span>
          <span>Data persists across sessions</span>
        </div>
      </footer>
    </div>
  );
}
