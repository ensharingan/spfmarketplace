
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Product, SellerProfile, Enquiry, Order, ListingStatus, SellerStatus } from '../types';
import { CATEGORIES, SA_VEHICLE_DATA, MAKES, PART_GROUPS } from '../mockData';
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

  const [manualMake, setManualMake] = useState('');
  const [manualModel, setManualModel] = useState('');

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
    partGroup: 'Body & Panels',
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

  // Sync title (name) based on required fields
  useEffect(() => {
    if (showModal) {
      const parts = [
        formData.yearStart,
        formData.make === 'Other' ? manualMake : formData.make,
        formData.model === 'Other' ? manualModel : formData.model,
        formData.partGroup,
        formData.name?.split(' - ')[1] || '' // Preserve existing specific part name if it was manual
      ].filter(Boolean);
      
      // We don't want to overwrite the entire name if they've typed something specific, 
      // but we do want to provide a helpful suggestion
    }
  }, [formData.make, formData.model, formData.yearStart, formData.partGroup, manualMake, manualModel]);

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
    setManualMake('');
    setManualModel('');
    setVinFeedback(null);
    setShowModal(true);
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    const isKnownMake = Object.keys(SA_VEHICLE_DATA).includes(p.make);
    const standardModels = isKnownMake ? SA_VEHICLE_DATA[p.make] : [];
    const isKnownModel = standardModels.includes(p.model);

    setFormData({ 
      ...p,
      make: isKnownMake ? p.make : 'Other',
      model: isKnownModel ? p.model : 'Other'
    });

    if (!isKnownMake) setManualMake(p.make);
    else setManualMake('');

    if (!isKnownModel) setManualModel(p.model);
    else setManualModel('');

    setVinFeedback(null);
    setShowModal(true);
  };

  const handleTriggerSkuGen = () => {
    const activeMake = formData.make === 'Other' ? manualMake : (formData.make || 'GEN');
    setFormData(prev => ({
      ...prev,
      sku: generateSKU(activeMake)
    }));
  };

  const handleDecodeVin = async () => {
    const vinValue = (formData.vin || '').trim();
    setVinFeedback(null);
    if (vinValue.length < 17) {
      setVinFeedback({ type: 'error', message: `VIN too short (${vinValue.length}/17).` });
      return;
    }

    setIsDecodingVin(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const availableMakes = Object.keys(SA_VEHICLE_DATA).join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: `Decode this 17-character vehicle VIN: ${vinValue}` }] },
        config: {
          systemInstruction: `You are an automotive expert. Extract Make, Model, and Year from the VIN. 
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
        const exactMake = Object.keys(SA_VEHICLE_DATA).find(m => m.toLowerCase() === result.make.toLowerCase());
        if (exactMake) {
          setFormData(prev => ({ ...prev, make: exactMake, model: result.model, yearStart: result.year, yearEnd: result.year }));
          setManualMake('');
          setManualModel('');
        } else {
          setFormData(prev => ({ ...prev, make: 'Other', model: 'Other', yearStart: result.year, yearEnd: result.year }));
          setManualMake(result.make);
          setManualModel(result.model);
        }
        setVinFeedback({ type: 'success', message: `Successfully identified: ${result.year} ${result.make} ${result.model}` });
      }
    } catch (error) {
      setVinFeedback({ type: 'error', message: 'Decoding failed. Please enter details manually.' });
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setFormData(prev => ({ ...prev, images: [...(prev.images || []), e.target?.result as string] }));
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
          setProfileForm(prev => ({ ...prev, [field]: event.target?.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0] as File);
    }
  };

  const removeImage = (idx: number) => {
    setFormData(p => ({ ...p, images: p.images?.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.images || formData.images.length === 0) {
      setFormError("At least one image is required.");
      return;
    }
    let finalMake = formData.make === 'Other' ? manualMake : (formData.make || '');
    let finalModel = formData.model === 'Other' ? manualModel : (formData.model || '');
    const finalData = { ...formData, make: finalMake, model: finalModel, sku: formData.sku || generateSKU(finalMake) };
    if (editingProduct) onUpdateProduct({ ...editingProduct, ...finalData } as Product);
    else onAddProduct({ ...finalData, sellerId: user.id });
    setShowModal(false);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile(profileForm);
      setIsEditingProfile(false);
    }
  };

  const handleWhatsAppBuyerReply = (enq: Enquiry) => {
    const phone = enq.buyerPhone.replace(/\D/g, '');
    const messageText = `Hi ${enq.buyerName}, this is ${profile?.businessName} responding to your enquiry about the *${enq.productName}*.

How can I assist you further? We have the stock available and ready for collection/dispatch.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`, '_blank');
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

      {/* Stats Summary Section */}
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

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'listings', label: 'Inventory', icon: 'list_alt' },
          { id: 'enquiries', label: 'All Leads', icon: 'forum', badge: stats.newEnquiries },
          { id: 'orders', label: 'Sales', icon: 'receipt_long' },
          { id: 'profile', label: 'Profile Settings', icon: 'settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setIsEditingProfile(false); }}
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
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Group</th>
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.make} {p.model} ({p.yearStart})</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">{p.partGroup}</span>
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
                        <button onClick={() => handleEditClick(p)} className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase transition-all inline-flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">edit</span> Edit
                        </button>
                        <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-accent hover:bg-red-50 rounded-lg">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ... Other Tabs remain the same ... */}

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
                        <button 
                          onClick={() => handleWhatsAppBuyerReply(enq)}
                          className="bg-[#25D366] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                          WhatsApp Buyer
                        </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ... Profile Tab remains the same ... */}
        
        {activeTab === 'profile' && (
          <div className="p-6 sm:p-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-display font-black text-dark tracking-tight italic">Business Profile Suite</h3>
                {!isEditingProfile && (
                  <button onClick={() => setIsEditingProfile(true)} className="bg-primary text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg hover:-translate-y-0.5 transition-all">
                    <span className="material-symbols-outlined text-sm">edit_square</span> Update Profile
                  </button>
                )}
             </div>

             {isEditingProfile ? (
               <form onSubmit={handleProfileSubmit} className="space-y-12">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Media Assets Section */}
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                      <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-6">Visual Branding</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Shop Logo</p>
                          <div className="relative group w-32 h-32 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
                            {profileForm.logoUrl ? <img src={profileForm.logoUrl} className="w-full h-full object-cover" alt="" /> : <span className="material-symbols-outlined text-4xl text-slate-200">storefront</span>}
                            <button type="button" onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-dark/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[9px] font-black uppercase">
                              <span className="material-symbols-outlined text-lg mb-1">add_photo_alternate</span> Upload
                            </button>
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'logoUrl')} />
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Manager / Sales Profile</p>
                          <div className="relative group w-32 h-32 bg-white rounded-full border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
                            {profileForm.contactImageUrl ? <img src={profileForm.contactImageUrl} className="w-full h-full object-cover" alt="" /> : <span className="material-symbols-outlined text-4xl text-slate-200">person</span>}
                            <button type="button" onClick={() => managerImgInputRef.current?.click()} className="absolute inset-0 bg-dark/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[9px] font-black uppercase">
                              <span className="material-symbols-outlined text-lg mb-1">face</span> Photo
                            </button>
                            <input type="file" ref={managerImgInputRef} className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'contactImageUrl')} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Matrix */}
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                      <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-6">Digital Presence</label>
                      <div className="space-y-4">
                        <div className="flex gap-4 items-center">
                           <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20"><span className="material-symbols-outlined">facebook</span></div>
                           <input placeholder="Facebook URL" className="flex-1 rounded-xl border-slate-200 text-sm font-bold py-3" value={profileForm.socialLinks?.facebook || ''} onChange={e => setProfileForm({...profileForm, socialLinks: {...profileForm.socialLinks, facebook: e.target.value}})} />
                        </div>
                        <div className="flex gap-4 items-center">
                           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20"><span className="material-symbols-outlined">photo_camera</span></div>
                           <input placeholder="Instagram URL" className="flex-1 rounded-xl border-slate-200 text-sm font-bold py-3" value={profileForm.socialLinks?.instagram || ''} onChange={e => setProfileForm({...profileForm, socialLinks: {...profileForm.socialLinks, instagram: e.target.value}})} />
                        </div>
                        <div className="flex gap-4 items-center">
                           <div className="w-10 h-10 rounded-xl bg-dark text-white flex items-center justify-center shrink-0 shadow-lg"><span className="material-symbols-outlined">language</span></div>
                           <input placeholder="Official Website" className="flex-1 rounded-xl border-slate-200 text-sm font-bold py-3" value={profileForm.socialLinks?.website || ''} onChange={e => setProfileForm({...profileForm, socialLinks: {...profileForm.socialLinks, website: e.target.value}})} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="space-y-5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Human Factor</h4>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Contact Person Name</label>
                          <input required className="w-full rounded-xl border-slate-200 font-bold py-3" value={profileForm.contactPerson} onChange={e => setProfileForm({...profileForm, contactPerson: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Job Title / Role</label>
                          <input placeholder="e.g. Parts Manager" className="w-full rounded-xl border-slate-200 font-bold py-3" value={profileForm.contactRole || ''} onChange={e => setProfileForm({...profileForm, contactRole: e.target.value})} />
                        </div>
                     </div>
                     <div className="space-y-5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Physical Shop</h4>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2">
                             <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Operating Hours</label>
                             <input placeholder="e.g. Mon-Fri: 8am-5pm" className="w-full rounded-xl border-slate-200 font-bold py-3" value={profileForm.operatingHours || ''} onChange={e => setProfileForm({...profileForm, operatingHours: e.target.value})} />
                           </div>
                           <div className="col-span-2">
                             <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Suburb & City</label>
                             <input required className="w-full rounded-xl border-slate-200 font-bold py-3" value={`${profileForm.address.suburb}, ${profileForm.address.city}`} onChange={e => {
                               const parts = e.target.value.split(',');
                               setProfileForm({...profileForm, address: {...profileForm.address, suburb: (parts[0] || '').trim(), city: (parts[1] || '').trim()}});
                             }} />
                           </div>
                        </div>
                     </div>
                     <div className="space-y-5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Sales Communication</h4>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Main Sales Line</label>
                          <input required className="w-full rounded-xl border-slate-200 font-bold py-3" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                           <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-[#25D366] text-3xl">chat</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">WhatsApp Enabled</span>
                           </div>
                           <input type="checkbox" className="w-6 h-6 rounded-md text-[#25D366] focus:ring-[#25D366]" checked={profileForm.whatsappEnabled} onChange={e => setProfileForm({...profileForm, whatsappEnabled: e.target.checked})} />
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t">
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="px-10 py-4 bg-white text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-dark transition-all">Discard</button>
                    <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:shadow-primary/20 active:scale-95 transition-all">Publish Profile Updates</button>
                  </div>
               </form>
             ) : (
               <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <div className="flex flex-col lg:flex-row gap-8">
                    {/* Hero Section */}
                    <div className="flex-1 bg-gradient-to-br from-slate-50 to-white p-10 rounded-[3rem] border border-slate-200 shadow-inner flex flex-col items-center text-center">
                       <div className="w-32 h-32 rounded-[2rem] bg-white shadow-lg border border-slate-100 overflow-hidden mb-6">
                          {profile?.logoUrl ? <img src={profile.logoUrl} className="w-full h-full object-cover" alt="" /> : <span className="material-symbols-outlined text-6xl text-slate-100 mt-8">storefront</span>}
                       </div>
                       <h4 className="text-3xl font-display font-black text-dark tracking-tighter mb-2 italic uppercase">{profile?.businessName}</h4>
                       <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-6">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {profile?.address.city}, {profile?.address.province}
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Direct Email</p>
                             <p className="text-sm font-bold text-dark truncate">{profile?.email}</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Trading Hours</p>
                             <p className="text-sm font-bold text-emerald-600 truncate">{profile?.operatingHours || 'Not Specified'}</p>
                          </div>
                       </div>
                    </div>

                    {/* Manager / Social Card */}
                    <div className="flex-1 flex flex-col gap-6">
                       <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex items-center gap-6">
                          <div className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-md overflow-hidden shrink-0">
                             {profile?.contactImageUrl ? <img src={profile.contactImageUrl} className="w-full h-full object-cover" alt="" /> : <span className="material-symbols-outlined text-4xl text-slate-100 mt-6 ml-6">person</span>}
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Primary Representative</p>
                             <h4 className="text-2xl font-display font-black text-dark mb-0.5">{profile?.contactPerson}</h4>
                             <p className="text-slate-500 font-bold text-sm mb-3">{profile?.contactRole || 'Marketplace Specialist'}</p>
                             <button 
                               onClick={() => {
                                 const phone = (profile?.phone || '27615494504').replace(/\D/g, '');
                                 window.open(`tel:+${phone}`);
                               }}
                               className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-dark hover:bg-slate-200 transition-all"
                             >
                                <span className="material-symbols-outlined text-sm">phone</span> Contact Direct
                             </button>
                          </div>
                       </div>
                       
                       <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
                          <div>
                             <h5 className="font-display font-black text-xl italic mb-1">SOCIAL LINKS</h5>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Connect with our workshop</p>
                          </div>
                          <div className="flex gap-4">
                             {profile?.socialLinks?.facebook && <a href={profile.socialLinks.facebook} target="_blank" className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-primary transition-all"><span className="material-symbols-outlined text-white">facebook</span></a>}
                             {profile?.socialLinks?.instagram && <a href={profile.socialLinks.instagram} target="_blank" className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-pink-600 transition-all"><span className="material-symbols-outlined text-white">photo_camera</span></a>}
                             {profile?.socialLinks?.website && <a href={profile.socialLinks.website} target="_blank" className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-accent transition-all"><span className="material-symbols-outlined text-white">language</span></a>}
                          </div>
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
              <h2 className="text-3xl font-display font-black text-dark tracking-tighter italic">{editingProduct ? 'Edit Listing' : 'New Listing'}</h2>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-accent transition-all"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">VIN Decoder</label>
                </div>
                <div className="flex gap-3">
                  <input type="text" maxLength={17} placeholder="Enter 17-digit VIN..." className="flex-1 rounded-2xl border-slate-200 text-sm font-bold py-3.5 px-6 uppercase shadow-sm" value={formData.vin} onChange={e => setFormData({...formData, vin: e.target.value.toUpperCase()})} />
                  <button type="button" onClick={handleDecodeVin} disabled={isDecodingVin} className="bg-primary text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 disabled:opacity-50">
                    {isDecodingVin ? <span className="material-symbols-outlined animate-spin text-lg">sync</span> : <span className="material-symbols-outlined text-lg">bolt</span>}
                    {isDecodingVin ? 'Decoding' : 'Fill Info'}
                  </button>
                </div>
              </div>

              {/* Required Core Fields Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <div className="md:col-span-2 lg:col-span-1">
                   <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2">Asking Price (R)</label>
                   <input required type="number" className="w-full rounded-2xl border-primary py-3.5 px-6 text-sm font-black text-primary shadow-sm" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Part Group</label>
                  <select required className="w-full rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-bold" value={formData.partGroup} onChange={e => setFormData({...formData, partGroup: e.target.value})}>
                    {PART_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Condition</label>
                  <select required className="w-full rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-bold" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as any})}>
                    <option value="Used">Used</option>
                    <option value="New">New</option>
                    <option value="Damaged/Salvage">Damaged/Salvage</option>
                  </select>
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
                    {formData.make && (formData.make === 'Other' ? <option value="Other">Other</option> : SA_VEHICLE_DATA[formData.make]?.map(m => <option key={m} value={m}>{m}</option>))}
                    {formData.make && formData.make !== 'Other' && <option value="Other">Other</option>}
                  </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vehicle Year</label>
                   <input required type="number" className="w-full rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-bold" value={formData.yearStart} onChange={e => setFormData({...formData, yearStart: Number(e.target.value), yearEnd: Number(e.target.value)})} />
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="md:col-span-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Title / Specific Name</label>
                   <input required type="text" className="w-full rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Left Front Door Shell" />
                   <p className="mt-1.5 text-[9px] text-slate-400 font-bold uppercase">Buyers will see: [Year] [Make] [Model] [Group] - {formData.name || '...'}</p>
                </div>
                <div className="md:col-span-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Description</label>
                   <textarea rows={4} className="w-full rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-medium" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe technical details, part number, scratches, etc..."></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SKU</label>
                  <div className="flex gap-2">
                    <input type="text" className="flex-1 rounded-2xl border-slate-200 py-3.5 px-6 text-sm font-bold" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                    <button type="button" onClick={handleTriggerSkuGen} className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest">Gen</button>
                  </div>
                </div>
              </div>

              {formError && <p className="text-accent text-xs font-bold text-center">{formError}</p>}
              <button type="submit" className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl transition-all hover:-translate-y-1 active:scale-95">
                {editingProduct ? 'Save Stock Changes' : 'Publish Listing Now'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
