import React from 'react';
import { motion } from 'motion/react';
import { BrainTraceLogo } from './BrainTraceLogo';
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Youtube, 
  Instagram, 
  ArrowUpRight, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';

interface FooterProps {
  onOpenModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenModal }) => {
  return (
    <motion.footer 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      className="bg-[#09090b] text-white pt-16 pb-12 border-t border-neutral-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-800">
          
          {/* Brand Info Column */}
          <div className="lg:col-span-2 space-y-4">
            
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-1.5 shadow-md transition-transform group-hover:scale-105">
                <BrainTraceLogo className="w-full h-full" />
              </div>
              <span className="text-white text-2xl font-bold tracking-tight font-sans">BrainTrace</span>
            </a>

            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
              Helping patients and caregivers navigate the journey from early cognitive concerns to appropriate specialist care through explainable AI.
            </p>

            {/* Social Media Icons */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Connect With Us</div>
              <div className="flex items-center gap-3">
                
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
                  aria-label="Twitter / X"
                >
                  <Twitter className="w-4 h-4" />
                </a>

                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>

                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>

                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>

                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>

              </div>
            </div>

          </div>

          {/* Nav Column 1: Solutions & Mission */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Explore</div>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><a href="#solutions" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#mission" className="hover:text-white transition-colors">Our Mission</a></li>
              <li><a href="#research" className="hover:text-white transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Nav Column 2: Contact & Legal */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Company & Legal</div>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms Of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Giant Watermark Display Text */}
        <div className="pt-12 pb-4 text-center overflow-hidden border-t border-neutral-900 my-6">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] xl:text-[12rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-neutral-600 via-neutral-800 to-neutral-950 select-none leading-none">
            BrainTrace
          </h1>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          
          <div>
            © {new Date().getFullYear()} BrainTrace Technologies Inc. All rights reserved.
          </div>

          <div>
            {new Date().getFullYear()} Medical Disclaimer - BrainTrace is designed to support, not replace professional medical judgment. AI-generated insights should always be reviewed by qualified healthcare professionals.
          </div>

        </div>

      </div>
    </motion.footer>
  );
};
