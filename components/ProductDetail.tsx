
import React, { useState, useEffect } from 'react';
import { Product, ListingStatus, SellerProfile } from '../types';
import { GoogleGenAI } from '@google/genai';

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
  const [mapLink, setMapLink] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  
  const [enquiryData, setEnquiryData] = useState({
    buyerName: '',
    buyerPhone: '',
    buyerEmail: '',
    message: `Hi, I'm interested in the ${product.name} listed on Spare Parts Finder. Is it still available?`
  });

  const isOutOfStock = product.status === ListingStatus.OUT_OF_STOCK || product.quantity === 0;

  useEffect(() => {
    const fetchMapGrounding = async () => {
      setIsMapLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const locationStr = `${seller.address.street}, ${seller.address.suburb}, ${seller.address.city}, ${seller.address.province}, South Africa`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Provide information about this business location and find its Google Maps link: ${seller.businessName} at ${locationStr}. Return ONLY a concise description and the direct Google Maps URL.`,
          config: {
            tools: [{ googleMaps: {} }]
          }
        });

        // Extracting map URI from grounding chunks
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const mapsChunk = chunks?.find(c => c.maps?.uri);
        if (mapsChunk) {
          setMapLink(mapsChunk.maps.uri);
        } else {
          // Fallback if no specific chunk, look into text
          const text = response.text || '';
          const match = text.match(/https:\/\/www\.google\.com\/maps\S*/);
          if (match) setMapLink(match[0]);
        }
      } catch (error) {
        console.error("Map grounding failed:", error);
      } finally {
        setIsMapLoading(false);
      }
    };

    fetchMapGrounding();
  }, [seller]);

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

            {product.images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full text-dark shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full text-dark shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img, i) => (
              <div key={i} onClick={() => setSelectedImageIndex(i)} className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all cursor-pointer ${selectedImageIndex === i ? 'border-primary scale-105' : 'border-white hover:border-slate-200'}`}>
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
              <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-slate-800 text-white">
                {product.condition}
              </span>
            </div>
          </div>

          {/* Seller Information Card with Maps Link */}
          <div className="bg-panel p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 group">
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
                <h3 className="text-lg font-display font-black text-dark">{seller.businessName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {seller.address.city}, {seller.address.province}
                  </p>
                  {mapLink && (
                    <a 
                      href={mapLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline"
                    >
                      <span className="material-symbols-outlined text-xs">map</span>
                      View Map
                    </a>
                  )}
                  {isMapLoading && <span className="material-symbols-outlined animate-spin text-xs text-slate-300">sync</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="text-right hidden md:block">
                  <div className="flex items-center justify-end gap-1 text-[#25D366]">
                    <span className="material-symbols-outlined text-sm font-black">verified_user</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 py-8 border-y border-slate-100">
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
          </div>

          <div className="prose prose-slate prose-sm max-w-none">
            <h3 className="text-dark font-black text-xs uppercase tracking-widest mb-3 opacity-50">Detailed description</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base font-medium">{product.description}</p>
          </div>

          <div className="flex flex-col gap-4 pt-6">
            <button 
              onClick={handleWhatsAppClick}
              disabled={isOutOfStock}
              className="w-full bg-[#25D366] text-white h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-2xl">chat</span>
              WhatsApp Seller
            </button>
            <button 
              onClick={() => setShowEnquiryForm(true)}
              disabled={isOutOfStock}
              className="w-full bg-white text-dark border-2 border-slate-200 h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-2xl">mail</span>
              Send Email Enquiry
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Gallery Modal */}
      {showFullGallery && (
        <div className="fixed inset-0 z-[200] bg-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-4" onClick={() => setShowFullGallery(false)}>
          <button className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full"><span className="material-symbols-outlined text-3xl">close</span></button>
          <img src={product.images[selectedImageIndex]} className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg" alt="" />
        </div>
      )}

      {/* Email Enquiry Modal */}
      {(showEnquiryForm || enquirySuccessRef) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {enquirySuccessRef ? (
               <div className="p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-5xl">check_circle</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-black text-dark mb-2">Enquiry Received!</h2>
                    <p className="text-slate-500 font-medium">The seller has been notified and will contact you shortly.</p>
                  </div>
                  <button onClick={closeModals} className="w-full bg-dark text-white py-5 rounded-2xl font-black uppercase tracking-widest">Back to Product</button>
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
                    <input required type="text" className="w-full rounded-2xl border-slate-200 py-4 px-5 font-bold" value={enquiryData.buyerName} onChange={e => setEnquiryData({...enquiryData, buyerName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp / Phone</label>
                    <input required type="tel" className="w-full rounded-2xl border-slate-200 py-4 px-5 font-bold" value={enquiryData.buyerPhone} onChange={e => setEnquiryData({...enquiryData, buyerPhone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message</label>
                    <textarea required rows={4} className="w-full rounded-2xl border-slate-200 py-4 px-5" value={enquiryData.message} onChange={e => setEnquiryData({...enquiryData, message: e.target.value})}></textarea>
                  </div>
                  <button type="submit" className="w-full bg-accent text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl">
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
