import { useState, useRef, useEffect } from 'react';
import { rankLawyersForCase } from '../services/nimService';
import './FirmPage.css';

const PLACEHOLDER = `Describe your legal situation in as much detail as possible…

For example: "My employer has terminated me without notice or severance pay after 8 years of service, citing a vague 'restructuring' clause. I believe this violates the Industrial Disputes Act and my fundamental rights under Article 21."`;

const RANK_COLORS = ['#e9c176', '#c0c8d8', '#c8a87a', '#8ecfb2', '#a8b8d0', '#d0a8c0'];
const FILTER_DEFAULTS = {
    matterType: '',
    courtLevel: '',
    city: '',
    caseStage: '',
    budgetBand: '',
    counselStyle: '',
    mustHaveExpertise: '',
};
const RESULT_COUNT_OPTIONS = [6, 10, 15];

const MATTER_TYPE_OPTIONS = [
    'Constitutional challenge',
    'Criminal defence / bail',
    'Corporate / M&A dispute',
    'Employment / labour',
    'Family / matrimonial',
    'Insolvency / restructuring',
    'Intellectual property',
    'Property / land',
    'Regulatory / tax',
    'Service / government',
    'Startup / founder dispute',
    'White-collar / fraud',
];

const COURT_LEVEL_OPTIONS = [
    'Supreme Court',
    'Delhi High Court',
    'Bombay High Court',
    'Karnataka High Court',
    'Madras High Court',
    'National Company Law Tribunal',
    'Trial court',
    'Arbitration / tribunal',
];

const CASE_STAGE_OPTIONS = [
    'Pre-litigation strategy',
    'Interim relief / urgent hearing',
    'Trial / evidence stage',
    'Appeal',
    'Final arguments',
    'Settlement leverage',
];

const BUDGET_BAND_OPTIONS = [
    'Premium / senior counsel',
    'Upper-mid litigation team',
    'Value-conscious but strong',
];

const COUNSEL_STYLE_OPTIONS = [
    'Aggressive courtroom operator',
    'Technical and research-heavy',
    'Judge-facing constitutional strategist',
    'Commercial negotiator',
    'Media-sensitive and discreet',
];

function getOrdinalLabel(value) {
    const mod100 = value % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
    const mod10 = value % 10;
    if (mod10 === 1) return `${value}st`;
    if (mod10 === 2) return `${value}nd`;
    if (mod10 === 3) return `${value}rd`;
    return `${value}th`;
}

