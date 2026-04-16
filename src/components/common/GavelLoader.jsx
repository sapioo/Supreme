import { useState, useEffect, useMemo } from 'react';
import './GavelLoader.css';

const loadingSteps = [
  { text: "Summoning counsel...", duration: 800 },
  { text: "Reviewing case files...", duration: 1000 },
  { text: "Preparing submissions...", duration: 900 },
  { text: "Impaneling the Bench...", duration: 800 },
  { text: "All rise...", duration: 1200 },
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

      {/* Gavel animation */}
      <div className={`gavel-loader__gavel-container ${gavelStruck ? 'gavel-loader__gavel-container--struck' : ''}`}>
        <div className={`gavel-loader__ring ${currentStep % 2 === 0 ? 'gavel-loader__ring--pulse' : ''}`} aria-hidden="true" />
        <div className="gavel-loader__gavel">
          {/* Handle */}
          <div className="gavel-loader__handle" />
          {/* Head */}
          <div className="gavel-loader__head" />
        </div>
        {/* Sound block */}
        <div className="gavel-loader__block" />
        {/* Impact effect */}
        {gavelStruck && <div className="gavel-loader__impact" />}
      </div>

      {/* Loading text */}
      <div className="gavel-loader__text-area">
        <h2 className="gavel-loader__title">Preparing Courtroom</h2>
        <p className="gavel-loader__subtitle">Case #882-Alpha · High Stakes Protocol</p>
        
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

      {/* Court order stamp on complete */}
      {gavelStruck && (
        <div className="gavel-loader__stamp">
          ORDER ENTERED
        </div>
      )}
    </div>
  );
}
