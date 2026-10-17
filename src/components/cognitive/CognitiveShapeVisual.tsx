import React from 'react';

interface CognitiveShapeVisualProps {
  shapeSvg?: string;
  className?: string;
}

export const CognitiveShapeVisual: React.FC<CognitiveShapeVisualProps> = ({
  shapeSvg,
  className = 'w-10 h-10'
}) => {
  switch (shapeSvg) {
    case 'circle-dot':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#09090b" strokeWidth="6" />
          <circle cx="50" cy="50" r="14" fill="#09090b" />
        </svg>
      );

    case 'circle-hollow':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#09090b" strokeWidth="6" />
        </svg>
      );

    case 'diamond':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="50,12 88,50 50,88 12,50" fill="none" stroke="#09090b" strokeWidth="6" />
        </svg>
      );

    case 'square':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="18" y="18" width="64" height="64" fill="#09090b" rx="4" />
        </svg>
      );

    case 'star':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon
            points="50,10 61,35 88,38 68,57 74,84 50,70 26,84 32,57 12,38 39,35"
            fill="none"
            stroke="#09090b"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'triangle':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="50,15 88,85 12,85" fill="none" stroke="#09090b" strokeWidth="6" strokeLinejoin="round" />
        </svg>
      );

    case 'pentagon':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="50,12 88,40 73,86 27,86 12,40" fill="none" stroke="#09090b" strokeWidth="5" strokeLinejoin="round" />
        </svg>
      );

    case 'rect':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="10" y="25" width="80" height="50" fill="none" stroke="#09090b" strokeWidth="6" rx="4" />
        </svg>
      );

    case 'oval':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <ellipse cx="50" cy="50" rx="42" ry="26" fill="none" stroke="#09090b" strokeWidth="6" />
        </svg>
      );

    case 'cylinder':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <ellipse cx="50" cy="28" rx="32" ry="12" fill="none" stroke="#09090b" strokeWidth="5" />
          <line x1="18" y1="28" x2="18" y2="72" stroke="#09090b" strokeWidth="5" />
          <line x1="82" y1="28" x2="82" y2="72" stroke="#09090b" strokeWidth="5" />
          <path d="M 18,72 A 32,12 0 0,0 82,72" fill="none" stroke="#09090b" strokeWidth="5" />
        </svg>
      );

    case 'hexagon':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="50,12 85,32 85,68 50,88 15,68 15,32" fill="none" stroke="#09090b" strokeWidth="5" />
        </svg>
      );

    case 'shield-check':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <path d="M 50,12 L 82,24 C 82,56 68,78 50,88 C 32,78 18,56 18,24 Z" fill="#ecfdf5" stroke="#059669" strokeWidth="6" />
          <polyline points="35,50 45,60 65,40" fill="none" stroke="#059669" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'alert':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="50,14 88,82 12,82" fill="#fffbeb" stroke="#d97706" strokeWidth="6" strokeLinejoin="round" />
          <line x1="50" y1="38" x2="50" y2="58" stroke="#d97706" strokeWidth="7" strokeLinecap="round" />
          <circle cx="50" cy="70" r="4" fill="#d97706" />
        </svg>
      );

    case 'octagon':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="32,14 68,14 86,32 86,68 68,86 32,86 14,68 14,32" fill="none" stroke="#09090b" strokeWidth="5" />
        </svg>
      );

    case 'bolt':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="54,12 24,54 48,54 44,88 76,46 52,46" fill="#fef3c7" stroke="#d97706" strokeWidth="5" strokeLinejoin="round" />
        </svg>
      );

    case 'badge':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#71717a" strokeWidth="5" strokeDasharray="6 4" />
        </svg>
      );

    // 2D Rotation Shape Trial
    case 'l-target':
    case 'l-rot-90':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="25" y="20" width="20" height="60" fill="#09090b" rx="2" />
          <rect x="45" y="60" width="35" height="20" fill="#09090b" rx="2" />
          <circle cx="35" cy="30" r="5" fill="#ffffff" />
        </svg>
      );

    case 'l-mirror':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="55" y="20" width="20" height="60" fill="#09090b" rx="2" />
          <rect x="20" y="60" width="35" height="20" fill="#09090b" rx="2" />
          <circle cx="65" cy="30" r="5" fill="#ffffff" />
        </svg>
      );

    case 'l-altered':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="25" y="20" width="20" height="60" fill="#09090b" rx="2" />
          <rect x="45" y="45" width="20" height="35" fill="#09090b" rx="2" />
          <circle cx="35" cy="30" r="9" fill="#ffffff" />
        </svg>
      );

    case 'l-wrong':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="25" y="20" width="20" height="60" fill="#09090b" rx="2" />
          <rect x="45" y="20" width="35" height="20" fill="#09090b" rx="2" />
          <circle cx="35" cy="70" r="5" fill="#ffffff" />
        </svg>
      );

    // Symmetry matrix pieces
    case 'quad-correct':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="15" y="15" width="70" height="70" fill="none" stroke="#09090b" strokeWidth="4" rx="4" />
          <circle cx="65" cy="65" r="16" fill="#059669" />
          <line x1="20" y1="20" x2="80" y2="80" stroke="#09090b" strokeWidth="3" />
        </svg>
      );

    case 'quad-wrong':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="15" y="15" width="70" height="70" fill="none" stroke="#09090b" strokeWidth="4" rx="4" />
          <circle cx="35" cy="35" r="16" fill="#09090b" />
          <line x1="80" y1="20" x2="20" y2="80" stroke="#09090b" strokeWidth="3" />
        </svg>
      );

    case 'quad-partial':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="15" y="15" width="70" height="70" fill="none" stroke="#09090b" strokeWidth="4" rx="4" />
          <circle cx="35" cy="65" r="16" fill="#71717a" />
          <line x1="20" y1="20" x2="80" y2="80" stroke="#09090b" strokeWidth="3" />
        </svg>
      );

    case 'quad-solid':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="15" y="15" width="70" height="70" fill="#09090b" rx="4" />
          <circle cx="65" cy="65" r="16" fill="#ffffff" />
        </svg>
      );

    default:
      return (
        <div className={`rounded-xl border border-neutral-300 bg-neutral-100 flex items-center justify-center font-bold text-xs ${className}`}>
          ●
        </div>
      );
  }
};
