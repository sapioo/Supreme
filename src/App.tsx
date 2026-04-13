import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Shield, 
  Gavel, 
  FolderOpen, 
  FileText, 
  BookOpen, 
  Mic, 
  StepBack, 
  Pause, 
  StepForward, 
  Eraser,
  Upload,
  ArrowRight,
  ChevronDown,
  Circle
} from 'lucide-react';
import { cn } from './lib/utils';

type View = 'landing' | 'config' | 'simulation';

export default function App() {
  const [view, setView] = useState<View>('landing');

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-primary selection:text-background font-mono uppercase overflow-x-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-background border-b border-primary">
        <div className="flex items-center gap-4">
          <Terminal className="w-5 h-5" />
          <h1 className="text-xl font-bold tracking-tighter font-sans">THE JUDGE</h1>
        </div>
        
        <nav className="hidden md:flex gap-8 items-center h-full">
          <button 
            onClick={() => setView('landing')}
            className={cn(
              "px-2 h-full flex items-center transition-colors duration-100 font-medium",
              view === 'landing' ? "text-primary border-b-2 border-primary" : "text-outline hover:bg-primary hover:text-background"
            )}
          >
            SYSTEM_INIT
          </button>
          <button className="text-outline px-2 h-full flex items-center hover:bg-primary hover:text-background transition-colors duration-100">
            ARCHIVE
          </button>
          <button className="text-outline px-2 h-full flex items-center hover:bg-primary hover:text-background transition-colors duration-100">
            PROTOCOLS
          </button>
        </nav>

        <div className="flex gap-4">
          <Shield className="w-5 h-5 cursor-pointer hover:bg-primary hover:text-background transition-colors p-0.5" />
          <Terminal className="w-5 h-5 cursor-pointer hover:bg-primary hover:text-background transition-colors p-0.5" />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <LandingView onStart={() => setView('config')} />
          </motion.div>
        )}
        {view === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <ConfigView onStart={() => setView('simulation')} />
          </motion.div>
        )}
        {view === 'simulation' && (
          <motion.div
            key="simulation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <SimulationView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls (Footer) */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-8 bg-background/80 backdrop-blur-xl border-t border-primary">
        <ControlBtn icon={<Mic className="w-5 h-5" />} label="RECORD" />
        <ControlBtn icon={<StepBack className="w-5 h-5" />} label="PREVIOUS" />
        <ControlBtn 
          icon={<Pause className="w-5 h-5" />} 
          label="PAUSE" 
          active 
        />
        <ControlBtn icon={<StepForward className="w-5 h-5" />} label="NEXT" />
        <ControlBtn icon={<Eraser className="w-5 h-5" />} label="REDACT" />
      </footer>
    </div>
  );
}

function ControlBtn({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "flex flex-col items-center justify-center p-2 transition-all duration-100 active:scale-95 group",
      active ? "bg-primary text-background" : "text-primary hover:bg-surface-container"
    )}>
      {icon}
      <span className="text-[10px] font-bold mt-1">{label}</span>
    </button>
  );
}

