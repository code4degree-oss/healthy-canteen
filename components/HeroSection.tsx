import React from 'react';
import { QuirkyButton } from './QuirkyButton';
import { Leaf } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center p-4 md:p-6 overflow-hidden">


      {/* Floating Food (Main - Interactive) */}
      <div className="absolute top-20 left-10 animate-wiggle hidden lg:block transform -rotate-12 hover:scale-110 transition-transform cursor-pointer z-10">
        <img src="/hero-chicken.png" alt="Chicken" className="w-32 md:w-40 drop-shadow-2xl" />
      </div>

      <div className="absolute bottom-32 right-12 animate-bounce hidden lg:block hover:scale-110 transition-transform cursor-pointer z-10">
        <img src="/hero-broccoli.png" alt="Broccoli" className="w-28 md:w-36 drop-shadow-2xl -rotate-12" />
      </div>

      <div className="absolute top-40 right-1/4 animate-float hidden lg:block hover:scale-110 transition-transform cursor-pointer z-10">
        <img src="/hero-paneer.png" alt="Paneer" className="w-24 md:w-32 drop-shadow-2xl rotate-12" />
      </div>

      <div className="relative z-10 max-w-5xl text-center">

        {/* Badge */}
        <div className="inline-block transform -rotate-6 mb-8 bg-white/80 backdrop-blur-sm border-3 border-black px-4 py-2 md:px-6 shadow-hard hover:scale-110 transition-transform cursor-pointer">
          <span className="font-heading text-sm md:text-lg text-quirky-pink">🚫 NO BORING FOOD ALLOWED</span>
        </div>

        {/* Responsive Heading */}
        <h1 className="font-heading text-5xl sm:text-6xl md:text-8xl lg:text-[9rem] text-black leading-[0.9] mb-8 relative">
          <div className="hover:skew-x-12 transition-transform duration-300 origin-left">THE</div>

          {/* Blinking Animation for HEALTHY */}
          <style>{`
            @keyframes blinkGreen {
              0%, 100% { color: transparent; -webkit-text-stroke: 2px black; }
              50% { color: #87e44e; -webkit-text-stroke: 2px black; } 
            }
            .animate-blink-green {
              animation: blinkGreen 1s infinite;
            }
          `}</style>
          <div className="text-stroke-black text-transparent animate-blink-green">HEALTHY</div>

          <div className="relative inline-block">
            {/* Soft Glow behind CANTEEN */}
            <div className="absolute inset-0 bg-green-400/30 blur-2xl rounded-full -z-10 scale-110"></div>
            <div className="bg-quirky-black text-white inline-block px-2 md:px-4 transform -rotate-2 hover:rotate-2 transition-transform">CANTEEN</div>
          </div>
        </h1>

        <div className="relative max-w-2xl mx-auto mb-12 bg-white/90 backdrop-blur-sm border-3 border-black p-4 md:p-6 shadow-hard rotate-1 hover:-rotate-1 transition-transform">
          <div className="absolute -top-3 -left-3 w-4 h-4 md:w-6 md:h-6 bg-quirky-blue border-2 border-black rounded-full"></div>
          <div className="absolute -top-3 -right-3 w-4 h-4 md:w-6 md:h-6 bg-quirky-pink border-2 border-black rounded-full"></div>
          <div className="absolute -bottom-3 -left-3 w-4 h-4 md:w-6 md:h-6 bg-quirky-yellow border-2 border-black rounded-full"></div>
          <div className="absolute -bottom-3 -right-3 w-4 h-4 md:w-6 md:h-6 bg-quirky-green border-2 border-black rounded-full"></div>

          <p className="font-body text-lg md:text-xl lg:text-2xl text-black font-bold">
            "Your gym membership works harder when you feed it right."
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center">
          <QuirkyButton onClick={scrollToMenu} variant="primary" className="text-xl md:text-2xl w-full md:w-auto px-8 md:px-10 py-4 md:py-5 rotate-2 hover:rotate-0 shadow-xl">
            SHOW ME FOOD 🍔
          </QuirkyButton>
        </div>
      </div>
    </section>
  );
};