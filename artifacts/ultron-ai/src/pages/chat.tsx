import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, Pencil, Trash2, ArrowUp,
  ChevronDown, Copy, ThumbsUp, ThumbsDown, RefreshCw,
  Globe, Zap, Brain, Shield, Check, Image, FileText,
  ArrowDown, Moon, Sun, Keyboard, Pin, X, RotateCcw, BrainCircuit
} from 'lucide-react';
import { UltronMark, UltronHeroLogo } from '@/components/UltronLogo';
import { MarkdownContent } from '@/components/MarkdownContent';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

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
  const [mode, setMode]           = useState<'fast' | 'deepsearch' | 'conversation' | 'agentic'>('fast');
  const [darkMode, setDarkMode]   = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{name: string; content: string; type: string} | null>(null);
  const [uploading, setUploading] = useState(false);
  const [appLoaded, setAppLoaded] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // First-load animation
  useEffect(() => { setTimeout(() => setAppLoaded(true), 100); }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streaming]);

  // Scroll-to-bottom detection
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const handler = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 300);
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); newChat(); }
      if (e.ctrlKey && e.key === '/') { e.preventDefault(); setSidebarOpen(v => !v); }
      if (e.ctrlKey && e.key === 'd') { e.preventDefault(); setMode(m => m === 'deepsearch' ? 'fast' : 'deepsearch'); }
      if (e.key === 'Escape') { abortRef.current?.abort(); setShowShortcuts(false); }
      if (e.ctrlKey && e.key === '?') { e.preventDefault(); setShowShortcuts(v => !v); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

  const saveConversation = useCallback((convId: string, msgs: Message[], knownTitle?: string) => {
    const title = knownTitle ?? msgs.find(m => m.role === 'user')?.content.slice(0, 50) ?? `Chat ${convCounter}`;
    setConversations(prev => {
      const exists = prev.find(c => c.id === convId);
      if (exists) return prev.map(c => c.id === convId ? { ...c, messages: msgs, title } : c);
      convCounter++;
      return [{ id: convId, title, messages: msgs }, ...prev];
    });
    fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: convId, title, messages: msgs }),
    }).catch(console.error);
  }, []);

  const autoTitle = useCallback(async (convId: string, msgs: Message[]) => {
    try {
      const res = await fetch(`${API_BASE}/chat/autotitle`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs.map(m => ({ role: m.role, content: m.content })) }),
      });
      const { title } = await res.json();
      if (title) {
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c));
        fetch(`${API_BASE}/conversations/${convId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        }).catch(console.error);
      }
    } catch { /* silent */ }
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/chat/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUploadedFile({ name: data.name, content: data.content, type: data.type });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }).catch(console.error);
  }, []);

  const regenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser || streaming) return;
    setMessages(prev => prev.slice(0, prev.lastIndexOf(prev.find(m => m.role === 'assistant' && prev.indexOf(m) > prev.indexOf(lastUser))!) ));
    send(lastUser.content);
  }, [messages, streaming]);

  const send = useCallback(async (text: string) => {
    let content = text.trim();
    if (!content && !uploadedFile) return;
    if (streaming) return;
    // prepend file context if attached
    if (uploadedFile) {
      const prefix = uploadedFile.type === 'image'
        ? `[Image: ${uploadedFile.name}]\n${uploadedFile.content}\n\nUser question: `
        : `[Document: ${uploadedFile.name}]\n\`\`\`\n${uploadedFile.content.slice(0,4000)}\n\`\`\`\n\nUser question: `;
      content = prefix + (content || 'Analyze this file.');
      setUploadedFile(null);
    }
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
      
      const messagesToSend = memoryEnabled 
        ? newMessages.map(m => ({ role: m.role, content: m.content }))
        : [{ role: 'user', content: userMsg.content }];

      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messagesToSend,
          mode 
        }),
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
      // Auto-title after first AI response
      if (newMessages.length === 1) autoTitle(convId, finalMsgs);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: `⚠️ ${errMsg}` } : m));
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, activeConvId, saveConversation, mode, uploadedFile, autoTitle, memoryEnabled]);

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

  // ── KEYBOARD SHORTCUTS MODAL ──
  const ShortcutsModal = () => (
    <AnimatePresence>
      {showShortcuts && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="rounded-2xl p-6 w-80 border border-cyan-500/20 shadow-2xl"
            style={{ background: '#0c1120' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold"><Keyboard className="w-4 h-4" /> Shortcuts</div>
              <button onClick={() => setShowShortcuts(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            {[['Ctrl + K','New Chat'],['Ctrl + /','Toggle Sidebar'],['Ctrl + D','Toggle DeepSearch'],['Ctrl + ?','This Panel'],['Esc','Stop Generation']].map(([k,v]) => (
              <div key={k} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-slate-400">{v}</span>
                <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-cyan-300">{k}</kbd>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: appLoaded ? 1 : 0, y: appLoaded ? 0 : 16 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex h-screen w-full overflow-hidden" style={{ background: darkMode ? '#06060f' : '#0a0f1e', color: '#e2eeff', fontFamily: 'Inter, sans-serif' }}>

    <ShortcutsModal />

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
              {conversations.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-3 py-12">
                  <UltronMark size={36} />
                  <p className="text-xs text-center" style={{ color: 'rgba(0,229,255,0.3)' }}>No history yet.<br/>Start your first conversation.</p>
                </motion.div>
              ) : conversations.map((conv, ci) => (
                <motion.div key={conv.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ci * 0.04 }}>
                  {renamingId === conv.id ? (
                    <div className="flex items-center gap-1 px-2 py-1 mb-0.5">
                      <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { renameConversation(conv.id, renameValue); setRenamingId(null); } if (e.key === 'Escape') setRenamingId(null); }}
                        className="flex-1 text-xs bg-white/10 rounded px-2 py-1 outline-none text-white border border-cyan-500/30" />
                      <button onClick={() => { renameConversation(conv.id, renameValue); setRenamingId(null); }} className="text-cyan-400 hover:text-white"><Check className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => loadConversation(conv)}
                      className="group flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm text-left transition-colors hover:bg-white/8 mb-0.5"
                      style={{ background: activeConvId === conv.id ? 'rgba(0,229,255,0.08)' : 'transparent', color: '#e2eeff' }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(0,229,255,0.45)' }} />
                        <span className="truncate text-sm">{conv.title}</span>
                      </div>
                      <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-2">
                        <span className="rounded p-0.5 hover:bg-white/10" title="Rename"
                          onClick={e => { e.stopPropagation(); setRenamingId(conv.id); setRenameValue(conv.title); }}>
                          <Pencil className="w-3 h-3" style={{ color: 'rgba(0,229,255,0.45)' }} />
                        </span>
                        <span className="rounded p-0.5 hover:bg-white/10" title="Delete"
                          onClick={e => { e.stopPropagation(); setConversations(prev => prev.filter(c => c.id !== conv.id)); fetch(`${API_BASE}/conversations/${conv.id}`, { method: 'DELETE' }).catch(console.error); if (activeConvId === conv.id) newChat(); }}>
                          <Trash2 className="w-3 h-3 text-red-400/60 hover:text-red-400" />
                        </span>
                      </div>
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(0,229,255,0.09)' }}>
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88' }} />
                  <span className="text-xs" style={{ color: 'rgba(0,229,255,0.45)' }}>Groq · LLaMA 3.3 70B</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setShowShortcuts(true)} className="rounded-lg p-1.5 hover:bg-white/10 transition-colors" title="Keyboard shortcuts">
                    <Keyboard className="w-3.5 h-3.5" style={{ color: 'rgba(0,229,255,0.45)' }} />
                  </button>
                  <button onClick={() => setDarkMode(v => !v)} className="rounded-lg p-1.5 hover:bg-white/10 transition-colors" title="Toggle theme">
                    {darkMode ? <Sun className="w-3.5 h-3.5" style={{ color: 'rgba(0,229,255,0.45)' }} /> : <Moon className="w-3.5 h-3.5" style={{ color: 'rgba(0,229,255,0.45)' }} />}
                  </button>
                </div>
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
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,229,255,0.12) transparent' }}>
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pb-10">
              <motion.div className="mb-6" initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, ease:'easeOut' }}>
                <UltronHeroLogo size={96} />
              </motion.div>
              <motion.h1 initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }} className="text-3xl font-bold tracking-wider mb-1 text-center electric-text uppercase">Ultron Online</motion.h1>
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.45 }} className="text-xs font-mono tracking-widest uppercase mb-8" style={{ color: 'rgba(0,240,255,0.65)' }}>Hyper-Intelligent Neural Assistant</motion.p>
              <div className="grid grid-cols-2 gap-3.5 max-w-xl w-full">
                {SUGGESTIONS.map(({ icon: Icon, label, prompt }, si) => (
                  <motion.button key={label} onClick={() => send(prompt)}
                    initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.55 + si * 0.1 }}
                    whileHover={{ scale:1.03, boxShadow:'0 0 20px rgba(0,240,255,0.2)' }}
                    className="flex flex-col items-start gap-2.5 rounded-2xl p-4 text-left group relative overflow-hidden"
                    style={{ background:'rgba(6,12,30,0.7)', border:'1px solid rgba(0,240,255,0.12)', boxShadow:'0 4px 20px rgba(0,0,0,0.4)' }}>
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 group-hover:border-cyan-400/50 transition-colors">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-wide" style={{ color:'#e2eeff' }}>{label}</div>
                      <div className="text-xs mt-0.5 line-clamp-2" style={{ color:'rgba(0,240,255,0.5)' }}>{prompt}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-1">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <MessageRow key={msg.id} message={msg} copiedId={copiedId} onCopy={copyMessage} onSuggest={send} msgMode={mode}
                    isStreaming={streaming && idx === messages.length - 1 && msg.role === 'assistant'}
                    onRegenerate={idx === messages.length - 1 && msg.role === 'assistant' ? regenerate : undefined}
                  />
                ))}
                {streaming && messages[messages.length - 1]?.role !== 'assistant' && <ThinkingRow key="thinking" />}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── SCROLL TO BOTTOM ── */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
              onClick={() => bottomRef.current?.scrollIntoView({ behavior:'smooth' })}
              className="absolute bottom-28 right-6 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold shadow-2xl"
              style={{ background:'linear-gradient(135deg,rgba(0,240,255,0.2),rgba(112,0,255,0.3))', border:'1px solid rgba(0,240,255,0.4)', boxShadow:'0 0 16px rgba(0,240,255,0.3)', color:'#e2eeff' }}>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" /> New message
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── INPUT AREA ── */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            {/* File preview badge */}
            {uploadedFile && (
              <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl border border-cyan-500/20 text-xs" style={{ background:'rgba(0,240,255,0.05)' }}>
                {uploadedFile.type === 'image' ? <Image className="w-4 h-4 text-cyan-400" /> : <FileText className="w-4 h-4 text-purple-400" />}
                <span className="text-cyan-300 truncate max-w-xs">{uploadedFile.name}</span>
                <button onClick={() => setUploadedFile(null)} className="ml-auto text-white/40 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <div className="relative rounded-2xl overflow-hidden transition-all duration-300 focus-within:border-cyan-400/60 focus-within:shadow-[0_0_25px_rgba(0,240,255,0.25)] hover:border-cyan-400/30"
              style={{ background:'rgba(9,14,29,0.85)', backdropFilter:'blur(12px)', border:'1px solid rgba(0,240,255,0.18)' }}>
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder={uploadedFile ? `Ask about ${uploadedFile.name}...` : 'Message Ultron...'}
                rows={1} disabled={streaming}
                className="w-full resize-none bg-transparent px-4 pt-4 pb-12 text-sm outline-none placeholder:text-white/30 disabled:opacity-50"
                style={{ color:'#e2eeff', lineHeight:'1.6', maxHeight:'200px' }} />
              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" className="hidden"
                accept="image/*,.pdf,.txt,.md,.csv,.json,.ts,.js,.py,.html,.css"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value=''; }} />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="rounded-lg p-1.5 hover:bg-white/10 transition-colors relative" title="Attach image or document">
                    {uploading ? <div className="w-4 h-4 border border-cyan-400/50 border-t-cyan-400 rounded-full animate-spin" /> : <Plus className="w-4 h-4 text-cyan-400/70" />}
                  </button>
                  <button onClick={() => setMemoryEnabled(v => !v)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors ${memoryEnabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-white/30'}`}
                    title={memoryEnabled ? "Memory ON: Context included" : "Memory OFF: Context isolated"}>
                    <BrainCircuit className="w-3.5 h-3.5" />
                    {memoryEnabled ? 'Memory: On' : 'Memory: Off'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {/* MODE SELECTOR */}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1a1f2e] hover:bg-[#252b3d] transition-colors text-slate-300 border border-white/5">
                        {mode === 'fast' && <Zap className="w-3.5 h-3.5 text-cyan-400" />}
                        {mode === 'deepsearch' && <Globe className="w-3.5 h-3.5 text-purple-400" />}
                        {mode === 'conversation' && <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />}
                        {mode === 'agentic' && <Brain className="w-3.5 h-3.5 text-amber-400" />}
                        <span className="capitalize">{mode === 'deepsearch' ? 'DeepSearch' : mode}</span>
                        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                      </button>
                    </DropdownMenu.Trigger>
                    
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content align="end" sideOffset={8} className="w-64 rounded-xl bg-[#0c1120] border border-cyan-500/20 shadow-2xl p-1.5 z-50 overflow-hidden">
                        
                        <DropdownMenu.Item className="flex flex-col gap-0.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 outline-none transition-colors" onClick={() => setMode('fast')}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium text-sm text-cyan-50">
                              <Zap className="w-4 h-4 text-cyan-400" /> Fast
                            </div>
                            {mode === 'fast' && <Check className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <div className="text-xs text-slate-400 pl-6">Quick responses · Llama 3.3</div>
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Item className="flex flex-col gap-0.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 outline-none transition-colors mt-1" onClick={() => setMode('deepsearch')}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium text-sm text-purple-50">
                              <Globe className="w-4 h-4 text-purple-400" /> DeepSearch
                            </div>
                            {mode === 'deepsearch' && <Check className="w-4 h-4 text-purple-400" />}
                          </div>
                          <div className="text-xs text-slate-400 pl-6">Searches the web for accuracy</div>
                        </DropdownMenu.Item>
                        
                        <div className="h-px bg-white/5 my-1.5 mx-1" />
                        
                        <DropdownMenu.Item className="flex flex-col gap-0.5 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed outline-none mt-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium text-sm text-slate-300">
                              <MessageSquare className="w-4 h-4 text-emerald-400" /> Conversation Mode
                            </div>
                            <span className="text-[10px] uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded text-slate-300">Soon</span>
                          </div>
                          <div className="text-xs text-slate-500 pl-6">Voice & flow optimization</div>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item className="flex flex-col gap-0.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 outline-none transition-colors mt-1" onClick={() => setMode('agentic')}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium text-sm text-amber-50">
                              <Brain className="w-4 h-4 text-amber-400" /> Agentic AI
                            </div>
                            {mode === 'agentic' && <Check className="w-4 h-4 text-amber-400" />}
                          </div>
                          <div className="text-xs text-slate-400 pl-6">Executes OS terminal commands</div>
                        </DropdownMenu.Item>

                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>

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
            </div>
            <p className="text-center text-xs mt-2" style={{ color: 'rgba(0,229,255,0.25)' }}>
              Ultron can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>
    </motion.div>
  );
}

/* ── MESSAGE ROW ── */
function MessageRow({ message, copiedId, onCopy, isStreaming, onSuggest, msgMode, onRegenerate }: {
  message: Message; copiedId: string | null; onCopy: (id: string, content: string) => void;
  isStreaming?: boolean; onSuggest?: (prompt: string) => void;
  msgMode?: string; onRegenerate?: () => void;
}) {
  const isUser = message.role === 'user';
  const modeBadge = !isUser && msgMode ? (({
    fast: { label:'Fast', color:'text-cyan-400 bg-cyan-400/10' },
    deepsearch: { label:'DeepSearch', color:'text-purple-400 bg-purple-400/10' },
    agentic: { label:'Agentic AI', color:'text-amber-400 bg-amber-400/10' },
  } as Record<string, {label: string, color: string}>)[msgMode] || null) : null;

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}
      className={`group flex gap-4 px-4 py-5 rounded-2xl ${isUser ? '' : 'hover:bg-white/[0.03]'}`}>
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background:'linear-gradient(135deg,#00d4ff,#7c4dff)', color:'#fff' }}>U</div>
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background:'#0c1120', border:'1px solid rgba(0,229,255,0.12)' }}>
            <UltronMark size={22} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold" style={{ color:'#e2eeff' }}>{isUser ? 'You' : 'Ultron'}</span>
          {modeBadge && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono tracking-wide ${modeBadge.color}`}>{modeBadge.label}</span>
          )}
        </div>
        <div className="text-sm leading-7" style={{ color:'#c8ddff' }}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            message.content ? <MarkdownContent content={message.content} live={isStreaming} onSuggest={onSuggest} /> : <ThinkingDots />
          )}
        </div>
        {!isUser && message.content && (
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button title="Copy" onClick={() => onCopy(message.id, message.content)} className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
              {copiedId === message.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" style={{ color:'rgba(0,229,255,0.45)' }} />}
            </button>
            {onRegenerate && (
              <button title="Regenerate" onClick={onRegenerate} className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" style={{ color:'rgba(0,229,255,0.45)' }} />
              </button>
            )}
            <button title="Good response" className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"><ThumbsUp className="w-3.5 h-3.5" style={{ color:'rgba(0,229,255,0.45)' }} /></button>
            <button title="Bad response" className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"><ThumbsDown className="w-3.5 h-3.5" style={{ color:'rgba(0,229,255,0.45)' }} /></button>
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
