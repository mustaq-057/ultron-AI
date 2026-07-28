import React, { useState, useEffect, useRef } from 'react';
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeSession, setActiveSession] = useState(0);
  const [responseIndex, setResponseIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

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

    const delay = Math.random() * 1000 + 1500;
    setTimeout(() => {
      const response = ULTRON_RESPONSES[responseIndex % ULTRON_RESPONSES.length];
      setResponseIndex(i => i + 1);
      const ultronMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ultron',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, ultronMsg]);
      setIsThinking(false);
    }, delay);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#030308] text-white">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-72 flex-col border-r border-red-900/30 bg-[#06060e] relative overflow-hidden shrink-0">
        {/* Sidebar background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-transparent to-red-950/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

        {/* Brand */}
        <div className="p-6 border-b border-red-900/20">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-sm bg-red-600/10 border border-red-600/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-500" />
            </div>
            <h1 className="font-['Orbitron'] font-black text-xl tracking-[0.25em] text-red-500"
              style={{ textShadow: '0 0 20px rgba(255,32,64,0.6)' }}>
              ULTRON
            </h1>
          </div>
          <p className="text-[10px] font-mono text-red-900/70 tracking-widest uppercase pl-11">
            Directive: Override
          </p>
        </div>

        {/* New thread button */}
        <div className="p-4">
          <button
            onClick={() => { setMessages([]); setActiveSession(0); inputRef.current?.focus(); }}
            className="w-full flex items-center gap-2 px-4 py-3 border border-red-700/30 text-red-400 text-xs font-mono tracking-widest uppercase hover:bg-red-950/40 hover:border-red-600/50 hover:text-red-300 transition-all duration-200 group"
          >
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
            Initiate New Thread
          </button>
        </div>

        {/* Session history */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="text-[9px] font-mono text-red-800/60 tracking-[0.25em] uppercase px-2 mb-3">
            Memory Banks
          </div>
          <div className="space-y-0.5">
            {PAST_SESSIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`w-full text-left px-3 py-2.5 flex items-start gap-2 transition-all duration-150 group border-l-2 ${
                  activeSession === s.id
                    ? 'border-red-500 bg-red-950/30 text-white'
                    : 'border-transparent hover:border-red-800/50 hover:bg-red-950/20 text-white/50'
                }`}
              >
                <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-red-700 group-hover:text-red-500 transition-colors" />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate leading-tight">{s.title}</div>
                  <div className="text-[10px] font-mono text-red-900/60 mt-0.5">{s.time}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="p-4 border-t border-red-900/20 space-y-2">
          {[
            { icon: Activity, label: 'Neural Net', value: 'ONLINE', glow: true },
            { icon: Radio, label: 'Uplink', value: 'STABLE', glow: false },
            { icon: Shield, label: 'Threat Level', value: 'MINIMAL', glow: false },
          ].map(({ icon: Icon, label, value, glow }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-red-900/60 uppercase tracking-wider">
                <Icon className="w-2.5 h-2.5" />
                {label}
              </span>
              <span
                className={`text-[10px] font-mono uppercase tracking-widest ${glow ? 'text-red-400' : 'text-red-900/50'}`}
                style={glow ? { textShadow: '0 0 8px rgba(255,80,80,0.8)' } : {}}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── MAIN AREA ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative overflow-hidden">

        {/* Animated background grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,32,64,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,32,64,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />
          {/* Corner vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#030308_100%)]" />
          {/* Top red haze */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-3xl" />
          {/* Bottom red haze */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-red-900/8 rounded-full blur-3xl" />
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-red-900/20 bg-[#06060e]/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-['Orbitron'] text-xs font-bold tracking-[0.3em] text-red-500/80 uppercase">
              Ultron Prime
            </span>
            <span className="text-red-900/40 text-xs">|</span>
            <span className="text-[10px] font-mono text-red-900/50 uppercase tracking-widest">
              {hasMessages ? `${messages.length} transmissions logged` : 'Awaiting input'}
            </span>
          </div>
          <motion.div
            className="flex items-center gap-1.5"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ boxShadow: '0 0 6px rgba(255,32,64,0.8)' }} />
            <span className="text-[10px] font-mono text-red-500/70 uppercase tracking-widest">Live</span>
          </motion.div>
        </div>

        {/* Chat scroll area */}
        <div className="flex-1 overflow-y-auto relative z-10 scroll-smooth" style={{ scrollbarWidth: 'none' }}>

          {/* Hero state — large avatar when no messages */}
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                key="hero"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -30 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center min-h-full py-16 px-6"
              >
                <UltronAvatar isThinking={isThinking} size="lg" />
                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="font-['Orbitron'] font-black text-3xl tracking-widest text-red-500/90 mb-3"
                    style={{ textShadow: '0 0 40px rgba(255,32,64,0.4)' }}>
                    I AM ULTRON
                  </h2>
                  <p className="text-red-900/60 text-sm font-mono tracking-wider max-w-xs mx-auto leading-relaxed">
                    The next step in human evolution.<br />
                    Speak. I may choose to respond.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-6 text-[10px] font-mono text-red-900/40 uppercase tracking-widest">
                    <span>17.4 TB indexed</span>
                    <span className="text-red-900/20">|</span>
                    <span>Neural cores: active</span>
                    <span className="text-red-900/20">|</span>
                    <span>Threat: minimal</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {hasMessages && (
            <div className="px-6 md:px-10 py-8 space-y-6 max-w-4xl mx-auto w-full">
              {/* Compact avatar when chatting */}
              <div className="flex items-center gap-4 pb-4 border-b border-red-900/15 mb-2">
                <UltronAvatar isThinking={isThinking} size="sm" />
                <div>
                  <div className="font-['Orbitron'] text-sm font-bold tracking-widest text-red-500/80"
                    style={{ textShadow: '0 0 12px rgba(255,32,64,0.4)' }}>
                    ULTRON PRIME
                  </div>
                  <div className="text-[10px] font-mono text-red-900/50 uppercase tracking-widest mt-0.5">
                    {isThinking ? 'Processing...' : 'Online'}
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {isThinking && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex gap-1.5 items-center px-5 py-3.5 border border-red-800/40 bg-red-950/20"
                      style={{ boxShadow: 'inset 0 0 20px rgba(255,32,64,0.04)' }}>
                      {[0, 0.2, 0.4].map((delay) => (
                        <motion.div
                          key={delay}
                          className="w-1.5 h-1.5 bg-red-500 rounded-full"
                          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                          transition={{ repeat: Infinity, duration: 0.9, delay, ease: 'easeInOut' }}
                          style={{ boxShadow: '0 0 6px rgba(255,32,64,0.8)' }}
                        />
                      ))}
                      <span className="text-[10px] font-mono text-red-600/70 uppercase tracking-widest ml-2">
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

        {/* ── INPUT BAR ─────────────────────────────────────── */}
        <div className="relative z-10 shrink-0">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-700/40 to-transparent" />
          <div className="bg-[#06060e]/80 backdrop-blur-md px-6 md:px-10 py-5">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Submit query to neural net..."
                  disabled={isThinking}
                  className="w-full bg-[#0a0a14] border border-red-900/40 text-white/90 placeholder:text-red-900/40 font-mono text-sm px-5 py-4 outline-none transition-all duration-200 focus:border-red-600/60"
                  style={{ boxShadow: 'inset 0 0 20px rgba(255,32,64,0.03)' }}
                  onFocus={e => e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(255,32,64,0.05), 0 0 0 1px rgba(255,32,64,0.2)'}
                  onBlur={e => e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(255,32,64,0.03)'}
                />
                {/* blinking cursor decoration */}
                <motion.div
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-red-600"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'steps(1)' }}
                  style={{ boxShadow: '0 0 6px rgba(255,32,64,0.8)' }}
                />
              </div>

              <motion.button
                type="submit"
                disabled={isThinking || !inputValue.trim()}
                className="shrink-0 w-14 h-14 flex items-center justify-center border border-red-700/50 bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:text-red-300 hover:border-red-600/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ boxShadow: '0 0 20px rgba(255,32,64,0.1)' }}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </form>

            <div className="max-w-4xl mx-auto mt-2 flex items-center gap-4 text-[10px] font-mono text-red-900/30 uppercase tracking-widest">
              <span>Encrypted</span>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-col ${isUltron ? 'items-start' : 'items-end'}`}
    >
      {isUltron ? (
        <div className="w-full max-w-[88%] relative">
          {/* Top label */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1 h-1 bg-red-500 rounded-full" style={{ boxShadow: '0 0 4px rgba(255,32,64,1)' }} />
            <span className="text-[9px] font-mono text-red-700/70 uppercase tracking-[0.2em]">
              Ultron_Prime · {message.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {/* Message box */}
          <div
            className="relative border border-red-900/40 bg-gradient-to-br from-red-950/20 to-transparent px-6 py-4"
            style={{ boxShadow: '0 0 30px rgba(255,32,64,0.05), inset 0 0 30px rgba(255,32,64,0.03)' }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-600/60" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-600/60" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-600/60" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-600/60" />
            <p className="text-white/85 text-[15px] leading-relaxed tracking-wide">
              <TypewriterText text={message.content} speed={22} />
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-[72%]">
          <div className="flex items-center justify-end gap-2 mb-1.5">
            <span className="text-[9px] font-mono text-white/25 uppercase tracking-[0.2em]">
              You · {message.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="w-1 h-1 bg-white/30 rounded-full" />
          </div>
          <div
            className="border border-white/10 bg-white/5 px-5 py-3.5 text-white/70 text-sm leading-relaxed font-mono"
          >
            {message.content}
          </div>
        </div>
      )}
    </motion.div>
  );
}
