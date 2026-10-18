/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SolutionsSection } from './components/SolutionsSection';
import { ResearchSection } from './components/ResearchSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { TryBrainTracePage } from './components/TryBrainTracePage';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { BrainTraceCompanion } from './components/companion/BrainTraceCompanion';
import {
  CompanionContext,
  NavigationDestination,
  executeCompanionNavigation
} from './services/companionNavigation';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'try-braintrace'>('home');
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'Patient' | 'Caretaker' | 'Doctor'>('Patient');

  const handleGoToContact = () => {
    setCurrentView('home');
    setTimeout(() => {
      const contactElem = document.getElementById('contact');
      if (contactElem) {
        contactElem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleOpenTryBrainTrace = () => {
    setCurrentView('try-braintrace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompanionNavigate = (destination: NavigationDestination) => {
    if (destination === 'home') {
      setCurrentView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (currentView !== 'try-braintrace') {
        setCurrentView('try-braintrace');
      }
      setTimeout(() => {
        executeCompanionNavigation(destination);
      }, 50);
    }
  };

  const companionContext: CompanionContext = {
    currentRoute: currentView,
    userRole: userRole
  };

  if (currentView === 'try-braintrace') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-[#09090b] font-sans antialiased selection:bg-black selection:text-white">
        <TryBrainTracePage 
          onBackToHome={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
          loggedInUser={loggedInUser}
          userRole={userRole}
          onLoginSuccess={(userName, role) => {
            setLoggedInUser(userName);
            if (role) setUserRole(role);
          }}
          onLogout={() => {
            setLoggedInUser(null);
            setUserRole('Patient');
          }}
        />
        <ScrollProgressBar />
        <BrainTraceCompanion 
          context={companionContext} 
          onNavigate={handleCompanionNavigate} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#09090b] font-sans antialiased selection:bg-black selection:text-white">
      {/* Top Fixed Navigation */}
      <Navbar 
        onOpenModal={handleOpenTryBrainTrace} 
        loggedInUser={loggedInUser}
        userRole={userRole}
        onLogout={() => {
          setLoggedInUser(null);
          setUserRole('Patient');
        }}
      />

      {/* Main Landing Page Content */}
      <main>
        {/* Hero Section */}
        <HeroSection onOpenModal={handleOpenTryBrainTrace} />

        {/* Core Capabilities & 4 Pillars */}
        <SolutionsSection onOpenModal={handleOpenTryBrainTrace} />

        {/* Mission & 30+ Language Research */}
        <ResearchSection onOpenModal={handleOpenTryBrainTrace} />

        {/* Direct Contact Form */}
        <ContactSection />
      </main>

      {/* Footer with Social Icons */}
      <Footer 
        onOpenModal={handleOpenTryBrainTrace} 
      />

      {/* Scroll Progress Bar at the very bottom */}
      <ScrollProgressBar />

      {/* BrainTrace Gemini AI Companion */}
      <BrainTraceCompanion 
        context={companionContext} 
        onNavigate={handleCompanionNavigate} 
      />
    </div>
  );
}
