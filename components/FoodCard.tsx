import React from 'react';
import { PricingTier, ProteinType } from '../types';
import { Star, Clock } from 'lucide-react';
import { MENU_ITEMS } from '../constants';

interface FoodCardProps {
  plan: PricingTier;
  protein: ProteinType;
  onAdd: () => void;
  hasInCart: boolean;
}

export const FoodCard: React.FC<FoodCardProps> = ({ plan, protein, onAdd, hasInCart }) => {
  const price = protein === ProteinType.CHICKEN ? plan.chickenPrice : plan.paneerPrice;
  const image = MENU_ITEMS[protein].image;
  const isVeg = protein === ProteinType.PANEER;

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex gap-4 hover:border-quirky-black hover:shadow-hard-sm transition-all duration-200">
      
      {/* Text Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className={`w-4 h-4 border-2 flex items-center justify-center p-[1px] mb-2 ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
             <div className={`w-full h-full rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
          </div>
          <h3 className="font-heading text-lg leading-tight mb-1">{plan.label}</h3>
          <div className="flex items-center gap-1 mb-2">
            <div className="bg-green-100 border border-green-200 rounded-full px-1 py-0.5 flex items-center gap-0.5">
                <Star className="w-3 h-3 text-green-700 fill-green-700" />
                <span className="text-[10px] font-bold text-green-800">{plan.rating}</span>
            </div>
            <span className="text-xs text-gray-500 font-body">({plan.votes})</span>
          </div>
          <div className="font-heading text-base mb-1">₹{price.toLocaleString()}</div>
          <p className="font-body text-xs text-gray-400 line-clamp-2">{plan.description} - {protein === ProteinType.CHICKEN ? 'High protein chicken breast' : 'Fresh soft paneer'}.</p>
        </div>
      </div>

      {/* Image & Add Button */}
      <div className="relative w-32 flex-shrink-0">
         <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm relative">
            <img src={image} alt={plan.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
         </div>
         
         <button 
           onClick={onAdd}
           className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 py-2 bg-white border-2 rounded-lg font-heading text-sm shadow-md active:scale-95 transition-all ${hasInCart ? 'border-quirky-green text-quirky-green bg-green-50' : 'border-gray-200 text-quirky-green'}`}
         >
           {hasInCart ? 'ADDED' : 'ADD'}
         </button>
      </div>
    </div>
  );
};
