import './ToneChip.css';

const DOMINANT_COLORS = {
    Assertive: { bg: 'rgba(233, 193, 118, 0.1)', border: 'rgba(233, 193, 118, 0.3)', text: 'var(--color-secondary)' },
    Measured: { bg: 'rgba(183, 200, 222, 0.1)', border: 'rgba(183, 200, 222, 0.3)', text: 'var(--color-primary-fixed)' },
    Aggressive: { bg: 'rgba(220, 80, 60, 0.1)', border: 'rgba(220, 80, 60, 0.35)', text: '#e87060' },
    Defensive: { bg: 'rgba(172, 140, 80, 0.1)', border: 'rgba(172, 140, 80, 0.3)', text: '#c8ad6a' },
    Persuasive: { bg: 'rgba(130, 200, 150, 0.1)', border: 'rgba(130, 200, 150, 0.3)', text: '#80c89a' },
    Conciliatory: { bg: 'rgba(150, 180, 220, 0.1)', border: 'rgba(150, 180, 220, 0.3)', text: '#a0c0e0' },
    Analytical: { bg: 'rgba(183, 200, 222, 0.1)', border: 'rgba(183, 200, 222, 0.3)', text: 'var(--color-primary-fixed-dim)' },
    Emotional: { bg: 'rgba(210, 120, 140, 0.1)', border: 'rgba(210, 120, 140, 0.3)', text: '#d88090' },
};

function Meter({ label, value }) {
    return (
        <div className="tone-chip__meter">
            <span className="tone-chip__meter-label">{label}</span>
            <div className="tone-chip__meter-track">
                <div className="tone-chip__meter-fill" style={{ width: `${value}%` }} />
            </div>
            <span className="tone-chip__meter-val">{value}</span>
        </div>
    );
}

export default function ToneChip({ tone }) {
    if (!tone) return null;

    const { dominant, confidence, formality, emotionality, tags = [], tip } = tone;
    const palette = DOMINANT_COLORS[dominant] ?? DOMINANT_COLORS.Measured;

    return (
        <div
            className="tone-chip"
            style={{ '--tone-bg': palette.bg, '--tone-border': palette.border, '--tone-text': palette.text }}
        >
            <div className="tone-chip__header">
                <span className="tone-chip__icon">🎙</span>
                <span className="tone-chip__dominant" style={{ color: palette.text }}>{dominant}</span>
                <div className="tone-chip__tags">
                    {tags.map(t => (
                        <span key={t} className="tone-chip__tag">{t}</span>
                    ))}
                </div>
            </div>

            <div className="tone-chip__meters">
                <Meter label="Confidence" value={confidence} />
                <Meter label="Formality" value={formality} />
                <Meter label="Emotionality" value={emotionality} />
            </div>

            {tip && (
                <p className="tone-chip__tip">💡 {tip}</p>
            )}
        </div>
    );
}
