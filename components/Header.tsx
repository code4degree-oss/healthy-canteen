import React from 'react';
import { MapPin, User, Search } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-quirky-black shadow-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors">
            <MapPin className="text-quirky-pink w-6 h-6" strokeWidth={2.5} />
            <div className="leading-tight">
              <h2 className="font-heading text-sm flex items-center gap-1">
                HOME <span className="text-xs font-body text-gray-500 font-normal">▼</span>
              </h2>
              <p className="font-body text-xs text-gray-500 truncate max-w-[200px]">
                B-22 Privia Business Center, Moshi...
              </p>
            </div>
          </div>
          <div className="bg-quirky-black text-white p-2 rounded-full border-2 border-transparent hover:border-quirky-green cursor-pointer">
            <User size={20} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search for 'muscle fuel'..." 
            className="w-full bg-gray-100 border-2 border-transparent focus:border-quirky-black focus:bg-white rounded-xl py-2 pl-10 pr-4 font-body text-sm transition-all outline-none placeholder:text-gray-400"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
