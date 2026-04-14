import React, { useState, useEffect, useRef } from 'react';
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
  Circle,
  Image,
  Film,
  FileSearch,
  File,
  Filter,
  Clock,
  User,
  Scale
} from 'lucide-react';
import { cn } from './lib/utils';

type View = 'landing' | 'config' | 'simulation' | 'evidence';
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
            <SimulationView trialPhase={trialPhase} isRedactMode={isRedactMode} isPaused={isPaused} onViewEvidence={() => setView('evidence')} />
          </motion.div>
        )}
        {view === 'evidence' && (
          <motion.div key="evidence" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full">
            <EvidenceView onBack={() => setView('simulation')} />
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

// ─── Evidence Types ────────────────────────────────────────────────────────────
type EvidenceParty = 'prosecution' | 'defense' | 'court';
type EvidenceType = 'document' | 'image' | 'video' | 'testimony' | 'physical';

interface EvidenceRecord {
  id: string;
  title: string;
  description: string;
  party: EvidenceParty;
  type: EvidenceType;
  phase: string;
  submittedAt: string;
  admissible: boolean;
  tags: string[];
}

const DEMO_EVIDENCE: EvidenceRecord[] = [
  {
    id: 'EX-001',
    title: 'Security Footage — Warehouse District, 2:47 AM',
    description: 'CCTV recording from the adjacent building showing defendant\'s vehicle at the scene of the alleged incident. Timestamp verified by local law enforcement.',
    party: 'prosecution',
    type: 'video',
    phase: 'Opening Statement',
    submittedAt: '2026-04-14T09:15:00',
    admissible: true,
    tags: ['CCTV', 'Alibi', 'Vehicle'],
  },
  {
    id: 'EX-002',
    title: 'Signed Contract — April 3rd, 2026',
    description: 'Original signed contract between plaintiff and defendant outlining the terms of the financial agreement. Notarised and authenticated.',
    party: 'prosecution',
    type: 'document',
    phase: 'Opening Statement',
    submittedAt: '2026-04-14T09:18:00',
    admissible: true,
    tags: ['Contract', 'Financial', 'Notarised'],
  },
  {
    id: 'EX-003',
    title: 'Alibi Testimony — James R. Holloway',
    description: 'Sworn affidavit from defense witness stating defendant was present at a separate location during the time of the alleged offence.',
    party: 'defense',
    type: 'testimony',
    phase: 'Opening Statement',
    submittedAt: '2026-04-14T09:31:00',
    admissible: true,
    tags: ['Alibi', 'Witness', 'Affidavit'],
  },
  {
    id: 'EX-004',
    title: 'Forensic Analysis Report — Item #7',
    description: 'Independent forensic laboratory analysis of physical item #7 recovered from the scene. Results indicate inconclusive match to defendant\'s DNA profile.',
    party: 'defense',
    type: 'document',
    phase: 'Evidence Presentation',
    submittedAt: '2026-04-14T10:02:00',
    admissible: true,
    tags: ['Forensic', 'DNA', 'Lab Report'],
  },
  {
    id: 'EX-005',
    title: 'Bank Statement — March–April 2026',
    description: 'Financial records subpoenaed by the court showing transaction history relevant to the allegation of misappropriation of funds.',
    party: 'court',
    type: 'document',
    phase: 'Evidence Presentation',
    submittedAt: '2026-04-14T10:45:00',
    admissible: true,
    tags: ['Financial', 'Subpoena', 'Bank Records'],
  },
  {
    id: 'EX-006',
    title: 'Photograph — Physical Item #12',
    description: 'High-resolution photograph of physical item #12 taken at the scene by the responding officer. Chain of custody verified.',
    party: 'prosecution',
    type: 'image',
    phase: 'Cross-Examination',
    submittedAt: '2026-04-14T11:10:00',
    admissible: false,
    tags: ['Physical Evidence', 'Photograph', 'Scene'],
  },
];

const PARTY_STYLES: Record<EvidenceParty, { label: string; bar: string; badge: string; text: string }> = {
  prosecution: { label: 'Prosecution', bar: 'bg-white', badge: 'bg-white text-black', text: 'text-white' },
  defense: { label: 'Defense', bar: 'bg-[#6b7280]', badge: 'bg-[#6b7280] text-white', text: 'text-[#9ca3af]' },
  court: { label: 'Court', bar: 'bg-[#d4af37]', badge: 'bg-[#d4af37] text-black', text: 'text-[#d4af37]' },
};

const TYPE_ICONS: Record<EvidenceType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  video: <Film className="w-4 h-4" />,
  testimony: <User className="w-4 h-4" />,
  physical: <FileSearch className="w-4 h-4" />,
};

function EvidenceView({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<EvidenceParty | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EvidenceType | 'all'>('all');

  const filtered = DEMO_EVIDENCE.filter(e =>
    (filter === 'all' || e.party === filter) &&
    (typeFilter === 'all' || e.type === typeFilter)
  );

  return (
    <main className="flex min-h-screen pt-16 bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-none w-64 flex-col bg-background border-r border-primary fixed top-16 bottom-0 left-0">
        <div className="p-6 border-b border-primary">
          <h2 className="text-lg font-bold font-sans">Court Management</h2>
          <p className="text-[10px] text-outline uppercase">Status: Secure</p>
        </div>
        <nav className="flex-grow">
          <SideLink icon={<Gavel className="w-4 h-4" />} label="DOCKET" onClick={onBack} />
          <SideLink icon={<FolderOpen className="w-4 h-4" />} label="EVIDENCE" active />
          <SideLink icon={<FileText className="w-4 h-4" />} label="TRANSCRIPT" onClick={onBack} />
          <SideLink icon={<BookOpen className="w-4 h-4" />} label="STATUTES" onClick={onBack} />
        </nav>
        <div className="p-6 border-t border-primary mt-auto">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-outline"><span className="w-2 h-2 bg-white inline-block" /> Prosecution</div>
            <div className="flex items-center gap-2 text-[10px] text-outline"><span className="w-2 h-2 bg-[#6b7280] inline-block" /> Defense</div>
            <div className="flex items-center gap-2 text-[10px] text-outline"><span className="w-2 h-2 bg-[#d4af37] inline-block" /> Court</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-0">
        {/* Page Header */}
        <div className="px-10 py-8 border-b border-primary flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold font-sans tracking-tighter mb-1">EVIDENCE REGISTER</h1>
            <p className="text-[10px] text-outline tracking-widest uppercase">{filtered.length} of {DEMO_EVIDENCE.length} Records — Current Session</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Scale className="w-4 h-4 text-outline" />
            <span className="text-[10px] text-outline tracking-widest uppercase">Filter by Party:</span>
            {(['all', 'prosecution', 'defense', 'court'] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={cn(
                  "text-[10px] tracking-widest px-3 py-1 border transition-colors font-bold uppercase",
                  filter === p ? "bg-primary text-background border-primary" : "border-primary/40 text-outline hover:border-primary hover:text-primary"
                )}
              >
                {p === 'all' ? 'All' : PARTY_STYLES[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter Strip */}
        <div className="px-10 py-3 border-b border-primary/30 flex gap-4 items-center flex-wrap">
          <Filter className="w-3 h-3 text-outline" />
          <span className="text-[9px] text-outline tracking-widest">TYPE:</span>
          {(['all', 'document', 'image', 'video', 'testimony', 'physical'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "text-[9px] tracking-widest px-2 py-0.5 uppercase transition-colors",
                typeFilter === t ? "text-primary underline underline-offset-4" : "text-outline hover:text-primary"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Evidence Table */}
        <div className="flex-1 px-10 py-6 space-y-3 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="py-20 text-center text-outline text-sm tracking-widest">No evidence matches the current filter.</div>
          )}
          {filtered.map((ev) => {
            const ps = PARTY_STYLES[ev.party];
            return (
              <div key={ev.id} className="flex gap-0 border border-primary/20 hover:border-primary transition-colors group relative overflow-hidden">
                {/* Party colour bar */}
                <div className={cn("w-1 flex-none", ps.bar)} />

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Exhibit ID */}
                      <span className="text-[10px] font-mono text-outline border border-primary/30 px-2 py-0.5">{ev.id}</span>
                      {/* Type badge */}
                      <span className="flex items-center gap-1.5 text-[10px] tracking-widest text-outline uppercase border border-primary/20 px-2 py-0.5">
                        {TYPE_ICONS[ev.type]} {ev.type}
                      </span>
                      {/* Party badge */}
                      <span className={cn("text-[10px] tracking-widest font-bold px-2 py-0.5 uppercase", ps.badge)}>
                        {ps.label}
                      </span>
                      {/* Admissibility */}
                      <span className={cn(
                        "text-[10px] tracking-widest px-2 py-0.5 uppercase font-bold border",
                        ev.admissible ? "text-green-500 border-green-500/40" : "text-red-500 border-red-500/40"
                      )}>
                        {ev.admissible ? 'Admitted' : 'Objected'}
                      </span>
                    </div>
                    {/* Time & phase */}
                    <div className="flex flex-col items-end gap-1 text-[9px] text-outline shrink-0">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ev.submittedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="uppercase tracking-widest">{ev.phase}</span>
                    </div>
                  </div>

                  <div>
                    <p className={cn("font-bold tracking-tight font-sans text-sm mb-1 group-hover:text-primary transition-colors", ps.text)}>{ev.title}</p>
                    <p className="text-[11px] text-outline leading-relaxed normal-case">{ev.description}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-2 flex-wrap">
                    {ev.tags.map(tag => (
                      <span key={tag} className="text-[9px] text-outline border border-primary/10 px-2 py-0.5 tracking-widest uppercase">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
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
  const [activeTab, setActiveTab] = useState<'prosecution' | 'defense'>('prosecution');
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

        {/* ── Terminal Tabs ─────────────────────────────────────────────── */}
        <div className="flex items-stretch border border-primary mb-10">
          {(['prosecution', 'defense'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 px-6 text-xs font-bold tracking-[0.25em] uppercase transition-all duration-150 font-mono flex items-center justify-center gap-3",
                activeTab === tab
                  ? "bg-primary text-background"
                  : "text-outline hover:text-primary hover:bg-primary/5"
              )}
            >
              {tab === 'prosecution' ? 'PROSECUTION DATA' : 'DEFENSE DATA'}
            </button>
          ))}
        </div>

        {/* ── Prosecution Fields ────────────────────────────────────────── */}
        {activeTab === 'prosecution' && (
          <div className="space-y-12">
            {/* Case Type + Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-2">
                <label className="block text-[10px] tracking-widest text-outline">CASE TYPE</label>
                <div className="relative">
                  <select className="w-full bg-transparent border-0 border-b border-primary text-primary font-bold tracking-widest py-3 focus:ring-0 appearance-none cursor-pointer">
                    <option className="bg-background">CRIMINAL</option>
                    <option className="bg-background">CIVIL</option>
                    <option className="bg-background">CORPORATE</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-3 w-5 h-5 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2 overflow-hidden">
                <label className="block text-[10px] tracking-widest text-outline">DEFENDANT NAME</label>
                <input
                  className="w-full bg-transparent border-0 border-b border-primary text-primary font-bold tracking-widest py-3 focus:ring-0 focus:outline-none focus:border-b-2 placeholder:text-surface-container-highest"
                  placeholder="FULL LEGAL NAME OF DEFENDANT"
                  type="text"
                />
              </div>
            </div>

            <Field label="THE CHARGES / ALLEGATIONS" placeholder="STATE THE FORMAL CHARGES OR CIVIL ALLEGATIONS IN FULL..." rows={3} />
            <Field label="PROSECUTION NARRATIVE" placeholder="THE SEQUENCE OF EVENTS ACCORDING TO THE ACCUSER / PLAINTIFF..." rows={4} />

            {/* Prosecution Evidence */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] tracking-widest text-outline">PROSECUTION EVIDENCE</label>
                <span className="text-[10px] text-outline">MAX_FILE_SIZE: 50MB</span>
              </div>
              <div className="border border-primary border-dashed p-12 text-center group cursor-pointer hover:bg-primary/5 transition-colors">
                <Upload className="w-10 h-10 mx-auto mb-4 text-outline group-hover:text-primary transition-colors" />
                <p className="text-xs tracking-widest text-outline group-hover:text-primary">DRAG EXHIBITS HERE OR CLICK TO BROWSE</p>
                <p className="text-[9px] mt-2 text-outline-variant">PDF, JPG, PNG, DOCX SUPPORTED</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Defense Fields ────────────────────────────────────────────── */}
        {activeTab === 'defense' && (
          <div className="space-y-12">
            {/* Plea / Stance */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-widest text-outline">THE PLEA / STANCE</label>
              <div className="relative">
                <select className="w-full bg-transparent border-0 border-b border-primary text-primary font-bold tracking-widest py-3 focus:ring-0 appearance-none cursor-pointer">
                  <option className="bg-background">NOT GUILTY</option>
                  <option className="bg-background">SELF-DEFENSE</option>
                  <option className="bg-background">LACK OF EVIDENCE</option>
                  <option className="bg-background">ALIBI</option>
                  <option className="bg-background">PROCEDURAL VIOLATION</option>
                  <option className="bg-background">NO CONTEST</option>
                </select>
                <ChevronDown className="absolute right-0 top-3 w-5 h-5 pointer-events-none" />
              </div>
            </div>

            <Field label="DEFENSE COUNTER-NARRATIVE" placeholder="THE ALTERNATE SEQUENCE OF EVENTS AS STATED BY THE DEFENDANT..." rows={4} />
            <Field label="WITNESS / ALIBI LIST" placeholder="LIST WITNESSES AND ALIBI DETAILS, ONE PER LINE..." rows={3} />
            <FactsInput />
            <TimelineInput />

            {/* Defense Evidence */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] tracking-widest text-outline">DEFENSE EVIDENCE</label>
                <span className="text-[10px] text-outline">MAX_FILE_SIZE: 50MB</span>
              </div>
              <div className="border border-primary border-dashed p-12 text-center group cursor-pointer hover:bg-primary/5 transition-colors">
                <Upload className="w-10 h-10 mx-auto mb-4 text-outline group-hover:text-primary transition-colors" />
                <p className="text-xs tracking-widest text-outline group-hover:text-primary">DRAG EXHIBITS HERE OR CLICK TO BROWSE</p>
                <p className="text-[9px] mt-2 text-outline-variant">PDF, JPG, PNG, DOCX SUPPORTED</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Global: Start Simulation ──────────────────────────────────── */}
        <div className="pt-12">
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
    </main>
  );
}

function SideLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <a className={cn(
      "flex items-center px-6 py-4 gap-4 transition-colors duration-100 font-bold text-xs tracking-widest cursor-pointer",
      active ? "bg-primary text-background" : "text-outline hover:text-primary hover:bg-surface-container"
    )} onClick={(e) => { e.preventDefault(); onClick?.(); }} href="#">
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

interface TimelineEvent { date: string; event: string; }

function TimelineInput() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [date, setDate] = useState('');
  const [event, setEvent] = useState('');

  const addEvent = () => {
    const d = date.trim();
    const e = event.trim();
    if (!d || !e) return;
    setEvents(prev => [...prev, { date: d, event: e }]);
    setDate('');
    setEvent('');
  };

  const removeEvent = (idx: number) => setEvents(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <label className="block text-[10px] tracking-widest text-outline">TIMELINE OF EVENTS</label>

      {/* Logged events */}
      {events.length > 0 && (
        <ul className="flex flex-col gap-2">
          {events
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((ev, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border border-primary/30 px-4 py-2 text-sm font-mono group"
              >
                <span className="text-outline shrink-0 select-none w-[90px]">{ev.date}</span>
                <span className="flex-1 text-primary leading-relaxed">{ev.event}</span>
                <button
                  onClick={() => removeEvent(i)}
                  className="opacity-0 group-hover:opacity-100 text-outline hover:text-primary transition-opacity shrink-0 text-xs"
                >
                  ✕
                </button>
              </li>
            ))}
        </ul>
      )}

      {/* Two-column input row */}
      <div className="flex items-center gap-0 border-b border-primary">
        {/* Date picker */}
        <input
          type="date"
          className="flex-none w-38 bg-transparent text-outline font-mono tracking-widest py-3 focus:outline-none text-sm border-r border-primary/30 pr-3 mr-3 [color-scheme:dark]"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        {/* Event description */}
        <input
          className="flex-1 min-w-0 bg-transparent text-primary font-bold tracking-widest py-3 focus:outline-none placeholder:text-surface-container-highest text-sm"
          placeholder="DESCRIBE THE EVENT"
          value={event}
          onChange={e => setEvent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEvent(); } }}
        />
        <button
          onClick={addEvent}
          disabled={!date || !event.trim()}
          className="text-[10px] font-bold tracking-widest py-3 px-4 hover:bg-primary hover:text-background transition-colors disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
        >
          ADD
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

const AI_STAGES = [
  { label: 'Parsing case brief', pct: 15 },
  { label: 'Loading precedents', pct: 32 },
  { label: 'Synthesising argument', pct: 58 },
  { label: 'Reviewing evidence', pct: 74 },
  { label: 'Formulating response', pct: 91 },
  { label: 'Ready to proceed', pct: 100 },
];

function AIProcessingIndicator({ isPaused }: { isPaused: boolean }) {
  const [stage, setStage] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setStage(s => {
        const next = (s + 1) % AI_STAGES.length;
        return next;
      });
    }, 2200);
    return () => clearInterval(id);
  }, [isPaused]);

  // Animate the percentage smoothly
  useEffect(() => {
    const target = isPaused ? displayPct : AI_STAGES[stage].pct;
    const diff = target - displayPct;
    if (diff === 0) return;
    const step = diff > 0 ? 1 : -1;
    const id = setInterval(() => {
      setDisplayPct(p => {
        if (Math.abs(AI_STAGES[stage].pct - p) <= 1) { clearInterval(id); return AI_STAGES[stage].pct; }
        return p + step;
      });
    }, 12);
    return () => clearInterval(id);
  }, [stage, isPaused]);

  const current = isPaused ? { label: 'Proceedings paused', pct: displayPct } : AI_STAGES[stage];

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[9px] tracking-widest text-outline uppercase font-bold">AI Processing</span>
        <span className={cn("text-[9px] font-mono", isPaused ? "text-outline" : "text-primary")}>{displayPct}%</span>
      </div>
      {/* Track */}
      <div className="h-1.5 w-full bg-outline-variant/30 relative overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 relative"
          style={{ width: `${displayPct}%` }}
        >
          {/* shimmer */}
          {!isPaused && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.4s_linear_infinite]" />
          )}
        </div>
      </div>
      <p className={cn(
        "text-[9px] tracking-wide leading-snug transition-opacity duration-300",
        isPaused ? "text-outline opacity-50" : "text-outline"
      )}>
        {isPaused ? '— Proceedings paused' : `↳ ${current.label}…`}
      </p>
    </div>
  );
}

function SimulationView({

  trialPhase,
  isRedactMode,
  isPaused,
  onViewEvidence,
}: {
  trialPhase: TrialPhase;
  isRedactMode: boolean;
  isPaused: boolean;
  onViewEvidence: () => void;
}) {
  // ── Judge HUD state ───────────────────────────────────────────────
  // verdictLean: 0 = full defense, 100 = full prosecution
  const [verdictLean, setVerdictLean] = useState(52);
  const [objections, setObjections] = useState({ prosecution: 2, defense: 1 });
  const [sessionSeconds, setSessionSeconds] = useState(120);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer & drift verdict lean when phase changes
  useEffect(() => {
    setSessionSeconds(120);
    setVerdictLean(prev => Math.min(95, Math.max(5, prev + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 12 + 3))));
  }, [trialPhase]);

  // Live countdown
  useEffect(() => {
    if (isPaused) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setSessionSeconds(s => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, trialPhase]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const timerUrgent = sessionSeconds <= 20;

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
          <SideLink icon={<FolderOpen className="w-4 h-4" />} label="EVIDENCE" onClick={onViewEvidence} />
          <SideLink icon={<FileText className="w-4 h-4" />} label="TRANSCRIPT" />
          <SideLink icon={<BookOpen className="w-4 h-4" />} label="STATUTES" />
        </nav>
        <div className="p-6 border-t border-primary mt-auto">
          <AIProcessingIndicator isPaused={isPaused} />
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

      {/* Judge HUD */}
      <div className="fixed bottom-20 left-0 md:left-64 right-0 h-16 bg-background border-t border-primary z-40 flex items-stretch divide-x divide-primary/30">

        {/* 1. Verdict Lean */}
        <div className="flex-1 flex flex-col justify-center px-5 gap-1 min-w-0 relative overflow-hidden">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[8px] tracking-[0.2em] text-white font-bold uppercase">Prosecution</span>
            <span className="text-[8px] tracking-[0.15em] text-outline font-bold uppercase">VERDICT LEAN</span>
            <span className="text-[8px] tracking-[0.2em] text-[#6b7280] font-bold uppercase">Defense</span>
          </div>
          <div className="relative h-2 w-full bg-[#6b7280]/30">
            {/* prosecution fill from left */}
            <div
              className="absolute left-0 top-0 h-full bg-white transition-all duration-700"
              style={{ width: `${verdictLean}%` }}
            />
            {/* defense fill from right */}
            <div
              className="absolute right-0 top-0 h-full bg-[#6b7280] transition-all duration-700"
              style={{ width: `${100 - verdictLean}%` }}
            />
            {/* centre needle */}
            <div className="absolute left-1/2 top-0 h-full w-[2px] bg-background -translate-x-1/2 z-10" />
          </div>
          <div className="flex justify-between">
            <span className="text-[8px] text-white font-mono">{verdictLean}%</span>
            <span className="text-[8px] text-[#6b7280] font-mono">{100 - verdictLean}%</span>
          </div>
        </div>

        {/* 2. Objection Counter */}
        <div className="flex items-center gap-4 px-6 flex-none">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] tracking-widest text-outline uppercase">Objections</span>
            <div className="flex gap-3 mt-1">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-white tracking-widest">PROS</span>
                <span className="text-xl font-extrabold font-sans text-white leading-none">{objections.prosecution}</span>
              </div>
              <div className="w-px bg-primary/20 mx-1" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-[#9ca3af] tracking-widest">DEF</span>
                <span className="text-xl font-extrabold font-sans text-[#9ca3af] leading-none">{objections.defense}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Session Timer */}
        <div className="flex flex-col items-center justify-center px-6 flex-none gap-0.5">
          <span className="text-[8px] tracking-[0.2em] text-outline uppercase">Session Time</span>
          <span className={cn(
            "text-2xl font-extrabold font-mono leading-none tabular-nums transition-colors",
            timerUrgent ? "text-red-500 animate-pulse" : "text-primary"
          )}>
            {fmtTime(sessionSeconds)}
          </span>
          <span className="text-[8px] text-outline tracking-widest uppercase">{trialPhase.replace('_', ' ')}</span>
        </div>

        {/* Paused overlay */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[1px] z-20">
            <span className="text-[11px] font-bold tracking-[0.4em] text-primary animate-pulse">⚖ OBJECTION — PROCEEDINGS PAUSED</span>
          </div>
        )}
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
