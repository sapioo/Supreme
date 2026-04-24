import { useEffect, useState } from 'react';
import './NotificationToast.css';

export default function NotificationToast({ notification, onRemove }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      case 'timer': return '⏰';
      case 'round': return '🏛';
      case 'voice': return '🎤';
      default: return 'ℹ';
    }
  };

  return (
    <div 
      className={`notification-toast notification-toast--${notification.type} ${
        isVisible && !isExiting ? 'notification-toast--visible' : ''
      } ${isExiting ? 'notification-toast--exiting' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="notification-toast__icon">
        {getIcon()}
      </div>
      <div className="notification-toast__content">
        {notification.message}
      </div>
      <button 
        className="notification-toast__close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}