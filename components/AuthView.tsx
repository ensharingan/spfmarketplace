
import React, { useState } from 'react';
import { UserRole, SellerProfile, SellerStatus } from '../types';

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
    
    // Admin Check Logic
    if (email.toLowerCase() === 'admin@spf.co.za') {
      onAuth({
        id: 'admin_1',
        email: email,
        role: UserRole.ADMIN
      });
      return;
    }

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
        contactPerson: "New Manager",
        contactRole: "Owner",
        phone: phone, // This is the WhatsApp number
        email: email,
        status: SellerStatus.PENDING_APPROVAL,
        address: { 
          street: "Pending Verification", 
          suburb: "Pending", 
          city: city, 
          province: "Pending", 
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
      <div className="bg-white p-8 sm:p-10 rounded-[3rem] shadow-2xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">{isLogin ? 'key' : 'storefront'}</span>
          </div>
          <h2 className="text-3xl font-display font-black text-dark tracking-tighter italic">
            {isLogin ? 'Marketplace Login' : 'Join the Network'}
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">
            {isLogin 
              ? 'Enter your credentials to manage your store' 
              : 'Register your business for approval today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business Entity Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full rounded-2xl border-slate-200 focus:border-primary focus:ring-primary py-3.5 text-sm font-bold shadow-sm"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Cape Town Bakkie Spares"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">WhatsApp Number</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full rounded-2xl border-slate-200 focus:border-primary focus:ring-primary py-3.5 text-sm font-bold shadow-sm"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="27..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Primary City</label>
                  <input 
                    required
                    type="text" 
                    className="w-full rounded-2xl border-slate-200 focus:border-primary focus:ring-primary py-3.5 text-sm font-bold shadow-sm"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Durban"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email / Username</label>
            <input 
              required
              type="email" 
              className="w-full rounded-2xl border-slate-200 focus:border-primary focus:ring-primary py-3.5 text-sm font-bold shadow-sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Secret Key (Password)</label>
            <input 
              required
              type="password" 
              className="w-full rounded-2xl border-slate-200 focus:border-primary focus:ring-primary py-3.5 text-sm font-bold shadow-sm"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="w-full bg-primary text-white py-4.5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 transition-all hover:-translate-y-1 active:scale-95 mt-6">
            {isLogin ? 'Enter Console' : 'Submit Application'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
          >
            {isLogin ? "New Merchant? Create Account" : "Registered Seller? Log In Here"}
          </button>
        </div>

        {isLogin && (
          <div className="mt-6 pt-6 border-t border-slate-100">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 text-center">Administrator Portal</p>
             <button 
               type="button"
               onClick={() => {
                 setEmail('admin@spf.co.za');
                 setPassword('admin123');
               }}
               className="w-full py-2 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors"
             >
               Quick Fill Admin Credentials
             </button>
          </div>
        )}
      </div>
      <button onClick={onBack} className="w-full mt-8 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:text-dark transition-colors">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Marketplace
      </button>
    </div>
  );
};
