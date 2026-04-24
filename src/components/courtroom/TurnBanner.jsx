import { useState, useEffect, useRef } from 'react';
import './TurnBanner.css';

/**
 * Prominent banner that slides in at the start of each user turn,
 * shows for 3s, then fades away on its own.
 * Re-triggers on every new round (via roundKey).
 */
export default function TurnBanner({ side, round, totalRounds, active }) {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const prevActive = useRef(false);

    useEffect(() => {
        // Only trigger when transitioning from inactive → active
        if (!prevActive.current && active) {
            setVisible(true);
            setExiting(false);

            // Auto-dismiss after 3s
            const dismiss = setTimeout(() => {
                setExiting(true);
                setTimeout(() => setVisible(false), 500);
            }, 3000);

            return () => clearTimeout(dismiss);
        }
        prevActive.current = active;
        return undefined;
    }, [active, round]); // round as dep re-triggers on new rounds

    if (!visible) return null;

    const sideLabel = side === 'petitioner' ? 'PETITIONER' : 'RESPONDENT';
    const icon = side === 'petitioner' ? '🔵' : '🟡';

    return (
        <div className={`turn-banner ${exiting ? 'turn-banner--exit' : 'turn-banner--enter'}`} role="status" aria-live="polite">
            <div className="turn-banner__inner">
                <span className="turn-banner__icon">{icon}</span>
                <div className="turn-banner__text">
                    <span className="turn-banner__role">{sideLabel}'S TURN</span>
                    <span className="turn-banner__round">Round {round} of {totalRounds} — Present your argument</span>
                </div>
                <span className="turn-banner__scales">⚖</span>
            </div>
        </div>
    );
}
