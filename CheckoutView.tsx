
import React, { useState } from 'react';
import { Product, Order, OrderStatus } from '../types';

interface CheckoutViewProps {
  cart: { product: Product, quantity: number }[];
  onComplete: (order: Order) => void;
  onBack: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ cart, onComplete, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    isCollection: false
  });

  const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const order: Order = {
      id: 'SPF-' + Math.random().toString(36).substring(7).toUpperCase(),
      customerDetails: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      },
      deliveryAddress: formData.isCollection ? undefined : formData.address,
      isCollection: formData.isCollection,
      items: cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        price: i.product.price,
        quantity: i.quantity
      })),
      total: total,
      status: OrderStatus.PAID,
      createdAt: new Date().toISOString()
    };

    onComplete(order);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h2 className="text-2xl font-display font-bold text-dark">Secure Checkout</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
               <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                <input required className="w-full rounded-lg border-slate-200" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</label>
                  <input required type="email" className="w-full rounded-lg border-slate-200" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</label>
                  <input required type="tel" className="w-full rounded-lg border-slate-200" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 p-2 bg-slate-100 rounded-xl">
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, isCollection: false})}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${!formData.isCollection ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                 >Courier</button>
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, isCollection: true})}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${formData.isCollection ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                 >Collection</button>
              </div>
              {!formData.isCollection && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Address</label>
                  <textarea required rows={3} className="w-full rounded-lg border-slate-200" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
                </div>
              )}
            </div>

            <button 
              disabled={loading}
              className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Pay R ${total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
            </button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 h-fit space-y-4">
           <h3 className="text-lg font-bold text-dark border-b pb-4">Order Summary</h3>
           <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex gap-3">
                   <div className="flex-1">
                      <p className="text-xs font-bold text-dark">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500">{item.quantity} units</p>
                   </div>
                   <p className="text-sm font-bold text-dark">R { (item.quantity * item.product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 }) }</p>
                </div>
              ))}
           </div>
           <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between font-display font-extrabold text-xl text-dark">
                 <span>Total</span>
                 <span className="text-primary">R {total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
