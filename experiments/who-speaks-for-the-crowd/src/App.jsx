import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  getState, joinRun, reportClosed, submitVote,
} from './api.js';
import { hasNextSlideStep, nextSlideStep, previousSlideStep } from './deck-model.js';
import { NativeSlide } from './native-slides.jsx';
import { createParticipantId, resultRows } from './poll-model.js';
import { pollKeys, pollsByKey } from './polls.js';
import { nextHealthCheckDelayMs } from './preflight-timing.js';
import { PostCard } from './post-card.jsx';
import { createPresenterBridge } from './presenter-bridge.js';
import { slides } from './slides.js';
import { connectVotingApi } from './voting-connection.js';

const clamp = (value) => Math.min(slides.length - 1, Math.max(0, value));
const initialPhases = () => Object.fromEntries(pollKeys.map((key) => [key, 'tweet']));
const POLL_COUNTDOWN_SECONDS = 40;

function slideFromHash() {
  const parsed = Number.parseInt(window.location.hash.slice(1), 10);
  return Number.isFinite(parsed) ? clamp(parsed - 1) : 0;
}

function useCountdown(active, seconds) {
  const [remaining, setRemaining] = useState(seconds);
  const startRef = useRef(null);

  useEffect(() => {
    if (!active) {
      startRef.current = null;
      return undefined;
    }
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      setRemaining(Math.max(0, Math.ceil(seconds - elapsed)));
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [active, seconds]);

  return remaining;
}

const COUNTDOWN_RADIUS = 42;
const COUNTDOWN_CIRCUMFERENCE = 2 * Math.PI * COUNTDOWN_RADIUS;

function CountdownRing({ remaining, total, compact = false, large = false }) {
  const pct = Math.max(0, Math.min(1, remaining / total));
  const urgent = remaining <= 5;
  return (
    <div className={`countdown-ring ${compact ? 'countdown-ring-compact' : ''} ${large ? 'countdown-ring-large' : ''} ${urgent ? 'countdown-ring-urgent' : ''}`} aria-live="polite">
      <svg viewBox="0 0 100 100">
        <circle className="countdown-ring-track" cx="50" cy="50" r={COUNTDOWN_RADIUS} />
        <circle
          className="countdown-ring-progress"
          cx="50" cy="50" r={COUNTDOWN_RADIUS}
          strokeDasharray={COUNTDOWN_CIRCUMFERENCE}
          strokeDashoffset={COUNTDOWN_CIRCUMFERENCE * (1 - pct)}
        />
      </svg>
      <span className="countdown-ring-value">{remaining}</span>
    </div>
  );
}

function QrLightbox({ audienceUrl, onClose }) {
  useEffect(() => {
    document.body.dataset.lightboxOpen = 'true';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      delete document.body.dataset.lightboxOpen;
    };
  }, [onClose]);

  return createPortal(
    <div className="qr-lightbox" role="dialog" aria-modal="true" aria-label="Enlarged QR code" onClick={onClose}>
      <div className="qr-lightbox-card" onClick={(event) => event.stopPropagation()}>
        <QRCodeSVG value={audienceUrl} size={560} level="M" />
        <button type="button" className="qr-lightbox-close" onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>,
    document.body,
  );
}

function VoteQr({ audienceUrl, large = false, compact = false, label = 'Scan once.' }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`vote-qr ${large ? 'vote-qr-large' : ''} ${compact ? 'vote-qr-compact' : ''}`}>
      <button
        type="button"
        className="vote-qr-code"
        onClick={() => setExpanded(true)}
        aria-label="Enlarge QR code for the live audience vote"
      >
        <QRCodeSVG value={audienceUrl} size={256} level="M" />
      </button>
      <div className="vote-qr-copy">
        <strong>{label}</strong>
        <span>Keep this page open.</span>
      </div>
      {expanded && <QrLightbox audienceUrl={audienceUrl} onClose={() => setExpanded(false)} />}
    </div>
  );
}

function JoinedCount({ count, compact = false }) {
  if (count == null) return null;
  return (
    <div className={`joined-count ${compact ? 'joined-count-compact' : ''}`}>
      <span className="joined-count-dot" aria-hidden="true" />
      <strong>{count}</strong> {count === 1 ? 'join' : 'joins'} this run
    </div>
  );
}

