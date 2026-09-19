import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  closePoll, downloadExport, downloadRawExport, getState, openPoll, reopenPoll, resetRun, submitVote,
} from './api.js';
import { createParticipantId, resultRows } from './poll-model.js';
import { pollKeys, pollsByKey } from './polls.js';
import { slides } from './slides.js';

const clamp = (value) => Math.min(slides.length - 1, Math.max(0, value));
const initialPhases = () => Object.fromEntries(pollKeys.map((key) => [key, 'tweet']));

function slideFromHash() {
  const parsed = Number.parseInt(window.location.hash.slice(1), 10);
  return Number.isFinite(parsed) ? clamp(parsed - 1) : 0;
}

function CroppedTweet({ poll, compact = false }) {
  const { x, y, width, height } = poll.crop;
  const style = {
    '--crop-aspect': `${(16 * width) / (9 * height)}`,
    '--image-width': `${10000 / width}%`,
    '--image-height': `${10000 / height}%`,
    '--image-left': `${(-x / width) * 100}%`,
    '--image-top': `${(-y / height) * 100}%`,
  };
  return (
    <figure className={`tweet-crop ${compact ? 'tweet-crop-compact' : ''}`} style={style}>
      <img src={poll.tweetImage} alt={poll.tweetAlt} draggable="false" />
    </figure>
  );
}

function CandidateCard({ candidate, selected = false, interactive = false, onSelect }) {
  const Tag = interactive ? 'button' : 'article';
  return (
    <Tag
      className={`candidate-card ${candidate.illustrative ? 'candidate-illustrative' : ''} ${selected ? 'candidate-selected' : ''}`}
      type={interactive ? 'button' : undefined}
      onClick={interactive ? () => onSelect(candidate.id) : undefined}
      aria-pressed={interactive ? selected : undefined}
    >
      <div className="candidate-topline">
        <strong className="candidate-letter">{candidate.id}</strong>
        <span className="candidate-badge">{candidate.badge}</span>
      </div>
      <p>{candidate.text}</p>
      <small>{candidate.source}</small>
      {interactive && <span className="candidate-action">{selected ? 'Selected' : `Vote ${candidate.id}`}</span>}
    </Tag>
  );
}