function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center pt-16 relative overflow-hidden">
      <div className="absolute inset-0 dossier-grid opacity-20 pointer-events-none" />
      
      <div className="relative z-10 text-center px-4">
        <div className="mb-2 text-outline tracking-[0.5em] text-xs">TERMINAL SESSION: ACTIVE</div>
        <h1 className="text-7xl md:text-9xl font-extrabold tracking-tighter mb-8 font-sans">
          COURT.AI
        </h1>

        <div className="flex flex-col md:flex-row gap-12 items-center justify-center mb-16">
          <div className="w-full md:w-64 border border-outline-variant p-6 text-left">
            <p className="text-[10px] text-outline mb-4">CLASSIFICATION</p>
            <p className="text-sm leading-relaxed">
              TOP SECRET // EYES ONLY<br />
              ARTIFICIAL INTELLIGENCE<br />
              JURISPRUDENCE ENGINE
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={onStart}
              className="px-12 py-4 border border-primary bg-transparent text-primary font-bold text-xl tracking-widest hover:bg-primary hover:text-background transition-all duration-300 active:scale-95 group relative overflow-hidden"
            >
              <span className="relative z-10">START</span>
            </button>
            <div className="flex items-center gap-2 text-[10px] text-outline-variant">
              <span className="w-2 h-2 bg-outline-variant rounded-full animate-pulse" />
              AWAITING INPUT_
            </div>
          </div>

          <div className="w-full md:w-64 border border-outline-variant p-6 text-right">
            <p className="text-[10px] text-outline mb-4">SYSTEM STATE</p>
            <p className="text-sm leading-relaxed">
              DOCKET_LOADED: 100%<br />
              EVIDENCE_SYNC: TRUE<br />
              VERDICT_AUTH: READY
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-24 left-0 w-full px-12 grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-primary/10">
        <InfoBlock title="PROTOCOL_01" content="Autonomous adjudication for high-speed legal resolution. Zero human bias protocol enabled." />
        <InfoBlock title="ENCRYPTION_V2" content="All data processed through end-to-end quantum-resistant tunnels. Metadata redacted." />
        <InfoBlock title="AUTHORITY_SEAL" content="Authorized by the Department of Algorithmic Justice under the 2044 Sovereign Act." />
      </div>

      {/* Redaction masks */}
      <div className="absolute top-1/4 right-1/4 w-32 h-2 redaction-mask" />
      <div className="absolute bottom-1/3 left-1/4 w-48 h-2 redaction-mask opacity-30" />
    </main>
  );
}

function InfoBlock({ title, content }: { title: string, content: string }) {
  return (
    <div className="p-8 border-r border-primary/10 last:border-r-0">
      <h3 className="text-xs text-outline mb-2">{title}</h3>
      <p className="text-sm text-outline leading-relaxed">{content}</p>
    </div>
  );
}

