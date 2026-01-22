
import React, { useState, useEffect } from 'react';
import { Product, ListingStatus, SellerProfile } from '../types';
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
    if (!vinInput.trim()) return;
    setIsDecoding(true);
    setVinError(null);
    setDecodedResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Decode this vehicle VIN and return the basic info: ${vinInput}`,
        config: {
          systemInstruction: "You are a vehicle specialist. Extract the Make, Model, and Year from the VIN. Return ONLY JSON with keys: 'make', 'model', 'year' (as number).",
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              make: { type: Type.STRING },
              model: { type: Type.STRING },
              year: { type: Type.NUMBER }
            },
            required: ['make', 'model', 'year']
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.make && result.model) {
        setDecodedResult(result);
      } else {
        setVinError("Could not decode this VIN. Please check if it's correct.");
      }
    } catch (error) {
      console.error("VIN decoding failed:", error);
      setVinError("Decoding failed. The AI was unable to process this request.");
    } finally {
      setIsDecoding(false);
    }
  };

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
    if (window.innerWidth < 1024) return;
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
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 mb-24 lg:mb-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Images Carousel */}
        <div className="space-y-4">
          <div 
            className="relative aspect-square bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200 group"
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
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full text-dark shadow-lg opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full text-dark shadow-lg opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}
          </div>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide">
            {product.images.map((img, i) => (
              <div key={i} onClick={() => setSelectedImageIndex(i)} className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 transition-all cursor-pointer snap-start ${selectedImageIndex === i ? 'border-primary scale-105' : 'border-white hover:border-slate-200'}`}>
                <img src={img} className="w-full h-full object-cover" alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <nav className="flex text-[10px] sm:text-xs text-slate-500 gap-2 uppercase font-black tracking-widest">
              <span>{product.make}</span>
              <span className="opacity-30">/</span>
              <span className="text-primary">{product.category}</span>
            </nav>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-dark tracking-tight leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-primary">
                R {product.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
              <span className="px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm bg-slate-800 text-white">
                {product.condition}
              </span>
            </div>
          </div>

          {/* Seller Information Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                {seller.logoUrl ? (
                  <img src={seller.logoUrl} alt={seller.businessName} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-slate-200">storefront</span>
                )}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Verified Seller</p>
                <h3 className="text-base sm:text-lg font-display font-black text-dark">{seller.businessName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {seller.address.city}
                  </p>
                  {mapLink && (
                    <a 
                      href={mapLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline"
                    >
                      <span className="material-symbols-outlined text-[14px]">map</span>
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-50 pt-4 sm:pt-0 sm:pl-6">
                <span className="text-[#25D366] material-symbols-outlined text-xl font-black">verified_user</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Response &lt; 1hr</span>
            </div>
          </div>

          {/* Interactive VIN Decoder Feature */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
             <div className="flex items-center gap-2 mb-4">
               <span className="material-symbols-outlined text-primary text-xl">verified</span>
               <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">AI VIN Verification Tool</h3>
             </div>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter vehicle VIN..." 
                  className="flex-1 rounded-xl border-slate-200 text-xs font-bold py-3 uppercase focus:ring-primary focus:border-primary"
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value)}
                />
                <button 
                  onClick={handleVinDecode}
                  disabled={isDecoding || !vinInput}
                  className="bg-primary text-white px-5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-900/10 active:scale-95 transition-all"
                >
                  {isDecoding ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      Decoding
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">bolt</span>
                      Verify
                    </>
                  )}
                </button>
             </div>
             
             {decodedResult && (
               <div className="mt-4 p-4 bg-white rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Matched Vehicle Info</span>
                    <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  </div>
                  <p className="text-sm font-black text-dark tracking-tight">
                    {decodedResult.year} {decodedResult.make} {decodedResult.model}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1 italic">Verified via Gemini 3 AI Model</p>
               </div>
             )}

             {vinError && (
               <div className="mt-3 text-accent text-[10px] font-bold px-1 flex items-center gap-1">
                 <span className="material-symbols-outlined text-sm">error</span>
                 {vinError}
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 py-6 sm:py-8 border-y border-slate-50">
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Manufacturer</p>
              <p className="text-sm sm:text-base text-slate-900 font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">directions_car</span>
                {product.make}
              </p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Compatibility</p>
              <p className="text-sm sm:text-base text-slate-900 font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                {product.yearStart} - {product.yearEnd}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-dark font-black text-[10px] uppercase tracking-widest opacity-40">Description</h3>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base font-medium">{product.description}</p>
          </div>

          <div className="hidden lg:flex flex-col gap-4 pt-6">
            <button 
              onClick={handleWhatsAppClick}
              disabled={isOutOfStock}
              className="w-full bg-[#25D366] text-white h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:brightness-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-2xl">chat</span>
              WhatsApp Seller
            </button>
            <button 
              onClick={() => setShowEnquiryForm(true)}
              disabled={isOutOfStock}
              className="w-full bg-white text-dark border-2 border-slate-200 h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-2xl">mail</span>
              Send Email Enquiry
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-[90] flex gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setShowEnquiryForm(true)}
          className="flex-1 bg-slate-100 text-dark h-14 rounded-xl flex items-center justify-center"
        >
          <span className="material-symbols-outlined">mail</span>
        </button>
        <button 
          onClick={handleWhatsAppClick}
          className="flex-[4] bg-[#25D366] text-white h-14 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">chat</span>
          WhatsApp Now
        </button>
      </div>

      {showFullGallery && (
        <div className="fixed inset-0 z-[200] bg-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-4" onClick={() => setShowFullGallery(false)}>
          <button className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full"><span className="material-symbols-outlined text-3xl">close</span></button>
          <img src={product.images[selectedImageIndex]} className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg" alt="" />
        </div>
      )}

      {(showEnquiryForm || enquirySuccessRef) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {enquirySuccessRef ? (
               <div className="p-10 text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black text-dark mb-1">Sent Successfully</h2>
                    <p className="text-slate-500 text-sm font-medium">The seller will reply to you soon.</p>
                  </div>
                  <button onClick={closeModals} className="w-full bg-dark text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">Done</button>
               </div>
            ) : (
              <>
                <div className="p-5 bg-primary text-white flex justify-between items-center">
                  <h2 className="text-base font-display font-bold">Quick Enquiry</h2>
                  <button onClick={() => setShowEnquiryForm(false)} className="hover:opacity-70 p-1">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <form onSubmit={handleSubmitEnquiry} className="p-6 space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                    <input required type="text" className="w-full rounded-xl border-slate-200 py-3 px-4 text-sm font-bold" value={enquiryData.buyerName} onChange={e => setEnquiryData({...enquiryData, buyerName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                    <input required type="tel" className="w-full rounded-xl border-slate-200 py-3 px-4 text-sm font-bold" value={enquiryData.buyerPhone} onChange={e => setEnquiryData({...enquiryData, buyerPhone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
                    <textarea required rows={3} className="w-full rounded-xl border-slate-200 py-3 px-4 text-sm" value={enquiryData.message} onChange={e => setEnquiryData({...enquiryData, message: e.target.value})}></textarea>
                  </div>
                  <button type="submit" className="w-full bg-accent text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">
                    Submit Lead
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
