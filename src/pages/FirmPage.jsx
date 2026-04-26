import { useState, useRef, useEffect } from 'react';
import { rankLawyersForCase } from '../services/nimService';
import './FirmPage.css';

const PLACEHOLDER = `Describe your legal situation in as much detail as possible…

For example: "My employer has terminated me without notice or severance pay after 8 years of service, citing a vague 'restructuring' clause. I believe this violates the Industrial Disputes Act and my fundamental rights under Article 21."`;

const RANK_COLORS = ['#e9c176', '#c0c8d8', '#c8a87a', '#8ecfb2', '#a8b8d0', '#d0a8c0'];
const RANK_LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

export default function FirmPage({ onBack }) {
    const [query, setQuery] = useState('');
    const [lawyers, setLawyers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const textareaRef = useRef(null);
    const resultsRef = useRef(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSubmit = async () => {
        const trimmed = query.trim();
        if (!trimmed || loading) return;

        setLoading(true);
        setError('');
        setLawyers([]);
        setSubmitted(true);

        try {
            const result = await rankLawyersForCase(trimmed);
            setLawyers(result);
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
        }
    };

    const handleReset = () => {
        setQuery('');
        setLawyers([]);
        setError('');
        setSubmitted(false);
        setLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    return (
        <div className="firm" id="firm-page">
            {/* Top bar */}
            <div className="firm__topbar">
                <button className="firm__back" onClick={onBack} aria-label="Back to home">
                    ← Back
                </button>
                <span className="firm__brand-title">FIRM</span>
            </div>

            {/* Hero heading */}
            <div className={`firm__hero ${submitted ? 'firm__hero--compact' : ''}`}>
                <h1 className="firm__title">Find the right<br /><span>advocate</span> for your case</h1>
                {!submitted && (
                    <p className="firm__subtitle">
                        Describe your legal situation below. Our AI will identify the&nbsp;6 best Indian advocates ranked by fit.
                    </p>
                )}
            </div>

            {/* Input */}
            <div className={`firm__input-wrap ${submitted ? 'firm__input-wrap--compact' : ''}`}>
                <textarea
                    ref={textareaRef}
                    className="firm__textarea"
                    placeholder={PLACEHOLDER}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKey}
                    rows={submitted ? 4 : 8}
                    disabled={loading}
                    aria-label="Case description"
                />
                <div className="firm__input-actions">
                    {submitted && (
                        <button className="firm__reset-btn" onClick={handleReset} disabled={loading}>
                            New Query
                        </button>
                    )}
                    <span className="firm__hint">Ctrl+Enter to send</span>
                    <button
                        className="firm__send-btn"
                        onClick={handleSubmit}
                        disabled={!query.trim() || loading}
                        id="firm-send-btn"
                    >
                        {loading ? (
                            <span className="firm__send-loading">
                                <span className="firm__spinner" />
                                Analysing…
                            </span>
                        ) : (
                            <>Find Advocates <span className="firm__send-icon">⚖</span></>
                        )}
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="firm__loading-area">
                    <div className="firm__loading-gavel">⚖</div>
                    <p className="firm__loading-text">Consulting the legal directory…</p>
                    <div className="firm__loading-dots">
                        <span /><span /><span />
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="firm__error">
                    <span className="firm__error-icon">⚠</span>
                    <div>
                        <p className="firm__error-title">Could not retrieve results</p>
                        <p className="firm__error-body">{error}</p>
                    </div>
                </div>
            )}

            {/* Results */}
            {lawyers.length > 0 && (
                <div className="firm__results" ref={resultsRef}>
                    <p className="firm__results-label">Top 6 Advocates for Your Case</p>
                    <div className="firm__cards">
                        {lawyers.map((lawyer, i) => (
                            <div
                                key={lawyer.rank ?? i}
                                className={`firm__card ${i === 0 ? 'firm__card--top' : ''}`}
                                style={{ '--accent': RANK_COLORS[i] ?? RANK_COLORS[5], animationDelay: `${i * 0.08}s` }}
                            >
                                {/* Rank badge */}
                                <div className="firm__rank" style={{ color: RANK_COLORS[i] }}>
                                    <span className="firm__rank-num">{RANK_LABELS[i]}</span>
                                    {i === 0 && <span className="firm__rank-crown">★</span>}
                                </div>

                                {/* Main info */}
                                <div className="firm__card-body">
                                    <div className="firm__card-header">
                                        <h3 className="firm__lawyer-name">{lawyer.name}</h3>
                                        <span className="firm__court">{lawyer.court}</span>
                                    </div>
                                    <p className="firm__designation">{lawyer.designation}</p>

                                    {/* Specialty chips */}
                                    {lawyer.specialties?.length > 0 && (
                                        <div className="firm__specialties">
                                            {lawyer.specialties.map((s, j) => (
                                                <span key={j} className="firm__specialty-chip">{s}</span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Rationale */}
                                    <p className="firm__rationale">{lawyer.rationale}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="firm__disclaimer">
                        ⚠ AI-generated recommendations. Verify credentials independently before engaging counsel.
                    </p>
                </div>
            )}
        </div>
    );
}
