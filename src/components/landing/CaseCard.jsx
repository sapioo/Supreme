import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import './CaseCard.css';

function DetailList({ title, items }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="case-card__detail-block">
      <h5>{title}</h5>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function CaseCard({ caseData, onSelect, isSelected }) {
  const [showDetails, setShowDetails] = useState(false);
  const details = caseData.caseDetails || {};

  const fieldRows = [
    ['ID', caseData.id],
    ['Full name', caseData.name],
    ['Short name', caseData.shortName],
    ['Year', caseData.year],
    ['Court', caseData.court],
    ['Court badge', caseData.courtBadge],
    ['Citation', details.citation],
    ['Case number', details.caseNumber],
    ['Decision date', details.decisionDate],
    ['Jurisdiction', details.jurisdiction],
    ['Case type', details.caseType],
    ['Complexity', `${caseData.difficulty}/5`],
    ['Articles', caseData.articles?.join(', ')],
  ].filter(([, value]) => value);

  return (
    <Card
      className={`case-card ${isSelected ? 'case-card--selected' : ''} ${showDetails ? 'case-card--expanded' : ''}`}
      aria-live={isSelected ? 'polite' : undefined}
    >
      <CardContent className="case-card__content">
        <div className="case-card__main">
          <div className="case-card__body">
            <div className="case-card__head">
              <div className="case-card__meta">
                <span className="case-card__year">{caseData.year}</span>
                <span className="case-card__dot" aria-hidden="true">•</span>
                <span className="case-card__court">{caseData.court}</span>
              </div>

            </div>

            <h4 className="case-card__name">{caseData.shortName}</h4>
            <p className="case-card__summary">{caseData.summary}</p>

            <div className="case-card__tags" aria-label="case-tags">
              {caseData.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="case-card__tag">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="case-card__side">
            <p className="case-card__difficulty" aria-label={`difficulty-${caseData.difficulty}`}>
              Complexity {caseData.difficulty}/5
            </p>
            <div className="case-card__actions">
              <Button
                type="button"
                size="sm"
                className={`case-card__button case-card__button--primary ${isSelected ? 'case-card__button--selected' : ''}`}
                onClick={() => onSelect(caseData)}
                aria-pressed={isSelected}
              >
                {isSelected ? 'Selected case' : 'Select case'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="case-card__button case-card__button--secondary"
                onClick={() => setShowDetails((value) => !value)}
                aria-expanded={showDetails}
                aria-controls={`case-details-${caseData.id}`}
              >
                {showDetails ? 'Hide details' : 'View details'}
              </Button>
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="case-card__details" id={`case-details-${caseData.id}`}>
            <dl className="case-card__fields">
              {fieldRows.map(([label, value]) => (
                <div className="case-card__field" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            <div className="case-card__dossier">
              <DetailList title="Bench" items={details.bench} />
              <DetailList title="Legal provisions" items={details.legalProvisions} />
              <DetailList title="Facts" items={details.facts} />
              <DetailList title="Procedural history" items={details.proceduralHistory} />
              <DetailList title="Issues" items={details.issues} />
              <DetailList title="Holdings" items={details.holdings} />
              <DetailList title="Related cases" items={details.relatedCases} />
              <DetailList title="Expected documents" items={details.documentsExpected} />

              {details.finalOrder && (
                <section className="case-card__detail-block">
                  <h5>Final order</h5>
                  <p>{details.finalOrder}</p>
                </section>
              )}

              {details.significance && (
                <section className="case-card__detail-block">
                  <h5>Significance</h5>
                  <p>{details.significance}</p>
                </section>
              )}
            </div>

            <div className="case-card__parties">
              {['petitioner', 'respondent'].map((side) => {
                const party = caseData[side];

                return (
                  <section className="case-card__party" key={side}>
                    <p className="case-card__party-label">{side}</p>
                    <h5>{party.name}</h5>
                    <p className="case-card__party-position">{party.position}</p>
                    <p>{party.description}</p>
                    <ul>
                      {party.keyArgs.map((argument) => (
                        <li key={argument}>{argument}</li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>

            {details.sourceDocuments?.length > 0 && (
              <section className="case-card__sources">
                <h5>Source documents</h5>
                <ul>
                  {details.sourceDocuments.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.label}
                      </a>
                      <span>{source.type}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="case-card__json" aria-label={`${caseData.shortName} raw JSON payload`}>
              <div className="case-card__json-head">
                <h5>Raw JSON payload</h5>
                <span>Passed caseData object</span>
              </div>
              <pre>{JSON.stringify(caseData, null, 2)}</pre>
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
