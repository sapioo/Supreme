import { useEffect, useRef, useState } from 'react';
import { Lightbulb, Mic, Globe, Paperclip, Send } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'motion/react';
import './AIChatInput.css';

const DEFAULT_PLACEHOLDERS = [
  'Rewrite this NDA in a sharper Indian legal tone',
  'Add an indemnity clause with capped liability',
  'Summarise drafting risks in this agreement',
  'Convert these notes into a formal legal notice',
  'Suggest cleaner structure for this petition',
  'Review this draft for weak language and ambiguity',
];

export function AIChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholders = DEFAULT_PLACEHOLDERS,
}) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const wrapperRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isActive || value) return undefined;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, placeholders, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (!value) setIsActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    const nextHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${Math.max(nextHeight, 44)}px`;
  }, [value, isActive]);

  const handleActivate = () => setIsActive(true);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
  };

  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };

  const letterVariants = {
    initial: { opacity: 0, filter: 'blur(12px)', y: 10 },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: 'spring', stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: 'blur(12px)',
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: 'spring', stiffness: 80, damping: 20 },
      },
    },
  };

  const isExpanded = isActive || Boolean(value.trim());

  return (
    <div
      ref={wrapperRef}
      className={`ai-chat-input ${isExpanded ? 'ai-chat-input--expanded' : ''}`}
      onClick={handleActivate}
    >
      <div className="ai-chat-input__inner">
        <div className="ai-chat-input__row">
          <button className="ai-chat-input__icon-btn" title="Attach file" type="button" tabIndex={-1}>
            <Paperclip size={20} />
          </button>

          <div className="ai-chat-input__field">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="ai-chat-input__textarea"
              onFocus={handleActivate}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <div className="ai-chat-input__placeholder-layer">
              <AnimatePresence mode="wait">
                {showPlaceholder && !isActive && !value && (
                  <Motion.span
                    key={placeholderIndex}
                    className="ai-chat-input__placeholder"
                    variants={placeholderContainerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {placeholders[placeholderIndex].split('').map((char, index) => (
                      <Motion.span key={index} variants={letterVariants}>
                        {char === ' ' ? '\u00A0' : char}
                      </Motion.span>
                    ))}
                  </Motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button className="ai-chat-input__icon-btn" title="Voice input" type="button" tabIndex={-1}>
            <Mic size={20} />
          </button>
          <button
            className="ai-chat-input__send-btn"
            title="Send"
            type="button"
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation();
              if (!isLoading && value.trim()) onSubmit();
            }}
            disabled={isLoading || !value.trim()}
          >
            <Send size={18} />
          </button>
        </div>

        <div className={`ai-chat-input__controls ${isExpanded ? 'ai-chat-input__controls--visible' : ''}`}>
          <button
            className={`ai-chat-input__toggle ${thinkActive ? 'ai-chat-input__toggle--active' : ''}`}
            title="Think"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setThinkActive((current) => !current);
            }}
          >
            <Lightbulb size={18} />
            <span>Think</span>
          </button>

          <Motion.button
            className={`ai-chat-input__toggle ai-chat-input__toggle--search ${deepSearchActive ? 'ai-chat-input__toggle--active' : ''}`}
            title="Deep Search"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDeepSearchActive((current) => !current);
            }}
            initial={false}
            animate={{
              width: deepSearchActive ? 132 : 40,
              paddingLeft: deepSearchActive ? 10 : 11,
            }}
          >
            <div className="ai-chat-input__toggle-icon">
              <Globe size={18} />
            </div>
            <Motion.span
              initial={false}
              animate={{ opacity: deepSearchActive ? 1 : 0 }}
              className="ai-chat-input__toggle-label"
            >
              Deep Search
            </Motion.span>
          </Motion.button>
        </div>
      </div>
    </div>
  );
}
