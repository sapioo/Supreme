import CaseCard from './CaseCard';
import cases from '../../data/cases';
import './CaseGrid.css';

export default function CaseGrid({ onSelectCase }) {
  return (
    <section className="case-grid-section" id="case-grid-section">
      {/* Grid */}
      <div className="case-grid" id="case-grid">
        {cases.map((caseData, index) => (
          <CaseCard
            key={caseData.id}
            caseData={caseData}
            index={index}
            onSelect={onSelectCase}
          />
        ))}
      </div>
    </section>
  );
}
