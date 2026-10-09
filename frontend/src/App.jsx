import React, { useState, useRef } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import InputArea from './components/InputArea';
import AnalysisPanel from './components/AnalysisPanel';
import ResponsePanel from './components/ResponsePanel';

const API = 'http://127.0.0.1:8000';

const EMPTY = {
  laya: null, route: null, response: '',
  streaming: false, done: false, error: null, activeNode: null,
};

export default function App() {
  const [session, setSession] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [currentMsg, setCurrentMsg] = useState('');
  const abortRef = useRef(null);

  const handleSubmit = async (message) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setSession(EMPTY);
    setCurrentMsg(message);
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: abortRef.current.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') {
            setSession(s => ({ ...s, done: true, streaming: false, activeNode: null }));
            setLoading(false);
            continue;
          }
          try { processEvent(JSON.parse(raw)); } catch (_) {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSession(s => ({ ...s, error: err.message, streaming: false }));
        setLoading(false);
      }
    }
  };

  const processEvent = (event) => {
    for (const node of Object.keys(event)) {
      const data = event[node];
      if (node === 'laya_analysis') {
        setSession(s => ({
          ...s, activeNode: 'laya_analysis',
          laya: {
            department: data.department,
            department_confidence: data.department_confidence,
            urgency: data.urgency,
            urgency_score: data.urgency_score,
            urgency_confidence: data.urgency_confidence,
            refund_probability: data.refund_probability,
            human_review_probability: data.human_review_probability,
          },
        }));
      }
      if (node === 'route_ticket') {
        setSession(s => ({ ...s, activeNode: 'route_ticket', route: data.route }));
      }
      if (node === 'generate_response' || node === 'human_escalation') {
        setSession(s => ({
          ...s, activeNode: node, streaming: true, response: data.response || '',
        }));
      }
    }
  };

  const hasResults = session.laya || session.route || session.response || session.error;

  return (
    <div className="app">
      <Sidebar />
      <div className="app-main">
        <div className="app-topbar">
          <div className="topbar-title">
            <span className="topbar-dot" />
            Support Console
          </div>
          <div className="topbar-status">
            {loading
              ? <><span className="status-spinner" />Processing</>
              : <><span className="status-live" />Ready</>
            }
          </div>
        </div>

        <div className="app-body">
          <InputArea onSubmit={handleSubmit} loading={loading} currentMsg={currentMsg} />

          {hasResults && (
            <div className="results-layout">
              <AnalysisPanel session={session} loading={loading} />
              <ResponsePanel
                text={session.response}
                streaming={session.streaming}
                route={session.route}
                done={session.done}
                error={session.error}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
