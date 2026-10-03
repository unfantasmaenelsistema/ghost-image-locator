import React from 'react';

interface NetPhantomLogoProps {
  className?: string;
  size?: number;
}

export const NetPhantomLogo: React.FC<NetPhantomLogoProps> = ({ className = 'h-6 w-6', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="phantomGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      {/* Ghost Silhouette with tactical cuts */}
      <path
        d="M12 2C7.03 2 3 6.03 3 11V21L6 19.5L9 21L12 19.5L15 21L18 19.5L21 21V11C21 6.03 16.97 2 12 2Z"
        fill="url(#phantomGlow)"
        fillOpacity="0.18"
        stroke="url(#phantomGlow)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Glowing Cyber Eyes */}
      <circle cx="8.5" cy="10.5" r="1.8" fill="#34d399" />
      <circle cx="15.5" cy="10.5" r="1.8" fill="#34d399" />
      {/* Terminal grid accents */}
      <path
        d="M9 15.5H15"
        stroke="#34d399"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
