
import React from 'react';

export const Footer: React.FC<{ onNavigate: (view: any) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-dark text-slate-400 py-12 px-4 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-primary rounded-lg p-1">
              <span className="material-symbols-outlined text-white text-xl">precision_manufacturing</span>
            </div>
            <span className="text-lg font-display font-bold tracking-tight">Spare Parts Finder</span>
          </div>
          <p className="text-sm leading-relaxed">
            The leading marketplace for high-quality auto spare parts in South Africa. Connecting verified sellers with buyers nationwide.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Marketplace</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => onNavigate('browse')} className="hover:text-primary transition-colors">Browse All Parts</button></li>
            <li><button className="hover:text-primary transition-colors">Special Offers</button></li>
            <li><button className="hover:text-primary transition-colors">New Listings</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">For Sellers</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => onNavigate('sell')} className="hover:text-primary transition-colors">Seller Portal</button></li>
            <li><button className="hover:text-primary transition-colors font-bold text-slate-200">Listing Fee: R299 / mo</button></li>
            <li><button className="hover:text-primary transition-colors">Success Stories</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><button className="hover:text-primary transition-colors">Contact Us</button></li>
            <li><button className="hover:text-primary transition-colors">FAQs</button></li>
            <li><button className="hover:text-primary transition-colors">Terms of Service</button></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <p>&copy; {new Date().getFullYear()} Spare Parts Finder ZA. All rights reserved.</p>
        <div className="flex gap-6">
          <button className="hover:text-white transition-colors">Privacy Policy</button>
          <button className="hover:text-white transition-colors">Cookie Policy</button>
        </div>
      </div>
    </footer>
  );
};
