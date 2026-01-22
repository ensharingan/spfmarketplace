
import React, { useState, useMemo } from 'react';
import { Product, ListingStatus } from '../types';
import { CATEGORIES, MAKES, SPARE_PARTS } from '../mockData';
import { ProductCard } from './ProductCard';

interface BrowseViewProps {
  products: Product[];
  onSelectProduct: (id: string) => void;
  onNavigateToSell?: () => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({ products, onSelectProduct, onNavigateToSell }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Generate years list (e.g., from current year down to 1980)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 1980;
    const yrs = [];
    for (let i = currentYear; i >= startYear; i--) {
      yrs.push(i.toString());
    }
    return yrs;
  }, []);

  // Derive available models based on selected make
  const availableModels = useMemo(() => {
    const filtered = selectedMake 
      ? products.filter(p => p.make === selectedMake)
      : products;
    const modelSet = new Set(filtered.map(p => p.model));
    return Array.from(modelSet).sort();
  }, [selectedMake, products]);

  // Comprehensive Filter logic
  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm ? (
      p.name.toLowerCase().includes(searchLower) || 
      p.description.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower) ||
      (p.vin && p.vin.toLowerCase().includes(searchLower))
    ) : true;
    
    const matchesMake = selectedMake ? p.make === selectedMake : true;
    
    const matchesModel = selectedModel ? p.model === selectedModel : true;
    
    const matchesYear = selectedYear ? (
      parseInt(selectedYear) >= p.yearStart && parseInt(selectedYear) <= p.yearEnd
    ) : true;
    
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    
    const isActive = p.status === ListingStatus.ACTIVE || p.status === ListingStatus.OUT_OF_STOCK;
    
    return matchesSearch && matchesMake && matchesModel && matchesYear && matchesCategory && isActive;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    setSelectedCategory('');
  };

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    setSelectedModel(''); // Reset model when make changes
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Small Hero Section */}
      <div className="mb-8 bg-primary rounded-[2.5rem] p-8 sm:p-10 text-center shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-4xl font-display font-black text-white mb-2 tracking-tight">
            Find Your <span className="text-accent italic">Spare Part</span>
          </h1>
          <p className="text-blue-100/80 max-w-xl mx-auto text-sm sm:text-base font-medium">
            Search 10,000+ verified listings from local sellers.
          </p>
        </div>
      </div>

      {/* Horizontal Multi-Field Search Matrix */}
      <div className="relative z-20 -mt-10 mb-12 max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl shadow-dark/10 p-4 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Keyword / Part Name / VIN */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">search</span>
              <input 
                type="text" 
                placeholder="Part Name or VIN" 
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 font-bold text-xs text-dark placeholder:text-slate-400 placeholder:font-normal"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Make Selector */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">directions_car</span>
              <select 
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 font-bold text-xs text-dark appearance-none"
                value={selectedMake}
                onChange={(e) => handleMakeChange(e.target.value)}
              >
                <option value="">Any Make</option>
                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Model Dropdown */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">minor_crash</span>
              <select 
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 font-bold text-xs text-dark appearance-none"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={availableModels.length === 0 && !selectedMake}
              >
                <option value="">{selectedMake ? 'All Models' : 'Select Make First'}</option>
                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Year Dropdown */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">calendar_month</span>
              <select 
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 font-bold text-xs text-dark appearance-none"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Any Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Category Selector */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">category</span>
              <select 
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 font-bold text-xs text-dark appearance-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          {(searchTerm || selectedMake || selectedModel || selectedYear || selectedCategory) && (
            <div className="mt-3 flex justify-end">
              <button 
                onClick={resetFilters}
                className="text-[9px] font-black uppercase text-slate-400 hover:text-accent transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">restart_alt</span>
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters - Categories Only */}
        <aside className="w-full lg:w-60 shrink-0">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm sticky top-32">
             <h3 className="text-[9px] font-black text-slate-400 mb-5 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Quick Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === '' 
                    ? 'bg-primary text-white shadow-lg shadow-blue-900/10' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                }`}
              >
                All Parts
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat 
                      ? 'bg-primary text-white shadow-lg shadow-blue-900/10' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
                <h2 className="text-lg font-display font-black text-dark italic tracking-tight">Verified Listings</h2>
                <span className="text-[9px] font-black text-slate-400 uppercase bg-white border border-slate-200 px-3 py-1 rounded-full">
                  {filteredProducts.length} Results
                </span>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">Sort:</span>
                <select className="bg-transparent border-none text-[9px] font-black text-primary uppercase focus:ring-0 cursor-pointer">
                   <option>Newest</option>
                   <option>Price: Low</option>
                   <option>Price: High</option>
                </select>
             </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} onClick={() => onSelectProduct(p.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="material-symbols-outlined text-3xl text-slate-300">manage_search</span>
              </div>
              <h3 className="text-lg font-display font-bold text-dark">No parts found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Try adjusting your vehicle model or year filter.</p>
              <button 
                onClick={resetFilters}
                className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
