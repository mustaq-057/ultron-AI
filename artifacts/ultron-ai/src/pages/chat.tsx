import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, Pencil, Trash2, Send, ArrowUp,
  ChevronDown, MoreHorizontal, Copy, ThumbsUp, ThumbsDown,
  Globe, Zap, Brain, Shield, Check
} from 'lucide-react';
import { UltronMark, UltronHeroLogo } from '@/components/UltronLogo';
import { MarkdownContent } from '@/components/MarkdownContent';

const API_BASE = 'http://localhost:3000/api';

type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date };
type Conversation = { id: string; title: string; messages: Message[] };

const SUGGESTIONS = [
  { icon: Brain,  label: 'Explain a complex topic',   prompt: 'Explain how neural networks learn in simple terms' },
  { icon: Zap,    label: 'Help me write something',   prompt: 'Write a compelling product description for a stealth AI startup' },
  { icon: Globe,  label: 'Analyze something for me',  prompt: 'Analyze the pros and cons of remote work in 2025' },
  { icon: Shield, label: 'Solve a technical problem', prompt: 'How do I fix a memory leak in a Node.js application?' },
];

let convCounter = 1;
function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streaming]);

  // Load conversations from Neon PostgreSQL DB on mount
  useEffect(() => {
    fetch(`${API_BASE}/conversations`)
      .then(res => res.json())
      .then(data => {
        if (data.conversations && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        }
      })
      .catch(err => console.error('Failed to load conversations from Neon DB:', err));
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [input]);

  const saveConversation = useCallback((convId: string, msgs: Message[]) => {
    const title = msgs.find(m => m.role === 'user')?.content.slice(0, 50) ?? `Chat ${convCounter}`;

    setConversations(prev => {
      const exists = prev.find(c => c.id === convId);
      if (exists) return prev.map(c => c.id === convId ? { ...c, messages: msgs, title } : c);
      convCounter++;
      return [{ id: convId, title, messages: msgs }, ...prev];
    });

    // Sync to Neon DB
    fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: convId, title, messages: msgs }),
    }).catch(err => console.error('Failed to save conversation to Neon DB:', err));
  }, []);

  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: Message = { id: makeId(), role: 'user', content, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStreaming(true);

    // Determine or create conversation
    let convId = activeConvId;
    if (!convId) {
      convId = makeId();
      setActiveConvId(convId);
    }

    const assistantId = makeId();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', timestamp: new Date() };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(err.error ?? 'Request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = JSON.parse(line.slice(6));
          if (data.type === 'delta') {
            fullContent += data.content;
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m));
          } else if (data.type === 'error') {
            throw new Error(data.message);
          }
        }
      }

      const finalMsgs = [...newMessages, { ...assistantMsg, content: fullContent }];
      saveConversation(convId, finalMsgs);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: `⚠️ ${errMsg}` } : m));
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, activeConvId, saveConversation]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const newChat = () => {
    if (streaming) { abortRef.current?.abort(); setStreaming(false); }
    setMessages([]);
    setActiveConvId(null);
  };

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages);
    setActiveConvId(conv.id);
  };

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#06060f', color: '#e2eeff', fontFamily: 'Inter, sans-serif' }}>

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="flex flex-col h-full shrink-0 overflow-hidden"
            style={{ background: '#04040c', borderRight: '1px solid rgba(0,229,255,0.09)' }}
          >
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <div className="flex items-center gap-2 px-1">
                <UltronMark size={24} />
                <span className="text-sm font-semibold tracking-wide" style={{ color: '#e2eeff' }}>Ultron</span>
              </div>
              <button onClick={newChat} className="rounded-lg p-1.5 transition-colors hover:bg-white/10" title="New chat">
                <Pencil className="w-4 h-4" style={{ color: 'rgba(0,229,255,0.45)' }} />
              </button>
            </div>

            <div className="px-3 pt-1 pb-2">
              <button onClick={newChat} className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/8" style={{ color: '#e2eeff' }}>
                <Plus className="w-4 h-4" style={{ color: 'rgba(0,229,255,0.45)' }} />
                New chat
              </button>
            </div>

            {/* History */}
            <div className="flex-1 overflow-y-auto px-3 py-1">
              {conversations.length === 0 && (
                <p className="px-3 py-2 text-xs" style={{ color: 'rgba(0,229,255,0.3)' }}>No conversations yet</p>
              )}
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className="group flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm text-left transition-colors hover:bg-white/8 mb-0.5"
                  style={{
                    background: activeConvId === conv.id ? 'rgba(0,229,255,0.08)' : 'transparent',
                    color: '#e2eeff',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(0,229,255,0.45)' }} />
                    <span className="truncate text-sm">{conv.title}</span>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-2">
                    <span
                      className="rounded p-0.5 hover:bg-white/10"
                      onClick={e => {
                        e.stopPropagation();
                        setConversations(prev => prev.filter(c => c.id !== conv.id));
                        fetch(`${API_BASE}/conversations/${conv.id}`, { method: 'DELETE' }).catch(err => console.error(err));
                        if (activeConvId === conv.id) newChat();
                      }}
                    >
                      <Trash2 className="w-3 h-3" style={{ color: 'rgba(0,229,255,0.45)' }} />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(0,229,255,0.09)' }}>
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88' }} />
                <span className="text-xs" style={{ color: 'rgba(0,229,255,0.45)' }}>
                  Powered by Groq · LLaMA 3.3 70B
                </span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MAIN ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="rounded-lg p-1.5 hover:bg-white/8 transition-colors">
            <div className="flex flex-col gap-[5px] w-4">
              {[0,1,2].map(i => <div key={i} className="h-[1.5px] rounded-full bg-white/50" />)}
            </div>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-white/8 transition-colors">
            <UltronMark size={16} />
            <span style={{ color: '#e2eeff' }}>Ultron</span>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(0,229,255,0.45)' }} />
          </button>
        </div>

        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,229,255,0.12) transparent' }}>
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pb-10">
              <div className="mb-6"><UltronHeroLogo size={96} /></div>
              <h1 className="text-3xl font-bold tracking-wider mb-1 text-center electric-text uppercase">Ultron Online</h1>
              <p className="text-xs font-mono tracking-widest uppercase mb-8" style={{ color: 'rgba(0,240,255,0.65)' }}>Hyper-Intelligent Neural Assistant</p>
              <div className="grid grid-cols-2 gap-3.5 max-w-xl w-full">
                {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => send(prompt)}
                    className="flex flex-col items-start gap-2.5 rounded-2xl p-4.5 text-left transition-all duration-200 hover:scale-[1.02] hover:border-cyan-400/50 hover:bg-cyan-500/10 group relative overflow-hidden"
                    style={{ background: 'rgba(6,12,30,0.7)', border: '1px solid rgba(0,240,255,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                  >
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 group-hover:border-cyan-400/50 transition-colors">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-wide" style={{ color: '#e2eeff' }}>{label}</div>
                      <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(0,240,255,0.5)' }}>{prompt}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-1">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <MessageRow
                    key={msg.id}
                    message={msg}
                    copiedId={copiedId}
                    onCopy={copyMessage}
                    onSuggest={send}
                    isStreaming={streaming && idx === messages.length - 1 && msg.role === 'assistant'}
                  />
                ))}
                {streaming && messages[messages.length - 1]?.role !== 'assistant' && (
                  <ThinkingRow key="thinking" />
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── INPUT AREA ── */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden transition-all duration-300 focus-within:border-cyan-400/60 focus-within:shadow-[0_0_25px_rgba(0,240,255,0.25)] hover:border-cyan-400/30"
              style={{ background: '#090e1d', border: '1px solid rgba(0,240,255,0.18)' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Message Ultron..."
                rows={1}
                disabled={streaming}
                className="w-full resize-none bg-transparent px-4 pt-4 pb-12 text-sm outline-none placeholder:text-white/30 disabled:opacity-50"
                style={{ color: '#e2eeff', lineHeight: '1.6', maxHeight: '200px' }}
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1">
                  <button className="rounded-lg p-1.5 hover:bg-white/10 transition-colors" title="Attach">
                    <Plus className="w-4 h-4 text-cyan-400/70" />
                  </button>
                </div>
                <motion.button
                  onClick={() => streaming ? abortRef.current?.abort() : send(input)}
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-all shadow-lg"
                  style={{
                    background: streaming 
                      ? 'rgba(255,60,60,0.3)' 
                      : input.trim() 
                        ? 'linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)' 
                        : 'rgba(0,229,255,0.12)',
                    boxShadow: input.trim() ? '0 0 12px rgba(0,240,255,0.5)' : 'none',
                    cursor: streaming || input.trim() ? 'pointer' : 'default',
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                >
                  {streaming
                    ? <div className="w-3 h-3 rounded-sm bg-red-500 animate-pulse" />
                    : <ArrowUp className="w-4 h-4" style={{ color: input.trim() ? '#ffffff' : '#555' }} />
                  }
                </motion.button>
              </div>
            </div>
            <p className="text-center text-xs mt-2" style={{ color: 'rgba(0,229,255,0.25)' }}>
              Ultron can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── MESSAGE ROW ── */
function MessageRow({ message, copiedId, onCopy, isStreaming, onSuggest }: { message: Message; copiedId: string | null; onCopy: (id: string, content: string) => void; isStreaming?: boolean; onSuggest?: (prompt: string) => void }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex gap-4 px-4 py-5 rounded-2xl ${isUser ? '' : 'hover:bg-white/[0.03]'}`}
    >
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #7c4dff 100%)', color: '#fff' }}>U</div>
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#0c1120', border: '1px solid rgba(0,229,255,0.12)' }}>
            <UltronMark size={22} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold mb-1.5" style={{ color: '#e2eeff' }}>{isUser ? 'You' : 'Ultron'}</div>
        <div className="text-sm leading-7" style={{ color: '#c8ddff' }}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            message.content
              ? <MarkdownContent content={message.content} live={isStreaming} onSuggest={onSuggest} />
              : <ThinkingDots />
          )}
        </div>
        {!isUser && message.content && (
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {[
              { icon: copiedId === message.id ? Check : Copy, title: 'Copy', action: () => onCopy(message.id, message.content) },
              { icon: ThumbsUp,   title: 'Good response', action: () => {} },
              { icon: ThumbsDown, title: 'Bad response',  action: () => {} },
            ].map(({ icon: Icon, title, action }) => (
              <button key={title} title={title} onClick={action}
                className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
                <Icon className="w-3.5 h-3.5" style={{ color: copiedId === message.id && title === 'Copy' ? '#00ff88' : 'rgba(0,229,255,0.45)' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── THINKING DOTS (inline, while streaming empty content) ── */
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 pt-1">
      {[0, 0.16, 0.32].map(delay => (
        <motion.div key={delay} className="w-2 h-2 rounded-full" style={{ background: '#00d4ff' }}
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.15, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.0, delay, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

/* ── THINKING ROW (standalone, kept for compatibility) ── */
function ThinkingRow() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-4 px-4 py-5">
      <div className="shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: '#0c1120', border: '1px solid rgba(0,229,255,0.12)' }}>
          <UltronMark size={22} />
        </div>
      </div>
      <div className="flex-1 pt-0.5">
        <div className="text-sm font-semibold mb-2" style={{ color: '#e2eeff' }}>Ultron</div>
        <ThinkingDots />
      </div>
    </motion.div>
  );
}
