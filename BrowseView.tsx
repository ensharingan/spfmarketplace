interface BrowseViewProps {
  products: Product[];
  ...
}
import React, { useState } from 'react';
import { Product, ListingStatus } from '../types';
import { CATEGORIES, MAKES } from '../constants';
import { ProductCard } from './ProductCard';

interface BrowseViewProps {
  products: Product[];
  onSelectProduct: (id: string) => void;
  onNavigateToSell?: () => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({ products, onSelectProduct, onNavigateToSell }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMake = selectedMake ? p.make === selectedMake : true;
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const isActive = p.status === ListingStatus.ACTIVE || p.status === ListingStatus.OUT_OF_STOCK;
    return matchesSearch && matchesMake && matchesCategory && isActive;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section with Primary Blue Background */}
      <div className="mb-12 bg-primary rounded-[3rem] p-10 sm:p-16 text-center shadow-2xl shadow-blue-900/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-6xl font-display font-black text-white mb-6 tracking-tight leading-none">
            Find Any Spare Part, <br/>
            <span className="text-accent italic">Instantly.</span>
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto mb-10 text-lg font-medium">
            Search thousands of listings from verified local sellers across South Africa.
          </p>
          
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-2xl">search</span>
            </div>
            <input 
              type="text"
              className="w-full pl-14 pr-6 py-5 rounded-2xl border-none focus:ring-4 focus:ring-accent/30 transition-all shadow-2xl text-lg font-medium text-dark"
              placeholder="Search by part name, car model, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* "Sell My Damaged Car" Promo Card */}
      <div className="mb-12 bg-gradient-to-r from-dark to-slate-800 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="relative z-10 text-center md:text-left max-w-xl">
          <span className="bg-accent text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">New Feature</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Have a Damaged or Salvage Car to Sell?</h2>
          <p className="text-slate-300 mb-6 font-medium">Turn your accident-damaged or non-running vehicle into cash. List it on our marketplace and reach thousands of buyers looking for projects or stripping units.</p>
          <button 
            onClick={onNavigateToSell}
            className="bg-white text-dark hover:bg-primary hover:text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-3"
          >
            <span className="material-symbols-outlined">car_crash</span>
            Sell My Damaged Car
          </button>
        </div>
        <div className="relative z-10 w-full md:w-1/3 aspect-video rounded-2xl overflow-hidden shadow-2xl rotate-2">
            <img 
              src="https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&q=80&w=800" 
              className="w-full h-full object-cover" 
              alt="Damaged Salvage Car"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent"></div>
        </div>
        {/* Background Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">Manufacturer</h3>
            <select 
              className="w-full rounded-xl border-slate-200 text-sm font-bold focus:border-primary focus:ring-primary py-3"
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
            >
              <option value="">All Makes</option>
              {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">Category</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                  selectedCategory === '' ? 'bg-primary text-white font-bold shadow-md shadow-blue-900/20' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                    selectedCategory === cat ? 'bg-primary text-white font-bold shadow-md shadow-blue-900/20' : 'text-slate-600 hover:bg-slate-50'
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
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Displaying {filteredProducts.length} Items
            </p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} onClick={() => onSelectProduct(p.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-7xl text-slate-200 mb-4">no_crash</span>
              <h3 className="text-2xl font-display font-bold text-dark">No matches found</h3>
              <p className="text-slate-400 mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
