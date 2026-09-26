import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  closePoll, downloadExport, downloadRawExport, getState, joinRun, openPoll, reopenPoll, resetRun, submitVote,
} from './api.js';
import { hasNextSlideStep, nextSlideStep, previousSlideStep } from './deck-model.js';
import { NativeSlide } from './native-slides.jsx';
import { createParticipantId, resultRows } from './poll-model.js';
import { pollKeys, pollsByKey } from './polls.js';
import { PostCard } from './post-card.jsx';
import { slides } from './slides.js';

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

const BLUE_COLS = [3, 7.5, 12, 16.5, 21];
const BLUE_ROWS = [14, 20, 26, 32, 38];
const CORAL_COLS = [79, 83.5, 88, 92.5, 97];
const CORAL_ROWS = [50, 57, 64, 71, 78];
const CARD_LEFT = 25;
const CARD_RIGHT = 47;
const BLUE_LINE_ENDS = [27, 31, 35, 39, 43];
const CORAL_LINE_STARTS = [30, 38, 46, 54, 60];

function NetworkArtwork({ audienceUrl }) {
  const blueDots = BLUE_ROWS.flatMap((y) => BLUE_COLS.map((x) => ({ x, y })));
  const coralDots = CORAL_ROWS.flatMap((y) => CORAL_COLS.map((x) => ({ x, y })));
  const blueLinkX = BLUE_COLS[3];
  const coralLinkX = CORAL_COLS[1];

  return (
    <div className="network-artwork" aria-label="Two groups connecting to a shared note">
      <svg className="network-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <g className="network-dots-blue">
          {blueDots.map((dot, index) => <circle key={`blue-${index}`} cx={dot.x} cy={dot.y} r="0.85" />)}
        </g>
        <g className="network-dots-coral">
          {coralDots.map((dot, index) => <circle key={`coral-${index}`} cx={dot.x} cy={dot.y} r="0.85" />)}
        </g>
        <g className="network-lines-blue">
          {BLUE_ROWS.map((y, index) => (
            <line key={`blue-line-${index}`} x1={blueLinkX} y1={y} x2={CARD_LEFT + 6} y2={BLUE_LINE_ENDS[index]} />
          ))}
        </g>
        <g className="network-lines-coral">
          {CORAL_ROWS.map((y, index) => (
            <line key={`coral-line-${index}`} x1={CARD_RIGHT - 6} y1={CORAL_LINE_STARTS[index]} x2={coralLinkX} y2={y} />
          ))}
        </g>
      </svg>
      <div className="cover-qr-card">
        <div role="img" aria-label="QR code for the live audience vote">
          <QRCodeSVG value={audienceUrl} size={280} level="M" />
        </div>
        <strong>JOIN THE LIVE VOTE</strong>
      </div>
    </div>
  );
}

function CoverSlide({ audienceUrl, number }) {
  return (
    <div className="cover-slide">
      <span className="opening-slide-number">{String(number).padStart(2, '0')}</span>
      <section className="cover-copy">
        <h1>WHO SPEAKS<br />FOR THE CROWD?</h1>
        <div className="cover-meta">
          <strong>Emrecan Ulu / Jingyao Shi</strong>
          <span>SEDS Data Science Slam · 1 October 2026</span>
        </div>
      </section>
      <NetworkArtwork audienceUrl={audienceUrl} />
    </div>
  );
}

function JoinedCount({ count, compact = false }) {
  if (count == null) return null;
  return (
    <div className={`joined-count ${compact ? 'joined-count-compact' : ''}`}>
      <span className="joined-count-dot" aria-hidden="true" />
      <strong>{count}</strong> {count === 1 ? 'person' : 'people'} joined
    </div>
  );
}

