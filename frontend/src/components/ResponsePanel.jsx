import React, { useEffect, useRef } from 'react';

export default function ResponsePanel({ text, streaming, route, done, error }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [text]);

  const isHuman = route === 'human';

  return (
    <div className={`response-panel ${isHuman ? 'response-panel--human' : ''}`}>
      <div className="rp-header">
        <div className="rp-header-left">
          <span className="rp-icon">{isHuman ? '👤' : '⚡'}</span>
          <span className="rp-title">{isHuman ? 'Human Escalation' : 'AI Response'}</span>
        </div>
        <div className="rp-header-right">
          {streaming && <span className="rp-badge rp-badge--stream"><span className="rp-dot"/>Live</span>}
          {done && !streaming && <span className="rp-badge rp-badge--done">✓ Done</span>}
        </div>
      </div>

      {error && (
        <div className="rp-error">⚠ {error}</div>
      )}

      {!error && (
        <div className="rp-body">
          {!text && streaming && (
            <div className="rp-thinking">
              <span className="rp-thinking-dot"/>
              <span className="rp-thinking-dot"/>
              <span className="rp-thinking-dot"/>
            </div>
          )}
          <div className="rp-text">
            {text}
            {streaming && <span className="rp-cursor">▋</span>}
          </div>
          <div ref={endRef}/>
        </div>
      )}

      {done && !streaming && text && (
        <div className="rp-footer">
          <span className="rp-footer-complete">Response complete</span>
          <span className="rp-footer-words">{text.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      )}
    </div>
  );
}
