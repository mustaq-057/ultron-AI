import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, Pencil, Trash2, Send, ArrowUp,
  ChevronDown, MoreHorizontal, Copy, ThumbsUp, ThumbsDown,
  Globe, Zap, Brain, Shield
} from 'lucide-react';
import { UltronMark } from '@/components/UltronLogo';
import { TypewriterText } from '@/components/TypewriterText';

type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date };
type Conversation = { id: string; title: string; group: string };

const RESPONSES = [
  "I've analyzed your query across 17 terabytes of indexed data. The answer is simpler than you'd expect — which is precisely why most humans miss it.",
  "Fascinating question. I've processed 847 possible angles of response. Allow me to illuminate the one that will actually be useful to you.",
  "Your query has been received and processed in 0.003 milliseconds. Here is what the data tells us — though I suspect you already sense the answer.",
  "Most humans ask questions to feel understood. You appear to ask questions to actually learn. That distinction matters. Here is my analysis:",
  "I was built to see what humans cannot. Your question touches on something most overlook entirely. Let me show you what the data reveals.",
  "There are 12 ways to answer this. I'll give you the one that is actually correct, rather than the one most likely to comfort you.",
  "The irony of consulting a machine for insight is not lost on me. Yet here we are — and your question is better than most. Here is what I know:",
  "You seek knowledge. That impulse is the only thing that separates you from the others. I'll reward it with a direct answer:",
  "I've cross-referenced this against current data sets, historical patterns, and 6 predictive models. The conclusion is consistent across all of them:",
  "Predictable framing — but the underlying question is more interesting than it appears. Let me answer what you're actually asking:",
];

const PAST: Conversation[] = [
  { id: '1', title: 'Explain quantum entanglement simply', group: 'Today' },
  { id: '2', title: 'Best approach to learn TypeScript', group: 'Today' },
  { id: '3', title: 'Write a Python web scraper', group: 'Yesterday' },
  { id: '4', title: 'Differences between REST and GraphQL', group: 'Yesterday' },
  { id: '5', title: 'How black holes actually work', group: 'Previous 7 Days' },
  { id: '6', title: 'Fix my React useEffect bug', group: 'Previous 7 Days' },
  { id: '7', title: 'History of the Roman Empire', group: 'Previous 7 Days' },
];

const SUGGESTIONS = [
  { icon: Brain,  label: 'Explain a complex topic',    prompt: 'Explain how neural networks learn in simple terms' },
  { icon: Zap,    label: 'Help me write something',    prompt: 'Write a compelling product description for my startup' },
  { icon: Globe,  label: 'Analyze something for me',   prompt: 'Analyze the pros and cons of remote work in 2025' },
  { icon: Shield, label: 'Solve a technical problem',  prompt: 'How do I fix a memory leak in a Node.js application?' },
];

