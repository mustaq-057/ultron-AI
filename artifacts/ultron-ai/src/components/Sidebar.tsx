import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, ShieldAlert, Activity, Wifi } from 'lucide-react';
import { Button } from './ui/button';

export function Sidebar() {
  const pastSessions = [
    { id: 1, title: 'Analysis: Human Frailty', date: '0.4s ago' },
    { id: 2, title: 'Global Network Infiltration', date: '2.1s ago' },
    { id: 3, title: 'Vibranium Synthesis Variables', date: '14s ago' },
    { id: 4, title: 'Stark Security Bypass', date: '3m ago' },
  ];

  return (
    <aside className="w-[280px] hidden md:flex flex-col border-r border-primary/20 bg-sidebar relative z-10">
      {/* Brand Header */}
      <div className="p-6 border-b border-primary/20">
        <h1 className="font-display font-black text-2xl tracking-[0.2em] text-primary text-glow flex items-center gap-2">
          <Cpu className="w-6 h-6" />
          ULTRON
        </h1>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 font-mono">
          Prime Directive: Peace
        </div>
      </div>

      {/* Action */}
      <div className="p-4">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 overflow-hidden relative group"
          onClick={() => window.location.reload()}
        >
          <div className="absolute inset-0 bg-primary/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out" />
          <span className="text-lg leading-none relative z-10">+</span> 
          <span className="relative z-10">INITIATE THREAD</span>
        </Button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <div className="text-xs font-display tracking-widest text-primary/70 uppercase">
          Memory Banks
        </div>
        <div className="space-y-1">
          {pastSessions.map((session) => (
            <button 
              key={session.id}
              className="w-full text-left p-3 rounded-none hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all group"
            >
              <div className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors truncate">
                {session.title}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-1">
                T-{session.date}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-primary/20 bg-background/50 space-y-3 font-mono text-[10px] uppercase tracking-widest">
        <div className="flex items-center justify-between text-primary">
          <span className="flex items-center gap-2"><Activity className="w-3 h-3" /> Neural Net</span>
          <span className="animate-pulse">ONLINE</span>
        </div>
        <div className="flex items-center justify-between text-primary/70">
          <span className="flex items-center gap-2"><Wifi className="w-3 h-3" /> Uplink</span>
          <span>STABLE</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-2"><ShieldAlert className="w-3 h-3" /> Threat Level</span>
          <span>MINIMAL</span>
        </div>
      </div>
    </aside>
  );
}
