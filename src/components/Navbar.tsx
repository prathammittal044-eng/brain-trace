import React, { useState, useEffect } from 'react';
import { BrainTraceLogo } from './BrainTraceLogo';
import { 
  ArrowUpRight, 
  Menu, 
  X,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  User
} from 'lucide-react';

interface NavbarProps {
  onOpenModal: () => void;
  loggedInUser?: string | null;
  userRole?: 'Patient' | 'Caretaker' | 'Doctor';
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenModal, 
  loggedInUser,
  userRole = 'Patient',
  onLogout
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const firstLetter = loggedInUser ? loggedInUser.trim().charAt(0).toUpperCase() : '';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#09090b]/90 backdrop-blur-md border-b border-white/10 py-3 shadow-2xl' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo - exact match to BrainTrace style */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center p-1 shadow-md transition-transform group-hover:scale-105">
              <BrainTraceLogo className="w-full h-full" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight font-sans">BrainTrace</span>
          </a>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            
            {/* About Us */}
            <a href="#mission" className="px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white transition-colors">
              About Us
            </a>

            {/* Solutions */}
            <a href="#solutions" className="px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white transition-colors">
              Solutions
            </a>
          </nav>

          {/* Right Action Links */}
          <div className="hidden lg:flex items-center gap-5">
            <a 
              href="#contact" 
              className="inline-flex items-center gap-1 text-sm font-medium text-neutral-300 hover:text-white transition-colors group"
            >
              Contact Us 
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <div className="h-4 w-px bg-white/20"></div>

            {loggedInUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1 pr-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer group"
                  title={`Logged in as ${loggedInUser}`}
                >
                  <div className="w-9 h-9 rounded-full bg-white text-black font-black text-base flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    {firstLetter}
                  </div>
                  <span className="text-sm font-bold text-white max-w-[120px] truncate">
                    {loggedInUser.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-300 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#09090b] border-2 border-white/20 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-white/10">
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Signed in as</p>
                      <p className="text-sm font-extrabold text-white truncate">{loggedInUser}</p>
                    </div>
                    <div className="py-1 space-y-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <LayoutDashboard className="w-4 h-4 text-amber-400" />
                        <span>{userRole} Dashboard</span>
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenModal}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-neutral-200 transition-colors group"
              >
                Try BrainTrace 
                <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Mobile menu trigger + Avatar icon on mobile */}
          <div className="lg:hidden flex items-center gap-3">
            {loggedInUser && (
              <button
                onClick={() => onOpenModal()}
                className="w-9 h-9 rounded-full bg-white text-black font-black text-sm flex items-center justify-center shadow-md cursor-pointer"
                title={`Open Dashboard (${loggedInUser})`}
              >
                {firstLetter}
              </button>
            )}

            <button 
              className="p-2 text-neutral-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#09090b] border-b border-white/10 px-6 py-6 space-y-4 animate-in fade-in duration-200">
          {loggedInUser && (
            <div className="p-3 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-black font-black text-base flex items-center justify-center shrink-0">
                  {firstLetter}
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-300">Logged in as</div>
                  <div className="text-sm font-extrabold text-white truncate max-w-[160px]">{loggedInUser}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}

          <nav className="flex flex-col space-y-3">
            <a 
              href="#mission" 
              className="text-base text-neutral-200 hover:text-white font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </a>
            <a 
              href="#solutions" 
              className="text-base text-neutral-200 hover:text-white font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Solutions
            </a>
            <a 
              href="#contact" 
              className="text-base text-neutral-200 hover:text-white font-medium flex items-center justify-between"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact Us <ArrowUpRight className="w-4 h-4" />
            </a>
          </nav>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenModal();
              }}
              className="w-full py-3 bg-white text-black font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              {loggedInUser ? 'Go to Dashboard' : 'Try BrainTrace'} <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
