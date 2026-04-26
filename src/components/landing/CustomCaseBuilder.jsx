import { useState, useRef } from 'react';
import './CustomCaseBuilder.css';

// ── Chip input (type + press Enter / click Add) ───────────────────────────────
function ChipInput({ label, placeholder, chips, onAdd, onRemove }) {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

    const handleAdd = () => {
        const trimmed = value.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setValue('');
        inputRef.current?.focus();
    };

    const handleKey = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
        if (e.key === 'Backspace' && !value && chips.length > 0) {
            onRemove(chips.length - 1);
        }
    };

    return (
        <div className="ccb-chip-field">
            <label className="ccb-label">{label}</label>
            <div className="ccb-chip-row">
                {chips.map((chip, i) => (
                    <span key={i} className="ccb-chip">
                        {chip}
                        <button
                            type="button"
                            className="ccb-chip__remove"
                            onClick={() => onRemove(i)}
                            aria-label={`Remove ${chip}`}
                        >×</button>
                    </span>
                ))}
                <div className="ccb-chip-entry">
                    <input
                        ref={inputRef}
                        className="ccb-chip-input"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder={chips.length === 0 ? placeholder : 'Add more…'}
                    />
                    <button
                        type="button"
                        className="ccb-add-btn"
                        onClick={handleAdd}
                        disabled={!value.trim()}
                    >+ Add</button>
                </div>
            </div>
        </div>
    );
}

// ── KeyArg chip input (same as ChipInput but for key arguments) ───────────────
// We reuse ChipInput for key arguments — they're just strings too.

// ── Blank form state ──────────────────────────────────────────────────────────
const blank = () => ({
    title: '',
    court: '',
    year: new Date().getFullYear().toString(),
    summary: '',
    tags: [],
    articles: [],
    // Petitioner
    petitionerName: '',
    petitionerPosition: '',
    petitionerArgs: [],
    // Respondent
    respondentName: '',
    respondentPosition: '',
    respondentArgs: [],
    // Extra context
    evidence: [],
    witnesses: [],
});

