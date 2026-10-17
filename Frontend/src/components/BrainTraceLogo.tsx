import React from 'react';

interface BrainTraceLogoProps {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  leafColor?: string;
}

export const BrainTraceLogo: React.FC<BrainTraceLogoProps> = ({
  className = "w-6 h-6",
  primaryColor = "#000000",
  secondaryColor = "#9E9E9E",
  leafColor = "#FFFFFF",
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Arm Capsule (Black) */}
      <rect x="34" y="10" width="32" height="40" rx="16" fill={primaryColor} />
      {/* Right Arm Capsule (Black) */}
      <rect x="50" y="34" width="40" height="32" rx="16" fill={primaryColor} />

      {/* Left Arm Capsule (Grey) */}
      <rect x="10" y="34" width="40" height="32" rx="16" fill={secondaryColor} />
      {/* Bottom Arm Capsule (Grey) */}
      <rect x="34" y="50" width="32" height="40" rx="16" fill={secondaryColor} />

      {/* Center White Leaf / Almond Intersection */}
      <path
        d="M 34 34
           C 52 34, 66 48, 66 66
           C 48 66, 34 52, 34 34 Z"
        fill={leafColor}
      />
    </svg>
  );
};
