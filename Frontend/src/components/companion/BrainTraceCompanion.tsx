import React, { useState } from 'react';
import { CompanionMascot } from './CompanionMascot';
import { CompanionChatPanel } from './CompanionChatPanel';
import {
  CompanionContext,
  NavigationDestination,
  executeCompanionNavigation
} from '../../services/companionNavigation';

interface BrainTraceCompanionProps {
  context?: CompanionContext;
  onNavigate?: (destination: NavigationDestination) => void;
}

export const BrainTraceCompanion: React.FC<BrainTraceCompanionProps> = ({
  context,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleNavigate = (destination: NavigationDestination) => {
    // Optionally close or keep panel open
    if (onNavigate) {
      onNavigate(destination);
    } else {
      executeCompanionNavigation(destination);
    }
  };

  return (
    <>
      <CompanionChatPanel
        isOpen={isOpen}
        onClose={handleClose}
        context={context}
        onNavigate={handleNavigate}
      />
      <CompanionMascot
        isOpen={isOpen}
        onToggle={handleToggle}
      />
    </>
  );
};