export default function FirmPage({ onBack }) {
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState(FILTER_DEFAULTS);
    const [resultCount, setResultCount] = useState(6);
    const [lawyers, setLawyers] = useState([]);
    const [source, setSource] = useState(null);
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
        setSource(null);
        setSubmitted(true);

        try {
            const result = await rankLawyersForCase({
                caseSummary: trimmed,
                filters,
                resultCount,
            });
            setLawyers(result.lawyers || []);
            setSource(result.source || null);
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
        setFilters(FILTER_DEFAULTS);
        setResultCount(6);
        setLawyers([]);
        setSource(null);
        setError('');
        setSubmitted(false);
        setLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }));
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
                        Describe your legal situation below. Our AI will identify the&nbsp;best Indian advocates ranked by fit.
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
                <details className="firm__filters">
                    <summary className="firm__filters-summary">Add niche search filters</summary>
                    <div className="firm__filters-grid">
                        <label className="firm__field">
                            <span className="firm__field-label">Number of lawyers</span>
                            <select
                                className="firm__field-input firm__field-input--select"
                                value={resultCount}
                                onChange={(e) => setResultCount(Number(e.target.value))}
                                disabled={loading}
                            >
                                {RESULT_COUNT_OPTIONS.map((option) => (
                                    <option key={option} value={option}>Top {option}</option>
                                ))}
                            </select>
                        </label>

                        <label className="firm__field">
                            <span className="firm__field-label">Matter type</span>
                            <select
                                className="firm__field-input firm__field-input--select"
                                value={filters.matterType}
                                onChange={(e) => updateFilter('matterType', e.target.value)}
                                disabled={loading}
                            >
                                <option value="">Any</option>
                                {MATTER_TYPE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </label>

                        <label className="firm__field">
                            <span className="firm__field-label">Forum</span>
                            <select
                                className="firm__field-input firm__field-input--select"
                                value={filters.courtLevel}
                                onChange={(e) => updateFilter('courtLevel', e.target.value)}
                                disabled={loading}
                            >
                                <option value="">Any</option>
                                {COURT_LEVEL_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </label>

                        <label className="firm__field">
                            <span className="firm__field-label">Case stage</span>
                            <select
                                className="firm__field-input firm__field-input--select"
                                value={filters.caseStage}
                                onChange={(e) => updateFilter('caseStage', e.target.value)}
                                disabled={loading}
                            >
                                <option value="">Any</option>
                                {CASE_STAGE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </label>

                        <label className="firm__field">
                            <span className="firm__field-label">Budget band</span>
                            <select
                                className="firm__field-input firm__field-input--select"
                                value={filters.budgetBand}
                                onChange={(e) => updateFilter('budgetBand', e.target.value)}
                                disabled={loading}
                            >
                                <option value="">Any</option>
                                {BUDGET_BAND_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </label>

                        <label className="firm__field">
                            <span className="firm__field-label">Preferred city</span>
                            <input
                                className="firm__field-input"
                                type="text"
                                value={filters.city}
                                onChange={(e) => updateFilter('city', e.target.value)}
                                placeholder="Delhi, Mumbai, Bengaluru…"
                                disabled={loading}
                            />
                        </label>

                        <label className="firm__field">
                            <span className="firm__field-label">Counsel style</span>
                            <select
                                className="firm__field-input firm__field-input--select"
                                value={filters.counselStyle}
                                onChange={(e) => updateFilter('counselStyle', e.target.value)}
                                disabled={loading}
                            >
                                <option value="">Any</option>
                                {COUNSEL_STYLE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </label>

                        <label className="firm__field firm__field--full">
                            <span className="firm__field-label">Must-have expertise</span>
                            <input
                                className="firm__field-input"
                                type="text"
                                value={filters.mustHaveExpertise}
                                onChange={(e) => updateFilter('mustHaveExpertise', e.target.value)}
                                placeholder="SEBI enforcement, 498A defence, insolvency promoter disputes…"
                                disabled={loading}
                            />
                        </label>
                    </div>
                </details>
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
                    <p className="firm__results-label">Top {lawyers.length} Advocates for Your Case</p>
                    <div className="firm__cards">
                        {lawyers.map((lawyer, i) => {
                            const accentColor = RANK_COLORS[i % RANK_COLORS.length];
                            return (
                            <div
                                key={lawyer.rank ?? i}
                                className={`firm__card ${i === 0 ? 'firm__card--top' : ''}`}
                                style={{ '--accent': accentColor, animationDelay: `${i * 0.08}s` }}
                            >
                                {/* Rank badge */}
                                <div className="firm__rank" style={{ color: accentColor }}>
                                    <span className="firm__rank-num">{getOrdinalLabel(i + 1)}</span>
                                    {i === 0 && <span className="firm__rank-crown">★</span>}
                                </div>

                                {/* Main info */}
                                <div className="firm__card-body">
                                    <div className="firm__card-header">
                                        <h3 className="firm__lawyer-name">{lawyer.name}</h3>
                                        <span className="firm__court">{lawyer.court}</span>
                                    </div>
                                    <p className="firm__designation">{lawyer.designation}</p>
                                    {lawyer.sourceRecord?.city && (
                                        <p className="firm__directory-line">City: {lawyer.sourceRecord.city}</p>
                                    )}
                                    {(lawyer.sourceRecord?.phones?.[0] || lawyer.sourceRecord?.emails?.[0]) && (
                                        <p className="firm__directory-line">
                                            {lawyer.sourceRecord?.phones?.[0] ? `Phone: ${lawyer.sourceRecord.phones[0]}` : ''}
                                            {lawyer.sourceRecord?.phones?.[0] && lawyer.sourceRecord?.emails?.[0] ? ' · ' : ''}
                                            {lawyer.sourceRecord?.emails?.[0] ? `Email: ${lawyer.sourceRecord.emails[0]}` : ''}
                                        </p>
                                    )}

                                    {/* Specialty chips */}
                                    {lawyer.specialties?.length > 0 && (
                                        <div className="firm__specialties">
                                            {lawyer.specialties.map((s, j) => (
                                                <span key={j} className="firm__specialty-chip">{s}</span>
                                            ))}
                                        </div>
                                    )}

                                    {lawyer.fitHighlights?.length > 0 && (
                                        <div className="firm__fit">
                                            {lawyer.fitHighlights.map((highlight, j) => (
                                                <span key={j} className="firm__fit-chip">{highlight}</span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Rationale */}
                                    <p className="firm__rationale">{lawyer.rationale}</p>
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    <p className="firm__disclaimer">
                        ⚠ AI-generated recommendations. Verify credentials independently before engaging counsel.
                    </p>
                    {source?.url && (
                        <p className="firm__source-note">
                            Source: <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a> as of {source.asOf}.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
