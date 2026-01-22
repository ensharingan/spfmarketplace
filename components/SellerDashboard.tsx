import React, { useState, useRef, useEffect } from 'react';
import { User, Product, SellerProfile, Enquiry, Order, ListingStatus } from '../types';
import { CATEGORIES, COMMON_PART_NAMES } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Bulk Import State
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'preview'>('idle');

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

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
    vin: '',
    isVehicle: false,
    mileage: 0,
    transmission: 'Manual'
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);

  // Use a ref to track blobs for proper cleanup on unmount
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      // Cleanup all blobs on unmount
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionBoxRef.current && 
        !suggestionBoxRef.current.contains(event.target as Node) &&
        nameInputRef.current && 
        !nameInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameChange = (val: string) => {
    setFormData({ ...formData, name: val });
    if (val.length > 1) {
      const existingNames = Array.from(new Set(products.map(p => p.name)));
      const combined = [...new Set([...COMMON_PART_NAMES, ...existingNames])];
      const filtered = combined.filter(s => 
        s.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setFormData({ ...formData, name: suggestion });
    setShowSuggestions(false);
  };

  const handleDecodeVin = async () => {
    if (!formData.vin || formData.vin.length < 5) {
      alert("Please enter a valid VIN (Vehicle Identification Number)");
      return;
    }

    setIsDecodingVin(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Decode this VIN and provide the vehicle make, model, and manufacture year. Format the response as JSON. VIN: ${formData.vin}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              make: { type: Type.STRING },
              model: { type: Type.STRING },
              year: { type: Type.INTEGER }
            },
            required: ["make", "model", "year"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.make && result.model && result.year) {
        setFormData(prev => ({
          ...prev,
          make: result.make,
          model: result.model,
          yearStart: result.year,
          yearEnd: result.year,
          name: `${result.year} ${result.make} ${result.model}`
        }));
      }
    } catch (error) {
      console.error("VIN decoding failed:", error);
      alert("Failed to decode VIN. Please enter details manually.");
    } finally {
      setIsDecodingVin(false);
    }
  };

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

  const processFiles = (files: FileList) => {
    const currentCount = formData.images?.length || 0;
    const remainingSlots = 10 - currentCount;
    
    if (remainingSlots <= 0) {
      setFormError("Maximum of 10 images allowed per listing.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newImages = filesToProcess.map((file: File) => {
      const url = URL.createObjectURL(file);
      blobUrlsRef.current.add(url);
      return url;
    });

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...newImages]
    }));
    setFormError(null);
    
    if (files.length > remainingSlots) {
      setFormError(`Only ${remainingSlots} images were added. (Max 10 total)`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const removeImage = (idx: number) => {
    const urlToRemove = formData.images?.[idx];
    if (urlToRemove && urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove);
      blobUrlsRef.current.delete(urlToRemove);
    }
    setFormData(p => ({
      ...p, 
      images: p.images?.filter((_, i) => i !== idx)
    }));
  };

  // CSV Processing
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('parsing');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      
      const newItems = rows.slice(1).filter(r => r.trim()).map(row => {
        const values = row.split(',').map(v => v.trim());
        const item: any = { ...initialFormState };
        
        headers.forEach((header, idx) => {
          const val = values[idx];
          if (!val) return;

          if (header === 'name' || header === 'part name') item.name = val;
          if (header === 'price') item.price = parseFloat(val) || 0;
          if (header === 'category') item.category = val;
          if (header === 'make') item.make = val;
          if (header === 'model') item.model = val;
          if (header === 'sku') item.sku = val;
          if (header === 'year' || header === 'yearstart') item.yearStart = parseInt(val) || 2015;
          if (header === 'yearend') item.yearEnd = parseInt(val) || item.yearStart;
          if (header === 'description') item.description = val;
          if (header === 'condition') item.condition = val as any;
        });

        if (!item.images || item.images.length === 0) {
          item.images = ['https://sparepartsfinder.co.za/wp-content/uploads/2023/05/Spare-Parts-Finder-Logo.png'];
        }
        
        return item;
      });

      setParsedProducts(newItems);
      setImportStatus('preview');
    };
    reader.readAsText(file);
  };

  const finalizeBulkImport = () => {
    parsedProducts.forEach(p => {
      const finalSKU = p.sku && p.sku.trim() !== '' ? p.sku : generateSKU(p.make || '');
      onAddProduct({ ...p, sku: finalSKU, sellerId: user.id });
    });
    setParsedProducts([]);
    setShowImportModal(false);
    setImportStatus('idle');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      const url = URL.createObjectURL(files[0] as Blob);
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

  const isVehicleCat = formData.category === 'Damaged Vehicles (Salvage)' || 
                       formData.category === 'Stripping' || 
                       formData.category === 'Stripping for Parts' || 
                       formData.isVehicle;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-dark tracking-tight italic">Seller Console</h1>
          <p className="text-slate-500 font-medium">Monitoring <span className="text-primary font-bold">{profile?.businessName || 'Business Hub'}</span> performance</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <button 
                onClick={() => setShowImportModal(true)}
                className="bg-white text-primary border-2 border-primary px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
                <span className="material-symbols-outlined">upload_file</span>
                Bulk Import CSV
            </button>
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

        {/* WhatsApp Leads Card - Enhanced for visibility */}
        <div className="bg-[#25D366]/5 p-6 rounded-3xl border border-[#25D366]/20 shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#25D366]/10 rounded-full translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-125"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#25D366]/20">
              <span className="material-symbols-outlined text-2xl">chat</span>
            </div>
            <span className="text-[10px] font-black text-[#25D366] bg-white border border-[#25D366]/20 px-2.5 py-1 rounded-full uppercase tracking-widest">Direct Leads</span>
          </div>
          <p className="text-4xl font-display font-black text-dark relative z-10">{whatsappLeadsCount}</p>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tighter relative z-10">WhatsApp Leads</p>
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

            {activeTab === 'orders' && (
              <div className="p-8 animate-in slide-in-from-right duration-500">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-dark uppercase tracking-widest text-xs">Sales History</h3>
                </div>
                {orders.length === 0 ? (
                  <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">receipt_long</span>
                    <p className="font-bold text-slate-400">No completed orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Order ID</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Customer</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Total</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td className="py-4 font-bold text-sm text-primary">{order.id}</td>
                            <td className="py-4 font-bold text-sm">{order.customerDetails.name}</td>
                            <td className="py-4 font-black text-sm">R {order.total.toLocaleString()}</td>
                            <td className="py-4 text-[10px] font-black text-slate-400 text-right">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                        {profile?.whatsappEnabled && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-[#25D366] uppercase bg-[#E7F8EE] px-3 py-1.5 rounded-full tracking-widest">
                            <span className="material-symbols-outlined text-xs">chat</span> WhatsApp Active
                          </span>
                        )}
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
                  <form onSubmit={handleProfileSubmit} className="space-y-10">
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
                      </div>

                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Physical Address</h4>
                         <div className="grid grid-cols-1 gap-4">
                            <div>
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Street Address</label>
                               <input className="w-full rounded-2xl border-slate-200 text-sm py-4" value={profileForm.address?.street} onChange={e => setProfileForm({...profileForm, address: {...(profileForm.address as any), street: e.target.value}})} />
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
                          <div className={`w-10 h-10 ${profile?.whatsappEnabled ? 'bg-[#E7F8EE] text-[#25D366]' : 'bg-slate-50 text-slate-300'} rounded-xl flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-lg">chat</span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Leads</p>
                            <p className={`font-black ${profile?.whatsappEnabled ? 'text-[#25D366]' : 'text-slate-400 italic'}`}>
                                {profile?.whatsappEnabled ? 'Enabled & Active' : 'Disabled'}
                            </p>
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

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-dark/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-10 border-b border-slate-100">
              <div>
                <h2 className="text-3xl font-display font-black text-dark tracking-tighter">Bulk Asset Import</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Import multiple parts via CSV file</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportStatus('idle'); }} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-accent transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10">
              {importStatus === 'idle' && (
                <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                   <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                      <span className="material-symbols-outlined text-4xl text-primary">cloud_upload</span>
                   </div>
                   <h3 className="text-xl font-display font-bold text-dark mb-2">Upload your inventory file</h3>
                   <p className="text-slate-500 mb-8 max-w-sm text-center font-medium">Support standard CSV files. Ensure headers like Name, Price, Category are present.</p>
                   
                   <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleCSVUpload} />
                   <div className="flex gap-4">
                      <button onClick={() => csvInputRef.current?.click()} className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                        Select CSV File
                      </button>
                   </div>
                </div>
              )}

              {importStatus === 'parsing' && (
                <div className="flex flex-col items-center justify-center py-20">
                   <span className="material-symbols-outlined text-6xl text-primary animate-spin mb-4">sync</span>
                   <p className="font-black text-dark uppercase tracking-widest">Processing Inventory Data...</p>
                </div>
              )}

              {importStatus === 'preview' && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined">check</span>
                         </div>
                         <div>
                            <p className="text-sm font-black text-emerald-800">{parsedProducts.length} Items Detected</p>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ready to finalize import</p>
                         </div>
                      </div>
                      <button onClick={finalizeBulkImport} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 active:scale-95">
                         Authorize Import
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-10 border border-white/20 animate-in zoom-in-95 duration-300">
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
              {/* Smart VIN Decoder */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">auto_fix</span>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Smart VIN Decoder</label>
                </div>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Enter 17-digit VIN..." 
                    className="flex-1 rounded-2xl border-slate-200 focus:border-primary focus:ring-primary text-sm font-bold py-4 px-6 uppercase shadow-sm" 
                    value={formData.vin} 
                    onChange={e => setFormData({...formData, vin: e.target.value.toUpperCase()})} 
                  />
                  <button 
                    type="button"
                    onClick={handleDecodeVin}
                    disabled={isDecodingVin}
                    className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-900/20 active:scale-95"
                  >
                    {isDecodingVin ? (
                      <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-lg">bolt</span>
                    )}
                    {isDecodingVin ? 'Decoding' : 'Auto-Fill'}
                  </button>
                </div>
              </div>

              {/* Enhanced Media Library */}
              <div>
                <div className="flex justify-between items-center mb-4">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Media Library ({formData.images?.length || 0}/10 Images)</label>
                   {formError && <span className="text-[10px] font-black text-accent uppercase animate-pulse">{formError}</span>}
                </div>
                
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 p-6 rounded-3xl transition-all border-2 border-dashed ${
                    isDragging 
                      ? 'bg-blue-50 border-primary scale-[1.01]' 
                      : formError 
                        ? 'bg-red-50 border-accent' 
                        : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                   {formData.images?.map((url, idx) => (
                      <div key={url + idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white animate-in zoom-in-95">
                         <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                         
                         {idx === 0 && (
                           <div className="absolute top-2 left-2 bg-primary text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md z-10 flex items-center gap-1">
                             <span className="material-symbols-outlined text-[10px]">star</span>
                             Primary
                           </div>
                         )}

                         <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                          >
                           <div className="bg-white/95 p-2 rounded-full text-accent shadow-xl active:scale-90 transition-transform">
                             <span className="material-symbols-outlined text-lg font-black">delete</span>
                           </div>
                         </button>
                      </div>
                   ))}

                   {(!formData.images || formData.images.length < 10) && (
                     <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl flex flex-col items-center justify-center transition-all bg-white border border-slate-100 hover:bg-white hover:text-primary hover:shadow-lg text-slate-400 group/add"
                     >
                       <span className="material-symbols-outlined text-3xl mb-1 group-hover/add:scale-110 transition-transform">add_a_photo</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">Add Photo</span>
                     </button>
                   )}
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
                <div className="md:col-span-2 relative">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Listing Title</label>
                  <input 
                    required 
                    type="text" 
                    ref={nameInputRef}
                    placeholder="e.g. 2020 Toyota Hilux GD-6 Salvage" 
                    className="w-full rounded-2xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm font-bold py-4 px-6" 
                    value={formData.name} 
                    onChange={e => handleNameChange(e.target.value)}
                    onFocus={() => formData.name && handleNameChange(formData.name)}
                  />
                  {showSuggestions && (
                    <div 
                      ref={suggestionBoxRef}
                      className="absolute left-0 right-0 top-[calc(100%+4px)] z-[110] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2"
                    >
                      <p className="px-5 py-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">Suggestions</p>
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectSuggestion(s)}
                          className="w-full text-left px-5 py-3 hover:bg-slate-50 text-sm font-bold text-dark transition-colors border-l-4 border-transparent hover:border-primary"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category Segment</label>
                  <select className="w-full rounded-2xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm py-4 px-6 font-bold" value={formData.category} onChange={e => {
                    const cat = e.target.value;
                    const isVehicle = cat === 'Damaged Vehicles (Salvage)' || cat === 'Stripping' || cat === 'Stripping for Parts';
                    setFormData({...formData, category: cat, isVehicle, condition: isVehicle ? 'Damaged/Salvage' : formData.condition});
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
                <textarea rows={4} className="w-full rounded-2xl border-slate-200 text-sm py-4 px-6 font-medium leading-relaxed" placeholder="Describe the part..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} ></textarea>
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