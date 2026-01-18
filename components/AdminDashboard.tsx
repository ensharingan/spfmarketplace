
import React from 'react';
import { Product, Enquiry, Order } from '../types';

interface AdminDashboardProps {
  products: Product[];
  users: any[];
  enquiries: Enquiry[];
  orders: Order[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, users, enquiries, orders }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark">Marketplace Overview</h1>
          <p className="text-slate-500">Global administration panel</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
              <p className="text-xl font-display font-extrabold text-primary">${orders.reduce((a, b) => a + b.total, 0).toLocaleString()}</p>
           </div>
           <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Listings</p>
              <p className="text-xl font-display font-extrabold text-dark">{products.length}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
           <div className="flex items-center gap-3 mb-4 text-emerald-600">
              <span className="material-symbols-outlined">payments</span>
              <h3 className="font-bold">Recent Orders</h3>
           </div>
           <div className="space-y-4">
              {orders.length === 0 ? <p className="text-slate-400 italic text-sm">No orders yet</p> : orders.slice(-5).map(o => (
                <div key={o.id} className="text-sm flex justify-between">
                   <span>{o.customerDetails.name}</span>
                   <span className="font-bold">${o.total.toFixed(2)}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
           <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined">forum</span>
              <h3 className="font-bold">Global Enquiries</h3>
           </div>
           <div className="space-y-4">
              {enquiries.length === 0 ? <p className="text-slate-400 italic text-sm">No enquiries yet</p> : enquiries.slice(-5).map(e => (
                <div key={e.id} className="text-sm">
                   <p className="font-bold line-clamp-1">{e.productName}</p>
                   <p className="text-slate-500 text-xs">From: {e.buyerName}</p>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
           <div className="flex items-center gap-3 mb-4 text-secondary">
              <span className="material-symbols-outlined">group</span>
              <h3 className="font-bold">Active Sellers</h3>
           </div>
           <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">P</div>
                 <span>Premium Parts Corp</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">E</div>
                 <span>Engine Experts Ltd</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