function JoinSlide({ audienceUrl, number, state }) {
  return (
    <div className="join-slide">
      <span className="opening-slide-number">{String(number).padStart(2, '0')}</span>
      <span className="join-eyebrow">LIVE AUDIENCE VOTE</span>
      <h1>YOU’RE PART OF THE CROWD</h1>
      <JoinedCount count={state?.joinedCount} />
      <VoteQr audienceUrl={audienceUrl} large label="Scan now." />
      <p>The first question will appear automatically.</p>
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

function PollSlide({ poll, phase, state, audienceUrl, warning, number }) {
  const counts = state?.pollKey === poll.key ? state.counts : {};
  const rows = resultRows(poll.candidates, counts);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const showCandidates = phase !== 'tweet';
  const showVoting = phase === 'live' || phase === 'closed' || phase === 'reveal';
  const closed = phase === 'closed' || phase === 'reveal';
  const showReveal = phase === 'reveal';
  const votingOpen = phase === 'live';
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
        <span>{showReveal ? 'What sounds convincing is not always what is supported.' : 'Choose the note that should appear below this post.'}</span>
        {warning && <strong className="poll-warning">{warning}</strong>}
      </footer>
    </div>
  );
}

function PresenterPanel({ open, onClose, state, currentPoll, onReset, onReopen, onExport, onRawExport, message }) {
  if (!open) return null;
  return (
    <div className="presenter-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="presenter-panel" role="dialog" aria-modal="true" aria-label="Presenter controls" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span>PRESENTER CONTROL</span><h2>Live voting preflight</h2></div>
          <button type="button" onClick={onClose} aria-label="Close presenter controls">×</button>
        </header>
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
        <p className="presenter-message">{message || 'The VPS controls whether voting is online.'}</p>
      </section>
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [presenterMessage, setPresenterMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const localMode = useRef(new Set());
  const hideTimer = useRef(null);
  const wheelLocked = useRef(false);

  const slide = slides[current];
  const poll = slide.type === 'poll' ? pollsByKey[slide.pollKey] : null;
  const phase = poll ? phases[poll.key] : null;
  const slideStep = slideSteps[slide.id] || 0;
  const audienceUrl = useMemo(() => {
    const url = new URL(import.meta.env.BASE_URL, window.location.origin);
    url.searchParams.set('audience', '1');
    return url.toString();
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
    if (!poll) {
      if (slide.type === 'native' && hasNextSlideStep(slideStep, slide.steps)) {
        setSlideSteps((previous) => ({ ...previous, [slide.id]: nextSlideStep(slideStep, slide.steps) }));
      } else goTo(current + 1);
      return;
    }
    if (phase === 'tweet') { setPollPhase(poll.key, 'candidates'); return; }
    if (phase === 'candidates') {
      setWarning('');
      setBusy(true);
      try {
        const state = await openPoll(poll.key);
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
        const state = await closePoll(poll.key);
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
  }, [busy, current, goTo, phase, poll, setPollPhase, slide, slideStep]);

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
      if (settingsOpen || document.body.dataset.lightboxOpen) return;
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(event.key)) { event.preventDefault(); next(); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) { event.preventDefault(); previous(); }
      else if (event.key === 'Home') { event.preventDefault(); goTo(0); }
      else if (event.key === 'End') { event.preventDefault(); goTo(slides.length - 1); }
      else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); setSettingsOpen(true); }
      showControls();
    };
    const handleWheel = (event) => {
      if (settingsOpen || document.body.dataset.lightboxOpen || Math.abs(event.deltaY) < 28 || wheelLocked.current) return;
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
  const handleReset = async () => {
    try {
      const state = await resetRun();
      setRemoteState(state);
      setPhases(initialPhases());
      setSlideSteps({});
      localMode.current.clear();
      setPresenterMessage('Fresh run started. The fixed QR is ready.');
    } catch (error) { setPresenterMessage(error.message); }
  };
  const handleReopen = async () => {
    if (!poll) return;
    try {
      const state = await reopenPoll(poll.key);
      setRemoteState(state);
      localMode.current.delete(poll.key);
      setPollPhase(poll.key, 'live');
      setPresenterMessage(`${poll.key} reopened.`);
    } catch (error) { setPresenterMessage(error.message); }
  };
  const handleExport = async () => {
    try { await downloadExport(); setPresenterMessage('CSV downloaded.'); }
    catch (error) { setPresenterMessage(error.message); }
  };
  const handleRawExport = async () => {
    try { await downloadRawExport(); setPresenterMessage('Raw vote CSV downloaded.'); }
    catch (error) { setPresenterMessage(error.message); }
  };

  const progress = ((current + 1) / slides.length) * 100;
  return (
    <main className={`deck ${controlsVisible ? 'controls-visible' : ''}`} onPointerMove={showControls}>
      <div className="ambient ambient-blue" aria-hidden="true" /><div className="ambient ambient-coral" aria-hidden="true" />
      <section className="slide-stage" aria-label={`Slide ${current + 1} of ${slides.length}`}>
        {slide.type === 'cover' && <CoverSlide audienceUrl={audienceUrl} number={current + 1} />}
        {slide.type === 'join' && <JoinSlide audienceUrl={audienceUrl} number={current + 1} state={remoteState} />}
        {slide.type === 'poll' && <PollSlide poll={poll} phase={phase} state={remoteState} audienceUrl={audienceUrl} warning={warning} number={current + 1} />}
        {slide.type === 'native' && <NativeSlide slideKey={slide.nativeKey} number={current + 1} step={slideStep} />}
      </section>
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
      <PresenterPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} state={remoteState} currentPoll={poll} onReset={handleReset} onReopen={handleReopen} onExport={handleExport} onRawExport={handleRawExport} message={presenterMessage} />
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
  const joinedRunId = useRef('');
  useEffect(() => {
    if (!state?.runId || joinedRunId.current === state.runId) return;
    joinedRunId.current = state.runId;
    joinRun({ runId: state.runId, participantId }).catch(() => { joinedRunId.current = ''; });
  }, [state?.runId, participantId]);
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
  const votingOpen = state?.phase === 'open';
  const countdown = useCountdown(votingOpen, POLL_COUNTDOWN_SECONDS);
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
          <div className="audience-round">
            <span>ROUND {poll.round} OF 3 · {votingOpen ? 'VOTING OPEN' : 'VOTING CLOSED'}</span>
            {votingOpen && <CountdownRing remaining={countdown} total={POLL_COUNTDOWN_SECONDS} compact />}
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
