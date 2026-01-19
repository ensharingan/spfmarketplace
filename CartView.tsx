
import React from 'react';
import { Product } from '../types';

interface CartViewProps {
  items: { product: Product, quantity: number }[];
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onBack: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ items, onRemove, onCheckout, onBack }) => {
  const subtotal = items.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold text-dark mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-2xl border-2 border-dashed border-slate-200">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">shopping_cart_off</span>
          <h3 className="text-xl font-bold text-slate-900">Your cart is empty</h3>
          <p className="text-slate-500 mb-8">Ready to find some parts?</p>
          <button onClick={onBack} className="bg-primary text-white px-8 py-3 rounded-lg font-bold shadow-lg">
            Start Browsing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.product.id} className="bg-white p-4 rounded-xl flex gap-4 shadow-sm border border-slate-200">
                <img src={item.product.images[0]} className="w-24 h-24 rounded-lg object-cover" alt="" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-dark leading-tight">{item.product.name}</h3>
                    <button onClick={() => onRemove(item.product.id)} className="text-slate-400 hover:text-accent">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{item.product.condition}</p>
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-medium text-slate-500">Qty: {item.quantity}</p>
                    <p className="text-lg font-bold text-primary">R { (item.product.price * item.quantity).toLocaleString('en-ZA', { minimumFractionDigits: 2 }) }</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 h-fit space-y-6">
            <h3 className="text-lg font-bold text-dark border-b pb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>R {subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-display font-extrabold text-2xl text-dark pt-4 border-t">
                <span>Total</span>
                <span className="text-accent">R {subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
            >
              Secure Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
