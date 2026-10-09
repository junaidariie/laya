import React, { useState, useRef, useEffect } from 'react';

const EXAMPLES = [
  { label: 'Billing',   color: '#60a5fa', icon: '💳', route: 'ai',
    text: 'I was charged twice for my Pro subscription this month. Can you check my invoice?' },
  { label: 'Technical', color: '#a78bfa', icon: '⚙️', route: 'ai',
    text: 'My API keeps returning 429 errors even though I am well under my quota. How do I fix this?' },
  { label: 'Account',   color: '#34d399', icon: '🔑', route: 'ai',
    text: 'I forgot my password and the reset email is not arriving in my inbox.' },
  { label: 'General',   color: '#94a3b8', icon: '💬', route: 'ai',
    text: 'What is the difference between the Starter and Pro plans?' },
  { label: 'Security ⚠', color: '#f87171', icon: '🚨', route: 'human',
    text: 'Our account was hacked. Someone changed our billing and API keys from an unknown IP. This is a critical security emergency.' },
  { label: 'Legal ⚠',   color: '#fb923c', icon: '⚖️', route: 'human',
    text: 'You have been overcharging us for 6 months. Our lawyer is now involved and we are preparing legal action.' },
];

const PLACEHOLDERS = [
  'Describe your issue here…',
  'e.g. I was charged twice this month…',
  'e.g. My API is returning 500 errors…',
  'e.g. I cannot log into my account…',
];

export default function InputArea({ onSubmit, loading }) {
  const [value, setValue] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [activeChip, setActiveChip] = useState(null);
  const ref = useRef(null);
  const submitTimerRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(id);
  }, []);

  const resize = (text) => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = Math.min(ref.current.scrollHeight, 180) + 'px';
  };

  const submit = (msg) => {
    const m = (msg ?? value).trim();
    if (!m || loading) return;
    onSubmit(m);
    setValue('');
    setActiveChip(null);
    if (ref.current) ref.current.style.height = 'auto';
  };

  const handleChipClick = (ex) => {
    if (loading) return;
    // Clear any pending auto-submit
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    // Fill textarea so user can read the question
    setValue(ex.text);
    setActiveChip(ex.label);
    setTimeout(() => resize(ex.text), 0);
    ref.current?.focus();
    // Auto-submit after 1.2s so user has time to read it
    submitTimerRef.current = setTimeout(() => {
      onSubmit(ex.text);
      setValue('');
      setActiveChip(null);
      if (ref.current) ref.current.style.height = 'auto';
    }, 1200);
  };

  // If user edits the textarea after a chip click, cancel the auto-submit
  const handleChange = (e) => {
    if (submitTimerRef.current) { clearTimeout(submitTimerRef.current); setActiveChip(null); }
    setValue(e.target.value);
    resize(e.target.value);
  };

  return (
    <div className="input-area">
      <div className={`input-box ${activeChip ? 'input-box--chip-active' : ''}`}>
        <textarea
          ref={ref}
          className="input-ta"
          placeholder={PLACEHOLDERS[phIdx]}
          value={value}
          rows={3}
          disabled={loading}
          onChange={handleChange}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        />
        <div className="input-actions">
          <div className="input-actions-left">
            <span className="input-hint">↵ send · ⇧↵ newline</span>
            {activeChip && (
              <span className="input-chip-sending">
                <span className="chip-sending-bar" />
                Sending in 1s…
              </span>
            )}
          </div>
          <button
            className={`submit-btn ${value.trim() && !loading ? 'submit-btn--on' : ''}`}
            onClick={() => { if (submitTimerRef.current) clearTimeout(submitTimerRef.current); submit(); }}
            disabled={loading || !value.trim()}
          >
            {loading
              ? <span className="btn-spinner" />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            }
            <span>{loading ? 'Analyzing…' : 'Send'}</span>
          </button>
        </div>
      </div>

      <div className="examples-wrap">
        <div className="examples-header">
          <span className="examples-title">Quick examples</span>
          <div className="examples-legend">
            <span className="legend-dot legend-dot--ai" />AI route
            <span className="legend-dot legend-dot--human" style={{marginLeft:12}}/>Human route
          </div>
        </div>
        <div className="examples-row">
          {EXAMPLES.map(ex => (
            <button
              key={ex.label}
              className={`ex-chip ${ex.route === 'human' ? 'ex-chip--human' : ''} ${activeChip === ex.label ? 'ex-chip--active' : ''}`}
              style={{ '--c': ex.color }}
              onClick={() => handleChipClick(ex)}
              disabled={loading}
              title={ex.text}
            >
              <span className="ex-chip-icon">{ex.icon}</span>
              <span className="ex-chip-label">{ex.label}</span>
              {activeChip === ex.label && <span className="ex-chip-countdown" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
