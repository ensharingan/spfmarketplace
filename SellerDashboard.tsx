
import React, { useState, useRef } from 'react';
import { User, Product, SellerProfile, Enquiry, Order, ListingStatus } from '../types';
import { CATEGORIES } from '../constants';

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState<Partial<SellerProfile>>(profile || {});

  const initialFormState: Partial<Product> = {
    name: '',
    category: 'Body Parts',
    make: 'Toyota',
    model: '',
    yearStart: 2015,
    yearEnd: 2024,
    condition: 'Used',
    price: 0,
    quantity: 1,
    sku: '',
    description: '',
    shippingOptions: ['Collection'],
    status: ListingStatus.ACTIVE,
    location: profile?.address.city || '',
    images: [],
    isVehicle: false,
    mileage: 0,
    transmission: 'Manual'
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);

  const activeListingsCount = products.filter(p => p.status === ListingStatus.ACTIVE).length;
  const newEnquiriesCount = enquiries.filter(e => e.status === 'New').length;
  const whatsappLeadsCount = enquiries.filter(e => e.message.includes('[WHATSAPP LEAD]')).length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const generateSKU = (make: string) => {
    const prefix = (make || 'GEN').substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setFormError(null);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setFormError(null);
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImages]
      }));
      setFormError(null); // Clear error when images are added
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setProfileForm(prev => ({ ...prev, logoUrl: url }));
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile && profile) {
      onUpdateProfile({ ...profile, ...profileForm } as SellerProfile);
      setIsEditingProfile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION: Enforce mandatory image upload
    if (!formData.images || formData.images.length === 0) {
      setFormError("At least one image is required to publish a listing.");
      return;
    }

    const finalSKU = formData.sku && formData.sku.trim() !== '' 
      ? formData.sku 
      : generateSKU(formData.make || '');

    const finalData = { ...formData, sku: finalSKU };

    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...finalData } as Product);
    } else {
      onAddProduct({
        ...finalData,
        sellerId: user.id,
      });
    }
    setShowModal(false);
  };

  const isVehicleCat = formData.category === 'Damaged Vehicles (Salvage)' || formData.isVehicle;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-dark tracking-tight italic">Seller Console</h1>
          <p className="text-slate-500 font-medium">Monitoring <span className="text-primary font-bold">{profile?.businessName || 'Business Hub'}</span> performance</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleAddClick}
                className="bg-accent text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-opacity-90 transition-all shadow-xl shadow-red-500/20 active:scale-95"
            >
                <span className="material-symbols-outlined">add_box</span>
                Create Listing
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest">Stock</span>
          </div>
          <p className="text-4xl font-display font-black text-dark">{products.length}</p>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Total Items Listed</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">visibility</span>
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">Market</span>
          </div>
          <p className="text-4xl font-display font-black text-dark">{activeListingsCount}</p>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Live Advertisements</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-red-50 text-accent rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">campaign</span>
            </div>
            <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase tracking-widest">Leads</span>
          </div>
          <p className="text-4xl font-display font-black text-dark">{newEnquiriesCount}</p>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">New Enquiries</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-[#E7F8EE] text-[#25D366] rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">chat</span>
            </div>
            <span className="text-[10px] font-black text-[#25D366] bg-[#E7F8EE] px-2 py-1 rounded-full uppercase tracking-widest">Direct</span>
          </div>
          <p className="text-4xl font-display font-black text-dark">{whatsappLeadsCount}</p>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">WhatsApp Leads</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-slate-50 text-dark rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">analytics</span>
            </div>
            <span className="text-[10px] font-black text-slate-600 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-widest">Sales</span>
          </div>
          <p className="text-3xl font-display font-black text-dark">R {totalRevenue.toLocaleString()}</p>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Revenue Volume</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-72 shrink-0 space-y-2">
          {[
            { id: 'listings', label: 'Inventory Management', icon: 'list_alt' },
            { id: 'enquiries', label: 'Customer Leads', icon: 'chat_bubble', badge: newEnquiriesCount },
            { id: 'orders', label: 'Sales History', icon: 'receipt_long' },
            { id: 'profile', label: 'Business Settings', icon: 'settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-xl shadow-blue-900/20 translate-x-1' 
                  : 'text-slate-600 hover:bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined">{tab.icon}</span>
                <span className="text-sm font-bold tracking-tight">{tab.label}</span>
              </div>
              {tab.badge ? (
                <span className={`${activeTab === tab.id ? 'bg-white text-primary' : 'bg-accent text-white'} text-[10px] font-black px-2.5 py-1 rounded-full`}>
                    {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            {activeTab === 'listings' && (
              <div className="animate-in fade-in duration-500">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                  <h3 className="font-black text-dark uppercase tracking-widest text-xs">Live Stock Feed</h3>
                  <span className="text-xs font-bold text-slate-400">{products.length} Products Found</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Part Identification</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/30 group transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                                <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                              </div>
                              <div>
                                <p className="font-black text-dark text-sm leading-none mb-1 group-hover:text-primary transition-colors">{p.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</p>
                                {p.isVehicle && <span className="text-[9px] bg-dark text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">VEHICLE</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="font-black text-dark">R {p.price.toLocaleString()}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              p.status === ListingStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-accent'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditClick(p)} 
                                className="p-2.5 bg-blue-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-1 group/edit"
                                title="Edit Listing"
                              >
                                <span className="material-symbols-outlined text-xl">edit</span>
                                <span className="text-[10px] font-black uppercase hidden group-hover/edit:inline">Edit</span>
                              </button>
                              <button onClick={() => onDeleteProduct(p.id)} className="p-2.5 bg-red-50 text-accent rounded-xl hover:bg-accent hover:text-white transition-all">
                                <span className="material-symbols-outlined text-xl">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'enquiries' && (
              <div className="p-8 animate-in slide-in-from-right duration-500">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-dark uppercase tracking-widest text-xs">Customer Inquiries</h3>
                </div>
                {enquiries.length === 0 ? (
                  <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">mail_lock</span>
                    <p className="font-bold text-slate-400">No active leads found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enquiries.map(enq => (
                      <div key={enq.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center font-black ${enq.message.includes('[WHATSAPP LEAD]') ? 'bg-[#E7F8EE] text-[#25D366]' : 'bg-white text-primary'}`}>
                            {enq.message.includes('[WHATSAPP LEAD]') ? (
                               <span className="material-symbols-outlined">chat</span>
                            ) : enq.buyerName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-dark text-sm">{enq.buyerName}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{enq.message.includes('[WHATSAPP LEAD]') ? 'WA Direct Click' : `Lead ID: ${enq.id.split('-')[1]}`}</p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 mb-4 group-hover:border-primary/20 transition-colors">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Inquiry Regarding</p>
                          <p className="text-xs font-black text-primary line-clamp-1">{enq.productName}</p>
                        </div>
                        <p className="text-slate-600 text-xs italic leading-relaxed border-l-2 border-slate-200 pl-3">"{enq.message}"</p>
                        <div className="mt-4 flex justify-between items-center">
                           <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(enq.createdAt).toLocaleDateString()}</span>
                           <button className="text-[10px] font-black uppercase text-primary hover:underline">Reply Now</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="p-10 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-10 pb-10 border-b border-slate-100">
                  <div className="flex items-center gap-8">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
                        {profileForm?.logoUrl ? (
                          <img src={profileForm.logoUrl} className="w-full h-full object-cover" alt="logo" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <span className="material-symbols-outlined text-5xl">storefront</span>
                          </div>
                        )}
                        {isEditingProfile && (
                          <div 
                            onClick={() => logoInputRef.current?.click()}
                            className="absolute inset-0 bg-dark/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                          </div>
                        )}
                        <input type="file" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} accept="image/*" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-display font-black text-dark mb-2">{profile?.businessName}</h2>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1.5 rounded-full tracking-widest">
                          <span className="material-symbols-outlined text-xs">verified</span> Verified Seller
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isEditingProfile && (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-xs tracking-widest rounded-2xl transition-all"
                    >
                      Update Profile
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Primary Identity</h4>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Business Brand Name</label>
                            <input className="w-full rounded-2xl border-slate-200 text-sm py-4" value={profileForm.businessName} onChange={e => setProfileForm({...profileForm, businessName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Person</label>
                            <input className="w-full rounded-2xl border-slate-200 text-sm py-4" value={profileForm.contactPerson} onChange={e => setProfileForm({...profileForm, contactPerson: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lead Acquisition Phone</label>
                            <input className="w-full rounded-2xl border-slate-200 text-sm py-4" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operating Hours</label>
                            <input className="w-full rounded-2xl border-slate-200 text-sm py-4" placeholder="e.g. Mon-Fri 08:00 - 17:00" value={profileForm.operatingHours} onChange={e => setProfileForm({...profileForm, operatingHours: e.target.value})} />
                         </div>
                      </div>

                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Physical Address</h4>
                         <div className="grid grid-cols-1 gap-4">
                            <div>
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Street Address</label>
                               <input className="w-full rounded-2xl border-slate-200 text-sm py-4" value={profileForm.address?.street} onChange={e => setProfileForm({...profileForm, address: {...(profileForm.address as any), street: e.target.value}})} />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Suburb</label>
                               <input className="w-full rounded-2xl border-slate-200 text-sm py-4" value={profileForm.address?.suburb} onChange={e => setProfileForm({...profileForm, address: {...(profileForm.address as any), suburb: e.target.value}})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">City</label>
                                  <input className="w-full rounded-2xl border-slate-200 text-sm py-4" value={profileForm.address?.city} onChange={e => setProfileForm({...profileForm, address: {...(profileForm.address as any), city: e.target.value}})} />
                               </div>
                               <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Province</label>
                                  <input className="w-full rounded-2xl border-slate-200 text-sm py-4" value={profileForm.address?.province} onChange={e => setProfileForm({...profileForm, address: {...(profileForm.address as any), province: e.target.value}})} />
                               </div>
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Postcode</label>
                               <input className="w-full rounded-2xl border-slate-200 text-sm py-4" value={profileForm.address?.postcode} onChange={e => setProfileForm({...profileForm, address: {...(profileForm.address as any), postcode: e.target.value}})} />
                            </div>
                         </div>
                      </div>
                    </div>
                    <div className="flex gap-4 justify-end pt-10 border-t border-slate-100">
                      <button type="button" onClick={() => setIsEditingProfile(false)} className="px-8 py-3 font-black uppercase text-xs text-slate-400 hover:text-dark">Cancel</button>
                      <button type="submit" className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-95">Synchronize Profile</button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-8">
                      <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] border-b-2 border-slate-50 pb-4">Communication Hub</h4>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">call</span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Business Phone</p>
                            <p className="font-black text-dark">{profile?.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">schedule</span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operating Hours</p>
                            <p className="font-black text-dark">{profile?.operatingHours || 'Not Set'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-8">
                      <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] border-b-2 border-slate-50 pb-4">Physical Base</h4>
                      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                         <div className="flex items-center gap-4 mb-4">
                            <span className="material-symbols-outlined text-primary">location_on</span>
                            <p className="text-sm font-black text-dark">{profile?.address.city}, {profile?.address.province}</p>
                         </div>
                         <p className="text-xs text-slate-500 leading-relaxed font-medium">
                           {profile?.address.street}<br />
                           {profile?.address.suburb}<br />
                           {profile?.address.postcode}
                         </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-10 border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-display font-black text-dark tracking-tighter">
                    {editingProduct ? 'Modify Asset' : 'Publish New Listing'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Marketplace Compliance Form</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-accent transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Media Library (Required)</label>
                   {formError && <span className="text-[10px] font-black text-accent uppercase animate-pulse">{formError}</span>}
                </div>
                <div className={`flex flex-wrap gap-4 p-4 rounded-3xl transition-colors ${formError ? 'bg-red-50 border-2 border-dashed border-accent' : 'bg-slate-50/50 border-2 border-transparent'}`}>
                   {formData.images?.map((url, idx) => (
                      <div key={idx} className="relative w-28 h-28 rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                         <img src={url} className="w-full h-full object-cover" alt="" />
                         <button 
                            type="button"
                            onClick={() => setFormData(p => ({...p, images: p.images?.filter((_, i) => i !== idx)}))}
                            className="absolute top-2 right-2 bg-white/90 rounded-full p-1 text-accent hover:bg-white shadow-md"
                          >
                           <span className="material-symbols-outlined text-sm font-black">close</span>
                         </button>
                      </div>
                   ))}
                   <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-28 h-28 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${
                        formError ? 'border-accent text-accent' : 'border-slate-200 text-slate-400 hover:border-primary hover:text-primary'
                    }`}
                   >
                     <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                     <span className="text-[9px] font-black uppercase mt-2 tracking-widest">Add Media</span>
                   </button>
                   <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Listing Title</label>
                  <input required type="text" placeholder="e.g. 2020 Toyota Hilux GD-6 Salvage" className="w-full rounded-2xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm font-bold py-4 px-6" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category Segment</label>
                  <select className="w-full rounded-2xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm py-4 px-6 font-bold" value={formData.category} onChange={e => {
                    const isVehicle = e.target.value === 'Damaged Vehicles (Salvage)';
                    setFormData({...formData, category: e.target.value, isVehicle, condition: isVehicle ? 'Damaged/Salvage' : formData.condition});
                  }} >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Asset Condition</label>
                  <select className="w-full rounded-2xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm py-4 px-6 font-bold" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as any})} >
                    <option value="Used">Used / Pre-owned</option>
                    <option value="New">Brand New / OEM</option>
                    <option value="Damaged/Salvage">Damaged / Salvage / Non-Runner</option>
                  </select>
                </div>

                {isVehicleCat && (
                  <>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mileage (km)</label>
                        <input type="number" className="w-full rounded-2xl border-slate-200 text-sm py-4 px-6 font-bold" value={formData.mileage} onChange={e => setFormData({...formData, mileage: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transmission Type</label>
                        <select className="w-full rounded-2xl border-slate-200 text-sm py-4 px-6 font-bold" value={formData.transmission} onChange={e => setFormData({...formData, transmission: e.target.value as any})} >
                            <option value="Manual">Manual</option>
                            <option value="Automatic">Automatic</option>
                        </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Manufacturer</label>
                  <input required type="text" className="w-full rounded-2xl border-slate-200 text-sm py-4 px-6 font-bold" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vehicle Model</label>
                  <input required type="text" className="w-full rounded-2xl border-slate-200 text-sm py-4 px-6 font-bold" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Year From</label>
                        <input required type="number" className="w-full rounded-2xl border-slate-200 text-sm py-4 px-6 font-bold text-center" value={formData.yearStart} onChange={e => setFormData({...formData, yearStart: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Year To</label>
                        <input required type="number" className="w-full rounded-2xl border-slate-200 text-sm py-4 px-6 font-bold text-center" value={formData.yearEnd} onChange={e => setFormData({...formData, yearEnd: Number(e.target.value)})} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Asking Price (R)</label>
                        <input required type="number" className="w-full rounded-2xl border-slate-200 text-sm font-black py-4 px-6 text-primary" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
                        <input required type="number" className="w-full rounded-2xl border-slate-200 text-sm py-4 px-6 font-bold text-center" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                    </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Specifications / Damage Notes</label>
                <textarea rows={4} className="w-full rounded-2xl border-slate-200 text-sm py-4 px-6 font-medium leading-relaxed" placeholder="Describe the part or the extent of damage to the vehicle..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} ></textarea>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:-translate-y-1 transition-all active:scale-95">
                  {editingProduct ? 'Finalize Asset Updates' : 'Authorize & Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
