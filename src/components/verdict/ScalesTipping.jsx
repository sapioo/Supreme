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
      <svg className="scales-tip__svg" viewBox="0 0 300 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Center pillar */}
        <rect x="145" y="50" width="10" height="120" rx="3" fill="var(--gold-dim)" opacity="0.8" />

        {/* Base */}
        <rect x="108" y="164" width="84" height="9" rx="4" fill="var(--gold-parchment)" opacity="0.55" />
        <rect x="123" y="158" width="54" height="10" rx="3" fill="var(--gold-dim)" opacity="0.45" />

        {/* Top ornament */}
        <circle cx="150" cy="47" r="8" fill="var(--gold-parchment)" opacity="0.9" />
        <circle cx="150" cy="47" r="4" fill="var(--walnut-dark)" />

        {/* Beam group (rotates) */}
        <g className="scales-tip__beam">
          <rect x="28" y="43" width="244" height="7" rx="3.5" fill="var(--color-secondary)" opacity="0.88" />

          {/* Left chain */}
          <line x1="50" y1="50" x2="50" y2="86" stroke="var(--color-on-secondary-container)" strokeWidth="2" opacity="0.65" />
          {/* Right chain */}
          <line x1="250" y1="50" x2="250" y2="86" stroke="var(--color-on-secondary-container)" strokeWidth="2" opacity="0.65" />

          {/* Left pan (User) */}
          <g className="scales-tip__pan-left">
            <path d="M22 89 Q22 113 50 113 Q78 113 78 89 Z" fill="var(--color-secondary)" opacity="0.45" />
            <ellipse cx="50" cy="113" rx="30" ry="7" fill="var(--color-secondary-container)" opacity="0.4" />
            <text x="50" y="106" textAnchor="middle" fill="var(--color-on-surface)" fontSize="9" fontFamily="var(--font-label)" letterSpacing="1" fontWeight="700">YOU</text>
            {/* Score inside pan */}
            <text x="50" y="136" textAnchor="middle" fill="var(--color-secondary)" fontSize="14" fontFamily="var(--font-heading)" fontWeight="800" opacity="0"
              className="scales-tip__score-left">{userTotal}</text>
          </g>

          {/* Right pan (AI) */}
          <g className="scales-tip__pan-right">
            <path d="M222 89 Q222 113 250 113 Q278 113 278 89 Z" fill="var(--color-primary-fixed-dim)" opacity="0.4" />
            <ellipse cx="250" cy="113" rx="30" ry="7" fill="var(--color-primary-container)" opacity="0.4" />
            <text x="250" y="106" textAnchor="middle" fill="var(--color-on-surface)" fontSize="9" fontFamily="var(--font-label)" letterSpacing="1" fontWeight="700">AI</text>
            {/* Score inside pan */}
            <text x="250" y="136" textAnchor="middle" fill="var(--color-primary-fixed-dim)" fontSize="14" fontFamily="var(--font-heading)" fontWeight="800" opacity="0"
              className="scales-tip__score-right">{aiTotal}</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
