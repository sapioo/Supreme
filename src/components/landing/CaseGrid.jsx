import CaseCard from './CaseCard';
import cases from '../../data/cases';
import './CaseGrid.css';

export default function CaseGrid({ onSelectCase, selectedCase, casesData = cases }) {
  return (
    <section className="case-grid-section" id="case-grid-section">
      <div className="case-grid" id="case-grid">
        {casesData.map((caseData, index) => (
          <CaseCard
            key={caseData.id}
            caseData={caseData}
            index={index}
            onSelect={onSelectCase}
            isSelected={selectedCase?.id === caseData.id}
          />
        ))}
      </div>
    </section>
  );
}
