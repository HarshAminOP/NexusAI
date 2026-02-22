// components/NexusLogo.tsx
// Custom production-ready logo for NexusAI

import React from "react";

interface NexusLogoProps {
  className?: string;
  size?: number;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({ className = "", size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer hexagon */}
      <path
        d="M16 2L26.9282 8V18L16 24L5.0718 18V8L16 2Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Inner network nodes */}
      <circle cx="16" cy="8" r="2" fill="currentColor" fillOpacity="0.8" />
      <circle cx="24" cy="13" r="1.5" fill="currentColor" fillOpacity="0.6" />
      <circle cx="24" cy="19" r="1.5" fill="currentColor" fillOpacity="0.6" />
      <circle cx="16" cy="24" r="2" fill="currentColor" fillOpacity="0.8" />
      <circle cx="8" cy="19" r="1.5" fill="currentColor" fillOpacity="0.6" />
      <circle cx="8" cy="13" r="1.5" fill="currentColor" fillOpacity="0.6" />
      {/* Connection lines */}
      <path d="M16 8L24 13" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M24 13L24 19" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M24 19L16 24" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M16 24L8 19" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M8 19L8 13" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M8 13L16 8" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
      {/* Central intelligence core */}
      <circle cx="16" cy="15" r="3" fill="currentColor" fillOpacity="0.9" />
      <circle cx="16" cy="15" r="1.5" fill="white" />
    </svg>
  );
};