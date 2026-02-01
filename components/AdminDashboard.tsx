
import React, { useState } from 'react';
import { Product, Enquiry, Order, SellerProfile, SellerStatus, BlogPost } from '../types';
import { SEOManager } from './SEOManager';
import { MAKES, SA_VEHICLE_DATA, CATEGORIES, PART_GROUPS } from '../mockData';

const years = Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => new Date().getFullYear() - i);

// --- HELPERS ---
const generateSKU = (make: string) => {
  const prefix = (make || 'GEN').substring(0, 3).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${randomStr}${timestamp}`;
};

interface AdminDashboardProps {
  products: Product[];
  sellers: SellerProfile[];
  enquiries: Enquiry[];
  orders: Order[];
  blogPosts: BlogPost[];
  onUpdateSellerStatus: (sellerId: string, status: SellerStatus) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (p: Product) => void;
  onAddBlogPost: (post: BlogPost) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, sellers, enquiries, orders, blogPosts,
  onUpdateSellerStatus, onDeleteProduct, onUpdateProduct, onAddBlogPost
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'inventory' | 'seo'>('overview');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const getLeadsForSeller = (sellerId: string) => enquiries.filter(e => e.sellerId === sellerId).length;
  const getInventoryForSeller = (sellerId: string) => products.filter(p => p.sellerId === sellerId).length;

  const stats = {
    totalRevenue: orders.reduce((a, b) => a + b.total, 0),
    totalLeads: enquiries.length,
    activeSellers: sellers.filter(s => s.status === SellerStatus.APPROVED).length,
    pendingSellers: sellers.filter(s => s.status === SellerStatus.PENDING_APPROVAL).length,
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      const finalSKU = editingProduct.sku && editingProduct.sku.trim() !== '' 
        ? editingProduct.sku 
        : generateSKU(editingProduct.make || '');
      onUpdateProduct({ ...editingProduct, sku: finalSKU });
      setEditingProduct(null);
    }
  };

  const handleTriggerAdminSkuGen = () => {
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        sku: generateSKU(editingProduct.make || 'GEN')
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-dark tracking-tighter italic">Admin HQ</h1>
          <p className="text-slate-500 font-medium">Global Marketplace Operations Control</p>
        </div>
        
        <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'sellers', label: 'Sellers', icon: 'store', badge: stats.pendingSellers },
            { id: 'inventory', label: 'Global Stock', icon: 'inventory' },
            { id: 'seo', label: 'AI SEO & Content', icon: 'auto_awesome' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-dark'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
              {tab.badge ? <span className="bg-accent text-white px-1.5 py-0.5 rounded-full text-[8px] ml-1 animate-bounce">{tab.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <span className="material-symbols-outlined text-primary mb-2">payments</span>
               <p className="text-3xl font-display font-black text-dark">R {stats.totalRevenue.toLocaleString()}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marketplace GMV</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <span className="material-symbols-outlined text-emerald-500 mb-2">forum</span>
               <p className="text-3xl font-display font-black text-dark">{stats.totalLeads}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Leads</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <span className="material-symbols-outlined text-orange-500 mb-2">storefront</span>
               <p className="text-3xl font-display font-black text-dark">{stats.activeSellers}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Shops</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <span className="material-symbols-outlined text-blue-500 mb-2">inventory_2</span>
               <p className="text-3xl font-display font-black text-dark">{products.length}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Listings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
               <h3 className="text-xl font-display font-black text-dark mb-6">Recent Global Orders</h3>
               <div className="space-y-4">
                  {orders.slice(-5).reverse().map(o => (
                    <div key={o.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div>
                          <p className="font-black text-dark text-sm">{o.customerDetails.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{o.id}</p>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-primary">R {o.total.toLocaleString()}</p>
                          <p className="text-[9px] font-black uppercase text-emerald-500">PAID</p>
                       </div>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-center py-10 text-slate-400 font-bold italic">No transactions recorded yet.</p>}
               </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
               <h3 className="text-xl font-display font-black text-dark mb-6">Live Enquiry Stream</h3>
               <div className="space-y-4">
                  {enquiries.slice(-5).reverse().map(e => (
                    <div key={e.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-primary uppercase mb-1">{e.productName}</p>
                       <p className="text-xs font-bold text-dark italic leading-relaxed">"{e.message.slice(0, 100)}..."</p>
                       <div className="mt-2 flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase">From: {e.buyerName}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(e.createdAt).toLocaleTimeString()}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sellers' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Detail</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Stats</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map(s => (
                  <tr key={s.userId} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={s.logoUrl} className="w-12 h-12 rounded-xl border object-cover bg-slate-100" alt="" />
                        <div>
                          <p className="font-black text-dark text-sm">{s.businessName}</p>
                          <p className="text-xs text-slate-500 font-medium">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <img src={s.contactImageUrl} className="w-8 h-8 rounded-full object-cover grayscale" alt="" />
                         <span className="text-xs font-bold text-dark">{s.contactPerson}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[10px] font-black text-primary">{getLeadsForSeller(s.userId)}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Leads</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-dark">{getInventoryForSeller(s.userId)}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Items</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        s.status === SellerStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' :
                        s.status === SellerStatus.DISABLED ? 'bg-red-50 text-red-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                       {s.status === SellerStatus.PENDING_APPROVAL && (
                         <button 
                           onClick={() => onUpdateSellerStatus(s.userId, SellerStatus.APPROVED)}
                           className="bg-primary text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:opacity-90 transition-all shadow-md active:scale-95"
                         >
                           Approve
                         </button>
                       )}
                       {s.status === SellerStatus.APPROVED && (
                         <button 
                           onClick={() => onUpdateSellerStatus(s.userId, SellerStatus.DISABLED)}
                           className="bg-white text-accent border-2 border-accent/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-accent hover:text-white transition-all active:scale-95"
                         >
                           Disable
                         </button>
                       )}
                       {s.status === SellerStatus.DISABLED && (
                         <button 
                           onClick={() => onUpdateSellerStatus(s.userId, SellerStatus.APPROVED)}
                           className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:opacity-90 transition-all active:scale-95"
                         >
                           Re-Enable
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm animate-in fade-in duration-500">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-black text-dark">Global Catalog ({products.length} Items)</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Admin Override Access</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="group p-5 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col gap-4 hover:border-primary transition-all">
                   <div className="flex items-center gap-4">
                      <img src={p.images[0]} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                      <div className="flex-1 overflow-hidden">
                          <p className="font-black text-dark text-sm truncate">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Owner: {sellers.find(s => s.userId === p.sellerId)?.businessName || p.sellerId}</p>
                          <div className="mt-1 flex justify-between items-center">
                            <span className="text-xs font-black text-primary">R {p.price.toLocaleString()}</span>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-white border rounded">{p.status}</span>
                          </div>
                      </div>
                   </div>
                   <div className="flex gap-2 border-t border-slate-200 pt-3">
                      <button 
                        onClick={() => setEditingProduct({...p})}
                        className="flex-1 py-2 bg-white text-dark border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm("Permanently remove this stock item from the marketplace?")) {
                            onDeleteProduct(p.id);
                          }
                        }}
                        className="flex-1 py-2 bg-red-50 text-accent border border-red-100 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        Remove
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'seo' && (
        <SEOManager onAddPost={onAddBlogPost} blogPosts={blogPosts} />
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-dark/90 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-display font-black text-dark tracking-tighter">Edit Marketplace Stock</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Admin Global Override</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-accent transition-all"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <form onSubmit={handleEditProductSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <div className="md:col-span-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Stock Item Title</label>
                   <input required type="text" className="w-full rounded-2xl border-slate-200 py-3 text-sm font-bold" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Part Group</label>
                  <select required className="w-full rounded-2xl border-slate-200 py-3 text-sm font-bold" value={editingProduct.partGroup} onChange={e => setEditingProduct({...editingProduct, partGroup: e.target.value})}>
                    {PART_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Condition</label>
                  <select required className="w-full rounded-2xl border-slate-200 py-3 text-sm font-bold" value={editingProduct.condition} onChange={e => setEditingProduct({...editingProduct, condition: e.target.value as any})}>
                    <option value="Used">Used</option>
                    <option value="New">New</option>
                    <option value="Damaged/Salvage">Damaged/Salvage</option>
                  </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Asking Price (R)</label>
                   <input required type="number" className="w-full rounded-2xl border-slate-200 py-3 text-sm font-black text-primary" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SKU</label>
                   <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 rounded-2xl border-slate-200 py-3 px-6 text-sm font-bold" 
                      value={editingProduct.sku} 
                      onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} 
                    />
                    <button 
                      type="button" 
                      onClick={handleTriggerAdminSkuGen}
                      className="px-4 py-2 bg-slate-100 text-dark border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Gen
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                   <textarea rows={4} className="w-full rounded-2xl border-slate-200 text-sm font-medium" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}></textarea>
                </div>
              </div>

              <button type="submit" className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl transition-all hover:-translate-y-1 active:scale-95">
                Apply Admin Overrides
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