function Results({ poll, counts, closed }) {
  const rows = resultRows(poll.candidates, counts);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <section className={`results-panel ${closed ? 'results-closed' : ''}`} aria-live="polite">
      <header>
        <span className={`status-pill ${closed ? 'status-closed' : 'status-open'}`}>
          {closed ? 'VOTING CLOSED' : 'VOTING OPEN'}
        </span>
        <strong>{total} {total === 1 ? 'vote' : 'votes'}</strong>
      </header>
      <div className="result-bars">
        {rows.map((row) => (
          <div className={`result-row ${closed && row.winner ? 'result-winner' : ''}`} key={row.id}>
            <span className="result-letter">{row.id}</span>
            <div className="result-track"><div className="result-fill" style={{ width: `${row.percentage}%` }} /></div>
            <strong>{row.percentage.toFixed(0)}%</strong>
            <small>{row.count}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function PollSlide({ poll, phase, state, audienceUrl, warning }) {
  const counts = state?.pollKey === poll.key ? state.counts : {};
  const showCandidates = phase !== 'tweet';
  const showVoting = phase === 'live' || phase === 'closed';
  return (
    <div className={`poll-slide poll-phase-${phase}`}>
      <div className="poll-heading">
        <span>{poll.eyebrow}</span>
        <h1>{phase === 'tweet' ? 'Read the post first.' : poll.title}</h1>
      </div>
      <div className="poll-content">
        <div className="poll-source">
          <CroppedTweet poll={poll} compact={showCandidates} />
          {showVoting && (
            <div className="qr-panel">
              <div className="qr-code"><QRCodeSVG value={audienceUrl} size={112} level="M" /></div>
              <div><strong>Scan once.</strong><span>Your phone follows all three rounds.</span></div>
            </div>
          )}
        </div>
        {showCandidates && (
          <div className="poll-main">
            <div className="candidate-grid">
              {poll.candidates.map((candidate) => <CandidateCard candidate={candidate} key={candidate.id} />)}
            </div>
            {showVoting && <Results poll={poll} counts={counts} closed={phase === 'closed'} />}
          </div>
        )}
      </div>
      <footer className="poll-footer">
        <span>Illustrative candidates will be replaced with sourced Community Notes.</span>
        {warning && <strong className="poll-warning">{warning}</strong>}
      </footer>
    </div>
  );
}

function PresenterPanel({ open, onClose, token, setToken, state, currentPoll, onReset, onReopen, onExport, onRawExport, message }) {
  if (!open) return null;
  return (
    <div className="presenter-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="presenter-panel" role="dialog" aria-modal="true" aria-label="Presenter controls" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span>PRESENTER CONTROL</span><h2>Live voting preflight</h2></div>
          <button type="button" onClick={onClose} aria-label="Close presenter controls">×</button>
        </header>
        <label>Admin token<input type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" /></label>
        <div className="presenter-status">
          <span>Run</span><strong>{state?.runId ? 'ready' : 'not started'}</strong>
          <span>API phase</span><strong>{state?.phase || 'offline'}</strong>
          <span>Current poll</span><strong>{state?.pollKey || 'none'}</strong>
        </div>
        <div className="presenter-actions">
          <button type="button" className="action-primary" onClick={onReset}>Start fresh run</button>
          <button type="button" onClick={onReopen} disabled={!currentPoll}>Reopen current poll</button>
          <button type="button" onClick={onExport}>Download results CSV</button>
          <button type="button" onClick={onRawExport}>Download raw archive</button>
        </div>
        <p className="presenter-message">{message || 'Token stays in this browser tab only.'}</p>
      </section>
    </div>
  );
}

function PresentationApp() {
  const [current, setCurrent] = useState(slideFromHash);
  const [phases, setPhases] = useState(initialPhases);
  const [remoteState, setRemoteState] = useState(null);
  const [warning, setWarning] = useState('');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('science-slam-admin-token')
    || (import.meta.env.DEV ? 'dev-admin-token' : ''));
  const [presenterMessage, setPresenterMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const localMode = useRef(new Set());
  const hideTimer = useRef(null);
  const pointerStart = useRef(null);
  const swipeHandled = useRef(false);
  const wheelLocked = useRef(false);

  const slide = slides[current];
  const poll = slide.type === 'poll' ? pollsByKey[slide.pollKey] : null;
  const phase = poll ? phases[poll.key] : null;
  const audienceUrl = useMemo(() => {
    const url = new URL(import.meta.env.BASE_URL, window.location.origin);
    url.searchParams.set('audience', '1');
    return url.toString();
  }, []);

  const persistToken = useCallback((value) => {
    setAdminToken(value);
    if (value) sessionStorage.setItem('science-slam-admin-token', value);
    else sessionStorage.removeItem('science-slam-admin-token');
  }, []);
  const showControls = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2200);
  }, []);
  const setPollPhase = useCallback((pollKey, nextPhase) => setPhases((previous) => ({ ...previous, [pollKey]: nextPhase })), []);
  const goTo = useCallback((index) => {
    const nextIndex = clamp(index);
    setCurrent(nextIndex);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${nextIndex + 1}`);
    setWarning('');
  }, []);
  const refreshState = useCallback(async () => {
    try {
      const state = await getState();
      setRemoteState(state);
      return state;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const immediate = window.setTimeout(refreshState, 0);
    const timer = window.setInterval(refreshState, 750);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [refreshState]);

  const next = useCallback(async () => {
    if (busy) return;
    if (!poll) { goTo(current + 1); return; }
    if (phase === 'tweet') { setPollPhase(poll.key, 'candidates'); return; }
    if (phase === 'candidates') {
      setWarning('');
      if (!adminToken) {
        localMode.current.add(poll.key);
        setWarning('Presenter token missing — continuing in offline mode.');
        setPollPhase(poll.key, 'live');
        return;
      }
      setBusy(true);
      try {
        const state = await openPoll(poll.key, adminToken);
        setRemoteState(state);
        localMode.current.delete(poll.key);
      } catch (error) {
        localMode.current.add(poll.key);
        setWarning(`API unavailable — offline mode (${error.message}).`);
      } finally {
        setPollPhase(poll.key, 'live');
        setBusy(false);
      }
      return;
    }
    if (phase === 'live') {
      if (localMode.current.has(poll.key)) { setPollPhase(poll.key, 'closed'); return; }
      setBusy(true);
      try {
        const state = await closePoll(poll.key, adminToken);
        setRemoteState(state);
        setWarning('');
        setPollPhase(poll.key, 'closed');
      } catch (error) {
        setWarning(`Close was not acknowledged — press Next to retry (${error.message}).`);
      } finally {
        setBusy(false);
      }
      return;
    }
    goTo(current + 1);
  }, [adminToken, busy, current, goTo, phase, poll, setPollPhase]);

  const previous = useCallback(async () => {
    if (busy) return;
    if (!poll || phase === 'tweet' || phase === 'closed') { goTo(current - 1); return; }
    if (phase === 'candidates') { setPollPhase(poll.key, 'tweet'); return; }
    if (phase === 'live') await next();
  }, [busy, current, goTo, next, phase, poll, setPollPhase]);
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    } catch (error) {
      setWarning(`Fullscreen could not be changed (${error.message}).`);
    }
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (settingsOpen) return;
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(event.key)) { event.preventDefault(); next(); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) { event.preventDefault(); previous(); }
      else if (event.key === 'Home') { event.preventDefault(); goTo(0); }
      else if (event.key === 'End') { event.preventDefault(); goTo(slides.length - 1); }
      else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); setSettingsOpen(true); }
      showControls();
    };
    const handleWheel = (event) => {
      if (settingsOpen || Math.abs(event.deltaY) < 28 || wheelLocked.current) return;
      event.preventDefault();
      wheelLocked.current = true;
      if (event.deltaY > 0) next(); else previous();
      window.setTimeout(() => { wheelLocked.current = false; }, 520);
      showControls();
    };
    const handleHash = () => setCurrent(slideFromHash());
    const handleFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', handleKey);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('hashchange', handleHash);
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('hashchange', handleHash);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, [goTo, next, previous, settingsOpen, showControls, toggleFullscreen]);

  useEffect(() => {
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2200);
    return () => window.clearTimeout(hideTimer.current);
  }, []);
  useEffect(() => {
    [slides[current - 1], slides[current + 1]].filter((item) => item?.type === 'image').forEach((item) => {
      const image = new Image(); image.src = item.src;
    });
  }, [current]);

  const handlePointerDown = (event) => {
    swipeHandled.current = false;
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };
  const handlePointerUp = (event) => {
    if (!pointerStart.current) return;
    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
      swipeHandled.current = true;
      if (deltaX < 0) next(); else previous();
      window.setTimeout(() => { swipeHandled.current = false; }, 0);
    }
  };

  const handleReset = async () => {
    persistToken(adminToken.trim());
    if (!adminToken.trim()) { setPresenterMessage('Enter the admin token first.'); return; }
    try {
      const state = await resetRun(adminToken.trim());
      setRemoteState(state);
      setPhases(initialPhases());
      localMode.current.clear();
      setPresenterMessage('Fresh run started. The fixed QR is ready.');
    } catch (error) { setPresenterMessage(error.message); }
  };
  const handleReopen = async () => {
    if (!poll || !adminToken.trim()) return;
    try {
      const state = await reopenPoll(poll.key, adminToken.trim());
      setRemoteState(state);
      localMode.current.delete(poll.key);
      setPollPhase(poll.key, 'live');
      setPresenterMessage(`${poll.key} reopened.`);
    } catch (error) { setPresenterMessage(error.message); }
  };
  const handleExport = async () => {
    if (!adminToken.trim()) { setPresenterMessage('Enter the admin token first.'); return; }
    try { await downloadExport(adminToken.trim()); setPresenterMessage('CSV downloaded.'); }
    catch (error) { setPresenterMessage(error.message); }
  };
  const handleRawExport = async () => {
    if (!adminToken.trim()) { setPresenterMessage('Enter the admin token first.'); return; }
    try { await downloadRawExport(adminToken.trim()); setPresenterMessage('Raw vote CSV downloaded.'); }
    catch (error) { setPresenterMessage(error.message); }
  };

  const progress = ((current + 1) / slides.length) * 100;
  return (
    <main className={`deck ${controlsVisible ? 'controls-visible' : ''}`} onPointerMove={showControls} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <div className="ambient ambient-blue" aria-hidden="true" /><div className="ambient ambient-coral" aria-hidden="true" />
      <section className="slide-stage" aria-label={`Slide ${current + 1} of ${slides.length}`}>
        {slide.type === 'image'
          ? <img key={slide.id} className="slide-image" src={slide.src} alt={slide.title} draggable="false" />
          : <PollSlide poll={poll} phase={phase} state={remoteState} audienceUrl={audienceUrl} warning={warning} />}
      </section>
      <button className="click-zone click-zone-left" type="button" onClick={() => !swipeHandled.current && previous()} disabled={current === 0 && (!poll || phase === 'tweet')} aria-label="Previous step" />
      <button className="click-zone click-zone-right" type="button" onClick={() => !swipeHandled.current && next()} disabled={current === slides.length - 1} aria-label="Next step" />
      <div className="progress-track" aria-hidden="true"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <nav className="deck-controls" aria-label="Presentation controls">
        <button type="button" onClick={previous} aria-label="Previous step"><span aria-hidden="true">‹</span></button>
        <output aria-live="polite"><strong>{String(current + 1).padStart(2, '0')}</strong><span>/</span><span>{slides.length}</span></output>
        <button type="button" onClick={next} disabled={busy} aria-label="Next step"><span aria-hidden="true">›</span></button>
        <span className="control-divider" aria-hidden="true" />
        <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Presenter controls"><span className="settings-mark" aria-hidden="true">⚙</span></button>
        <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}><span className="fullscreen-mark" aria-hidden="true">{isFullscreen ? '×' : '⛶'}</span></button>
      </nav>
      <p className="keyboard-hint" aria-hidden="true">← → navigate · P preflight · F fullscreen</p>
      <PresenterPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} token={adminToken} setToken={persistToken} state={remoteState} currentPoll={poll} onReset={handleReset} onReopen={handleReopen} onExport={handleExport} onRawExport={handleRawExport} message={presenterMessage} />
    </main>
  );
}

function AudienceApp() {
  const [state, setState] = useState(null);
  const [connection, setConnection] = useState('connecting');
  const [selected, setSelected] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('Connecting to the room…');
  const participantId = useMemo(() => createParticipantId(localStorage), []);
  const refresh = useCallback(async () => {
    try {
      const nextState = await getState();
      setState(nextState);
      setConnection('online');
      const selectionKey = nextState.runId && nextState.pollKey ? `science-slam-selection:${nextState.runId}:${nextState.pollKey}` : '';
      setSelected(selectionKey ? localStorage.getItem(selectionKey) || '' : '');
      if (nextState.phase === 'open') setMessage('Choose one note. You can change your vote until the round closes.');
      else if (nextState.phase === 'closed') setMessage('This round is closed. Keep this page open for the next one.');
      else setMessage('Waiting for the presenter to open voting…');
    } catch {
      setConnection('offline');
      setMessage('Voting is offline right now. Keep this page open and it will reconnect.');
    }
  }, []);
  useEffect(() => {
    const immediate = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 1500);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [refresh]);
  const vote = async (choice) => {
    if (!state?.runId || !state?.pollKey || state.phase !== 'open' || submitting) return;
    setSubmitting(true);
    try {
      await submitVote({ runId: state.runId, pollKey: state.pollKey, choice, participantId });
      localStorage.setItem(`science-slam-selection:${state.runId}:${state.pollKey}`, choice);
      setSelected(choice);
      setMessage(`Vote ${choice} recorded. You can still change it until the round closes.`);
      await refresh();
    } catch (error) {
      setMessage(error.status === 409 ? 'The round just closed. Your last confirmed vote is final.' : 'Your vote was not saved. Tap again to retry.');
    } finally { setSubmitting(false); }
  };
  const poll = state?.pollKey ? pollsByKey[state.pollKey] : null;
  return (
    <main className="audience-app">
      <header className="audience-header">
        <div className="audience-brand"><span>WHO SPEAKS</span><strong>FOR THE CROWD?</strong></div>
        <span className={`connection-dot connection-${connection}`}>{connection}</span>
      </header>
      {!poll ? (
        <section className="audience-waiting"><div className="waiting-mark" aria-hidden="true">A · B · C</div><h1>Keep this page open.</h1><p>{message}</p></section>
      ) : (
        <section className="audience-poll">
          <div className="audience-round">ROUND {poll.round} OF 3 · {state.phase === 'open' ? 'VOTING OPEN' : 'VOTING CLOSED'}</div>
          <h1>{poll.title}</h1>
          <CroppedTweet poll={poll} compact />
          <div className="audience-candidates">
            {poll.candidates.map((candidate) => <CandidateCard candidate={candidate} selected={selected === candidate.id} interactive={state.phase === 'open' && !submitting} onSelect={vote} key={candidate.id} />)}
          </div>
          <p className="audience-message" aria-live="polite">{message}</p>
        </section>
      )}
    </main>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  return params.get('audience') === '1' ? <AudienceApp /> : <PresentationApp />;
}
