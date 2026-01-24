
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Product, SellerProfile, Enquiry, Order, ListingStatus, SellerStatus } from '../types';
import { CATEGORIES, SA_VEHICLE_DATA, MAKES } from '../mockData';
import { GoogleGenAI, Type } from '@google/genai';

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];

// --- HELPERS ---
const generateSKU = (make: string) => {
  const prefix = (make || 'GEN').substring(0, 3).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${randomStr}${timestamp}`;
};

const years = Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => new Date().getFullYear() - i);

interface SellerDashboardProps {
  user: User;
  profile: SellerProfile | null;
  products: Product[];
  enquiries: Enquiry[];
  orders: Order[];
  onAddProduct: (p: any) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProfile?: (p: SellerProfile) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ 
  user, profile, products, enquiries, orders, 
  onAddProduct, onUpdateProduct, onDeleteProduct, onUpdateProfile 
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'enquiries' | 'orders' | 'profile'>('listings');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [vinFeedback, setVinFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const managerImgInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState<SellerProfile>(profile || {
    userId: user.id,
    businessName: '',
    contactPerson: '',
    contactRole: '',
    contactImageUrl: '',
    phone: '',
    email: user.email,
    logoUrl: '',
    status: SellerStatus.PENDING_APPROVAL,
    address: { street: '', suburb: '', city: '', province: '', postcode: '' },
    whatsappEnabled: true,
    socialLinks: { facebook: '', instagram: '', website: '' },
    operatingHours: ''
  });

  useEffect(() => {
    if (profile && !isEditingProfile) {
      setProfileForm(profile);
    }
  }, [profile, isEditingProfile]);

  const initialFormState: Partial<Product> = {
    name: '',
    category: 'Body Parts',
    make: '',
    model: '',
    yearStart: new Date().getFullYear(),
    yearEnd: new Date().getFullYear(),
    condition: 'Used',
    price: 0,
    quantity: 1,
    sku: '',
    description: '',
    shippingOptions: ['Collection'],
    status: ListingStatus.ACTIVE,
    location: profile?.address.city || '',
    images: [],
    vin: '',
    isVehicle: false,
    mileage: 0,
    transmission: 'Manual'
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);

  const stats = useMemo(() => {
    const whatsappLeads = enquiries.filter(e => e.message.includes('[WHATSAPP LEAD]')).length;
    const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    const newEnquiries = enquiries.filter(e => e.status === 'New').length;
    
    return {
      whatsappLeads,
      totalStock: products.length,
      totalStockValue,
      newEnquiries,
      salesCount: orders.length
    };
  }, [products, enquiries, orders]);

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setVinFeedback(null);
    setShowModal(true);
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setFormData({ ...p });
    setVinFeedback(null);
    setShowModal(true);
  };

  const handleTriggerSkuGen = () => {
    setFormData(prev => ({
      ...prev,
      sku: generateSKU(prev.make || 'GEN')
    }));
  };

  const handleDecodeVin = async () => {
    const vinValue = (formData.vin || '').trim();
    setVinFeedback(null);

    if (vinValue.length === 0) {
      setVinFeedback({ type: 'error', message: 'Please enter a VIN.' });
      return;
    }

    if (vinValue.length < 17) {
      setVinFeedback({ type: 'error', message: `VIN too short (${vinValue.length}/17).` });
      return;
    }

    setIsDecodingVin(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const availableMakes = MAKES.join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: `Decode this 17-character vehicle VIN: ${vinValue}` }] }],
        config: {
          systemInstruction: `You are an automotive expert. Extract Make, Model, and Year from the VIN. 
          The Make MUST match one of these: ${availableMakes}. 
          If you cannot decode it, provide a specific reason (e.g., "Invalid format", "Make not recognized", "Year out of range").
          Return ONLY a JSON object.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN },
              make: { type: Type.STRING },
              model: { type: Type.STRING },
              year: { type: Type.INTEGER },
              errorReason: { type: Type.STRING }
            },
            required: ["success"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.success && result.make && result.model) {
        const exactMake = MAKES.find(m => m.toLowerCase() === result.make.toLowerCase()) || result.make;
        
        setFormData(prev => ({
          ...prev,
          make: exactMake,
          model: result.model,
          yearStart: result.year || prev.yearStart,
          yearEnd: result.year || prev.yearEnd,
          name: `${result.year || ''} ${exactMake} ${result.model} ${prev.name || ''}`.trim()
        }));
        setVinFeedback({ type: 'success', message: `Successfully identified: ${result.year} ${exactMake} ${result.model}` });
      } else {
        setVinFeedback({ type: 'error', message: result.errorReason || 'VIN format invalid or unrecognized.' });
      }
    } catch (error) {
      console.error("VIN decoding failed:", error);
      setVinFeedback({ type: 'error', message: 'Unable to connect to decoder. Please enter details manually.' });
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setFormData(prev => ({
              ...prev,
              images: [...(prev.images || []), e.target?.result as string]
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'contactImageUrl') => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileForm(prev => ({
            ...prev,
            [field]: event.target?.result as string
          }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const removeImage = (idx: number) => {
    setFormData(p => ({
      ...p, 
      images: p.images?.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.images || formData.images.length === 0) {
      setFormError("At least one image is required.");
      return;
    }
    const finalSKU = formData.sku && formData.sku.trim() !== '' 
      ? formData.sku 
      : generateSKU(formData.make || '');
    const finalData = { ...formData, sku: finalSKU };
    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...finalData } as Product);
    } else {
      onAddProduct({ ...finalData, sellerId: user.id });
    }
    setShowModal(false);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile(profileForm);
      setIsEditingProfile(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-dark tracking-tight italic">Seller Console</h1>
          <p className="text-slate-500 font-medium">Managing <span className="text-primary font-bold">{profile?.businessName || 'Business Hub'}</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
            <button onClick={handleAddClick} className="bg-accent text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl active:scale-95">
                <span className="material-symbols-outlined">add_box</span>
                New Listing
            </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div onClick={() => setActiveTab('enquiries')} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-2">
            <span className="material-symbols-outlined text-[#25D366] group-hover:scale-110 transition-transform">chat</span>
            <span className="text-[10px] font-black text-[#25D366] uppercase tracking-widest">WhatsApp Leads</span>
          </div>
          <p className="text-3xl font-display font-black text-dark">{stats.whatsappLeads}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Direct Enquiries</p>
        </div>
        
        <div onClick={() => setActiveTab('enquiries')} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-2">
            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">mail</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">New Leads</span>
          </div>
          <p className="text-3xl font-display font-black text-dark">{stats.newEnquiries}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Email Enquiries</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="material-symbols-outlined text-dark">inventory_2</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Stock</span>
          </div>
          <p className="text-3xl font-display font-black text-dark">{stats.totalStock}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Listed Parts</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="material-symbols-outlined text-emerald-500">payments</span>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Stock Value</span>
          </div>
          <p className="text-xl sm:text-2xl font-display font-black text-dark">R {stats.totalStockValue.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Assets</p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 mb-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'listings', label: 'Inventory', icon: 'list_alt' },
          { id: 'enquiries', label: 'All Leads', icon: 'forum', badge: stats.newEnquiries },
          { id: 'orders', label: 'Sales', icon: 'receipt_long' },
          { id: 'profile', label: 'Profile', icon: 'settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setIsEditingProfile(false);
            }}
            className={`whitespace-nowrap flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-xl shadow-blue-900/10' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
            {tab.badge ? <span className="bg-accent text-white text-[9px] px-1.5 py-0.5 rounded-full">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {activeTab === 'listings' && (
          <div className="animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Part Identification</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/30 group transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-5">
                          <img src={p.images[0]} className="w-14 h-14 rounded-xl object-cover" alt="" />
                          <div>
                            <p className="font-black text-dark text-sm">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-dark">R {p.price.toLocaleString()}</td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                          p.condition === 'New' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {p.condition}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right space-x-2">
                        <button onClick={() => handleEditClick(p)} className="p-2 text-primary hover:bg-blue-50 rounded-lg"><span className="material-symbols-outlined">edit</span></button>
                        <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-accent hover:bg-red-50 rounded-lg"><span className="material-symbols-outlined">delete</span></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'enquiries' && (
          <div className="p-8 animate-in fade-in duration-500">
            <h3 className="text-xl font-display font-black text-dark mb-6">Customer Enquiries</h3>
            <div className="grid grid-cols-1 gap-4">
              {enquiries.map(enq => {
                const isWhatsApp = enq.message.includes('[WHATSAPP LEAD]');
                return (
                  <div key={enq.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            isWhatsApp ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-primary/10 text-primary'
                          }`}>
                            {isWhatsApp ? 'WhatsApp Enquiry' : 'Email Enquiry'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(enq.createdAt).toLocaleDateString()}
                          </span>
                       </div>
                       <h4 className="font-black text-dark text-lg">{enq.buyerName}</h4>
                       <div className="bg-white p-3 rounded-xl inline-block border border-slate-100 mb-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Part Requested</p>
                          <p className="text-xs font-bold text-primary">{enq.productName}</p>
                       </div>
                       <p className="text-sm text-slate-600 italic">"{enq.message.replace('[WHATSAPP LEAD] ', '')}"</p>
                    </div>
                    <div className="flex flex-col gap-2 justify-center shrink-0">
                        <button className="bg-dark text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Reply by Email</button>
                        <button className="bg-[#25D366] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">WhatsApp Buyer</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="p-6 sm:p-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-display font-black text-dark tracking-tight">Business Profile</h3>
                {!isEditingProfile && (
                  <button 
                    onClick={() => {
                      setProfileForm(profile || profileForm);
                      setIsEditingProfile(true);
                    }}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">edit_square</span>
                    Edit Profile
                  </button>
                )}
             </div>

             {isEditingProfile ? (
               <form onSubmit={handleProfileSubmit} className="space-y-10 max-w-5xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Business Logo</label>
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-slate-200 flex-shrink-0 relative group">
                          {profileForm.logoUrl ? (
                            <img src={profileForm.logoUrl} className="w-full h-full object-cover" alt="Logo preview" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <span className="material-symbols-outlined text-4xl">storefront</span>
                            </div>
                          )}
                          <button type="button" onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase">Change</button>
                        </div>
                        <div className="flex-1">
                          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'logoUrl')} />
                          <input 
                            type="text" 
                            placeholder="Or enter Image URL" 
                            className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold"
                            value={profileForm.logoUrl || ''}
                            onChange={e => setProfileForm({...profileForm, logoUrl: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Manager Picture</label>
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-200 flex-shrink-0 relative group">
                          {profileForm.contactImageUrl ? (
                            <img src={profileForm.contactImageUrl} className="w-full h-full object-cover" alt="Manager preview" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                               <span className="material-symbols-outlined text-6xl">person</span>
                            </div>
                          )}
                          <button type="button" onClick={() => managerImgInputRef.current?.click()} className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase">Change</button>
                        </div>
                        <div className="flex-1">
                          <input type="file" ref={managerImgInputRef} className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'contactImageUrl')} />
                          <input 
                            type="text" 
                            placeholder="Or enter Image URL" 
                            className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold"
                            value={profileForm.contactImageUrl || ''}
                            onChange={e => setProfileForm({...profileForm, contactImageUrl: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2">Business Presence</h4>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business Name</label>
                        <input required className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold" value={profileForm.businessName} onChange={e => setProfileForm({...profileForm, businessName: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">WhatsApp / Sales Line</label>
                        <div className="flex gap-2">
                           <input required type="tel" className="flex-1 rounded-xl border-slate-200 py-3 text-sm font-bold" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                           <button 
                             type="button" 
                             onClick={() => setProfileForm({...profileForm, whatsappEnabled: !profileForm.whatsappEnabled})}
                             className={`px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors ${profileForm.whatsappEnabled ? 'bg-[#25D366] text-white' : 'bg-slate-100 text-slate-400'}`}
                           >
                             {profileForm.whatsappEnabled ? 'ON' : 'OFF'}
                           </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Operating Hours</label>
                        <input placeholder="e.g. Mon-Fri: 8am - 5pm" className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold" value={profileForm.operatingHours || ''} onChange={e => setProfileForm({...profileForm, operatingHours: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2">Dispatch Address</h4>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Street Address</label>
                        <input required className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold" value={profileForm.address.street} onChange={e => setProfileForm({...profileForm, address: {...profileForm.address, street: e.target.value}})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Suburb</label>
                          <input required className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold" value={profileForm.address.suburb} onChange={e => setProfileForm({...profileForm, address: {...profileForm.address, suburb: e.target.value}})} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">City</label>
                          <input required className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold" value={profileForm.address.city} onChange={e => setProfileForm({...profileForm, address: {...profileForm.address, city: e.target.value}})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Province</label>
                          <select required className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold" value={profileForm.address.province} onChange={e => setProfileForm({...profileForm, address: {...profileForm.address, province: e.target.value}})}>
                            <option value="">Select Province</option>
                            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Postcode</label>
                          <input required className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold" value={profileForm.address.postcode} onChange={e => setProfileForm({...profileForm, address: {...profileForm.address, postcode: e.target.value}})} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2">Social & Website</h4>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">Facebook</label>
                        <input placeholder="https://facebook.com/your-business" className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold" value={profileForm.socialLinks?.facebook} onChange={e => setProfileForm({...profileForm, socialLinks: {...profileForm.socialLinks, facebook: e.target.value}})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">Website URL</label>
                        <input placeholder="https://yourwebsite.co.za" className="w-full rounded-xl border-slate-200 py-3 text-sm font-bold" value={profileForm.socialLinks?.website} onChange={e => setProfileForm({...profileForm, socialLinks: {...profileForm.socialLinks, website: e.target.value}})} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 bg-white text-slate-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-200 hover:text-dark transition-all">Discard</button>
                    <button type="submit" className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all">Save Profile Changes</button>
                  </div>
               </form>
             ) : (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center shadow-inner relative overflow-hidden group">
                       <div className="w-32 h-32 rounded-3xl bg-white border shadow-sm overflow-hidden flex-shrink-0 mb-6 group-hover:scale-105 transition-transform">
                          {profile?.logoUrl ? <img src={profile.logoUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><span className="material-symbols-outlined text-5xl">storefront</span></div>}
                       </div>
                       <h4 className="text-3xl font-display font-black text-dark tracking-tighter mb-2">{profile?.businessName}</h4>
                       <div className="w-full space-y-3">
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Sales Line</span><span className="text-sm font-black text-dark">{profile?.phone}</span></div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Email</span><span className="text-sm font-black text-dark">{profile?.email}</span></div>
                          {profile?.operatingHours && <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hours</span><span className="text-sm font-black text-emerald-600">{profile.operatingHours}</span></div>}
                       </div>
                    </div>
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 flex flex-col sm:flex-row items-center gap-8 shadow-sm">
                       <div className="w-40 h-40 rounded-full border-4 border-slate-50 overflow-hidden flex-shrink-0 shadow-lg">
                          {profile?.contactImageUrl ? <img src={profile.contactImageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><span className="material-symbols-outlined text-6xl">person</span></div>}
                       </div>
                       <div className="flex-1 text-center sm:text-left">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Key Representative</p>
                          <h4 className="text-2xl font-display font-black text-dark mb-1">{profile?.contactPerson}</h4>
                          <p className="text-slate-500 font-bold mb-4">{profile?.contactRole || 'Marketplace Manager'}</p>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 inline-block"><p className="text-xs font-bold text-dark">{profile?.address.city}, {profile?.address.province}</p></div>
                       </div>
                    </div>
                 </div>
               </div>
             )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-display font-black text-dark tracking-tighter">{editingProduct ? 'Edit Listing' : 'New Listing'}</h2>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-accent transition-all"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">VIN Decoder (Make, Model, Year)</label>
                </div>
                <div className="flex gap-3">
                  <input type="text" maxLength={17} placeholder="Enter 17-digit VIN..." className="flex-1 rounded-2xl border-slate-200 text-sm font-bold py-3.5 px-6 uppercase shadow-sm" value={formData.vin} onChange={e => setFormData({...formData, vin: e.target.value.toUpperCase()})} />
                  <button type="button" onClick={handleDecodeVin} disabled={isDecodingVin} className="bg-primary text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 disabled:opacity-50">
                    {isDecodingVin ? <span className="material-symbols-outlined animate-spin text-lg">sync</span> : <span className="material-symbols-outlined text-lg">bolt</span>}
                    {isDecodingVin ? 'Decoding' : 'Fill Info'}
                  </button>
                </div>
                {vinFeedback && (
                  <div className={`mt-3 text-[11px] font-bold px-1 flex items-center gap-1 ${vinFeedback.type === 'error' ? 'text-accent' : 'text-emerald-600'}`}>
                    <span className="material-symbols-outlined text-sm">{vinFeedback.type === 'error' ? 'error' : 'check_circle'}</span>
                    {vinFeedback.message}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Photos ({formData.images?.length || 0}/10)</label>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                   {formData.images?.map((url, idx) => (
                      <div key={idx} className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden border bg-slate-50 group">
                         <img src={url} className="w-full h-full object-cover" alt="" />
                         <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><span className="material-symbols-outlined">delete</span></button>
                      </div>
                   ))}
                   <button type="button" onClick={() => fileInputRef.current?.click()} className="w-28 h-28 shrink-0 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                      <span className="text-[9px] font-black uppercase mt-1">Add Photo</span>
                   </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <div className="md:col-span-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Part Title</label>
                   <input required type="text" className="w-full rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. 2018 Toyota Hilux Left Headlight" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Make</label>
                  <select required className="w-full rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-bold" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value, model: ''})}>
                    <option value="">Select Make</option>
                    {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Model</label>
                  <select required className="w-full rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-bold disabled:opacity-50" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} disabled={!formData.make}>
                    <option value="">{formData.make ? 'Select Model' : 'Select Make First'}</option>
                    {formData.make && SA_VEHICLE_DATA[formData.make]?.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SKU (Empty for Auto-Gen)</label>
                  <div className="flex gap-2">
                    <input type="text" className="flex-1 rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-bold placeholder:italic placeholder:font-normal" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. TOY-HIL-001" />
                    <button type="button" onClick={handleTriggerSkuGen} className="px-4 py-2 bg-slate-100 text-dark border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Gen</button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Year Start</label>
                  <select className="w-full rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-bold" value={formData.yearStart} onChange={e => setFormData({...formData, yearStart: Number(e.target.value)})}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {formError && <p className="text-accent text-xs font-bold text-center">{formError}</p>}
              <button type="submit" className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl transition-all hover:-translate-y-1 active:scale-95">Publish Listing Now</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
