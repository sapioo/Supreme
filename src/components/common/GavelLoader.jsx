import { useState, useEffect, useMemo } from 'react';
import './GavelLoader.css';

const loadingSteps = [
  { text: "Loading case configuration and selected side...", duration: 700 },
  { text: "Connecting to NIM AI inference endpoint...", duration: 1000 },
  { text: "Fetching Qdrant vector store context...", duration: 900 },
  { text: "Building system prompt for AI counsel...", duration: 800 },
  { text: "Initialising voice session (Vapi + Deepgram)...", duration: 900 },
];

export default function GavelLoader({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [gavelStruck, setGavelStruck] = useState(false);

  const progress = useMemo(() => {
    const safeStep = Math.min(currentStep, loadingSteps.length);
    return (safeStep / loadingSteps.length) * 100;
  }, [currentStep]);

  useEffect(() => {
    let timeout;

    if (currentStep < loadingSteps.length) {
      timeout = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, loadingSteps[currentStep].duration);
    } else {
      const strikeTimeout = setTimeout(() => setGavelStruck(true), 220);
      const completeTimeout = setTimeout(() => setIsComplete(true), 1000);
      const doneTimeout = setTimeout(() => onComplete(), 1800);

      return () => {
        clearTimeout(strikeTimeout);
        clearTimeout(completeTimeout);
        clearTimeout(doneTimeout);
      };
    }

    return () => clearTimeout(timeout);
  }, [currentStep, onComplete]);

  return (
    <div className={`gavel-loader ${isComplete ? 'gavel-loader--complete' : ''}`} id="gavel-loader">
      <div className="gavel-loader__backdrop" />

      {/* Scales-of-justice icon with spinning ring */}
      <div className={`gavel-loader__gavel-container ${gavelStruck ? 'gavel-loader__gavel-container--struck' : ''}`}>
        <div className={`gavel-loader__ring ${currentStep % 2 === 0 ? 'gavel-loader__ring--pulse' : ''}`} aria-hidden="true" />
        <svg
          className="gavel-loader__icon"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Scales of Justice"
        >
          {/* Centre pole */}
          <rect x="30.5" y="10" width="3" height="40" rx="1.5" fill="#e9c176" />
          {/* Cross beam */}
          <rect x="10" y="16" width="44" height="3" rx="1.5" fill="#e9c176" />
          {/* Left chain */}
          <line x1="16" y1="19" x2="16" y2="34" stroke="#e9c176" strokeWidth="2" strokeLinecap="round" />
          {/* Right chain */}
          <line x1="48" y1="19" x2="48" y2="34" stroke="#e9c176" strokeWidth="2" strokeLinecap="round" />
          {/* Left pan */}
          <path d="M8 34 Q16 40 24 34" stroke="#e9c176" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Right pan */}
          <path d="M40 34 Q48 40 56 34" stroke="#e9c176" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Base */}
          <rect x="22" y="50" width="20" height="3" rx="1.5" fill="#e9c176" />
        </svg>
        {gavelStruck && <div className="gavel-loader__impact" />}
      </div>

      {/* Loading text */}
      <div className="gavel-loader__text-area">
        <h2 className="gavel-loader__title">Initialising Session</h2>
        <p className="gavel-loader__subtitle">Supreme Court AI · Loading runtime services</p>

        {/* Steps */}
        <div className="gavel-loader__steps">
          {loadingSteps.map((step, index) => (
            <div
              key={index}
              className={`gavel-loader__step
                ${index < currentStep ? 'gavel-loader__step--done' : ''}
                ${index === currentStep ? 'gavel-loader__step--active' : ''}
              `}
            >
              <span className="gavel-loader__step-dot">
                {index < currentStep ? '✓' : index === currentStep ? '●' : '○'}
              </span>
              <span className="gavel-loader__step-text">{step.text}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="gavel-loader__progress-track">
          <div
            className="gavel-loader__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
