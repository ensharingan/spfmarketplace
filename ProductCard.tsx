
import React from 'react';
import { Product, ListingStatus } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const isOutOfStock = product.status === ListingStatus.OUT_OF_STOCK || product.quantity === 0;

  return (
    <div 
      className={`group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg transition-all cursor-pointer ${isOutOfStock ? 'opacity-75' : ''}`}
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            product.condition === 'New' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
          }`}>
            {product.condition}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-[10px] font-bold text-primary uppercase mb-1 tracking-tight">{product.category}</p>
        <h3 className="text-slate-900 font-bold line-clamp-2 leading-tight mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
          <span className="material-symbols-outlined text-sm">location_on</span>
          <span>{product.location}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <p className="text-xl font-display font-bold text-dark">
            R {product.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </p>
          <span className="material-symbols-outlined text-primary">arrow_forward_ios</span>
        </div>
      </div>
    </div>
  );
};
