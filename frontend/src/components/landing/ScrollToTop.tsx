'use client';

import { useEffect, useRef, useState } from 'react';

const CIRCUMFERENCE = 2 * Math.PI * 26;

// Port of the ScrollToTopButton class (script.js:727-872) minus the removed
// btn-glow element (AGENTS 3.0c).
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct =
        documentHeight > 0
          ? Math.min((scrollTop / documentHeight) * 100, 100)
          : 0;

      const shouldShow = scrollTop > 300;
      if (shouldShow !== visibleRef.current) {
        visibleRef.current = shouldShow;
        setVisible(shouldShow);
      }
      setPercentage(pct);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

  return (
    <div
      className={`scroll-to-top-container${visible ? ' visible' : ''}`}
      id="scrollToTopContainer"
    >
      <button
        className="scroll-to-top-btn"
        id="scrollToTopBtn"
        type="button"
        aria-label="Scroll to top"
        aria-hidden={!visible}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <div className="btn-background" />
        <div className="btn-content">
          <div className="arrow-container">
            <svg
              className="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </div>
          <div className="progress-ring">
            <svg className="progress-svg" width="60" height="60">
              <circle
                className="progress-circle-bg"
                cx="30"
                cy="30"
                r="26"
                strokeWidth="2"
              />
              <circle
                className="progress-circle"
                cx="30"
                cy="30"
                r="26"
                strokeWidth="2"
                style={{
                  strokeDasharray: CIRCUMFERENCE,
                  strokeDashoffset: offset,
                }}
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Tooltip */}
      <div
        className={`scroll-tooltip${tooltipVisible ? ' visible' : ''}`}
        id="scrollTooltip"
      >
        <span>Back to top</span>
        <div className="tooltip-arrow" />
      </div>
    </div>
  );
}
