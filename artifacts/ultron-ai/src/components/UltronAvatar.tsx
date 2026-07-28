import React from 'react';
import { motion } from 'framer-motion';

interface UltronAvatarProps {
  isThinking?: boolean;
  size?: 'sm' | 'lg';
}

export function UltronAvatar({ isThinking = false, size = 'lg' }: UltronAvatarProps) {
  const dim = size === 'lg' ? 280 : 64;

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: dim, height: dim }}
    >
      {/* Outer rotating ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: '1px solid rgba(255,32,64,0.25)',
          boxShadow: '0 0 40px rgba(255,32,64,0.15), inset 0 0 40px rgba(255,32,64,0.05)',
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
      />
      {/* Second counter-rotating ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: '12px',
          border: '1px solid rgba(255,32,64,0.15)',
          borderTopColor: 'rgba(255,32,64,0.7)',
          borderRightColor: 'rgba(255,32,64,0.4)',
        }}
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
      />

      {/* Ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{ inset: '24px', background: 'radial-gradient(circle, rgba(255,32,64,0.08) 0%, transparent 70%)' }}
        animate={{ opacity: isThinking ? [0.4, 1, 0.4] : [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: isThinking ? 0.6 : 3, ease: 'easeInOut' }}
      />

      {/* Main SVG face */}
      <motion.svg
        viewBox="0 0 200 240"
        style={{ width: '62%', height: '62%', filter: 'drop-shadow(0 0 20px rgba(255,32,64,0.5))' }}
        animate={{ y: isThinking ? [0, -3, 0] : [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: isThinking ? 0.4 : 5, ease: 'easeInOut' }}
      >
        <defs>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6080" />
            <stop offset="40%" stopColor="#ff2040" />
            <stop offset="100%" stopColor="#800010" stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="strongGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1a28" />
            <stop offset="50%" stopColor="#0d0d18" />
            <stop offset="100%" stopColor="#080810" />
          </linearGradient>
          <linearGradient id="plateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#222235" />
            <stop offset="100%" stopColor="#0a0a14" />
          </linearGradient>
        </defs>

        {/* Head outer shell */}
        <path
          d="M 40 20 L 160 20 L 185 65 L 178 155 L 155 210 L 100 230 L 45 210 L 22 155 L 15 65 Z"
          fill="url(#headGrad)"
          stroke="#2a2a40"
          strokeWidth="1.5"
        />

        {/* Inner face plate */}
        <path
          d="M 55 35 L 145 35 L 165 72 L 158 148 L 138 195 L 100 210 L 62 195 L 42 148 L 35 72 Z"
          fill="url(#plateGrad)"
          stroke="#1e1e30"
          strokeWidth="1"
        />

        {/* Brow ridge */}
        <path
          d="M 55 80 L 90 70 L 100 75 L 110 70 L 145 80 L 138 92 L 100 87 L 62 92 Z"
          fill="#0a0a14"
          stroke="#ff2040"
          strokeWidth="0.5"
          strokeOpacity="0.4"
        />

        {/* LEFT EYE */}
        <motion.g
          animate={{ opacity: isThinking ? [0.5, 1, 0.5] : [0.85, 1, 0.85] }}
          transition={{ repeat: Infinity, duration: isThinking ? 0.25 : 2.5, ease: 'easeInOut' }}
        >
          {/* Eye socket */}
          <ellipse cx="72" cy="105" rx="22" ry="10" fill="#05050a" />
          {/* Eye glow core */}
          <ellipse cx="72" cy="105" rx="18" ry="7" fill="url(#eyeGlow)" filter="url(#strongGlow)" />
          {/* Eye slit */}
          <rect x="54" y="102" width="36" height="6" rx="3" fill="#ff2040" filter="url(#strongGlow)" />
          {/* Eye highlight */}
          <rect x="58" y="103" width="14" height="2" rx="1" fill="#ff8080" opacity="0.8" />
        </motion.g>

        {/* RIGHT EYE */}
        <motion.g
          animate={{ opacity: isThinking ? [0.5, 1, 0.5] : [0.85, 1, 0.85] }}
          transition={{ repeat: Infinity, duration: isThinking ? 0.25 : 2.5, ease: 'easeInOut', delay: 0.15 }}
        >
          <ellipse cx="128" cy="105" rx="22" ry="10" fill="#05050a" />
          <ellipse cx="128" cy="105" rx="18" ry="7" fill="url(#eyeGlow)" filter="url(#strongGlow)" />
          <rect x="110" y="102" width="36" height="6" rx="3" fill="#ff2040" filter="url(#strongGlow)" />
          <rect x="118" y="103" width="14" height="2" rx="1" fill="#ff8080" opacity="0.8" />
        </motion.g>

        {/* Nose ridge */}
        <path d="M 95 115 L 100 140 L 105 115" fill="none" stroke="#1e1e30" strokeWidth="2" />

        {/* Cheekbone plates */}
        <path d="M 38 110 L 55 125 L 50 145 L 30 130 Z" fill="#111120" stroke="#1e1e30" strokeWidth="1" />
        <path d="M 162 110 L 145 125 L 150 145 L 170 130 Z" fill="#111120" stroke="#1e1e30" strokeWidth="1" />

        {/* Jaw seam lines */}
        <line x1="62" y1="155" x2="138" y2="155" stroke="#1e1e30" strokeWidth="1.5" />
        <line x1="55" y1="168" x2="145" y2="168" stroke="#1e1e30" strokeWidth="1" />

        {/* Mouth grill */}
        <motion.g
          animate={{ opacity: isThinking ? [0.3, 0.9, 0.3] : [0.5, 0.7, 0.5] }}
          transition={{ repeat: Infinity, duration: isThinking ? 0.3 : 2 }}
        >
          {[0, 7, 14, 21].map((offset) => (
            <line
              key={offset}
              x1="75"
              y1={158 + offset}
              x2="125"
              y2={158 + offset}
              stroke="#ff2040"
              strokeWidth="1.2"
              filter="url(#glow)"
            />
          ))}
        </motion.g>

        {/* Chin point */}
        <path d="M 80 200 L 100 228 L 120 200" fill="#0d0d18" stroke="#1e1e30" strokeWidth="1" />

        {/* Crown detail */}
        <path d="M 70 20 L 100 5 L 130 20" fill="#111120" stroke="#2a2a40" strokeWidth="1" />
        <motion.circle
          cx="100" cy="5" r="3"
          fill="#ff2040"
          filter="url(#glow)"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />

        {/* Temple details */}
        <line x1="20" y1="90" x2="38" y2="100" stroke="#1e1e30" strokeWidth="1.5" />
        <line x1="20" y1="100" x2="38" y2="108" stroke="#1e1e30" strokeWidth="1" />
        <line x1="180" y1="90" x2="162" y2="100" stroke="#1e1e30" strokeWidth="1.5" />
        <line x1="180" y1="100" x2="162" y2="108" stroke="#1e1e30" strokeWidth="1" />

        {/* Energy neck core */}
        <motion.rect
          x="88" y="210" width="24" height="14" rx="2"
          fill="#ff2040"
          filter="url(#strongGlow)"
          animate={{ opacity: isThinking ? [0.4, 1, 0.4] : [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: isThinking ? 0.4 : 1.5 }}
        />
      </motion.svg>

      {/* Scan line sweeping over the face */}
      {isThinking && (
        <motion.div
          className="absolute rounded-full overflow-hidden pointer-events-none"
          style={{ inset: '24px' }}
        >
          <motion.div
            className="absolute left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,32,64,0.8), transparent)' }}
            animate={{ top: ['20%', '80%', '20%'] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
        </motion.div>
      )}
    </div>
  );
}
