import React, { useEffect, useState } from 'react';

const DEPT_COLOR = { billing:'#60a5fa', technical:'#a78bfa', account:'#34d399', general:'#94a3b8' };
const URG_COLOR  = { low:'#34d399', medium:'#fbbf24', high:'#fb923c', critical:'#f87171' };

const NODES = [
  { id:'laya_analysis',     label:'Laya Analysis',   icon:'🧠' },
  { id:'route_ticket',      label:'Route Ticket',    icon:'⇄'  },
  { id:'generate_response', label:'LLM Response',    icon:'⚡' },
  { id:'human_escalation',  label:'Human Escalation',icon:'👤' },
];

function Arc({ value, color, size = 80 }) {
  const [v, setV] = useState(0);
  useEffect(() => { const t = setTimeout(() => setV(value), 150); return () => clearTimeout(t); }, [value]);
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2535" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }}
      />
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={color}
        fontSize="12" fontWeight="700" fontFamily="'JetBrains Mono',monospace">{v}%</text>
    </svg>
  );
}

function Bar({ value, color }) {
  const [w, setW] = useState(0);
  const pct = Math.round(value * 100);
  useEffect(() => { const t = setTimeout(() => setW(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="abar">
      <div className="abar-track"><div className="abar-fill" style={{ width:`${w}%`, background:color }}/></div>
      <span className="abar-val" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function AnalysisPanel({ session, loading }) {
  const { laya, route, activeNode, done } = session;

  const visibleNodes = NODES.filter(n => {
    if (n.id === 'generate_response' && route === 'human') return false;
    if (n.id === 'human_escalation'  && route === 'llm')   return false;
    return true;
  });

  const nodeStatus = (id) => {
    if (!activeNode) return 'idle';
    const order = visibleNodes.map(n => n.id);
    const ai = order.indexOf(activeNode), ci = order.indexOf(id);
    if (ci < ai) return 'done';
    if (ci === ai) return done ? 'done' : 'active';
    return 'idle';
  };

  const dc = laya ? (DEPT_COLOR[laya.department] || '#94a3b8') : '#94a3b8';
  const uc = laya ? (URG_COLOR[laya.urgency]     || '#94a3b8') : '#94a3b8';

  return (
    <div className="analysis-panel">
      <div className="ap-section">
        <div className="ap-section-title">Pipeline</div>
        <div className="pipeline">
          {visibleNodes.map((n, i) => {
            const st = nodeStatus(n.id);
            return (
              <React.Fragment key={n.id}>
                <div className={`pn pn--${st}`}>
                  <span className="pn-icon">{n.icon}</span>
                  <span className="pn-label">{n.label}</span>
                  {st === 'active' && <span className="pn-pulse"/>}
                  {st === 'done'   && <span className="pn-done">✓</span>}
                </div>
                {i < visibleNodes.length - 1 && (
                  <div className={`pn-arrow pn-arrow--${st === 'done' ? 'done' : 'idle'}`}>↓</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {laya && (
        <>
          <div className="ap-section">
            <div className="ap-section-title">Classification</div>
            <div className="ap-row">
              <div className="ap-card">
                <div className="ap-card-label">Department</div>
                <div className="ap-card-value" style={{ color: dc }}>{laya.department}</div>
                <Bar value={laya.department_confidence} color={dc} />
              </div>
              <div className="ap-card">
                <div className="ap-card-label">Urgency</div>
                <div className="ap-card-value" style={{ color: uc }}>{laya.urgency}</div>
                <Bar value={laya.urgency_confidence} color={uc} />
              </div>
            </div>
          </div>

          <div className="ap-section">
            <div className="ap-section-title">Probabilities</div>
            <div className="ap-gauges">
              <div className="ap-gauge-item">
                <Arc value={Math.round(laya.refund_probability * 100)} color="#60a5fa" size={76}/>
                <span className="ap-gauge-label">Refund</span>
              </div>
              <div className="ap-gauge-item">
                <Arc value={Math.round(laya.human_review_probability * 100)}
                  color={laya.human_review_probability > 0.6 ? '#f87171' : '#fb923c'} size={76}/>
                <span className="ap-gauge-label">Human Review</span>
              </div>
            </div>
          </div>

          <div className="ap-section">
            <div className="ap-section-title">Routing</div>
            <div className={`route-tag route-tag--${route}`}>
              {route === 'human' ? '👤 Escalated to Human' : '⚡ Handled by AI'}
            </div>
          </div>
        </>
      )}

      {loading && !laya && (
        <div className="ap-loading">
          <span className="ap-loading-spinner"/>
          <span>Analyzing ticket…</span>
        </div>
      )}
    </div>
  );
}
