
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

interface ImageAnalysisModalProps {
  onClose: () => void;
  onResult: (result: { name: string; make: string; model: string; category: string }) => void;
}

export const ImageAnalysisModal: React.FC<ImageAnalysisModalProps> = ({ onClose, onResult }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
            { text: "Identify this car part. Provide the part name, likely vehicle make/model compatibility, and a general category. Format as JSON with keys: 'name', 'make', 'model', 'category'." }
          ]
        },
        config: {
          responseMimeType: 'application/json'
        }
      });

      const result = JSON.parse(response.text || '{}');
      onResult(result);
      onClose();
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("AI Analysis failed. Please try a clearer photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-dark/90 backdrop-blur-lg">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-black text-dark tracking-tight">AI Part Finder</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Identify any part from a photo</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8">
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-slate-100 rounded-3xl py-16 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group"
            >
              <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">photo_camera</span>
              </div>
              <p className="font-black text-dark uppercase tracking-tight">Upload or Snap Photo</p>
              <p className="text-xs text-slate-400 mt-1">Supported: JPG, PNG, WEBP</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="aspect-square rounded-3xl overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50">
                <img src={image} className="w-full h-full object-contain" alt="Preview" />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setImage(null)}
                  className="flex-1 py-4 font-black uppercase text-xs text-slate-400 tracking-widest hover:text-dark"
                >
                  Change Photo
                </button>
                <button 
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">auto_awesome</span>
                      Identify Part
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
      </div>
    </div>
  );
};
