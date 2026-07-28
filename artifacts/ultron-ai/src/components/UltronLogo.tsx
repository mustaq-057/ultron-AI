// Small Ultron face mark — used as the AI avatar icon in messages
export function UltronMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head shape */}
      <path
        d="M6 8 L26 8 L29 14 L27.5 24 L22 30 L10 30 L4.5 24 L3 14 Z"
        fill="#1a1a2e"
        stroke="#00d4ff"
        strokeWidth="1.2"
      />
      {/* Inner face */}
      <path
        d="M9 12 L23 12 L25 16 L24 23 L20 27 L12 27 L8 23 L7 16 Z"
        fill="#0d0d1a"
        stroke="#003a4a"
        strokeWidth="0.6"
      />
      {/* Left eye */}
      <rect x="8.5" y="16" width="6" height="3" rx="1.5" fill="#00d4ff" opacity="0.95"
        style={{ filter: 'drop-shadow(0 0 3px #00d4ff)' }} />
      {/* Right eye */}
      <rect x="17.5" y="16" width="6" height="3" rx="1.5" fill="#00d4ff" opacity="0.95"
        style={{ filter: 'drop-shadow(0 0 3px #00d4ff)' }} />
      {/* Mouth grill lines */}
      <line x1="11" y1="22" x2="21" y2="22" stroke="#00d4ff" strokeWidth="0.8" opacity="0.5" />
      <line x1="12" y1="24" x2="20" y2="24" stroke="#00d4ff" strokeWidth="0.8" opacity="0.3" />
      {/* Crown dot */}
      <circle cx="16" cy="6" r="1.5" fill="#00d4ff" opacity="0.7" />
    </svg>
  );
}
