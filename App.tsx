import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { HeroSection } from './components/HeroSection';
import { MenuShowcase } from './components/MenuShowcase';
import { StorySection } from './components/StorySection';
import { Footer } from './components/Footer';
import { OrderFlowPage } from './components/OrderFlowPage';
import { AdminDashboard } from './components/AdminDashboard';
import { DeliveryDashboard } from './components/DeliveryDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { AuthPage } from './components/AuthPage';
import { QuirkyButton } from './components/QuirkyButton';
import { Logo } from './components/Logo';
import { User, LogIn, LogOut } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { auth } from './src/services/api';
import { PoliciesPage } from './components/PoliciesPage';

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={(import.meta as any).env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    // Verify token with backend
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await auth.verifyToken();
          localStorage.setItem('user', JSON.stringify(res.data.user));
          setIsLoggedIn(true);
        } catch (error) {
          console.warn('Token verification failed, logging out');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsLoggedIn(false);
        }
      }
      setAuthChecked(true);
    };
    verifyAuth();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginSuccess = (user: any) => {
    setIsLoggedIn(true);
    if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'delivery') {
      navigate('/delivery');
    } else {
      navigate('/client');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/');
  };

  const goToDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'delivery') navigate('/delivery');
    else navigate('/client');
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage onLoginSuccess={handleLoginSuccess} onBack={() => navigate('/')} />} />
      <Route path="/client" element={<ClientDashboard onBack={() => navigate('/')} />} />
      <Route path="/order" element={
        isLoggedIn
          ? <OrderFlowPage onBack={() => navigate('/')} />
          : <Navigate to="/auth" replace />
      } />
      <Route path="/admin" element={<AdminDashboard onBack={() => navigate('/')} />} />
      <Route path="/delivery" element={<DeliveryDashboard onBack={() => navigate('/')} />} />
      <Route path="/policies" element={<PoliciesPage />} />
      <Route path="/" element={
        <HomePage
          scrolled={scrolled}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onGoToDashboard={goToDashboard}
        />
      } />
    </Routes>
  );
};

interface HomePageProps {
  scrolled: boolean;
  isLoggedIn: boolean;
  onLogout: () => void;
  onGoToDashboard: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ scrolled, isLoggedIn, onLogout, onGoToDashboard }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-hidden selection:bg-quirky-green selection:text-black">
      {/* Navbar */}
      <nav className="fixed top-2 md:top-4 left-0 right-0 z-50 transition-all duration-300 pointer-events-none flex justify-between items-center px-4 md:px-8">
        {/* Logo on far left */}
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="pointer-events-auto cursor-pointer shrink-0">
          <img src="/logo-green-full.png" alt="The Healthy Canteen" className="h-16 md:h-24 w-auto object-contain drop-shadow-md py-1" />
        </div>

        {/* Pill navbar moved to right */}
        <div className={`pointer-events-auto px-4 py-2 rounded-full flex items-center gap-2 md:gap-4 transition-all duration-300 bg-white border-2 border-quirky-black overflow-x-auto no-scrollbar ${scrolled ? 'shadow-hard scale-95' : 'shadow-none'}`}>
          {/* Removed text Logo based on sketch feedback */}

          {/* Moved JOIN NOW logic inside or keep same? User said "pill shape have to move right". Let's keep content same but move container right. */}
          <button
            className="px-3 py-1.5 md:px-4 md:py-1.5 rounded-full transition-colors text-[10px] md:text-xs font-bold bg-quirky-green text-quirky-black font-heading border border-quirky-black hover:bg-green-400 shrink-0 whitespace-nowrap"
            onClick={() => navigate('/order')}
          >
            JOIN NOW
          </button>

          {/* User / Login Button */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button onClick={onGoToDashboard} className="p-1.5 md:p-2 bg-quirky-yellow border border-black rounded-full hover:bg-yellow-400 shrink-0">
                <User size={16} />
              </button>
              <button onClick={onLogout} className="p-1.5 md:p-2 bg-red-100 border border-black rounded-full hover:bg-red-200 shrink-0 text-red-600" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} className="flex items-center gap-1 text-[10px] md:text-xs font-bold hover:text-quirky-pink shrink-0 whitespace-nowrap">
              <LogIn size={14} /> <span className="hidden sm:inline">LOGIN</span>
            </button>
          )}
        </div>
      </nav>

      <main className="pt-20">
        <HeroSection />

        {/* Marquee Separator */}
        <div className="bg-quirky-black text-white py-3 overflow-hidden border-y-2 border-white rotate-1 scale-105 z-20 relative">
          <div className="whitespace-nowrap animate-marquee font-heading text-lg md:text-xl">
            GOOD HABITS DELIVERED • FRESHLY COOKED DAILY • PORTION CONTROLLED • HIGH PROTEIN • GOOD HABITS DELIVERED • FRESHLY COOKED DAILY • PORTION CONTROLLED • HIGH PROTEIN •
          </div>
        </div>

        <MenuShowcase />

        {/* Call to Action Section */}
        <section id="pricing" className="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden bg-quirky-blue border-y-4 border-black">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_2px,transparent_2px)] [background-size:24px_24px]"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="p-6 md:p-12 transition-transform duration-300 bg-white border-4 border-black rounded-3xl shadow-hard-xl rotate-1 hover:rotate-0">
              <h2 className="font-heading text-3xl md:text-6xl mb-6">
                READY TO EAT LIKE A PRO?
              </h2>
              <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto font-body">
                Customize your plan from 1 to 24 days. Choose your protein. Add your boosters. Get healthy.
              </p>

              <QuirkyButton onClick={() => navigate('/order')} className="text-xl md:text-2xl px-8 md:px-12 py-4 md:py-6 animate-wiggle hover:animate-none">
                BUILD MY PLAN 🛠️
              </QuirkyButton>
            </div>
          </div>
        </section>

        <StorySection />
      </main>

      <Footer />

      {/* Global CSS for Marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        /* Safe area for bottom navigation on mobile */
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div >
  );
};

export default App;