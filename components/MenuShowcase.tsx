import React, { useState } from 'react';
import { MENU_ITEMS, SIDES } from '../constants';
import { ProteinType } from '../types';
import { Check, Zap } from 'lucide-react';

export const MenuShowcase: React.FC = () => {
  const [selectedProtein, setSelectedProtein] = useState<ProteinType>(ProteinType.CHICKEN);

  const activeItem = MENU_ITEMS[selectedProtein];

  return (
    <section id="menu" className="py-16 md:py-24 px-4 md:px-6 relative bg-quirky-purple/20 border-y-4 border-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
            <h2 className="font-heading text-3xl md:text-5xl lg:text-7xl bg-white border-4 border-black inline-block px-6 py-3 md:px-8 md:py-4 shadow-hard-lg -rotate-2">
            CHOOSE YOUR FIGHTER
            </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
          
          {/* Toggles */}
          <div className="flex flex-row lg:flex-col gap-4 md:gap-6 w-full lg:w-1/4">
             <button 
                onClick={() => setSelectedProtein(ProteinType.CHICKEN)}
                className={`flex-1 p-4 md:p-6 border-3 border-black rounded-xl transition-all relative group overflow-hidden ${selectedProtein === ProteinType.CHICKEN ? 'bg-quirky-yellow shadow-hard-lg translate-x-1 -translate-y-1' : 'bg-white shadow-hard hover:bg-gray-50'}`}
             >
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-heading text-2xl md:text-3xl">🐔</span>
                        {selectedProtein === ProteinType.CHICKEN && <Check size={24} className="border-2 border-black rounded-full p-0.5 bg-white"/>}
                    </div>
                    <span className="font-heading text-xl md:text-2xl block mb-1">CHICKEN</span>
                    <span className="font-heading text-xs md:text-sm bg-black text-white px-2 py-1 rounded">60g PROTEIN</span>
                </div>
                {/* Decoration */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 md:w-20 md:h-20 bg-white/30 rounded-full"></div>
             </button>

             <button 
                onClick={() => setSelectedProtein(ProteinType.PANEER)}
                className={`flex-1 p-4 md:p-6 border-3 border-black rounded-xl transition-all relative group overflow-hidden ${selectedProtein === ProteinType.PANEER ? 'bg-quirky-pink text-white shadow-hard-lg translate-x-1 -translate-y-1' : 'bg-white shadow-hard hover:bg-gray-50'}`}
             >
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-heading text-2xl md:text-3xl">🧀</span>
                        {selectedProtein === ProteinType.PANEER && <Check size={24} className="border-2 border-black rounded-full p-0.5 bg-black text-white"/>}
                    </div>
                    <span className="font-heading text-xl md:text-2xl block mb-1">PANEER</span>
                    <span className="font-heading text-xs md:text-sm bg-black text-white px-2 py-1 rounded">40g PROTEIN</span>
                </div>
                 {/* Decoration */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 md:w-20 md:h-20 bg-white/30 rounded-full"></div>
             </button>
          </div>

          {/* Main Display */}
          <div className="w-full lg:w-3/4">
            <div className={`relative border-4 border-black rounded-3xl p-6 md:p-10 shadow-hard-xl transition-colors duration-500 bg-white`}>
                
                {/* Window Controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-black bg-quirky-pink"></div>
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-black bg-quirky-yellow"></div>
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-black bg-quirky-green"></div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center mt-6">
                    <div className="w-full md:w-1/2">
                        <div className="aspect-square bg-black p-2 rounded-xl border-2 border-black shadow-hard-sm transform rotate-1">
                            <div className="w-full h-full bg-gray-200 rounded-lg overflow-hidden border-2 border-white relative group">
                                <img src={activeItem.image} alt={activeItem.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-4">
                                     <span className="font-heading text-white text-xl animate-bounce">YUM!</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 space-y-6">
                        <div>
                             <h3 className="font-heading text-3xl md:text-5xl mb-2 text-stroke-sm text-quirky-blue">{activeItem.name}</h3>
                             <div className="h-2 w-24 bg-black rounded-full mb-4"></div>
                             <p className="font-body text-lg md:text-xl font-bold border-l-4 border-quirky-green pl-4">{activeItem.description}</p>
                        </div>
                        
                        <div className="bg-quirky-cream border-3 border-black p-4 md:p-6 rounded-xl relative shadow-hard-sm">
                            <div className="absolute -top-4 left-4 bg-quirky-purple text-white border-2 border-black px-3 py-1 font-heading text-xs md:text-sm rotate-2">
                                SIDE KICKS
                            </div>
                            <ul className="font-body text-sm md:text-base space-y-2 mt-2">
                                {SIDES.slice(0, 4).map((side, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <Zap size={16} className="text-quirky-black shrink-0" fill="currentColor"/>
                                        <span className="font-bold">{side}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};