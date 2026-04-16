import { useState, useEffect } from 'react';
import './ScalesTipping.css';

export default function ScalesTipping({ winner, userTotal, aiTotal }) {
  const [isTipping, setIsTipping] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsTipping(true), 500);
    return () => clearTimeout(t);
  }, []);

  const tipDirection = winner === 'user' ? 'left' : 'right';

  return (
    <div className={`scales-tip ${isTipping ? `scales-tip--${tipDirection}` : ''}`} id="scales-tipping">
      <svg className="scales-tip__svg" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Center pillar */}
        <rect x="145" y="50" width="10" height="110" rx="3" fill="var(--gold-dim)" opacity="0.8"/>
        
        {/* Base */}
        <rect x="110" y="155" width="80" height="8" rx="4" fill="var(--gold-parchment)" opacity="0.6"/>
        <rect x="125" y="148" width="50" height="10" rx="3" fill="var(--gold-dim)" opacity="0.5"/>
        
        {/* Top ornament */}
        <circle cx="150" cy="47" r="8" fill="var(--gold-parchment)" opacity="0.9"/>
        <circle cx="150" cy="47" r="4" fill="var(--walnut-dark)"/>

        {/* Beam (this rotates) */}
        <g className="scales-tip__beam">
          <rect x="30" y="44" width="240" height="6" rx="3" fill="var(--color-secondary)" opacity="0.9"/>
          
          {/* Left chain */}
          <line x1="50" y1="50" x2="50" y2="85" stroke="var(--color-on-secondary-container)" strokeWidth="2" opacity="0.7"/>
          
          {/* Right chain */}
          <line x1="250" y1="50" x2="250" y2="85" stroke="var(--color-on-secondary-container)" strokeWidth="2" opacity="0.7"/>
          
          {/* Left pan (User) */}
          <g className="scales-tip__pan-left">
            <path d="M25 88 Q25 110 50 110 L50 110 Q75 110 75 88 Z" fill="var(--color-secondary)" opacity="0.5"/>
            <ellipse cx="50" cy="110" rx="30" ry="7" fill="var(--color-secondary-container)" opacity="0.4"/>
            <text x="50" y="102" textAnchor="middle" fill="var(--color-on-surface)" fontSize="11" fontFamily="var(--font-heading)" fontWeight="700">YOU</text>
          </g>
          
          {/* Right pan (AI) */}
          <g className="scales-tip__pan-right">
            <path d="M225 88 Q225 110 250 110 L250 110 Q275 110 275 88 Z" fill="var(--color-primary-fixed-dim)" opacity="0.45"/>
            <ellipse cx="250" cy="110" rx="30" ry="7" fill="var(--color-primary-container)" opacity="0.45"/>
            <text x="250" y="102" textAnchor="middle" fill="var(--color-on-surface)" fontSize="11" fontFamily="var(--font-heading)" fontWeight="700">AI</text>
          </g>
        </g>
      </svg>

      {/* Score labels */}
      <div className="scales-tip__labels">
        <span className="scales-tip__label scales-tip__label--user">{userTotal}</span>
        <span className="scales-tip__label scales-tip__label--ai">{aiTotal}</span>
      </div>
    </div>
  );
}