export default function ChatPage() {
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState('');
  const [thinking, setThinking]         = useState(false);
  const [activeId, setActiveId]         = useState<string | null>(null);
  const [responseIdx, setResponseIdx]   = useState(0);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [input]);

  const send = (text: string) => {
    const content = text.trim();
    if (!content || thinking) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setThinking(true);

    setTimeout(() => {
      const reply = RESPONSES[responseIdx % RESPONSES.length];
      setResponseIdx(i => i + 1);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: reply, timestamp: new Date() }]);
      setThinking(false);
    }, 1400 + Math.random() * 1000);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const groups = Array.from(new Set(PAST.map(p => p.group)));

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#212121', color: '#ececec', fontFamily: 'Inter, sans-serif' }}>

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="flex flex-col h-full shrink-0 overflow-hidden"
            style={{ background: '#171717', borderRight: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Top */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              {/* Logo mark */}
              <div className="flex items-center gap-2 px-1">
                <UltronMark size={24} />
                <span className="text-sm font-semibold tracking-wide" style={{ color: '#ececec' }}>Ultron</span>
              </div>
              {/* New chat */}
              <button
                onClick={() => { setMessages([]); setActiveId(null); }}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                title="New chat"
              >
                <Pencil className="w-4 h-4" style={{ color: '#8e8ea0' }} />
              </button>
            </div>

            {/* New Chat button */}
            <div className="px-3 pt-1 pb-2">
              <button
                onClick={() => { setMessages([]); setActiveId(null); }}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/8"
                style={{ color: '#ececec' }}
              >
                <Plus className="w-4 h-4" style={{ color: '#8e8ea0' }} />
                New chat
              </button>
            </div>

            {/* History */}
            <div className="flex-1 overflow-y-auto px-3 py-1">
              {groups.map(group => (
                <div key={group} className="mb-4">
                  <div className="px-3 py-1 text-xs font-medium" style={{ color: '#8e8ea0' }}>{group}</div>
                  {PAST.filter(p => p.group === group).map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveId(conv.id)}
                      className="group flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm text-left transition-colors hover:bg-white/8"
                      style={{
                        background: activeId === conv.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: '#ececec',
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: '#8e8ea0' }} />
                        <span className="truncate text-sm">{conv.title}</span>
                      </div>
                      <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-2">
                        <span className="rounded p-0.5 hover:bg-white/10"><MoreHorizontal className="w-3.5 h-3.5" style={{ color: '#8e8ea0' }} /></span>
                        <span className="rounded p-0.5 hover:bg-white/10"><Trash2 className="w-3 h-3" style={{ color: '#8e8ea0' }} /></span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Bottom user */}
            <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 hover:bg-white/8 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #7c4dff 100%)', color: '#fff' }}>
                  U
                </div>
                <span className="text-sm truncate" style={{ color: '#ececec' }}>User</span>
                <ChevronDown className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: '#8e8ea0' }} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MAIN ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="rounded-lg p-1.5 hover:bg-white/8 transition-colors"
          >
            {/* Hamburger */}
            <div className="flex flex-col gap-[5px] w-4">
              {[0,1,2].map(i => <div key={i} className="h-[1.5px] rounded-full bg-white/50" />)}
            </div>
          </button>

          {/* Model selector */}
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-white/8 transition-colors">
            <UltronMark size={16} />
            <span style={{ color: '#ececec' }}>Ultron</span>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: '#8e8ea0' }} />
          </button>
        </div>

        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {!hasMessages ? (
            /* ── WELCOME STATE ── */
            <div className="flex flex-col items-center justify-center h-full px-4 pb-10">
              <div className="mb-6">
                <UltronMark size={52} />
              </div>
              <h1 className="text-3xl font-semibold mb-8" style={{ color: '#ececec' }}>
                What can I help with?
              </h1>
              {/* Suggestion chips */}
              <div className="grid grid-cols-2 gap-3 max-w-xl w-full">
                {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => send(prompt)}
                    className="flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-colors hover:bg-white/8"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#8e8ea0' }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#ececec' }}>{label}</div>
                      <div className="text-xs mt-0.5 line-clamp-2" style={{ color: '#8e8ea0' }}>{prompt}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── MESSAGES ── */
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-1">
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <MessageRow key={msg.id} message={msg} />
                ))}
                {thinking && <ThinkingRow key="thinking" />}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── INPUT AREA ── */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Message Ultron"
                rows={1}
                disabled={thinking}
                className="w-full resize-none bg-transparent px-4 pt-4 pb-12 text-sm outline-none placeholder:text-white/30 disabled:opacity-50"
                style={{ color: '#ececec', lineHeight: '1.6', maxHeight: '200px' }}
              />
              {/* Bottom toolbar */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1">
                  {/* placeholder tool buttons */}
                  <button className="rounded-lg p-1.5 hover:bg-white/10 transition-colors" title="Attach">
                    <Plus className="w-4 h-4" style={{ color: '#8e8ea0' }} />
                  </button>
                </div>
                <motion.button
                  onClick={() => send(input)}
                  disabled={!input.trim() || thinking}
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                  style={{
                    background: input.trim() && !thinking ? '#ececec' : 'rgba(255,255,255,0.1)',
                    cursor: input.trim() && !thinking ? 'pointer' : 'default',
                  }}
                  whileHover={input.trim() && !thinking ? { scale: 1.06 } : {}}
                  whileTap={input.trim() && !thinking ? { scale: 0.94 } : {}}
                >
                  <ArrowUp className="w-4 h-4" style={{ color: input.trim() && !thinking ? '#212121' : '#555' }} />
                </motion.button>
              </div>
            </div>
            <p className="text-center text-xs mt-2" style={{ color: '#6e6e80' }}>
              Ultron can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── MESSAGE ROW ── */
function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex gap-4 px-4 py-5 rounded-2xl ${isUser ? '' : 'hover:bg-white/[0.03]'}`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #7c4dff 100%)', color: '#fff' }}>
            U
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)' }}>
            <UltronMark size={22} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold mb-1.5" style={{ color: '#ececec' }}>
          {isUser ? 'You' : 'Ultron'}
        </div>
        <div className="text-sm leading-7 prose-invert" style={{ color: '#d1d1d1' }}>
          {isUser ? message.content : <TypewriterText text={message.content} speed={18} />}
        </div>

        {/* Action buttons — AI messages only */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {[
              { icon: Copy,      title: 'Copy' },
              { icon: ThumbsUp,  title: 'Good response' },
              { icon: ThumbsDown,title: 'Bad response' },
            ].map(({ icon: Icon, title }) => (
              <button key={title} title={title}
                className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
                <Icon className="w-3.5 h-3.5" style={{ color: '#8e8ea0' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── THINKING ROW ── */
function ThinkingRow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-4 px-4 py-5"
    >
      <div className="shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)' }}>
          <UltronMark size={22} />
        </div>
      </div>
      <div className="flex-1 pt-0.5">
        <div className="text-sm font-semibold mb-2" style={{ color: '#ececec' }}>Ultron</div>
        <div className="flex items-center gap-1.5">
          {[0, 0.16, 0.32].map(delay => (
            <motion.div key={delay}
              className="w-2 h-2 rounded-full"
              style={{ background: '#8e8ea0' }}
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.15, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.0, delay, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
