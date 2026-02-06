import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface CartBarProps {
  count: number;
  total: number;
  onClick: () => void;
}

export const CartBar: React.FC<CartBarProps> = ({ count, total, onClick }) => {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-3xl mx-auto">
      <button 
        onClick={onClick}
        className="w-full bg-quirky-green border-2 border-quirky-black rounded-xl p-3 flex justify-between items-center shadow-hard animate-in slide-in-from-bottom-4 active:translate-y-1 active:shadow-none transition-all"
      >
        <div className="text-left">
          <p className="font-heading text-xs text-quirky-black uppercase mb-0.5">{count} ITEM ADDED</p>
          <p className="font-heading text-lg text-white text-stroke-sm">₹{total.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2 font-heading text-sm bg-white/20 px-3 py-2 rounded-lg text-quirky-black">
          View Cart <ShoppingBag size={18} />
        </div>
      </button>
    </div>
  );
};
