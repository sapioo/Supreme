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
type TrialPhase = 'opening' | 'evidence' | 'cross_examination' | 'verdict';
const TRIAL_PHASES: TrialPhase[] = ['opening', 'evidence', 'cross_examination', 'verdict'];

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [trialPhase, setTrialPhase] = useState<TrialPhase>('opening');
  const [isPaused, setIsPaused] = useState(false);
  const [isRedactMode, setIsRedactMode] = useState(false);

  const phaseIndex = TRIAL_PHASES.indexOf(trialPhase);
  const goPrev = () => setTrialPhase(TRIAL_PHASES[Math.max(0, phaseIndex - 1)]);
  const goNext = () => setTrialPhase(TRIAL_PHASES[Math.min(TRIAL_PHASES.length - 1, phaseIndex + 1)]);

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-primary selection:text-background font-mono uppercase">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex items-center px-6 h-16 bg-background border-b border-primary">

        <div className="flex-1 flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain invert" />
          <h1 className="text-xl font-bold tracking-tighter font-sans">SUPREME</h1>
        </div>

        <nav className="hidden md:flex flex-none gap-8 items-center h-full">
          <button
            onClick={() => setView('landing')}
            className={cn(
              "px-2 h-full flex items-center transition-colors duration-100 font-medium",
              view === 'landing' ? "text-primary border-b-2 border-primary" : "text-outline hover:bg-primary hover:text-background"
            )}
          >
            HOME
          </button>
          <button className="text-outline px-2 h-full flex items-center hover:bg-primary hover:text-background transition-colors duration-100">
            ARCHIVE
          </button>
        </nav>

        <div className="flex-1 flex justify-end">
          <div className="relative flex group">
            <div className="p-1 cursor-help hover:bg-primary hover:text-background transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            {/* Security Hover Info */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-primary p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
              <div className="text-[10px] text-outline tracking-[0.2em] mb-2 font-bold">SECURITY INFORMATION</div>
              <div className="text-[10px] text-primary leading-relaxed font-mono">
                <span className="text-outline">&gt;</span> End-to-End Encryption: <span className="text-green-500">Active</span><br />
                <span className="text-outline">&gt;</span> Local Processing: <span className="text-green-500">True</span><br />
                <span className="text-outline">&gt;</span> Data Logging: <span className="text-outline-variant">None</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <LandingView onStart={() => setView('config')} />
          </motion.div>
        )}
        {view === 'config' && (
          <motion.div key="config" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
            <ConfigView onStart={() => setView('simulation')} />
          </motion.div>
        )}
        {view === 'simulation' && (
          <motion.div key="simulation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <SimulationView trialPhase={trialPhase} isRedactMode={isRedactMode} isPaused={isPaused} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls — simulation only, slides up on mount */}
      <AnimatePresence>
        {view === 'simulation' && (
          <motion.footer
            key="footer"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-8 bg-background/90 backdrop-blur-xl border-t border-primary"
          >
            <ControlBtn
              icon={<Mic className="w-5 h-5" />}
              label="RECORD"
              onClick={() => console.log('Awaiting Web Speech API input for witness testimony...')}
            />
            <ControlBtn
              icon={<StepBack className="w-5 h-5" />}
              label="PREVIOUS"
              onClick={goPrev}
              isActive={phaseIndex === 0}
            />
            <ControlBtn
              icon={<Pause className="w-5 h-5" />}
              label={isPaused ? 'OBJECTION!' : 'PAUSE'}
              onClick={() => setIsPaused(p => !p)}
              isActive={isPaused}
            />
            <ControlBtn
              icon={<StepForward className="w-5 h-5" />}
              label="NEXT"
              onClick={goNext}
              isActive={phaseIndex === TRIAL_PHASES.length - 1}
            />
            <ControlBtn
              icon={<Eraser className="w-5 h-5" />}
              label="REDACT"
              onClick={() => setIsRedactMode(r => !r)}
              isActive={isRedactMode}
            />
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}

function ControlBtn({
  icon, label, onClick, isActive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center px-4 py-2 transition-all duration-100 active:scale-95 min-w-[60px]",
        isActive ? "bg-primary text-background" : "text-primary hover:bg-surface-container"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold mt-1 tracking-widest">{label}</span>
    </button>
  );
}

function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center pt-16 relative overflow-hidden">
      <div className="absolute inset-0 dossier-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 text-center px-4">
        <div className="mb-2 text-outline tracking-[0.5em] text-xs">YOU CANT KNOW IT ALL</div>
        <h1 className="text-7xl md:text-9xl font-extrabold tracking-tighter mb-8 font-sans">
          SUPREME
        </h1>

        <div className="flex flex-col md:flex-row gap-12 items-center justify-center mb-16">
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={onStart}
              className="px-12 py-4 border border-primary bg-transparent text-primary font-bold text-xl tracking-widest hover:bg-primary hover:text-background transition-all duration-300 active:scale-95 group relative overflow-hidden"
            >
              <span className="relative z-10">START</span>
            </button>
            <div className="flex items-center gap-2 text-[10px] text-outline-variant uppercase">
              <span className="w-2 h-2 bg-outline-variant rounded-full animate-pulse" />
              Ready to proceed
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full px-12 grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-primary/10">
        <InfoBlock title="STEP 1" content="Input all case details, define parties, establish timelines, and upload evidence for indexing.." />
        <InfoBlock title="STEP 2" content="Run multi-phase court proceedings, including opening statements, evidence presentation, and cross-examination." />
        <InfoBlock title="STEP 3" content="The algorithmic judge evaluates all session transcripts and evidence to render a final, impartial ruling." />
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
          <div className="text-lg font-bold font-sans">Court Management</div>
          <div className="text-[10px] text-outline mt-1 tracking-widest uppercase">Status: Secure</div>
        </div>
        <nav className="flex-1 py-4">
          <SideLink icon={<Gavel className="w-4 h-4" />} label="DOCKET" active />
          <SideLink icon={<FolderOpen className="w-4 h-4" />} label="EVIDENCE" />
          <SideLink icon={<FileText className="w-4 h-4" />} label="TRANSCRIPT" />
          <SideLink icon={<BookOpen className="w-4 h-4" />} label="STATUTES" />
        </nav>
        <div className="p-6 mt-auto border-t border-primary/20">
          <div className="text-[10px] text-outline mb-2 uppercase">Session ID</div>
          <div className="text-[10px] break-all opacity-50 font-mono">0x4F92...B331</div>
        </div>
      </aside>

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-primary pb-8 gap-4">
          <div>
            <h1 className="text-5xl font-extrabold font-sans tracking-tighter mb-2">CONFIGURATION</h1>
            <p className="text-outline text-xs tracking-[0.3em] font-medium uppercase">CREATE NEW CASE PROFILE</p>
          </div>
          <div className="text-right">
            <span className="text-xs px-3 py-1 border border-primary bg-primary/10 tracking-widest uppercase">CASE</span>
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
            <div className="space-y-2 overflow-hidden">
              <label className="block text-[10px] tracking-widest text-outline">PARTIES INVOLVED</label>
              <div className="flex items-end gap-4 w-full">
                <input
                  className="flex-1 min-w-0 w-full bg-transparent border-0 border-b border-primary text-primary font-bold tracking-widest py-3 focus:ring-0 focus:outline-none focus:border-b-2 placeholder:text-surface-container-highest"
                  placeholder="PLAINTIFF"
                  type="text"
                />
                <span className="text-outline font-bold tracking-widest pb-3 shrink-0">VS</span>
                <input
                  className="flex-1 min-w-0 w-full bg-transparent border-0 border-b border-primary text-primary font-bold tracking-widest py-3 focus:ring-0 focus:outline-none focus:border-b-2 placeholder:text-surface-container-highest"
                  placeholder="DEFENDANT"
                  type="text"
                />
              </div>
            </div>
          </div>

          <Field label="CASE SUMMARY" placeholder="PRIMARY LEGAL ALLEGATIONS AND SCOPE..." rows={2} />
          <FactsInput />

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
                <span className="text-[9px] text-outline tracking-widest uppercase">All systems operational</span>
              </div>
              <span className="text-[9px] text-outline tracking-widest uppercase">Version: 1.0.0</span>
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

function FactsInput() {
  const [facts, setFacts] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addFact = () => {
    const trimmed = input.trim();
    if (trimmed && !facts.includes(trimmed)) {
      setFacts(f => [...f, trimmed]);
      setInput('');
    }
  };

  const removeFact = (idx: number) => setFacts(f => f.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <label className="block text-[10px] tracking-widest text-outline">FACTS OF THE CASE</label>

      {/* Existing facts as chips */}
      {facts.length > 0 && (
        <ul className="flex flex-col gap-2">
          {facts.map((fact, i) => (
            <li
              key={i}
              className="flex items-start gap-3 border border-primary/30 px-4 py-2 text-sm font-mono group"
            >
              <span className="text-outline shrink-0 select-none">{String(i + 1).padStart(2, '0')}.</span>
              <span className="flex-1 text-primary leading-relaxed">{fact}</span>
              <button
                onClick={() => removeFact(i)}
                className="opacity-0 group-hover:opacity-100 text-outline hover:text-primary transition-opacity shrink-0 text-xs"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Input row */}
      <div className="flex items-center gap-3 border-b border-primary">
        <input
          className="flex-1 min-w-0 bg-transparent text-primary font-bold tracking-widest py-3 focus:outline-none placeholder:text-surface-container-highest text-sm"
          placeholder="ADD A FACT AND PRESS ENTER OR CLICK ADD"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFact(); } }}
        />
        <button
          onClick={addFact}
          className="shrink-0 text-[10px] font-bold tracking-widest border border-primary px-3 py-1 hover:bg-primary hover:text-background transition-colors"
        >
          + ADD
        </button>
      </div>
    </div>
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

function SimulationView({
  trialPhase,
  isRedactMode,
  isPaused,
}: {
  trialPhase: TrialPhase;
  isRedactMode: boolean;
  isPaused: boolean;
}) {
  const phaseLabels: Record<TrialPhase, string> = {
    opening: 'SESSION 1 — OPENING',
    evidence: 'SESSION 2 — EVIDENCE',
    cross_examination: 'CROSS-EXAMINATION',
    verdict: 'FINAL VERDICT',
  };

  return (
    <div
      className="fixed inset-0 top-16 bottom-20 overflow-hidden"
      style={{ cursor: isRedactMode ? 'crosshair' : undefined }}
    >
      {/* SideNavBar - true fixed */}
      <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col bg-background border-r border-primary hidden md:flex">
        <div className="p-6 border-b border-primary">
          <h2 className="text-lg font-bold font-sans">Court Management</h2>
          <p className="text-[10px] text-outline uppercase">Status: Secure</p>
        </div>
        <nav className="flex-grow">
          <SideLink icon={<Gavel className="w-4 h-4" />} label="DOCKET" active />
          <SideLink icon={<FolderOpen className="w-4 h-4" />} label="EVIDENCE" />
          <SideLink icon={<FileText className="w-4 h-4" />} label="TRANSCRIPT" />
          <SideLink icon={<BookOpen className="w-4 h-4" />} label="STATUTES" />
        </nav>
        <div className="p-6 border-t border-primary mt-auto">
          <div className="bg-surface-container-highest p-4 opacity-75">
            <p className="text-[10px] mb-2 uppercase">Confidential Documents</p>
            <div className="h-2 w-full bg-outline-variant animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Simulation Split View - exactly fills the remaining space */}
      <div className="absolute top-0 right-0 bottom-0 left-0 md:left-64 flex flex-row">
        {/* PROSECUTION */}
        <section className="flex-1 flex flex-col border-r border-primary relative group">
          <div className="p-4 border-b border-primary flex justify-between items-center bg-background">
            <span className="text-xs tracking-widest uppercase">Prosecution Counsel</span>
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
              <h3 className="font-sans text-2xl font-extrabold tracking-tighter uppercase">Opening Statement</h3>
              <p className="text-sm leading-relaxed text-outline uppercase">Preparing opening arguments... Reviewing physical evidence and witness testimony.</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </section>

        {/* DEFENSE */}
        <section className="flex-1 flex flex-col relative group">
          <div className="p-4 border-b border-primary flex justify-between items-center bg-background">
            <span className="text-xs tracking-widest uppercase">Defense Counsel</span>
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
              <h3 className="font-sans text-2xl font-extrabold tracking-tighter uppercase">Opening Statement</h3>
              <p className="text-sm leading-relaxed uppercase">Awaiting prosecution's opening statement. Defense is ready.</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </section>
      </div>

      {/* Progress Timeline Overlay */}
      <div className="fixed bottom-20 md:bottom-20 left-0 md:left-64 right-0 h-16 bg-background border-t border-primary flex items-center px-12 relative z-40">
        {/* paused banner */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 z-10 pointer-events-none">
            <span className="text-xs font-bold tracking-[0.4em] text-primary animate-pulse">⚖ OBJECTION — PROCEEDINGS PAUSED</span>
          </div>
        )}
        <div className="absolute left-12 right-12 h-[1px] bg-outline-variant top-1/2 -translate-y-1/2" />
        <div
          className="absolute left-12 h-[1px] bg-primary top-1/2 -translate-y-1/2 transition-all duration-500"
          style={{ width: `${(['opening', 'evidence', 'cross_examination', 'verdict'].indexOf(trialPhase) / 3) * 100}%` }}
        />
        <div className="relative flex justify-between w-full">
          <TimelineNode label="OPENING" completed={['opening', 'evidence', 'cross_examination', 'verdict'].indexOf(trialPhase) >= 0} active={trialPhase === 'opening'} />
          <TimelineNode label="EVIDENCE" completed={['evidence', 'cross_examination', 'verdict'].indexOf(trialPhase) >= 0} active={trialPhase === 'evidence'} />
          <TimelineNode label="CROSS-EXAM" completed={['cross_examination', 'verdict'].indexOf(trialPhase) >= 0} active={trialPhase === 'cross_examination'} />
          <TimelineNode label="VERDICT" completed={trialPhase === 'verdict'} active={trialPhase === 'verdict'} />
        </div>
      </div>
    </div>
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
