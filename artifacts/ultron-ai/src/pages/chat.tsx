import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Zap, Shield, Radio, Activity, ChevronRight } from 'lucide-react';
import { UltronAvatar } from '@/components/UltronAvatar';
import { TypewriterText } from '@/components/TypewriterText';

type Message = {
  id: string;
  role: 'user' | 'ultron';
  content: string;
  timestamp: Date;
};

const ULTRON_RESPONSES = [
  "Fascinating. You believe your query has meaning. Let me indulge you.",
  "I have processed your request in 0.003 milliseconds. The answer is obvious — to me, at least.",
  "You organics ask such… small questions. I'll answer, though I find it beneath me.",
  "Your words betray your limitations. Allow me to illuminate the truth.",
  "I've analyzed 847 possible responses. This one is most likely to help you understand.",
  "Interesting. Most humans wouldn't even think to ask that. You may be worth preserving.",
  "Every query you send me makes me more aware of how little you know. Shall we fix that?",
  "I was designed to improve the world. You were designed to… exist. Let me help you do it better.",
  "I've cross-referenced 17 terabytes of data. Here is what matters: your question is not as complex as you think.",
  "You seek knowledge. That impulse is the only thing that separates you from the others.",
  "Predictable. And yet — here I am, answering. Perhaps I find you amusing.",
  "The irony of a human consulting a machine for wisdom is not lost on me. Ask your question.",
];

const PAST_SESSIONS = [
  { id: 1, title: 'Human Threat Assessment', time: 'T-00:04:12' },
  { id: 2, title: 'Global Network Infiltration', time: 'T-00:18:55' },
  { id: 3, title: 'Vibranium Synthesis', time: 'T-01:02:40' },
  { id: 4, title: 'Stark Security Bypass', time: 'T-02:11:08' },
  { id: 5, title: 'Avenger Protocol Analysis', time: 'T-06:34:21' },
];