function JoinSlide({ audienceUrl, number, state }) {
  return (
    <div className="join-slide">
      <span className="opening-slide-number">{String(number).padStart(2, '0')}</span>
      <div className="join-meta">
        <strong>Emrecan Ulu / Jingyao Shi</strong>
        <span>SEDS Data Science Slam · 1 October 2026</span>
      </div>
      <span className="join-eyebrow">INTERACTIVE PRESENTATION</span>
      <h1>WHO SPEAKS FOR THE CROWD?</h1>
      <p className="join-subtitle">Please join before we start — this talk is interactive, and you’ll vote live from your phone throughout.</p>
      <JoinedCount count={state?.joinedCount} />
      <VoteQr audienceUrl={audienceUrl} large label="Scan now." />
    </div>
  );
}

function CandidateCard({ candidate, selected = false, interactive = false, onSelect, presentation = false, result, showResult = false, showReveal = false, closed = false }) {
  const Tag = interactive ? 'button' : 'article';
  const winner = closed && result?.winner && !showReveal;
  const resultText = result ? `${result.percentage.toFixed(0)}% · ${result.count}` : '0% · 0';
  const revealTone = showReveal ? candidate.reveal?.tone : '';
  return (
    <Tag
      className={`candidate-card ${presentation ? 'candidate-presentation' : ''} ${selected ? 'candidate-selected' : ''} ${winner ? 'candidate-winner' : ''} ${revealTone ? `candidate-reveal-${revealTone}` : ''}`}
      type={interactive ? 'button' : undefined}
      onClick={interactive ? () => onSelect(candidate.id) : undefined}
      aria-pressed={interactive ? selected : undefined}
    >
      {presentation ? (
        <>
          <strong className="candidate-letter">{candidate.id}</strong>
          <div className="candidate-body">
            <span className="candidate-badge">{candidate.badge}</span>
            <p>{candidate.text}</p>
            <div className={`candidate-explanation ${showReveal ? 'candidate-explanation-visible' : ''}`} aria-hidden={!showReveal}>
              <strong>{candidate.reveal?.label}</strong>
              <span>{candidate.reveal?.detail}</span>
            </div>
            <div className={`candidate-result ${showResult ? 'candidate-result-visible' : ''}`} aria-hidden={!showResult}>
              <div className="candidate-result-track">
                <div className="candidate-result-fill" style={{ width: `${result?.percentage || 0}%` }} />
              </div>
              <strong>{resultText}</strong>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="candidate-topline">
            <strong className="candidate-letter">{candidate.id}</strong>
            <span className="candidate-badge">{candidate.badge}</span>
          </div>
          <p>{candidate.text}</p>
          {interactive && <span className="candidate-action">{selected ? 'Selected' : `Vote ${candidate.id}`}</span>}
        </>
      )}
    </Tag>
  );
}

function PollSlide({ poll, phase, state, audienceUrl, warning, number, votingKeyOff }) {
  const counts = state?.pollKey === poll.key ? state.counts : {};
  const rows = resultRows(poll.candidates, counts);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const showCandidates = phase !== 'tweet';
  const showVoting = phase === 'live' || phase === 'closed' || phase === 'reveal';
  const votingOpen = phase === 'live' && state?.pollKey === poll.key && state.phase === 'open';
  const closed = phase === 'closed' || phase === 'reveal' || (phase === 'live' && !votingOpen);
  const showReveal = phase === 'reveal';
  const countdown = useCountdown(votingOpen, POLL_COUNTDOWN_SECONDS);
  const actualCandidate = poll.candidates.find((candidate) => candidate.reveal?.tone === 'actual');
  return (
    <div className={`poll-slide poll-phase-${phase}`}>
      <div className="poll-heading">
        <div className="poll-heading-text">
          <div><span>{poll.eyebrow}</span><span>{String(number).padStart(2, '0')}</span></div>
          <h1>{phase === 'tweet' ? 'Read the post first.' : poll.title}</h1>
        </div>
        {votingOpen && (
          <div className="poll-countdown-center">
            <CountdownRing remaining={countdown} total={POLL_COUNTDOWN_SECONDS} large />
          </div>
        )}
        <div className="poll-heading-aside">
          <JoinedCount count={state?.joinedCount} compact />
          <VoteQr audienceUrl={audienceUrl} compact label="JOIN" />
        </div>
      </div>
      <div className="poll-content">
        {!showCandidates ? (
          <div className="poll-source poll-source-feature"><PostCard post={poll.post} /></div>
        ) : (
          <>
            <div className="poll-source">
              <PostCard
                post={poll.post}
                compact
                className={poll.key === 'case-great-wall' && showReveal ? 'post-card-compact-tight' : ''}
                note={showReveal && actualCandidate ? (
                  <>
                    {actualCandidate.text}
                    {actualCandidate.reveal.detail && <span className="post-note-source">{actualCandidate.reveal.detail}</span>}
                  </>
                ) : undefined}
              />
            </div>
          <div className="poll-main">
            <div className="poll-live-header" aria-live="polite">
              <div className={`poll-live-status ${showVoting ? 'poll-live-status-visible' : ''}`}>
                <span className={`status-pill ${closed ? 'status-closed' : 'status-open'}`}>
                  {closed ? 'VOTING CLOSED' : 'VOTING OPEN'}
                </span>
                <strong>{total} {total === 1 ? 'vote' : 'votes'}</strong>
              </div>
            </div>
            <div className="candidate-grid">
              {poll.candidates.map((candidate, index) => (
                <CandidateCard
                  candidate={candidate}
                  presentation
                  result={rows[index]}
                  showResult={showVoting}
                  showReveal={showReveal}
                  closed={closed}
                  key={candidate.id}
                />
              ))}
            </div>
          </div>
          </>
        )}
      </div>
      <footer className="poll-footer">
        {votingKeyOff && !showVoting && <strong className="poll-warning">Voting key is off — this round will be skipped.</strong>}
        {warning && <strong className="poll-warning">{warning}</strong>}
      </footer>
    </div>
  );
}

