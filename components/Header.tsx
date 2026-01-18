
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  cartCount: number;
  onNavigate: (view: any) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, cartCount, onNavigate, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-primary shadow-md">
      {/* Top Thin Accent Bar */}
      <div className="h-1 bg-accent w-full"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* Brand Logo Section */}
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="relative p-1 bg-white rounded-lg">
              <img 
                src="https://sparepartsfinder.co.za/wp-content/uploads/2023/05/Spare-Parts-Finder-Logo.png" 
                alt="Spare Parts Finder" 
                className="h-14 sm:h-16 w-auto object-contain transition-transform group-hover:scale-[1.03]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            {/* Logo Text Fallback - styled with primary/accent colors */}
            <div className="ml-3 hidden lg:block group-only:block-fallback">
               <div className="flex flex-col leading-none">
                 <span className="text-xl font-display font-black tracking-tighter text-primary italic">SPARE PARTS</span>
                 <span className="text-xl font-display font-black tracking-tighter text-accent italic">FINDER.CO.ZA</span>
               </div>
            </div>
          </div>

          {/* Navigation Links - Centered */}
          <nav className="hidden md:flex items-center space-x-2">
            <button 
              onClick={() => onNavigate('browse')} 
              className="px-4 py-2 text-slate-700 hover:text-primary hover:bg-slate-50 rounded-full font-bold text-sm uppercase tracking-wider transition-all"
            >
              Browse Parts
            </button>
            <button 
              onClick={() => onNavigate('sell')} 
              className="px-4 py-2 text-slate-700 hover:text-primary hover:bg-slate-50 rounded-full font-bold text-sm uppercase tracking-wider transition-all"
            >
              Seller Portal
            </button>
            <button 
              className="px-4 py-2 text-slate-700 hover:text-primary hover:bg-slate-50 rounded-full font-bold text-sm uppercase tracking-wider transition-all"
            >
              Support
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Cart Button with Accent Notification */}
            <button 
              onClick={() => onNavigate('cart')}
              className="group relative p-3 text-slate-700 hover:text-primary transition-colors bg-slate-50 rounded-full"
            >
              <span className="material-symbols-outlined text-3xl">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-black text-white ring-2 ring-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
            
            <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>

            {user ? (
              <div className="flex items-center">
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-accent hover:bg-red-50 border-2 border-slate-100 rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('sell')}
                className="group relative overflow-hidden bg-primary px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-900/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* Visual hover effect layer */}
                <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">login</span>
                  Sign In
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