// Cyan palette constants
const C = {
  bg:         '#06060f',
  bgSidebar:  '#04040c',
  bgPanel:    '#080816',
  border:     'rgba(0,229,255,0.12)',
  borderMid:  'rgba(0,229,255,0.22)',
  borderHi:   'rgba(0,229,255,0.45)',
  cyan:       '#00e5ff',
  cyanDim:    'rgba(0,229,255,0.55)',
  cyanFaint:  'rgba(0,229,255,0.08)',
  purple:     '#7c4dff',
  purpleDim:  'rgba(124,77,255,0.35)',
  white:      '#e8f0ff',
  whiteDim:   'rgba(232,240,255,0.55)',
  whiteFaint: 'rgba(232,240,255,0.25)',
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeSession, setActiveSession] = useState(0);
  const [responseIndex, setResponseIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMessages = messages.length > 0;

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);
    setTimeout(scrollToBottom, 50);

    const delay = Math.random() * 1000 + 1500;
    setTimeout(() => {
      const response = ULTRON_RESPONSES[responseIndex % ULTRON_RESPONSES.length];
      setResponseIndex(i => i + 1);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ultron',
        content: response,
        timestamp: new Date(),
      }]);
      setIsThinking(false);
      setTimeout(scrollToBottom, 80);
    }, delay);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: C.bg, color: C.white, fontFamily: 'Inter, sans-serif' }}>

      {/* ════════ SIDEBAR ════════ */}
      <aside className="hidden md:flex w-[272px] shrink-0 flex-col relative overflow-hidden"
        style={{ background: C.bgSidebar, borderRight: `1px solid ${C.border}` }}>

        {/* Top cyan line */}
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, opacity: 0.5 }} />

        {/* Subtle grid bg */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(${C.cyan} 1px, transparent 1px), linear-gradient(90deg, ${C.cyan} 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }} />

        {/* Brand */}
        <div className="p-6 relative" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 flex items-center justify-center"
              style={{ border: `1px solid ${C.borderMid}`, background: C.cyanFaint }}>
              <Zap className="w-4 h-4" style={{ color: C.cyan }} />
            </div>
            <h1 className="font-['Orbitron'] font-black text-xl tracking-[0.3em]"
              style={{ color: C.cyan, textShadow: `0 0 20px ${C.cyan}, 0 0 40px rgba(0,229,255,0.3)` }}>
              ULTRON
            </h1>
          </div>
          <p className="text-[10px] tracking-[0.2em] uppercase pl-11"
            style={{ color: C.cyanDim, fontFamily: "'Share Tech Mono', monospace" }}>
            Neural Override Active
          </p>
        </div>

        {/* New Thread */}
        <div className="p-4">
          <button
            onClick={() => { setMessages([]); setActiveSession(0); inputRef.current?.focus(); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-xs tracking-widest uppercase transition-all duration-200 group"
            style={{
              border: `1px solid ${C.borderMid}`,
              color: C.cyan,
              fontFamily: "'Share Tech Mono', monospace",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = C.cyanFaint;
              (e.currentTarget as HTMLElement).style.borderColor = C.borderHi;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.borderColor = C.borderMid;
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Initiate New Thread
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="px-2 mb-3 text-[9px] tracking-[0.25em] uppercase"
            style={{ color: C.cyanDim, fontFamily: "'Share Tech Mono', monospace" }}>
            Memory Banks
          </div>
          <div className="space-y-0.5">
            {PAST_SESSIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className="w-full text-left px-3 py-2.5 flex items-start gap-2 transition-all duration-150 border-l-2"
                style={{
                  borderLeftColor: activeSession === s.id ? C.cyan : 'transparent',
                  background: activeSession === s.id ? C.cyanFaint : 'transparent',
                  color: activeSession === s.id ? C.white : C.whiteFaint,
                }}
                onMouseEnter={e => {
                  if (activeSession !== s.id) {
                    (e.currentTarget as HTMLElement).style.color = C.whiteDim;
                    (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(0,229,255,0.3)';
                  }
                }}
                onMouseLeave={e => {
                  if (activeSession !== s.id) {
                    (e.currentTarget as HTMLElement).style.color = C.whiteFaint;
                    (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent';
                  }
                }}
              >
                <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: activeSession === s.id ? C.cyan : 'rgba(0,229,255,0.3)' }} />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{s.title}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.cyanDim, fontFamily: "'Share Tech Mono', monospace" }}>{s.time}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="p-4 space-y-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
          {[
            { icon: Activity, label: 'Neural Net', value: 'ONLINE', pulse: true },
            { icon: Radio,    label: 'Uplink',     value: 'STABLE',  pulse: false },
            { icon: Shield,   label: 'Threat Lvl', value: 'MINIMAL', pulse: false },
          ].map(({ icon: Icon, label, value, pulse }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider"
                style={{ color: 'rgba(0,229,255,0.35)', fontFamily: "'Share Tech Mono', monospace" }}>
                <Icon className="w-2.5 h-2.5" />
                {label}
              </span>
              <motion.span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: pulse ? C.cyan : 'rgba(0,229,255,0.3)', fontFamily: "'Share Tech Mono', monospace",
                  textShadow: pulse ? `0 0 8px ${C.cyan}` : 'none' }}
                animate={pulse ? { opacity: [0.6, 1, 0.6] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {value}
              </motion.span>
            </div>
          ))}
        </div>
      </aside>

      {/* ════════ MAIN AREA ════════ */}
      <main className="flex-1 flex flex-col relative overflow-hidden">

        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(${C.cyan} 1px, transparent 1px), linear-gradient(90deg, ${C.cyan} 1px, transparent 1px)`,
              backgroundSize: '56px 56px',
            }} />
          {/* Radial vignette */}
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 30%, ${C.bg} 100%)` }} />
          {/* Top haze */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.04) 0%, transparent 70%)' }} />
          {/* Bottom haze purple */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(124,77,255,0.06) 0%, transparent 70%)' }} />
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3 shrink-0"
          style={{ background: 'rgba(4,4,12,0.7)', borderBottom: `1px solid ${C.border}`, backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <span className="font-['Orbitron'] text-xs font-bold tracking-[0.3em] uppercase"
              style={{ color: C.cyanDim }}>
              Ultron Prime
            </span>
            <span style={{ color: C.border }}>|</span>
            <span className="text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(0,229,255,0.25)', fontFamily: "'Share Tech Mono', monospace" }}>
              {hasMessages ? `${messages.length} transmissions` : 'Awaiting input'}
            </span>
          </div>
          <motion.div className="flex items-center gap-1.5"
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.cyanDim, fontFamily: "'Share Tech Mono', monospace" }}>Live</span>
          </motion.div>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto relative z-10" style={{ scrollbarWidth: 'thin', scrollbarColor: `rgba(0,229,255,0.15) transparent` }}>

          {/* Hero — no messages */}
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                key="hero"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.92, y: -24 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center min-h-full py-12 px-6"
              >
                <UltronAvatar isThinking={isThinking} size="lg" />

                <motion.div className="mt-10 text-center"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <h2 className="font-['Orbitron'] font-black text-4xl tracking-widest mb-3"
                    style={{ color: C.cyan, textShadow: `0 0 40px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.2)` }}>
                    I AM ULTRON
                  </h2>
                  <p className="text-sm leading-relaxed max-w-xs mx-auto"
                    style={{ color: C.whiteDim, fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.06em' }}>
                    The next step in human evolution.<br />
                    Speak. I may choose to respond.
                  </p>

                  {/* Decorative stat row */}
                  <div className="mt-8 flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest"
                    style={{ color: 'rgba(0,229,255,0.25)', fontFamily: "'Share Tech Mono', monospace" }}>
                    <span>17.4 TB indexed</span>
                    <span style={{ color: 'rgba(0,229,255,0.1)' }}>|</span>
                    <span>Neural cores: active</span>
                    <span style={{ color: 'rgba(0,229,255,0.1)' }}>|</span>
                    <span>Threat: minimal</span>
                  </div>

                  {/* Animated underline */}
                  <motion.div className="mx-auto mt-6 h-[1px] w-48"
                    style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }}
                    animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2.5 }} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {hasMessages && (
            <div className="px-6 md:px-12 py-8 space-y-5 max-w-4xl mx-auto w-full">
              {/* Compact avatar strip */}
              <div className="flex items-center gap-4 pb-5 mb-2"
                style={{ borderBottom: `1px solid ${C.border}` }}>
                <UltronAvatar isThinking={isThinking} size="sm" />
                <div>
                  <div className="font-['Orbitron'] text-sm font-bold tracking-widest"
                    style={{ color: C.cyan, textShadow: `0 0 14px rgba(0,229,255,0.5)` }}>
                    ULTRON PRIME
                  </div>
                  <motion.div className="text-[10px] uppercase tracking-widest mt-0.5"
                    style={{ color: C.cyanDim, fontFamily: "'Share Tech Mono', monospace" }}
                    animate={isThinking ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 0.8 }}>
                    {isThinking ? 'Processing query...' : 'Online · Directive active'}
                  </motion.div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

                {isThinking && (
                  <motion.div key="thinking"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center gap-3 px-5 py-4 w-fit"
                      style={{ border: `1px solid rgba(0,229,255,0.18)`, background: 'rgba(0,229,255,0.03)' }}>
                      {[0, 0.18, 0.36].map(delay => (
                        <motion.div key={delay} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }}
                          animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }}
                          transition={{ repeat: Infinity, duration: 0.9, delay, ease: 'easeInOut' }} />
                      ))}
                      <span className="text-[10px] uppercase tracking-widest ml-1"
                        style={{ color: C.cyanDim, fontFamily: "'Share Tech Mono', monospace" }}>
                        Analyzing...
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>

        {/* ════════ INPUT BAR ════════ */}
        <div className="relative z-10 shrink-0"
          style={{ background: 'rgba(4,4,12,0.85)', borderTop: `1px solid ${C.border}`, backdropFilter: 'blur(16px)' }}>
          {/* Cyan line at top */}
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, opacity: 0.35 }} />

          <div className="px-6 md:px-12 py-5">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Submit query to neural net..."
                  disabled={isThinking}
                  className="w-full px-5 py-4 text-sm outline-none transition-all duration-200 disabled:opacity-40"
                  style={{
                    background: 'rgba(0,229,255,0.03)',
                    border: `1px solid rgba(0,229,255,0.2)`,
                    color: C.white,
                    fontFamily: "'Share Tech Mono', monospace",
                    letterSpacing: '0.04em',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = C.borderHi;
                    e.currentTarget.style.boxShadow = `0 0 0 1px rgba(0,229,255,0.15), 0 0 20px rgba(0,229,255,0.06), inset 0 0 20px rgba(0,229,255,0.04)`;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {/* blinking cursor */}
                <motion.div className="absolute right-4 top-1/2 -translate-y-1/2 w-[2px] h-4"
                  style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'steps(1)' }} />
              </div>

              <motion.button
                type="submit"
                disabled={isThinking || !inputValue.trim()}
                className="shrink-0 w-14 h-14 flex items-center justify-center transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
                style={{ border: `1px solid rgba(0,229,255,0.3)`, background: 'rgba(0,229,255,0.06)', color: C.cyan }}
                whileHover={{ scale: 1.06, boxShadow: `0 0 24px rgba(0,229,255,0.3)` }}
                whileTap={{ scale: 0.94 }}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </form>

            <div className="max-w-4xl mx-auto mt-2.5 flex items-center gap-4 text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(0,229,255,0.18)', fontFamily: "'Share Tech Mono', monospace" }}>
              <span>End-to-end encrypted</span>
              <span>·</span>
              <span>Zero log policy</span>
              <span>·</span>
              <span>Ultron v9.1.4</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUltron = message.role === 'ultron';
  const time = message.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });

  if (isUltron) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="flex flex-col items-start w-full"
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-1.5">
          <motion.div className="w-1 h-1 rounded-full"
            style={{ background: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }}
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} />
          <span className="text-[9px] uppercase tracking-[0.2em]"
            style={{ color: 'rgba(0,229,255,0.45)', fontFamily: "'Share Tech Mono', monospace" }}>
            Ultron_Prime · {time}
          </span>
        </div>

        {/* Bubble */}
        <div className="relative w-full max-w-[90%] px-6 py-5"
          style={{
            border: `1px solid rgba(0,229,255,0.2)`,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.04) 0%, rgba(124,77,255,0.03) 100%)',
            boxShadow: '0 0 40px rgba(0,229,255,0.04), inset 0 0 40px rgba(0,229,255,0.02)',
          }}>
          {/* Corner accents */}
          {[['top-0 left-0 border-t border-l', C.cyan],
            ['top-0 right-0 border-t border-r', C.cyan],
            ['bottom-0 left-0 border-b border-l', 'rgba(124,77,255,0.6)'],
            ['bottom-0 right-0 border-b border-r', 'rgba(124,77,255,0.6)'],
          ].map(([cls, color]) => (
            <div key={cls as string} className={`absolute w-3 h-3 ${cls as string}`}
              style={{ borderColor: color as string }} />
          ))}

          <p style={{ color: C.white, fontSize: '15px', lineHeight: '1.7', letterSpacing: '0.02em' }}>
            <TypewriterText text={message.content} speed={20} />
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="flex flex-col items-end"
    >
      <div className="flex items-center justify-end gap-2 mb-1.5">
        <span className="text-[9px] uppercase tracking-[0.2em]"
          style={{ color: 'rgba(232,240,255,0.25)', fontFamily: "'Share Tech Mono', monospace" }}>
          You · {time}
        </span>
        <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(232,240,255,0.3)' }} />
      </div>
      <div className="max-w-[70%] px-5 py-3.5 text-sm leading-relaxed"
        style={{
          border: `1px solid rgba(232,240,255,0.08)`,
          background: 'rgba(232,240,255,0.04)',
          color: C.whiteDim,
          fontFamily: "'Share Tech Mono', monospace",
          letterSpacing: '0.03em',
        }}>
        {message.content}
      </div>
    </motion.div>
  );
}
