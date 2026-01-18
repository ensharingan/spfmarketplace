
import React, { useState } from 'react';
import { Product, ListingStatus } from '../types';

interface ProductDetailProps {
  product: Product;
  sellerPhone?: string;
  onAddToCart: (p: Product) => void;
  onEnquire: (enquiry: any) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, sellerPhone, onAddToCart, onEnquire }) => {
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [showSellerDetails, setShowSellerDetails] = useState(false);
  const [enquiryData, setEnquiryData] = useState({
    buyerName: '',
    buyerPhone: '',
    buyerEmail: '',
    message: `Hi, I'm interested in the ${product.name} listed on Spare Parts Finder. Is it still available?`
  });

  const isOutOfStock = product.status === ListingStatus.OUT_OF_STOCK || product.quantity === 0;

  const handleWhatsAppClick = () => {
    const phone = sellerPhone || '27123456789';
    const messageText = `Hi, I'm interested in your part: ${product.name} (R${product.price}). Is it still available?`;
    
    // Automatically count as a new lead by sending a specific enquiry type
    onEnquire({
      buyerName: 'WhatsApp Visitor',
      buyerPhone: 'Direct Link',
      productId: product.id,
      productName: product.name,
      sellerId: product.sellerId,
      message: '[WHATSAPP LEAD] User initiated WhatsApp conversation for: ' + product.name,
      status: 'New'
    });

    const encodedMsg = encodeURIComponent(messageText);
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
  };

  const handleSubmitEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    onEnquire({
      ...enquiryData,
      productId: product.id,
      productName: product.name,
      sellerId: product.sellerId,
      status: 'New'
    });
    setShowEnquiryForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:border-primary transition-colors">
                <img src={img} className="w-full h-full object-cover" alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div>
            <nav className="flex text-xs text-slate-500 mb-4 gap-2 uppercase font-bold tracking-wider">
              <span>{product.make}</span>
              <span>/</span>
              <span className="text-primary">{product.category}</span>
            </nav>
            <h1 className="text-3xl font-display font-bold text-dark mb-2">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-display font-extrabold text-primary">
                R {product.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
              <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                product.condition === 'New' ? 'bg-blue-100 text-blue-700' : 
                product.condition === 'Damaged/Salvage' ? 'bg-red-100 text-accent' :
                'bg-slate-100 text-slate-700'
              }`}>
                {product.condition}
              </span>
            </div>
          </div>

          <div className={`grid ${product.isVehicle ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'} gap-6 py-6 border-y border-slate-100`}>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Make / Model</p>
              <p className="text-slate-900 font-bold">{product.make} {product.model}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Year</p>
              <p className="text-slate-900 font-bold">{product.yearStart}</p>
            </div>
            {product.isVehicle && (
                <>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Mileage</p>
                        <p className="text-slate-900 font-bold">{product.mileage?.toLocaleString()} km</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Trans.</p>
                        <p className="text-slate-900 font-bold">{product.transmission}</p>
                    </div>
                </>
            )}
          </div>

          <div className="prose prose-slate prose-sm max-w-none">
            <h3 className="text-dark font-bold text-lg mb-2">Description / Damage Details</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={handleWhatsAppClick}
              className="w-full bg-[#25D366] text-white h-14 rounded-xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg"
            >
              <span className="material-symbols-outlined">chat</span>
              WhatsApp Seller
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button 
                disabled={isOutOfStock}
                onClick={() => onAddToCart(product)}
                className="bg-primary text-white h-14 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                Buy Now
              </button>
              <button 
                onClick={() => setShowEnquiryForm(true)}
                className="bg-white text-dark border-2 border-slate-200 h-14 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <span className="material-symbols-outlined">mail</span>
                Email Us
              </button>
            </div>
            
            <button 
              onClick={() => setShowSellerDetails(true)}
              className="w-full bg-dark text-white h-14 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all"
            >
              <span className="material-symbols-outlined">person</span>
              Contact Seller Details
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-accent">
                <span className="material-symbols-outlined text-3xl">verified_user</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Seller Location</p>
                <p className="font-bold text-dark">{product.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Details Modal */}
      {showSellerDetails && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 bg-dark text-white flex justify-between items-center">
              <h2 className="text-xl font-display font-bold">Seller Information</h2>
              <button onClick={() => setShowSellerDetails(false)} className="hover:opacity-70">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl">store</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Name</p>
                  <h3 className="text-2xl font-display font-bold text-dark">Verified Parts Supplier</h3>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Person</p>
                    <p className="font-bold text-dark">Sales Manager</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                    <p className="font-bold text-dark text-lg">+{sellerPhone || '27123456789'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Area</p>
                    <p className="font-bold text-dark">{product.location}</p>
                  </div>
                </div>
              </div>

              <a 
                href={`tel:${sellerPhone || '27123456789'}`}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <span className="material-symbols-outlined text-xl">call</span>
                Call Seller Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Email Enquiry Modal */}
      {showEnquiryForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-primary text-white flex justify-between items-center">
              <h2 className="text-xl font-display font-bold">Email Enquiry</h2>
              <button onClick={() => setShowEnquiryForm(false)} className="hover:opacity-70">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitEnquiry} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Name</label>
                <input required type="text" className="w-full rounded-lg border-slate-200" value={enquiryData.buyerName} onChange={e => setEnquiryData({...enquiryData, buyerName: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp / Phone</label>
                <input required type="tel" className="w-full rounded-lg border-slate-200" value={enquiryData.buyerPhone} onChange={e => setEnquiryData({...enquiryData, buyerPhone: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Message</label>
                <textarea required rows={4} className="w-full rounded-lg border-slate-200" value={enquiryData.message} onChange={e => setEnquiryData({...enquiryData, message: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg hover:opacity-90">
                Send Email
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
