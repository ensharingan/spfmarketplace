
import React, { useState } from 'react';
import { Product, ListingStatus, SellerProfile } from '../types';

interface ProductDetailProps {
  product: Product;
  seller: SellerProfile;
  onAddToCart: (p: Product) => void;
  onEnquire: (enquiry: any, showAlert?: boolean) => string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, seller, onAddToCart, onEnquire }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enquirySuccessRef, setEnquirySuccessRef] = useState<string | null>(null);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });
  
  const [enquiryData, setEnquiryData] = useState({
    buyerName: '',
    buyerPhone: '',
    buyerEmail: '',
    message: `Hi, I'm interested in the ${product.name} listed on Spare Parts Finder. Is it still available?`
  });

  const isOutOfStock = product.status === ListingStatus.OUT_OF_STOCK || product.quantity === 0;

  const handleWhatsAppClick = () => {
    const phone = seller.phone || '27123456789';
    const messageText = `Hi, I'm interested in your part: ${product.name} (R${product.price}). Is it still available?`;
    
    onEnquire({
      buyerName: 'WhatsApp Visitor',
      buyerPhone: 'Direct Link',
      productId: product.id,
      productName: product.name,
      sellerId: product.sellerId,
      message: '[WHATSAPP LEAD] User initiated WhatsApp conversation for: ' + product.name,
      status: 'New'
    }, false);

    const encodedMsg = encodeURIComponent(messageText);
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
  };

  const handleSubmitEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const refId = onEnquire({
      ...enquiryData,
      productId: product.id,
      productName: product.name,
      sellerId: product.sellerId,
      status: 'New'
    });
    setEnquirySuccessRef(refId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y, show: true });
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const closeModals = () => {
    setShowEnquiryForm(false);
    setEnquirySuccessRef(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Images Carousel */}
        <div className="space-y-4">
          <div 
            className="relative aspect-square bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 group"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoomPos({ ...zoomPos, show: false })}
          >
            <div 
              className="w-full h-full cursor-zoom-in"
              onClick={() => setShowFullGallery(true)}
            >
              <img 
                src={product.images[selectedImageIndex]} 
                alt={product.name} 
                className={`w-full h-full object-cover transition-transform duration-200 ${zoomPos.show ? 'scale-150' : 'scale-100'}`}
                style={zoomPos.show ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
              />
            </div>

            {/* Carousel Navigation Arrows */}
            {product.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full text-dark shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full text-dark shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}

            {!zoomPos.show && (
              <div className="absolute bottom-4 right-4 bg-dark/50 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined">fullscreen</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedImageIndex(i)}
                className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all cursor-pointer ${
                  selectedImageIndex === i ? 'border-primary shadow-md scale-105' : 'border-white hover:border-slate-200'
                }`}
              >
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
            <h1 className="text-4xl font-display font-black text-dark mb-2 tracking-tight leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-display font-extrabold text-primary">
                R {product.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm ${
                product.condition === 'New' ? 'bg-blue-600 text-white' : 
                product.condition === 'Damaged/Salvage' ? 'bg-accent text-white' :
                'bg-slate-800 text-white'
              }`}>
                {product.condition}
              </span>
            </div>
          </div>

          {/* Seller Information Card */}
          <div className="bg-panel p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
                {seller.logoUrl ? (
                  <img src={seller.logoUrl} alt={seller.businessName} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-slate-300">storefront</span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Verified Seller</p>
                <h3 className="text-lg font-display font-black text-dark group-hover:text-primary transition-colors">
                  {seller.businessName}
                </h3>
                <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  {seller.address.city}, {seller.address.province}
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <div className="flex items-center justify-end gap-1 text-[#25D366] mb-1">
                <span className="material-symbols-outlined text-sm font-black">verified_user</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400">Response time: &lt; 1hr</p>
            </div>
          </div>

          <div className={`grid grid-cols-2 ${product.isVehicle ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-6 py-8 border-y border-slate-100`}>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Manufacturer</p>
              <p className="text-slate-900 font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">directions_car</span>
                {product.make}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Compatibility</p>
              <p className="text-slate-900 font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                {product.yearStart}{product.yearEnd !== product.yearStart ? ` - ${product.yearEnd}` : ''}
              </p>
            </div>
            {product.isVehicle && (
              <>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Mileage</p>
                  <p className="text-slate-900 font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary">speed</span>
                    {product.mileage?.toLocaleString()} km
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Transmission</p>
                  <p className="text-slate-900 font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary">settings_input_component</span>
                    {product.transmission}
                  </p>
                </div>
                {product.vin && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">VIN (Chassis Number)</p>
                    <p className="text-slate-900 font-bold flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-sm">
                      <span className="material-symbols-outlined text-lg text-primary">fingerprint</span>
                      {product.vin}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="prose prose-slate prose-sm max-w-none">
            <h3 className="text-dark font-black text-xs uppercase tracking-widest mb-3 opacity-50">Detailed description</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base font-medium">{product.description}</p>
          </div>

          <div className="flex flex-col gap-4 pt-6">
            <button 
              onClick={handleWhatsAppClick}
              disabled={isOutOfStock}
              className="w-full bg-[#25D366] text-white h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-[#25D366]/20 transition-all active:scale-95 shadow-lg disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-2xl">chat</span>
              WhatsApp Seller
            </button>
            <button 
              onClick={() => setShowEnquiryForm(true)}
              disabled={isOutOfStock}
              className="w-full bg-white text-dark border-2 border-slate-200 h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-2xl">mail</span>
              Send Email Enquiry
            </button>
            {isOutOfStock && (
              <p className="text-center text-accent font-black uppercase tracking-widest text-xs">Currently Out of Stock</p>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Gallery Modal */}
      {showFullGallery && (
        <div 
          className="fixed inset-0 z-[200] bg-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
          onClick={() => setShowFullGallery(false)}
        >
          <button 
            onClick={() => setShowFullGallery(false)}
            className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors z-[210]"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          
          <div className="w-full max-w-6xl flex-1 flex flex-col items-center justify-center gap-8 relative" onClick={e => e.stopPropagation()}>
            <div className="w-full h-full max-h-[70vh] flex items-center justify-center relative">
              <img 
                src={product.images[selectedImageIndex]} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300" 
                alt={`${product.name} view ${selectedImageIndex + 1}`} 
              />
              
              {product.images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-4 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-4xl">chevron_left</span>
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-4 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-4xl">chevron_right</span>
                  </button>
                </>
              )}
            </div>

            <div className="w-full overflow-x-auto pb-4 px-4 flex justify-center gap-3">
              {product.images.map((img, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedImageIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImageIndex === i ? 'border-primary scale-110' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
            </div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/10 px-4 py-1 rounded-full text-white/50 text-xs font-black tracking-widest uppercase">
              {selectedImageIndex + 1} / {product.images.length}
            </div>
          </div>
        </div>
      )}

      {/* Email Enquiry Modal */}
      {(showEnquiryForm || enquirySuccessRef) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {enquirySuccessRef ? (
               <div className="p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-black text-dark mb-2">Enquiry Received!</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Thank you for your interest in the <span className="text-primary font-bold">{product.name}</span>. The seller has been notified and will contact you shortly.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Enquiry Reference Number</p>
                    <p className="text-xl font-display font-black text-primary tracking-widest uppercase">{enquirySuccessRef}</p>
                  </div>
                  <button 
                    onClick={closeModals}
                    className="w-full bg-dark text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1 active:scale-95"
                  >
                    Back to Product
                  </button>
               </div>
            ) : (
              <>
                <div className="p-6 bg-primary text-white flex justify-between items-center">
                  <h2 className="text-xl font-display font-bold">Email Enquiry</h2>
                  <button onClick={() => setShowEnquiryForm(false)} className="hover:opacity-70 p-2">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <form onSubmit={handleSubmitEnquiry} className="p-8 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Full Name</label>
                    <input required type="text" className="w-full rounded-2xl border-slate-200 py-4 px-5 focus:ring-primary focus:border-primary font-bold" placeholder="e.g. John Smith" value={enquiryData.buyerName} onChange={e => setEnquiryData({...enquiryData, buyerName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp / Phone</label>
                    <input required type="tel" className="w-full rounded-2xl border-slate-200 py-4 px-5 focus:ring-primary focus:border-primary font-bold" placeholder="e.g. 082 123 4567" value={enquiryData.buyerPhone} onChange={e => setEnquiryData({...enquiryData, buyerPhone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message</label>
                    <textarea required rows={4} className="w-full rounded-2xl border-slate-200 py-4 px-5 focus:ring-primary focus:border-primary font-medium" value={enquiryData.message} onChange={e => setEnquiryData({...enquiryData, message: e.target.value})}></textarea>
                  </div>
                  <button type="submit" className="w-full bg-accent text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-red-500/30 hover:opacity-90 transition-all active:scale-95">
                    Submit Enquiry
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
