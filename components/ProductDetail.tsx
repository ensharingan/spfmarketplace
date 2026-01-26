
import React, { useState, useEffect } from 'react';
import { Product, ListingStatus, SellerProfile } from '../types';
import { MAKES } from '../mockData';
import { GoogleGenAI, Type } from '@google/genai';

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
  
  // VIN Decoder State
  const [vinInput, setVinInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedResult, setDecodedResult] = useState<{ make: string; model: string; year: number } | null>(null);
  const [vinError, setVinError] = useState<string | null>(null);

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

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const mapsChunk = chunks?.find(c => c.maps?.uri);
        if (mapsChunk) {
          setMapLink(mapsChunk.maps.uri);
        } else {
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

  const handleVinDecode = async () => {
    const vinValue = vinInput.trim();
    if (vinValue.length < 17) {
      setVinError(`VIN too short (${vinValue.length}/17).`);
      return;
    }
    setIsDecoding(true);
    setVinError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Decode this vehicle VIN and return the basic info: ${vinValue}`,
        config: {
          systemInstruction: `Automotive expert. Extract Make, Model, Year. Return ONLY valid JSON.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN },
              make: { type: Type.STRING },
              model: { type: Type.STRING },
              year: { type: Type.INTEGER }
            },
            required: ['success']
          }
        }
      });
      const result = JSON.parse(response.text || '{}');
      if (result.success) setDecodedResult(result);
      else setVinError("Could not decode this VIN.");
    } catch (error) {
      setVinError("Decoding failed.");
    } finally {
      setIsDecoding(false);
    }
  };

  const handleWhatsAppClick = () => {
    const phone = seller.phone || '27123456789';
    const messageText = `Hi, I'm interested in your part: ${product.name} (R${product.price}). Is it still available?`;
    onEnquire({ buyerName: 'WhatsApp Visitor', buyerPhone: 'Direct Link', productId: product.id, productName: product.name, sellerId: product.sellerId, message: '[WHATSAPP LEAD] User initiated WhatsApp conversation for: ' + product.name, status: 'New' }, false);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const handleSubmitEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const refId = onEnquire({ ...enquiryData, productId: product.id, productName: product.name, sellerId: product.sellerId, status: 'New' });
    setEnquirySuccessRef(refId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 mb-24 lg:mb-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images Carousel */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200 group" onMouseMove={(e) => {
            if (window.innerWidth < 1024) return;
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setZoomPos({ x: ((e.pageX - left - window.scrollX) / width) * 100, y: ((e.pageY - top - window.scrollY) / height) * 100, show: true });
          }} onMouseLeave={() => setZoomPos({ ...zoomPos, show: false })}>
            <div className="w-full h-full cursor-zoom-in" onClick={() => setShowFullGallery(true)}>
              <img src={product.images[selectedImageIndex]} alt={product.name} className={`w-full h-full object-cover transition-transform duration-200 ${zoomPos.show ? 'scale-150' : 'scale-100'}`} style={zoomPos.show ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined} />
            </div>
            {product.images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => (prev - 1 + product.images.length) % product.images.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full text-dark shadow-lg opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => (prev + 1) % product.images.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full text-dark shadow-lg opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img, i) => (
              <div key={i} onClick={() => setSelectedImageIndex(i)} className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all cursor-pointer ${selectedImageIndex === i ? 'border-primary scale-105 shadow-lg' : 'border-white hover:border-slate-100'}`}>
                <img src={img} className="w-full h-full object-cover" alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <nav className="flex text-xs text-slate-500 gap-2 uppercase font-black tracking-widest">
              <span>{product.make}</span> <span className="opacity-30">/</span> <span className="text-primary">{product.category}</span>
            </nav>
            <h1 className="text-4xl font-display font-black text-dark tracking-tight italic uppercase">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-display font-extrabold text-primary">R {product.price.toLocaleString()}</span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-slate-800 text-white">{product.condition}</span>
            </div>
          </div>

          {/* Detailed Seller Information Card */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                  {seller.logoUrl ? <img src={seller.logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-3xl text-slate-200">storefront</span>}
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Verified Local Dealer</p>
                  <h3 className="text-lg font-display font-black text-dark tracking-tight uppercase italic">{seller.businessName}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> {seller.address.city}</p>
                    {seller.socialLinks?.website && <a href={seller.socialLinks.website} target="_blank" className="text-[9px] font-black uppercase text-primary hover:underline">Official Web</a>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 border-l pl-4">
                  <span className="text-[#25D366] material-symbols-outlined text-2xl font-black">verified_user</span>
                  <span className="text-[8px] font-black uppercase text-slate-400">Trusted</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full overflow-hidden border shadow-sm">
                  {seller.contactImageUrl ? <img src={seller.contactImageUrl} className="w-full h-full object-cover" alt="" /> : <span className="material-symbols-outlined text-xl text-slate-100 mt-2 ml-2">person</span>}
               </div>
               <div>
                  <p className="text-[10px] font-black text-dark leading-none">{seller.contactPerson}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{seller.contactRole || 'Sales Manager'}</p>
               </div>
               <div className="ml-auto flex gap-2">
                  {seller.socialLinks?.facebook && <a href={seller.socialLinks.facebook} target="_blank" className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><span className="material-symbols-outlined text-lg">facebook</span></a>}
                  {seller.socialLinks?.instagram && <a href={seller.socialLinks.instagram} target="_blank" className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all"><span className="material-symbols-outlined text-lg">photo_camera</span></a>}
               </div>
            </div>
          </div>

          {/* VIN Decoder Tool */}
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
             <div className="flex items-center gap-2 mb-4">
               <span className="material-symbols-outlined text-primary text-xl">verified</span>
               <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Verify Compatibility (AI Decoder)</h3>
             </div>
             <div className="flex gap-2">
                <input type="text" placeholder="Enter VIN..." className="flex-1 rounded-xl border-slate-200 text-xs font-bold py-3 uppercase shadow-sm" value={vinInput} onChange={(e) => setVinInput(e.target.value)} />
                <button onClick={handleVinDecode} disabled={isDecoding || !vinInput} className="bg-primary text-white px-5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                  {isDecoding ? <span className="material-symbols-outlined text-sm animate-spin">sync</span> : <span className="material-symbols-outlined text-sm">bolt</span>} Verify
                </button>
             </div>
             {decodedResult && (
               <div className="mt-4 p-4 bg-white rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-1">
                  <p className="text-xs font-black text-dark uppercase tracking-tight">AI MATCH: {decodedResult.year} {decodedResult.make} {decodedResult.model}</p>
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-6 py-8 border-y border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Manufacturer</p>
              <p className="text-sm text-slate-900 font-bold flex items-center gap-2"><span className="material-symbols-outlined text-lg text-primary">directions_car</span> {product.make}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Compatibility</p>
              <p className="text-sm text-slate-900 font-bold flex items-center gap-2"><span className="material-symbols-outlined text-lg text-primary">calendar_today</span> {product.yearStart} - {product.yearEnd}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-dark font-black text-[10px] uppercase tracking-widest opacity-40">Part Information</h3>
            <p className="text-slate-600 leading-relaxed text-base font-medium">{product.description}</p>
          </div>

          <div className="hidden lg:flex flex-col gap-4 pt-6">
            <button onClick={handleWhatsAppClick} disabled={isOutOfStock} className="w-full bg-[#25D366] text-white h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.01] transition-all">
              <span className="material-symbols-outlined text-2xl">chat</span> WhatsApp Official Seller
            </button>
            <button onClick={() => setShowEnquiryForm(true)} disabled={isOutOfStock} className="w-full bg-white text-dark border-2 border-slate-200 h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-2xl">mail</span> Send Email Lead
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showFullGallery && (
        <div className="fixed inset-0 z-[200] bg-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-4" onClick={() => setShowFullGallery(false)}>
          <button className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full"><span className="material-symbols-outlined text-3xl">close</span></button>
          <img src={product.images[selectedImageIndex]} className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-2xl" alt="" />
        </div>
      )}

      {/* Enquiry Form Modal */}
      {(showEnquiryForm || enquirySuccessRef) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {enquirySuccessRef ? (
               <div className="p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><span className="material-symbols-outlined text-5xl">check_circle</span></div>
                  <div><h2 className="text-2xl font-display font-black text-dark mb-1">LEAD SUBMITTED</h2><p className="text-slate-500 text-sm font-bold">The seller has been notified via SPF Enterprise.</p></div>
                  <button onClick={() => { setShowEnquiryForm(false); setEnquirySuccessRef(null); }} className="w-full bg-dark text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest">Back to Parts</button>
               </div>
            ) : (
              <>
                <div className="p-8 bg-primary text-white flex justify-between items-center">
                  <h2 className="text-xl font-display font-black tracking-tight italic uppercase">Quick Enquiry</h2>
                  <button onClick={() => setShowEnquiryForm(false)} className="hover:opacity-70"><span className="material-symbols-outlined">close</span></button>
                </div>
                <form onSubmit={handleSubmitEnquiry} className="p-8 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Your Name</label>
                    <input required type="text" className="w-full rounded-2xl border-slate-200 py-4 px-5 text-sm font-bold" value={enquiryData.buyerName} onChange={e => setEnquiryData({...enquiryData, buyerName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                    <input required type="tel" className="w-full rounded-2xl border-slate-200 py-4 px-5 text-sm font-bold" value={enquiryData.buyerPhone} onChange={e => setEnquiryData({...enquiryData, buyerPhone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Message to Dealer</label>
                    <textarea required rows={4} className="w-full rounded-2xl border-slate-200 py-4 px-5 text-sm font-medium" value={enquiryData.message} onChange={e => setEnquiryData({...enquiryData, message: e.target.value})}></textarea>
                  </div>
                  <button type="submit" className="w-full bg-accent text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Submit Lead Now</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