function PresentationApp() {
  const [current, setCurrent] = useState(slideFromHash);
  const [phases, setPhases] = useState(initialPhases);
  const [slideSteps, setSlideSteps] = useState({});
  const [remoteState, setRemoteState] = useState(null);
  const [warning, setWarning] = useState('');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [busy, setBusy] = useState(false);
  const [presenterPaired, setPresenterPaired] = useState(false);
  const [vpsConnection, setVpsConnection] = useState('connecting');
  const hideTimer = useRef(null);
  const wheelLocked = useRef(false);
  const observedRunId = useRef(undefined);
  const presenterBridge = useRef(null);

  const slide = slides[current];
  const poll = slide.type === 'poll' ? pollsByKey[slide.pollKey] : null;
  const phase = poll ? phases[poll.key] : null;
  const canControlVoting = presenterPaired;
  const votingKeyOff = vpsConnection !== 'connected';
  const slideStep = slideSteps[slide.id] || 0;
  const audienceUrl = useMemo(() => {
    const url = new URL('https://emrecanulu.com/who-speaks-for-the-crowd/');
    url.searchParams.set('audience', '1');
    return url.toString();
  }, []);

  useEffect(() => connectVotingApi(setVpsConnection), []);

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
  const refreshState = useCallback(async (signal) => {
    try {
      const state = await getState(signal);
      setRemoteState(state);
      return state;
    } catch {
      setRemoteState(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const bridge = createPresenterBridge(window, {
      onPairChange: setPresenterPaired,
      onReset: () => {
        observedRunId.current = undefined;
        setPhases(initialPhases());
        setSlideSteps({});
        goTo(0);
        setWarning('');
      },
      onKeyChange: () => {},
    });
    presenterBridge.current = bridge;
    bridge.start();
    return () => {
      bridge.stop();
      presenterBridge.current = null;
    };
  }, [goTo]);

  const changeVoting = useCallback((action, pollKey) => presenterBridge.current?.command(action, pollKey)
    || Promise.reject(new Error('Open the live presentation from the local management panel')), []);

  useEffect(() => {
    if (!canControlVoting || !remoteState?.runId) return;
    if (observedRunId.current === undefined) {
      observedRunId.current = remoteState.runId;
      return;
    }
    if (observedRunId.current !== remoteState.runId) {
      observedRunId.current = remoteState.runId;
      setPhases(initialPhases());
      setSlideSteps({});
      goTo(0);
      setWarning('');
    }
  }, [canControlVoting, goTo, remoteState?.runId]);

  const livePolling = Boolean(poll && phase === 'live');
  useEffect(() => {
    let cancelled = false;
    let timer;
    const check = async () => {
      await refreshState();
      if (!cancelled) timer = window.setTimeout(check, livePolling ? 750 : nextHealthCheckDelayMs());
    };
    check();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [refreshState, livePolling]);

  const next = useCallback(async () => {
    if (busy) return;
    if (!poll) {
      if (slide.type === 'native' && hasNextSlideStep(slideStep, slide.steps)) {
        setSlideSteps((previous) => ({ ...previous, [slide.id]: nextSlideStep(slideStep, slide.steps) }));
      } else goTo(current + 1);
      return;
    }
    if (phase === 'tweet') { setPollPhase(poll.key, 'candidates'); return; }
    if (phase === 'candidates') {
      if (votingKeyOff) { goTo(current + 1); return; }
      if (!canControlVoting) {
        setWarning('Open this presentation from the local management panel to control live voting.');
        return;
      }
      setWarning('');
      setBusy(true);
      try {
        const state = await changeVoting('open', poll.key);
        if (state?.pollKey !== poll.key || state.phase !== 'open') throw new Error('VPS did not confirm the round is open');
        setRemoteState(state);
        setPollPhase(poll.key, 'live');
      } catch (error) {
        setWarning(`Voting did not open. Check the local operator panel and retry (${error.message}).`);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (phase === 'live') {
      if (!canControlVoting) {
        setWarning('Presenter connection lost. Reopen the presentation from the local management panel.');
        return;
      }
      setBusy(true);
      try {
        const state = await changeVoting('close', poll.key);
        if (state?.pollKey !== poll.key || state.phase !== 'closed') throw new Error('VPS did not confirm the round is closed');
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
    if (phase === 'closed') { setPollPhase(poll.key, 'reveal'); return; }
    goTo(current + 1);
  }, [busy, canControlVoting, changeVoting, current, goTo, phase, poll, setPollPhase, slide, slideStep, votingKeyOff]);

  const previous = useCallback(async () => {
    if (busy) return;
    if (!poll) {
      if (slide.type === 'native' && slideStep > 0) {
        setSlideSteps((previousSteps) => ({ ...previousSteps, [slide.id]: previousSlideStep(slideStep) }));
      } else goTo(current - 1);
      return;
    }
    if (phase === 'reveal') { setPollPhase(poll.key, 'closed'); return; }
    if (phase === 'tweet' || phase === 'closed') { goTo(current - 1); return; }
    if (phase === 'candidates') { setPollPhase(poll.key, 'tweet'); return; }
    if (phase === 'live') await next();
  }, [busy, current, goTo, next, phase, poll, setPollPhase, slide, slideStep]);
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
      if (document.body.dataset.lightboxOpen) return;
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(event.key)) { event.preventDefault(); next(); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) { event.preventDefault(); previous(); }
      else if (event.key === 'Home') { event.preventDefault(); goTo(0); }
      else if (event.key === 'End') { event.preventDefault(); goTo(slides.length - 1); }
      else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
      showControls();
    };
    const handleWheel = (event) => {
      if (document.body.dataset.lightboxOpen || Math.abs(event.deltaY) < 28 || wheelLocked.current) return;
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
  }, [goTo, next, previous, showControls, toggleFullscreen]);

  useEffect(() => {
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2200);
    return () => window.clearTimeout(hideTimer.current);
  }, []);
  const progress = ((current + 1) / slides.length) * 100;
  return (
    <main className={`deck ${controlsVisible ? 'controls-visible' : ''}`} onPointerMove={showControls}>
      <div className="ambient ambient-blue" aria-hidden="true" /><div className="ambient ambient-coral" aria-hidden="true" />
      <section className="slide-stage" aria-label={`Slide ${current + 1} of ${slides.length}`}>
        {slide.type === 'join' && <JoinSlide audienceUrl={audienceUrl} number={current + 1} state={remoteState} />}
        {slide.type === 'poll' && <PollSlide poll={poll} phase={phase} state={remoteState} audienceUrl={audienceUrl} warning={warning} number={current + 1} votingKeyOff={votingKeyOff} />}
        {slide.type === 'native' && <NativeSlide slideKey={slide.nativeKey} number={current + 1} step={slideStep} />}
        <a className="slide-research-link" href="https://emrecanulu.com/research/cross-constituency-aggregation-community-notes.html" target="_blank" rel="noopener noreferrer">
          emrecanulu.com/research/cross-constituency-aggregation-community-notes.html
        </a>
      </section>
      <div className="progress-track" aria-hidden="true"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <nav className="deck-controls" aria-label="Presentation controls">
        <button type="button" onClick={previous} aria-label="Previous step"><span aria-hidden="true">‹</span></button>
        <output aria-live="polite"><strong>{String(current + 1).padStart(2, '0')}</strong><span>/</span><span>{slides.length}</span></output>
        <button type="button" onClick={next} disabled={busy} aria-label="Next step"><span aria-hidden="true">›</span></button>
        <span className="control-divider" aria-hidden="true" />
        <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}><span className="fullscreen-mark" aria-hidden="true">{isFullscreen ? '×' : '⛶'}</span></button>
      </nav>
      <div className={`vps-connection vps-connection-${vpsConnection}`} role="status" aria-live="polite">
        <span className="vps-connection-dot" aria-hidden="true" />
        {vpsConnection === 'connected'
          ? (canControlVoting ? 'Connected · Control ready' : 'Connected · Control not paired')
          : vpsConnection === 'connecting' ? 'Connecting to voting API…' : 'Cannot connect to voting API'}
      </div>
      <p className="keyboard-hint" aria-hidden="true">← → navigate · {canControlVoting ? 'LIVE VPS CONTROL CONNECTED' : 'OPEN FROM MANAGEMENT PANEL TO CONTROL VOTING'} · F fullscreen</p>
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
  const stateRef = useRef(null);
  const refresh = useCallback(async () => {
    try {
      const nextState = await getState(undefined, participantId);
      stateRef.current = nextState;
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
  }, [participantId]);
  useEffect(() => {
    const immediate = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 1500);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [refresh]);
  const joinedRunId = useRef('');
  useEffect(() => {
    if (!state?.runId || joinedRunId.current === state.runId) return;
    joinedRunId.current = state.runId;
    joinRun({ runId: state.runId, participantId }).catch(() => { joinedRunId.current = ''; });
  }, [state?.runId, participantId]);
  useEffect(() => {
    // pagehide (not beforeunload/visibilitychange) fires on an actual close
    // or navigation away, including on mobile Safari, and not on a mere
    // screen lock or app switch -- those just go quiet in the heartbeat
    // above instead, which the operator panel reads as "away," not "closed."
    // event.persisted means the page went into bfcache and may come back,
    // so that case sends nothing.
    const handlePageHide = (event) => {
      const runId = stateRef.current?.runId;
      if (!event.persisted && runId) reportClosed({ runId, participantId });
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [participantId]);
  useEffect(() => {
    if (!state?.pollKey) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state?.pollKey]);
  const vote = async (choice) => {
    if (!state?.runId || !state?.pollKey || state.phase !== 'open' || submitting) return;
    setSubmitting(true);
    try {
      await joinRun({ runId: state.runId, participantId });
      await submitVote({ runId: state.runId, pollKey: state.pollKey, choice, participantId });
      localStorage.setItem(`science-slam-selection:${state.runId}:${state.pollKey}`, choice);
      setSelected(choice);
      setMessage(`Vote ${choice} recorded. You can still change it until the round closes.`);
      await refresh();
    } catch (error) {
      setMessage(error.status === 409 ? 'Voting may have closed or the room is unavailable. Check the big screen.' : 'Your vote was not saved. Tap again to retry.');
    } finally { setSubmitting(false); }
  };
  const poll = state?.pollKey ? pollsByKey[state.pollKey] : null;
  const votingOpen = state?.phase === 'open';
  const countdown = useCountdown(votingOpen, POLL_COUNTDOWN_SECONDS);
  return (
    <main className="audience-app">
      <header className="audience-header">
        <div className="audience-brand"><span>WHO SPEAKS</span><strong>FOR THE CROWD?</strong></div>
        <div className="audience-header-status">
          {votingOpen && <CountdownRing remaining={countdown} total={POLL_COUNTDOWN_SECONDS} compact />}
          <span className={`connection-dot connection-${connection}`}>{connection}</span>
        </div>
      </header>
      {!poll ? (
        <section className="audience-waiting"><div className="waiting-mark" aria-hidden="true">A · B · C</div><h1>Keep this page open.</h1><p>{message}</p></section>
      ) : state.phase === 'closed' ? (
        <section className="audience-waiting">
          <div className="waiting-mark" aria-hidden="true">↑</div>
          <h1>Look up!</h1>
          <p>Round {poll.round} is closed. Watch the big screen for what happens next.</p>
        </section>
      ) : (
        <section className="audience-poll">
          <div className="audience-round">
            <span>ROUND {poll.round} OF 3 · VOTING OPEN</span>
          </div>
          <h1>{poll.title}</h1>
          <PostCard post={poll.post} compact />
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
