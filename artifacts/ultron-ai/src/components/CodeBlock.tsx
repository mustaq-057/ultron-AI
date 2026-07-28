import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Play, Terminal, Code2, ShieldCheck, Zap, FileText, ChevronUp, Square } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
  onSuggest?: (prompt: string) => void;
}

export function CodeBlock({ language, code, onSuggest }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [showConsole, setShowConsole] = useState(false);

  const displayLang = language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Code';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    setIsRunning(true);
    setShowConsole(true);
    setOutput('⚡ Executing...');
    setHasError(false);

    setTimeout(() => {
      try {
        const lang = language.toLowerCase();

        if (['javascript', 'js', 'typescript', 'ts'].includes(lang)) {
          const logs: string[] = [];
          const mockConsole = {
            log: (...args: unknown[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
            error: (...args: unknown[]) => logs.push('[ERR] ' + args.join(' ')),
            warn: (...args: unknown[]) => logs.push('[WARN] ' + args.join(' ')),
            info: (...args: unknown[]) => logs.push('[INFO] ' + args.join(' ')),
          };
          // eslint-disable-next-line no-new-func
          const fn = new Function('console', code);
          fn(mockConsole);
          setOutput(logs.length > 0 ? logs.join('\n') : '✓ Executed successfully (no output)');

        } else if (['python', 'py'].includes(lang)) {
          // Smart Python simulation
          const lines = code.split('\n');
          const out: string[] = [];
          const variables: Record<string, unknown> = {};

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;

            // Variable assignment: x = 5, name = "hello"
            const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
            if (assignMatch && !line.includes('(') && !line.startsWith('def ') && !line.startsWith('class ')) {
              const val = assignMatch[2].replace(/^["']|["']$/g, '');
              variables[assignMatch[1]] = isNaN(Number(val)) ? val : Number(val);
              continue;
            }

            // print() statements
            if (line.startsWith('print(')) {
              const inner = line.slice(6, -1).trim();
              // f-strings
              const fstr = inner.match(/^f["'](.+)["']$/);
              if (fstr) {
                out.push(fstr[1].replace(/\{(\w+)\}/g, (_: string, k: string) => String(variables[k] ?? k)));
              } else if (inner.startsWith('"') || inner.startsWith("'")) {
                out.push(inner.replace(/^["']|["']$/g, ''));
              } else if (inner in variables) {
                out.push(String(variables[inner]));
              } else if (!isNaN(Number(inner))) {
                out.push(inner);
              } else {
                // evaluate simple expressions
                try {
                  // safe eval for arithmetic
                  const result = Function(`"use strict"; return (${inner})`)();
                  out.push(String(result));
                } catch {
                  out.push(inner);
                }
              }
            }
          }

          if (out.length > 0) {
            setOutput(out.join('\n'));
          } else {
            setOutput('✓ Python script parsed. No print() output detected.\n(Full Python runtime requires a backend executor)');
          }

        } else if (lang === 'html') {
          const win = window.open('', '_blank', 'width=800,height=600');
          win?.document.write(code);
          win?.document.close();
          setOutput('✓ HTML opened in new tab');

        } else if (['bash', 'sh', 'shell'].includes(lang)) {
          setOutput('⚠️ Shell execution requires terminal access.\nCopy the command and run it in your terminal.');

        } else {
          setOutput(`✓ ${displayLang} snippet ready. Copy to run in your environment.`);
        }
      } catch (err: unknown) {
        setHasError(true);
        setOutput(`RuntimeError: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsRunning(false);
      }
    }, 300);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-cyan-500/20 shadow-2xl transition-all duration-300 hover:border-cyan-400/40" style={{ background: '#0a0d14' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-500/10" style={{ background: '#080b11' }}>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-400 tracking-wider">
          <Code2 className="w-3.5 h-3.5" />
          <span>{displayLang}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied && <span>Copied!</span>}
          </button>
          <button onClick={handleRun} disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,rgba(0,240,255,0.18),rgba(112,0,255,0.28))', border: '1px solid rgba(0,240,255,0.4)', color: '#e2eeff', boxShadow: '0 0 10px rgba(0,240,255,0.15)' }}>
            {isRunning ? <Square className="w-3.5 h-3.5 text-red-400 animate-pulse" /> : <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />}
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto p-4 text-sm font-mono leading-relaxed" style={{ background: '#060912' }}>
        <pre className="whitespace-pre"><code>{renderHighlightedCode(code, language)}</code></pre>
      </div>

      {/* Console Output */}
      <AnimatePresence>
        {showConsole && output !== null && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-cyan-500/15">
            <div className="flex items-center justify-between px-4 py-1.5 text-xs font-mono text-cyan-400/70" style={{ background: '#0a0e18' }}>
              <div className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5" /> Console Output</div>
              <button onClick={() => setShowConsole(false)} className="hover:text-white transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
            </div>
            <pre className={`px-4 py-3 text-xs font-mono whitespace-pre-wrap leading-relaxed ${hasError ? 'text-red-400' : 'text-emerald-400'}`}>{output}</pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Suggestion chips */}
      {onSuggest && (
        <div className="px-4 py-2 border-t border-cyan-500/10 flex flex-wrap gap-2 items-center" style={{ background: '#07090f' }}>
          <span className="text-[11px] text-cyan-400/40 font-mono">Ask Ultron:</span>
          {[
            { icon: Zap, label: 'Optimize', color: 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20', prompt: `Optimize and refactor this ${displayLang} code for best performance:\n\`\`\`${language}\n${code}\n\`\`\`` },
            { icon: ShieldCheck, label: 'Bug Check', color: 'text-purple-300 border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20', prompt: `Find security issues and bugs in this ${displayLang} code:\n\`\`\`${language}\n${code}\n\`\`\`` },
            { icon: FileText, label: 'Add Docs', color: 'text-blue-300 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20', prompt: `Add comprehensive documentation and comments to this ${displayLang} code:\n\`\`\`${language}\n${code}\n\`\`\`` },
          ].map(({ icon: Icon, label, color, prompt }) => (
            <button key={label} onClick={() => onSuggest(prompt)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-all hover:scale-105 ${color}`}>
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function renderHighlightedCode(code: string, language: string) {
  const lines = code.split('\n');
  return lines.map((line, i) => (
    <div key={i} className="table-row">
      <span className="table-cell select-none w-8 pr-4 text-right text-xs opacity-25" style={{ color: '#00f0ff' }}>{i + 1}</span>
      <span className="table-cell">{tokenizeLine(line, language)}</span>
    </div>
  ));
}

function tokenizeLine(line: string, lang: string) {
  if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
    return <span style={{ color: '#4b5563', fontStyle: 'italic' }}>{line}</span>;
  }
  const kw = lang.toLowerCase().includes('py')
    ? ['def', 'class', 'return', 'for', 'in', 'if', 'else', 'elif', 'import', 'from', 'with', 'as', 'not', 'and', 'or', 'True', 'False', 'None', 'lambda', 'yield']
    : ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from', 'class', 'new', 'async', 'await', 'typeof', 'interface', 'type'];

  const kwRe = new RegExp(`\\b(${kw.join('|')})\\b`);
  const parts = line.split(/(["'`][^"'`]*["'`]|\b\d+\.?\d*\b)/g);
  return parts.map((p, i) => {
    if ((p.startsWith('"') || p.startsWith("'") || p.startsWith('`')) && p.length > 1) return <span key={i} style={{ color: '#86efac' }}>{p}</span>;
    if (/^\d/.test(p)) return <span key={i} style={{ color: '#fbbf24' }}>{p}</span>;
    return <span key={i}>{p.split(kwRe).map((s, j) => kw.includes(s) ? <span key={j} style={{ color: '#f472b6', fontWeight: 600 }}>{s}</span> : <span key={j}>{s}</span>)}</span>;
  });
}