export default function CustomCaseBuilder({ onSelectCase, onBack }) {
    const [form, setForm] = useState(blank());
    const [errors, setErrors] = useState({});

    const set = (field, value) => {
        setForm(f => ({ ...f, [field]: value }));
        setErrors(e => ({ ...e, [field]: undefined }));
    };

    const addChip = (field, val) => set(field, [...form[field], val]);
    const removeChip = (field, i) => set(field, form[field].filter((_, idx) => idx !== i));

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Required';
        if (!form.summary.trim()) e.summary = 'Required';
        if (!form.petitionerName.trim()) e.petitionerName = 'Required';
        if (!form.petitionerPosition.trim()) e.petitionerPosition = 'Required';
        if (form.petitionerArgs.length < 1) e.petitionerArgs = 'Add at least one argument';
        if (!form.respondentName.trim()) e.respondentName = 'Required';
        if (!form.respondentPosition.trim()) e.respondentPosition = 'Required';
        if (form.respondentArgs.length < 1) e.respondentArgs = 'Add at least one argument';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLaunch = () => {
        if (!validate()) return;

        // Build context blob from evidence + witnesses for AI prompts
        const contextLines = [];
        if (form.evidence.length > 0)
            contextLines.push(`Evidence on record: ${form.evidence.join('; ')}.`);
        if (form.witnesses.length > 0)
            contextLines.push(`Key witnesses: ${form.witnesses.join(', ')}.`);

        const caseObj = {
            id: `custom-${Date.now()}`,
            name: form.title.trim(),
            shortName: form.title.trim(),
            year: parseInt(form.year) || new Date().getFullYear(),
            court: form.court.trim() || 'Custom Court',
            courtBadge: 'CC',
            summary: form.summary.trim(),
            difficulty: 3,
            tags: form.tags.length > 0 ? form.tags : ['Custom Case'],
            articles: form.articles,
            petitioner: {
                name: form.petitionerName.trim(),
                position: form.petitionerPosition.trim(),
                description:
                    form.petitionerPosition.trim() +
                    (contextLines.length > 0 ? ' ' + contextLines.join(' ') : ''),
                keyArgs: form.petitionerArgs,
            },
            respondent: {
                name: form.respondentName.trim(),
                position: form.respondentPosition.trim(),
                description:
                    form.respondentPosition.trim() +
                    (contextLines.length > 0 ? ' ' + contextLines.join(' ') : ''),
                keyArgs: form.respondentArgs,
            },
        };

        onSelectCase(caseObj);
    };

    const handleReset = () => { setForm(blank()); setErrors({}); };

    return (
        <div className="ccb" id="custom-case-builder">
            {/* Page header */}
            <div className="ccb__page-header">
                {onBack && (
                    <button className="ccb__back-btn" onClick={onBack} aria-label="Back to cases">
                        ← Back
                    </button>
                )}
                <div className="ccb__page-title-wrap">
                    <span className="ccb__toggle-icon">✦</span>
                    <h2 className="ccb__page-title">Build Your Own Case</h2>
                    <p className="ccb__page-sub">Define a custom scenario and argue it live</p>
                </div>
            </div>

            {/* Form always visible */}
            <div className="ccb__body">
                {/* Case basics */}
                <section className="ccb__section">
                    <h3 className="ccb__section-title">Case Overview</h3>
                    <div className="ccb__row ccb__row--3">
                        <div className="ccb__field">
                            <label className="ccb-label">Case Title <span className="ccb-req">*</span></label>
                            <input
                                className={`ccb-input ${errors.title ? 'ccb-input--err' : ''}`}
                                placeholder="e.g. State of X v. Accused Y"
                                value={form.title}
                                onChange={e => set('title', e.target.value)}
                            />
                            {errors.title && <span className="ccb-err">{errors.title}</span>}
                        </div>
                        <div className="ccb__field">
                            <label className="ccb-label">Court / Tribunal</label>
                            <input
                                className="ccb-input"
                                placeholder="e.g. High Court of Delhi"
                                value={form.court}
                                onChange={e => set('court', e.target.value)}
                            />
                        </div>
                        <div className="ccb__field">
                            <label className="ccb-label">Year</label>
                            <input
                                className="ccb-input"
                                type="number"
                                min="1900"
                                max="2099"
                                value={form.year}
                                onChange={e => set('year', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="ccb__field">
                        <label className="ccb-label">Case Summary <span className="ccb-req">*</span></label>
                        <textarea
                            className={`ccb-input ccb-textarea ${errors.summary ? 'ccb-input--err' : ''}`}
                            placeholder="Brief description of the dispute and what this case is about…"
                            rows={3}
                            value={form.summary}
                            onChange={e => set('summary', e.target.value)}
                        />
                        {errors.summary && <span className="ccb-err">{errors.summary}</span>}
                    </div>

                    <div className="ccb__row ccb__row--2">
                        <ChipInput
                            label="Tags / Legal Areas"
                            placeholder="e.g. Criminal Law"
                            chips={form.tags}
                            onAdd={v => addChip('tags', v)}
                            onRemove={i => removeChip('tags', i)}
                        />
                        <ChipInput
                            label="Constitutional Articles"
                            placeholder="e.g. Article 21"
                            chips={form.articles}
                            onAdd={v => addChip('articles', v)}
                            onRemove={i => removeChip('articles', i)}
                        />
                    </div>
                </section>

                <div className="ccb__divider" />

                {/* Parties */}
                <div className="ccb__parties">
                    {/* Petitioner */}
                    <section className="ccb__section ccb__section--petitioner">
                        <h3 className="ccb__section-title">Petitioner / Prosecution</h3>
                        <div className="ccb__row ccb__row--2">
                            <div className="ccb__field">
                                <label className="ccb-label">Name <span className="ccb-req">*</span></label>
                                <input
                                    className={`ccb-input ${errors.petitionerName ? 'ccb-input--err' : ''}`}
                                    placeholder="Full name or organisation"
                                    value={form.petitionerName}
                                    onChange={e => set('petitionerName', e.target.value)}
                                />
                                {errors.petitionerName && <span className="ccb-err">{errors.petitionerName}</span>}
                            </div>
                            <div className="ccb__field">
                                <label className="ccb-label">Legal Position <span className="ccb-req">*</span></label>
                                <input
                                    className={`ccb-input ${errors.petitionerPosition ? 'ccb-input--err' : ''}`}
                                    placeholder="e.g. Wrongful termination claimant"
                                    value={form.petitionerPosition}
                                    onChange={e => set('petitionerPosition', e.target.value)}
                                />
                                {errors.petitionerPosition && <span className="ccb-err">{errors.petitionerPosition}</span>}
                            </div>
                        </div>
                        <ChipInput
                            label={<>Key Arguments <span className="ccb-req">*</span></>}
                            placeholder="Type an argument and press Enter"
                            chips={form.petitionerArgs}
                            onAdd={v => addChip('petitionerArgs', v)}
                            onRemove={i => removeChip('petitionerArgs', i)}
                        />
                        {errors.petitionerArgs && <span className="ccb-err">{errors.petitionerArgs}</span>}
                    </section>

                    {/* Respondent */}
                    <section className="ccb__section ccb__section--respondent">
                        <h3 className="ccb__section-title">Respondent / Defence</h3>
                        <div className="ccb__row ccb__row--2">
                            <div className="ccb__field">
                                <label className="ccb-label">Name <span className="ccb-req">*</span></label>
                                <input
                                    className={`ccb-input ${errors.respondentName ? 'ccb-input--err' : ''}`}
                                    placeholder="Full name or organisation"
                                    value={form.respondentName}
                                    onChange={e => set('respondentName', e.target.value)}
                                />
                                {errors.respondentName && <span className="ccb-err">{errors.respondentName}</span>}
                            </div>
                            <div className="ccb__field">
                                <label className="ccb-label">Legal Position <span className="ccb-req">*</span></label>
                                <input
                                    className={`ccb-input ${errors.respondentPosition ? 'ccb-input--err' : ''}`}
                                    placeholder="e.g. Employer defending dismissal"
                                    value={form.respondentPosition}
                                    onChange={e => set('respondentPosition', e.target.value)}
                                />
                                {errors.respondentPosition && <span className="ccb-err">{errors.respondentPosition}</span>}
                            </div>
                        </div>
                        <ChipInput
                            label={<>Key Arguments <span className="ccb-req">*</span></>}
                            placeholder="Type an argument and press Enter"
                            chips={form.respondentArgs}
                            onAdd={v => addChip('respondentArgs', v)}
                            onRemove={i => removeChip('respondentArgs', i)}
                        />
                        {errors.respondentArgs && <span className="ccb-err">{errors.respondentArgs}</span>}
                    </section>
                </div>

                <div className="ccb__divider" />

                {/* Evidence & Witnesses */}
                <section className="ccb__section">
                    <h3 className="ccb__section-title">Evidence &amp; Witnesses <span className="ccb__section-opt">(optional — adds context to AI prompts)</span></h3>
                    <div className="ccb__row ccb__row--2">
                        <ChipInput
                            label="Key Evidence"
                            placeholder="e.g. CCTV footage from 3 Jan"
                            chips={form.evidence}
                            onAdd={v => addChip('evidence', v)}
                            onRemove={i => removeChip('evidence', i)}
                        />
                        <ChipInput
                            label="Witnesses"
                            placeholder="e.g. Dr. Anjali Mehta (forensics)"
                            chips={form.witnesses}
                            onAdd={v => addChip('witnesses', v)}
                            onRemove={i => removeChip('witnesses', i)}
                        />
                    </div>
                </section>

                {/* Actions */}
                <div className="ccb__actions">
                    <button type="button" className="ccb__reset-btn" onClick={handleReset}>
                        Clear Form
                    </button>
                    <button type="button" className="ccb__launch-btn" onClick={handleLaunch} id="launch-custom-case">
                        <span>Argue This Case</span>
                        <span className="ccb__launch-icon">⚖</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