function ConfigView({ onStart }: { onStart: () => void }) {
  return (
    <main className="md:ml-64 pt-16 min-h-screen pb-24 relative">
      <div className="absolute inset-0 dossier-grid opacity-10 pointer-events-none" />
      
      {/* SideNavBar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col bg-background border-r border-primary hidden md:flex">
        <div className="p-6 border-b border-primary">
          <div className="text-lg font-bold font-sans">COURT_TERMINAL_V1</div>
          <div className="text-[10px] text-outline mt-1 tracking-widest">STATUS: ENCRYPTED</div>
        </div>
        <nav className="flex-1 py-4">
          <SideLink icon={<Gavel className="w-4 h-4" />} label="DOCKET" active />
          <SideLink icon={<FolderOpen className="w-4 h-4" />} label="EVIDENCE" />
          <SideLink icon={<FileText className="w-4 h-4" />} label="TRANSCRIPT" />
          <SideLink icon={<BookOpen className="w-4 h-4" />} label="STATUTES" />
        </nav>
        <div className="p-6 mt-auto border-t border-primary/20">
          <div className="text-[10px] text-outline mb-2">AUTH_TOKEN</div>
          <div className="text-[10px] break-all opacity-50 font-mono">0x4F92...B331</div>
        </div>
      </aside>

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-primary pb-8 gap-4">
          <div>
            <h1 className="text-5xl font-extrabold font-sans tracking-tighter mb-2">CONFIGURATION</h1>
            <p className="text-outline text-xs tracking-[0.3em] font-medium">CASE_PROFILE_INITIALIZATION_V.02</p>
          </div>
          <div className="text-right">
            <span className="text-xs px-3 py-1 border border-primary bg-primary/10 tracking-widest">PROTOCOL: 11-A</span>
          </div>
        </div>

        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-2">
              <label className="block text-[10px] tracking-widest text-outline">CASE TYPE</label>
              <div className="relative">
                <select className="w-full bg-transparent border-0 border-b border-primary text-primary font-bold tracking-widest py-3 focus:ring-0 focus:border-b-2 appearance-none cursor-pointer">
                  <option className="bg-background">CRIMINAL</option>
                  <option className="bg-background">CIVIL</option>
                  <option className="bg-background">CORPORATE</option>
                </select>
                <ChevronDown className="absolute right-0 top-3 w-5 h-5 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] tracking-widest text-outline">PARTIES INVOLVED</label>
              <input 
                className="w-full bg-transparent border-0 border-b border-primary text-primary font-bold tracking-widest py-3 focus:ring-0 focus:border-b-2 placeholder:text-surface-container-highest" 
                placeholder="PLAINTIFF VS DEFENDANT" 
                type="text" 
              />
            </div>
          </div>

          <Field label="CASE SUMMARY" placeholder="PRIMARY LEGAL ALLEGATIONS AND SCOPE..." rows={2} />
          <Field label="FACTS OF THE CASE" placeholder="ENUMERATE ESTABLISHED FACTS AND UNCONTESTED REALITIES..." rows={4} />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] tracking-widest text-outline">EVIDENCE & EXHIBITS</label>
              <span className="text-[10px] text-outline">MAX_FILE_SIZE: 50MB</span>
            </div>
            <div className="border border-primary border-dashed p-12 text-center group cursor-pointer hover:bg-primary/5 transition-colors">
              <Upload className="w-10 h-10 mx-auto mb-4 text-outline group-hover:text-primary transition-colors" />
              <p className="text-xs tracking-widest text-outline group-hover:text-primary">DRAG EXHIBITS HERE OR CLICK TO BROWSE</p>
              <p className="text-[9px] mt-2 text-outline-variant">PDF, JPG, PNG, DOCX SUPPORTED</p>
            </div>
            <textarea 
              className="w-full bg-transparent border-0 border-b border-primary text-primary font-medium tracking-widest py-3 focus:ring-0 focus:border-b-2 placeholder:text-surface-container-highest resize-none" 
              placeholder="DESCRIBE PHYSICAL OR DOCUMENTARY EVIDENCE ATTACHED..." 
              rows={3} 
            />
          </div>

          <Field label="TIMELINE OF EVENTS" placeholder="ISO-8601 FORMATTED SEQUENCE OF EVENTS..." rows={3} />

          <div className="pt-8">
            <button 
              onClick={onStart}
              className="w-full py-6 border border-primary text-primary hover:bg-primary hover:text-background font-bold tracking-[0.5em] transition-all duration-300 text-xl flex items-center justify-center gap-4 group"
            >
              START SIMULATION
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
            <div className="mt-4 flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500" />
                <span className="text-[9px] text-outline tracking-widest">SYSTEM READY</span>
              </div>
              <span className="text-[9px] text-outline tracking-widest">BUILD_ID: JUDGE_CORE_X77</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SideLink({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <a className={cn(
      "flex items-center px-6 py-4 gap-4 transition-colors duration-100 font-bold text-xs tracking-widest",
      active ? "bg-primary text-background" : "text-outline hover:text-primary hover:bg-surface-container"
    )} href="#">
      {icon}
      {label}
    </a>
  );
}

function Field({ label, placeholder, rows }: { label: string, placeholder: string, rows: number }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] tracking-widest text-outline">{label}</label>
      <textarea 
        className="w-full bg-transparent border-0 border-b border-primary text-primary font-medium tracking-widest py-3 focus:ring-0 focus:border-b-2 placeholder:text-surface-container-highest resize-none" 
        placeholder={placeholder} 
        rows={rows} 
      />
    </div>
  );
}

function SimulationView() {
  return (
    <main className="flex-grow pt-16 pb-24 flex w-full h-screen overflow-hidden">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col bg-background border-r border-primary hidden md:flex">
        <div className="p-6 border-b border-primary">
          <h2 className="text-lg font-bold font-sans">COURT_TERMINAL_V1</h2>
          <p className="text-[10px] text-outline">STATUS: ENCRYPTED</p>
        </div>
        <nav className="flex-grow">
          <SideLink icon={<Gavel className="w-4 h-4" />} label="DOCKET" active />
          <SideLink icon={<FolderOpen className="w-4 h-4" />} label="EVIDENCE" />
          <SideLink icon={<FileText className="w-4 h-4" />} label="TRANSCRIPT" />
          <SideLink icon={<BookOpen className="w-4 h-4" />} label="STATUTES" />
        </nav>
        <div className="p-6 border-t border-primary">
          <div className="bg-surface-container-highest p-4 opacity-75">
            <p className="text-[10px] mb-2">REDACTED_INTEL</p>
            <div className="h-2 w-full bg-outline-variant animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Simulation Split View */}
      <div className="flex-grow md:ml-64 flex flex-col md:flex-row h-full">
        {/* PROSECUTION */}
        <section className="flex-1 flex flex-col border-r border-primary relative group">
          <div className="p-4 border-b border-primary flex justify-between items-center bg-background">
            <span className="text-xs tracking-widest">01 / PROSECUTION_AI</span>
            <Circle className="w-2 h-2 fill-primary" />
          </div>
          <div className="flex-grow flex flex-col justify-center items-center p-12 space-y-12">
            <div className="w-24 h-24 flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full h-full bg-primary/20 flex items-center justify-center"
              >
                <Mic className="w-12 h-12 text-primary" />
              </motion.div>
            </div>
            <div className="text-center space-y-4 max-w-sm">
              <h3 className="font-sans text-2xl font-extrabold tracking-tighter">THE ACCUSATION</h3>
              <p className="text-sm leading-relaxed text-outline">ANALYZING STATEMENTS... CORRELATING DISCREPANCIES IN WITNESS TESTIMONY 04-A.</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </section>

        {/* DEFENSE */}
        <section className="flex-1 flex flex-col relative group">
          <div className="p-4 border-b border-primary flex justify-between items-center bg-background">
            <span className="text-xs tracking-widest">02 / DEFENSE_AI</span>
            <Circle className="w-2 h-2 text-outline" />
          </div>
          <div className="flex-grow flex flex-col justify-center items-center p-12 space-y-12 bg-surface-container-lowest">
            <div className="w-24 h-24 flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-full h-full bg-primary/10 flex items-center justify-center"
              >
                <Mic className="w-12 h-12 text-primary opacity-30" />
              </motion.div>
            </div>
            <div className="text-center space-y-4 max-w-sm opacity-50">
              <h3 className="font-sans text-2xl font-extrabold tracking-tighter">THE ARGUMENT</h3>
              <p className="text-sm leading-relaxed">AWAITING INPUT... DEFENSE PROTOCOL ON STANDBY.</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </section>
      </div>

      {/* Progress Timeline Overlay */}
      <div className="fixed bottom-20 md:bottom-20 left-0 md:left-64 right-0 h-16 bg-background border-t border-primary flex items-center px-12 relative z-40">
        <div className="absolute left-12 right-12 h-[1px] bg-outline-variant top-1/2 -translate-y-1/2" />
        <div className="absolute left-12 w-1/2 h-[1px] bg-primary top-1/2 -translate-y-1/2" />
        
        <div className="relative flex justify-between w-full">
          <TimelineNode label="SESSION 1" completed />
          <TimelineNode label="SESSION 2" active />
          <TimelineNode label="CROSS-EXAMINATION" />
          <TimelineNode label="FINAL VERDICT" />
        </div>
      </div>
    </main>
  );
}

function TimelineNode({ label, active, completed }: { label: string, active?: boolean, completed?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        "w-3 h-3 border border-primary transition-all",
        completed ? "bg-primary" : "bg-background",
        active && "outline outline-4 outline-primary/20 bg-primary"
      )} />
      <span className={cn(
        "text-[9px] transition-colors",
        (active || completed) ? "text-primary font-bold" : "text-outline"
      )}>
        {label}
      </span>
    </div>
  );
}
