import React from 'react';
import { motion } from 'framer-motion';

interface UltronAvatarProps {
  isThinking?: boolean;
  size?: 'sm' | 'lg';
}

export function UltronAvatar({ isThinking = false, size = 'lg' }: UltronAvatarProps) {
  const dim = size === 'lg' ? 300 : 64;

  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: dim, height: dim }}>
      {/* Outer slow-rotating ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: '1px solid rgba(0,229,255,0.18)',
          boxShadow: '0 0 50px rgba(0,229,255,0.1), inset 0 0 50px rgba(0,229,255,0.04)',
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
      />
      {/* Inner counter ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: '10px',
          border: '1px solid transparent',
          borderTopColor: 'rgba(0,229,255,0.7)',
          borderRightColor: 'rgba(0,229,255,0.3)',
          borderBottomColor: 'rgba(120,80,255,0.2)',
        }}
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 7, ease: 'linear' }}
      />
      {/* Third pulsing ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ inset: '20px', border: '1px solid rgba(120,80,255,0.2)' }}
        animate={{ opacity: isThinking ? [0.2, 0.8, 0.2] : [0.15, 0.4, 0.15], scale: isThinking ? [1, 1.02, 1] : 1 }}
        transition={{ repeat: Infinity, duration: isThinking ? 0.7 : 3 }}
      />

      {/* Core ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: '28px',
          background: 'radial-gradient(circle, rgba(0,229,255,0.07) 0%, rgba(120,80,255,0.04) 60%, transparent 100%)',
        }}
        animate={{ opacity: isThinking ? [0.5, 1, 0.5] : [0.4, 0.7, 0.4] }}
        transition={{ repeat: Infinity, duration: isThinking ? 0.5 : 3.5 }}
      />

      {/* SVG Face */}
      <motion.svg
        viewBox="0 0 200 240"
        style={{
          width: '60%',
          height: '60%',
          filter: 'drop-shadow(0 0 18px rgba(0,229,255,0.45)) drop-shadow(0 0 40px rgba(0,180,255,0.2))',
        }}
        animate={{ y: isThinking ? [0, -4, 0] : [0, -7, 0] }}
        transition={{ repeat: Infinity, duration: isThinking ? 0.4 : 5, ease: 'easeInOut' }}
      >
        <defs>
          <radialGradient id="eyeGlowCyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#80ffff" />
            <stop offset="35%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#0060a0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="eyeGlowPurple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c080ff" />
            <stop offset="40%" stopColor="#8040ff" />
            <stop offset="100%" stopColor="#400080" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="headGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d1525" />
            <stop offset="50%" stopColor="#080e1e" />
            <stop offset="100%" stopColor="#050810" />
          </linearGradient>
          <linearGradient id="plateGradCyan" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#111c35" />
            <stop offset="100%" stopColor="#070b18" />
          </linearGradient>
          <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="cyanGlowStrong" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Head shell */}
        <path d="M 40 20 L 160 20 L 185 65 L 178 155 L 155 210 L 100 230 L 45 210 L 22 155 L 15 65 Z"
          fill="url(#headGradCyan)" stroke="#1a2840" strokeWidth="1.5" />

        {/* Inner face plate */}
        <path d="M 55 35 L 145 35 L 165 72 L 158 148 L 138 195 L 100 210 L 62 195 L 42 148 L 35 72 Z"
          fill="url(#plateGradCyan)" stroke="#0e1e38" strokeWidth="1" />

        {/* Brow ridge */}
        <path d="M 55 80 L 90 70 L 100 75 L 110 70 L 145 80 L 138 92 L 100 87 L 62 92 Z"
          fill="#060c1a" stroke="#00e5ff" strokeWidth="0.4" strokeOpacity="0.35" />

        {/* LEFT EYE */}
        <motion.g
          animate={{ opacity: isThinking ? [0.4, 1, 0.4] : [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: isThinking ? 0.22 : 2.5, ease: 'easeInOut' }}
        >
          <ellipse cx="72" cy="105" rx="22" ry="10" fill="#020510" />
          <ellipse cx="72" cy="105" rx="18" ry="7" fill="url(#eyeGlowCyan)" filter="url(#cyanGlowStrong)" />
          <rect x="54" y="102" width="36" height="6" rx="3" fill="#00e5ff" filter="url(#cyanGlowStrong)" />
          <rect x="58" y="103" width="12" height="2" rx="1" fill="#ffffff" opacity="0.75" />
        </motion.g>

        {/* RIGHT EYE */}
        <motion.g
          animate={{ opacity: isThinking ? [0.4, 1, 0.4] : [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: isThinking ? 0.22 : 2.5, ease: 'easeInOut', delay: 0.12 }}
        >
          <ellipse cx="128" cy="105" rx="22" ry="10" fill="#020510" />
          <ellipse cx="128" cy="105" rx="18" ry="7" fill="url(#eyeGlowCyan)" filter="url(#cyanGlowStrong)" />
          <rect x="110" y="102" width="36" height="6" rx="3" fill="#00e5ff" filter="url(#cyanGlowStrong)" />
          <rect x="116" y="103" width="12" height="2" rx="1" fill="#ffffff" opacity="0.75" />
        </motion.g>

        {/* Nose ridge */}
        <path d="M 95 115 L 100 140 L 105 115" fill="none" stroke="#0e1e38" strokeWidth="2" />

        {/* Cheekbone panels */}
        <path d="M 38 110 L 55 125 L 50 145 L 30 130 Z" fill="#0a1228" stroke="#0e1e38" strokeWidth="1" />
        <path d="M 162 110 L 145 125 L 150 145 L 170 130 Z" fill="#0a1228" stroke="#0e1e38" strokeWidth="1" />

        {/* Panel seam lines */}
        <line x1="62" y1="155" x2="138" y2="155" stroke="#0e1e38" strokeWidth="1.5" />
        <line x1="55" y1="168" x2="145" y2="168" stroke="#0e1e38" strokeWidth="1" />

        {/* Mouth grill — purple tinted */}
        <motion.g
          animate={{ opacity: isThinking ? [0.25, 0.85, 0.25] : [0.4, 0.65, 0.4] }}
          transition={{ repeat: Infinity, duration: isThinking ? 0.28 : 2 }}
        >
          {[0, 7, 14, 21].map((offset) => (
            <line key={offset}
              x1="75" y1={158 + offset} x2="125" y2={158 + offset}
              stroke="#7850ff" strokeWidth="1.2" filter="url(#cyanGlow)"
            />
          ))}
        </motion.g>

        {/* Chin */}
        <path d="M 80 200 L 100 228 L 120 200" fill="#080e1e" stroke="#0e1e38" strokeWidth="1" />

        {/* Crown */}
        <path d="M 70 20 L 100 5 L 130 20" fill="#0d1525" stroke="#1a2840" strokeWidth="1" />
        <motion.circle cx="100" cy="5" r="3.5"
          fill="#00e5ff" filter="url(#cyanGlow)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
        />

        {/* Temple details */}
        <line x1="20" y1="90" x2="38" y2="100" stroke="#0e1e38" strokeWidth="1.5" />
        <line x1="20" y1="100" x2="38" y2="108" stroke="#0e1e38" strokeWidth="1" />
        <line x1="180" y1="90" x2="162" y2="100" stroke="#0e1e38" strokeWidth="1.5" />
        <line x1="180" y1="100" x2="162" y2="108" stroke="#0e1e38" strokeWidth="1" />

        {/* Energy core — cyan */}
        <motion.rect x="88" y="210" width="24" height="14" rx="2"
          fill="#00e5ff" filter="url(#cyanGlowStrong)"
          animate={{ opacity: isThinking ? [0.3, 1, 0.3] : [0.25, 0.7, 0.25] }}
          transition={{ repeat: Infinity, duration: isThinking ? 0.35 : 1.6 }}
        />

        {/* Side circuit lines */}
        <motion.g animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}>
          <path d="M 22 65 L 35 65 L 35 75" fill="none" stroke="#00e5ff" strokeWidth="0.8" filter="url(#cyanGlow)" />
          <path d="M 178 65 L 165 65 L 165 75" fill="none" stroke="#00e5ff" strokeWidth="0.8" filter="url(#cyanGlow)" />
        </motion.g>
      </motion.svg>

      {/* Thinking scan line */}
      {isThinking && (
        <motion.div className="absolute rounded-full overflow-hidden pointer-events-none" style={{ inset: '28px' }}>
          <motion.div
            className="absolute left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.9), transparent)' }}
            animate={{ top: ['15%', '85%', '15%'] }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
        </motion.div>
      )}
    </div>
  );
}
