
import React, { useState } from 'react';
import { UserRole, SellerProfile } from '../types';

interface AuthViewProps {
  onAuth: (user: any, profile?: any) => void;
  onBack: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuth, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration specific fields
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userId = 's' + Date.now();
    const user = {
      id: userId,
      email: email || 'seller@example.com',
      role: UserRole.SELLER
    };

    if (isLogin) {
      onAuth(user);
    } else {
      const profile: SellerProfile = {
        userId: userId,
        businessName: businessName,
        contactPerson: "Manager",
        phone: phone, // This is the WhatsApp number
        email: email,
        address: { 
          street: "Pending", 
          suburb: "Pending", 
          city: city, 
          province: "ZA", 
          postcode: "0000" 
        },
        whatsappEnabled: true,
        logoUrl: "https://picsum.photos/seed/placeholder/200/200",
        socialLinks: {
          facebook: '',
          instagram: '',
          website: ''
        }
      };
      onAuth(user, profile);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4 font-sans text-slate-900">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">storefront</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-dark">{isLogin ? 'Seller Login' : 'Register Business'}</h2>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin 
              ? 'Access your marketplace dashboard' 
              : 'Join South Africa\'s leading part marketplace'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary py-3 text-sm"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Cape Town Spares"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">WhatsApp Number</label>
                <input 
                  required
                  type="tel" 
                  className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary py-3 text-sm"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 27821234567"
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">Format: 27 followed by 9 digits</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">City</label>
                <input 
                  required
                  type="text" 
                  className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary py-3 text-sm"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Johannesburg"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
            <input 
              required
              type="email" 
              className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary py-3 text-sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@business.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
            <input 
              required
              type="password" 
              className="w-full rounded-xl border-slate-200 focus:border-primary focus:ring-primary py-3 text-sm"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all active:scale-95 mt-4">
            {isLogin ? 'Sign In' : 'Register & Subscribe'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-primary hover:underline"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Log In"}
          </button>
        </div>
      </div>
      <button onClick={onBack} className="w-full mt-6 text-slate-500 font-medium text-sm flex items-center justify-center gap-2 hover:text-dark">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Marketplace
      </button>
    </div>
  );
};
