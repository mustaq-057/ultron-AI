import React from 'react';
import { motion } from 'framer-motion';

interface UltronLogoProps {
  size?: number;
  interactive?: boolean;
}

// Ultra-compact Electric Ultron Mark (for avatar, top bar, sidebar)
export function UltronMark({ size = 28 }: UltronLogoProps) {
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {/* Electric Plasma Outer Ring */}
      <div 
        className="absolute inset-0 rounded-full plasma-aura pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.35) 0%, rgba(112, 0, 255, 0.15) 60%, transparent 80%)',
          filter: 'blur(3px)'
        }}
      />

      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 electric-glow">
        {/* Background Outer Shield Glow */}
        <path
          d="M6 8 L26 8 L29 14 L27.5 24 L22 30 L10 30 L4.5 24 L3 14 Z"
          fill="#060919"
          stroke="#00f0ff"
          strokeWidth="1.4"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 5px #00f0ff)' }}
        />

        {/* Inner Armor Plate */}
        <path
          d="M9 12 L23 12 L25 16 L24 23 L20 27 L12 27 L8 23 L7 16 Z"
          fill="#0c1126"
          stroke="#7000ff"
          strokeWidth="0.8"
        />

        {/* Electric Lightning Arc 1 across forehead */}
        <motion.path
          d="M 5 9 Q 16 4 27 9"
          stroke="#00ffff"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          animate={{ opacity: [0.3, 1, 0.2, 0.9, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 4px #00ffff)' }}
        />

        {/* Electric Lightning Arc 2 crossing side */}
        <motion.path
          d="M 3 14 L 8 18 L 6 22 M 29 14 L 24 18 L 26 22"
          stroke="#00e5ff"
          strokeWidth="1"
          fill="none"
          animate={{ opacity: [0.2, 0.95, 0.3, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0.3 }}
          style={{ filter: 'drop-shadow(0 0 3px #00e5ff)' }}
        />

        {/* Left Electric Cyber Eye */}
        <rect x="8.5" y="15.5" width="6.5" height="3.5" rx="1.5" fill="#00ffff"
          style={{ filter: 'drop-shadow(0 0 6px #00ffff) drop-shadow(0 0 10px #00d4ff)' }} />
        <rect x="10" y="16.5" width="3.5" height="1.5" rx="0.75" fill="#ffffff" />

        {/* Right Electric Cyber Eye */}
        <rect x="17" y="15.5" width="6.5" height="3.5" rx="1.5" fill="#00ffff"
          style={{ filter: 'drop-shadow(0 0 6px #00ffff) drop-shadow(0 0 10px #00d4ff)' }} />
        <rect x="18.5" y="16.5" width="3.5" height="1.5" rx="0.75" fill="#ffffff" />

        {/* Mouth Grill Voltage Lines */}
        <line x1="11" y1="22.5" x2="21" y2="22.5" stroke="#00ffff" strokeWidth="1" opacity="0.8" style={{ filter: 'drop-shadow(0 0 3px #00ffff)' }} />
        <line x1="12" y1="24.5" x2="20" y2="24.5" stroke="#00f0ff" strokeWidth="0.8" opacity="0.6" />
        <line x1="13.5" y1="26" x2="18.5" y2="26" stroke="#7000ff" strokeWidth="0.8" opacity="0.9" />

        {/* Crown Power Core */}
        <circle cx="16" cy="6" r="1.8" fill="#00ffff" style={{ filter: 'drop-shadow(0 0 6px #00ffff)' }} />
      </svg>
    </div>
  );
}

// Large Electric Hero Logo (Used on main welcoming screen)
export function UltronHeroLogo({ size = 84 }: UltronLogoProps) {
  return (
    <div className="relative inline-flex items-center justify-center cursor-pointer group" style={{ width: size, height: size }}>

      {/* Pulsing Outer Electric Field */}
      <motion.div 
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '-20px',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.28) 0%, rgba(112, 0, 255, 0.18) 50%, transparent 75%)',
          filter: 'blur(12px)'
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rotating Electric Arc Ring */}
      <motion.div
        className="absolute rounded-full border border-cyan-400/30 pointer-events-none"
        style={{ inset: '-12px', borderStyle: 'dashed', borderWidth: '1.5px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="absolute rounded-full border border-purple-500/40 pointer-events-none"
        style={{ inset: '-6px', borderStyle: 'dotted', borderWidth: '2px' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 electric-glow">
        <defs>
          <linearGradient id="ultronMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0c1329" />
            <stop offset="50%" stopColor="#080c1a" />
            <stop offset="100%" stopColor="#04060d" />
          </linearGradient>

          <linearGradient id="electricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#7000ff" />
            <stop offset="100%" stopColor="#00ffff" />
          </linearGradient>

          <filter id="lightningGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* External Lightning Sparks */}
        <motion.path
          d="M 8 16 L 16 20 L 12 28 M 56 16 L 48 20 L 52 28"
          stroke="#00ffff"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#lightningGlow)"
          animate={{ opacity: [0.1, 1, 0.2, 0.9, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />

        {/* Lower Lightning Sparks */}
        <motion.path
          d="M 14 48 L 22 52 L 18 58 M 50 48 L 42 52 L 46 58"
          stroke="#7000ff"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          filter="url(#lightningGlow)"
          animate={{ opacity: [0.8, 0.2, 1, 0.4] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: 0.2 }}
        />

        {/* Outer Helmet Outline */}
        <path
          d="M12 16 L52 16 L58 28 L55 48 L44 60 L20 60 L9 48 L6 28 Z"
          fill="url(#ultronMetal)"
          stroke="#00f0ff"
          strokeWidth="2.2"
          strokeLinejoin="round"
          filter="url(#lightningGlow)"
        />

        {/* Inner Armor Contour */}
        <path
          d="M18 24 L46 24 L50 32 L48 46 L40 54 L24 54 L16 46 L14 32 Z"
          fill="#060a17"
          stroke="url(#electricGrad)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />

        {/* Forehead Electric Voltage Core */}
        <path d="M 32 10 L 36 20 L 32 18 L 28 20 Z" fill="#00ffff" filter="url(#lightningGlow)" />
        <motion.path
          d="M 14 18 Q 32 8 50 18"
          stroke="#00ffff"
          strokeWidth="2"
          fill="none"
          filter="url(#lightningGlow)"
          animate={{ opacity: [0.4, 1, 0.3, 0.9, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />

        {/* Left Electric Eye */}
        <g filter="url(#lightningGlow)">
          <rect x="17" y="31" width="13" height="7" rx="3.5" fill="#00ffff" />
          <rect x="20" y="33" width="7" height="3" rx="1.5" fill="#ffffff" />
        </g>

        {/* Right Electric Eye */}
        <g filter="url(#lightningGlow)">
          <rect x="34" y="31" width="13" height="7" rx="3.5" fill="#00ffff" />
          <rect x="37" y="33" width="7" height="3" rx="1.5" fill="#ffffff" />
        </g>

        {/* Cheeks Cyber Circuits */}
        <path d="M 14 38 L 19 44 M 50 38 L 45 44" stroke="#00f0ff" strokeWidth="1.2" opacity="0.7" />

        {/* Mouth Grill - Electric Grid */}
        <g filter="url(#lightningGlow)">
          <line x1="22" y1="45" x2="42" y2="45" stroke="#00ffff" strokeWidth="1.6" />
          <line x1="24" y1="49" x2="40" y2="49" stroke="#00f0ff" strokeWidth="1.4" />
          <line x1="27" y1="53" x2="37" y2="53" stroke="#7000ff" strokeWidth="1.4" />
        </g>

        {/* Vertical Voltage Slits */}
        <line x1="27" y1="44" x2="27" y2="50" stroke="#00ffff" strokeWidth="1" opacity="0.8" />
        <line x1="32" y1="44" x2="32" y2="54" stroke="#ffffff" strokeWidth="1.2" />
        <line x1="37" y1="44" x2="37" y2="50" stroke="#00ffff" strokeWidth="1" opacity="0.8" />

        {/* Crown Power Core Particle */}
        <circle cx="32" cy="12" r="3" fill="#ffffff" filter="url(#lightningGlow)" />
      </svg>
    </div>
  );
}
