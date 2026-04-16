import { useState, useEffect, useRef, useCallback } from 'react';
import { isQdrantConfigured, getCaseOverview } from '../../services/qdrantService';

const ICONS = {
  pending: '○',
  running: '●',
  success: '✓',
  warning: '⚠',
  error: '✗',
};

const ICON_COLORS = {
  pending: '#525252',
  running: '#f4f4f5',
  success: '#a3a3a3',
  warning: '#d4d4d4',
  error: '#f87171',
};

const LABEL_COLORS = {
  pending: '#737373',
  running: '#f5f5f5',
  success: '#9b9b9b',
  warning: '#d4d4d4',
  error: '#f87171',
};

const DETAIL_COLORS = {
  pending: '#525252',
  running: '#a3a3a3',
  success: '#737373',
  warning: '#d4d4d4',
  error: '#f87171',
};

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function GavelLoader({ selectedCase, selectedSide, onContextLoaded, onComplete }) {
  const [steps, setSteps] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const globalStartRef = useRef(0);
  const timerRef = useRef(null);
  const ranRef = useRef(false);

  useEffect(() => {
    globalStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - globalStartRef.current);
    }, 100);
    return () => clearInterval(timerRef.current);
  }, []);

  const updateStep = useCallback((index, update) => {
    setSteps(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...update };
      return next;
    });
  }, []);

  const runSteps = useCallback(async () => {
    if (ranRef.current) return;
    ranRef.current = true;

    const stepDefs = [
      {
        label: 'Validating session',
        action: async () => {
          if (!selectedCase) throw new Error('No case selected');
          if (!selectedSide) throw new Error('No side selected');
          await new Promise(r => setTimeout(r, 50));
          return `${selectedCase.shortName} · ${selectedCase.year} · ${selectedSide === 'petitioner' ? 'Petitioner' : 'Respondent'}`;
        },
      },
      {
        label: 'Checking knowledge base',
        action: async () => {
          const configured = isQdrantConfigured();
          await new Promise(r => setTimeout(r, 80));
          if (!configured) return 'Qdrant not configured — using mock AI fallback';
          return 'Qdrant connected — courtroom_cases collection available';
        },
      },
      {
        label: 'Loading case context',
        action: async () => {
          const configured = isQdrantConfigured();
          if (!configured) {
            await new Promise(r => setTimeout(r, 100));
            return 'Skipped — no knowledge base available';
          }
          try {
            const overview = await getCaseOverview(selectedCase.id);
            await new Promise(r => setTimeout(r, 100));
            if (overview.formatted) {
              onContextLoaded?.(overview.formatted);
              const docCount = overview.results?.length || 0;
              return `Retrieved ${docCount} document${docCount !== 1 ? 's' : ''} from case knowledge base`;
            }
            return 'No additional context retrieved — proceeding with mock data';
          } catch (err) {
            throw new Error(`Retrieval failed: ${err.message}`);
          }
        },
      },
      {
        label: 'Preparing AI counsel',
        action: async () => {
          await new Promise(r => setTimeout(r, 120));
          const aiSide = selectedSide === 'petitioner' ? 'respondent' : 'petitioner';
          const aiParty = selectedCase[aiSide];
          const articles = selectedCase.articles?.join(', ') || 'N/A';
          return `${aiParty?.name || 'AI Counsel'} (${aiSide}) · Articles: ${articles}`;
        },
      },
      {
        label: 'Initializing voice system',
        action: async () => {
          await new Promise(r => setTimeout(r, 80));
          const key = import.meta.env.VITE_VAPI_PUBLIC_KEY;
          if (!key || key === 'your-vapi-public-key-here') {
            return 'Voice unavailable — text mode only';
          }
          return 'Voice system ready';
        },
      },
      {
        label: 'All rise...',
        action: async () => {
          await new Promise(r => setTimeout(r, 600));
          return 'Court is now in session';
        },
      },
    ];

    setSteps(stepDefs.map(s => ({
      label: s.label,
      detail: null,
      status: 'pending',
      duration: null,
    })));

    for (let i = 0; i < stepDefs.length; i++) {
      const start = Date.now();
      updateStep(i, { status: 'running' });

      try {
        const result = await stepDefs[i].action();
        const duration = Date.now() - start;
        const isWarning = result && (
          result.toLowerCase().includes('not configured') ||
          result.toLowerCase().includes('skipped') ||
          result.toLowerCase().includes('unavailable') ||
          result.toLowerCase().includes('fallback')
        );
        updateStep(i, {
          status: isWarning ? 'warning' : 'success',
          detail: result,
          duration,
        });
      } catch (err) {
        const duration = Date.now() - start;
        updateStep(i, {
          status: 'error',
          detail: err.message,
          duration,
        });
      }
    }

    await new Promise(r => setTimeout(r, 800));
    setIsComplete(true);
    clearInterval(timerRef.current);
    await new Promise(r => setTimeout(r, 700));
    onComplete?.();
  }, [selectedCase, selectedSide, onContextLoaded, onComplete, updateStep]);

  const runStepsRef = useRef(null);
  runStepsRef.current = runSteps;

  useEffect(() => {
    if (ranRef.current) return;
    runStepsRef.current?.();
  }, []);

  const completedCount = steps.filter(s => s.status !== 'pending' && s.status !== 'running').length;
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.9rem, 2.6vw, 2rem)',
        background: '#0f0f10',
        opacity: isComplete ? 0 : 1,
        transition: 'opacity 600ms ease-out',
        pointerEvents: isComplete ? 'none' : 'auto',
      }}
      id="gavel-loader"
    >
      <div
        style={{
          width: 'min(100%, 560px)',
          borderRadius: '0.58rem',
          border: '1px solid #232323',
          background: '#141414',
          display: 'grid',
          gap: '1.1rem',
          padding: 'clamp(0.95rem, 2.2vw, 1.4rem)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{
              color: '#f5f5f5',
              fontFamily: 'var(--font-label)',
              fontSize: '0.76rem',
              letterSpacing: '0.08em',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              CourtRoom AI
            </p>
            <p style={{
              color: '#9b9b9b',
              fontFamily: 'var(--font-label)',
              fontSize: '0.58rem',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              marginTop: 2,
            }}>
              Initializing session
            </p>
          </div>
          <p style={{
            color: '#737373',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
          }}>
            {formatDuration(elapsed)}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '0.25rem',
          borderRadius: 999,
          background: '#242424',
          overflow: 'hidden',
        }}>
          <span style={{
            display: 'block',
            height: '100%',
            borderRadius: 'inherit',
            background: '#f4f4f5',
            width: `${progressPercent}%`,
            transition: 'width 400ms ease-out',
          }} />
        </div>

        {/* Steps card */}
        <div style={{
          borderRadius: '0.5rem',
          border: '1px solid #242424',
          background: '#171717',
          padding: '0.5rem 0',
        }}>
          {steps.map((step, i) => (
            <div key={i}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.55rem 0.85rem',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: ICON_COLORS[step.status],
                  flexShrink: 0,
                  marginTop: 1,
                  animation: step.status === 'running' ? 'loaderPulse 1.2s ease-in-out infinite' : 'none',
                }}>
                  {ICONS[step.status]}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{
                      fontFamily: 'var(--font-label)',
                      fontSize: '0.58rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: LABEL_COLORS[step.status],
                      fontWeight: step.status === 'running' ? 600 : 500,
                    }}>
                      {step.label}
                    </span>
                    {step.duration !== null && (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.5rem',
                        color: '#525252',
                        letterSpacing: '0.06em',
                        flexShrink: 0,
                      }}>
                        {formatDuration(step.duration)}
                      </span>
                    )}
                  </div>
                  {step.detail && (
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.52rem',
                      color: DETAIL_COLORS[step.status],
                      marginTop: 3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      → {step.detail}
                    </p>
                  )}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ height: 1, background: '#242424', margin: '0 0.85rem' }} />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #242424',
          paddingTop: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5rem',
            color: '#525252',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            {completedCount}/{steps.length} complete
          </span>
          {completedCount === steps.length && steps.length > 0 && (
            <span style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.56rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: '#f4f4f5',
            }}>
              Ready
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes loaderPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
