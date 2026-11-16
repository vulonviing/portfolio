import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { archive, archiveTotal, readOwnVote } from './archive.js';
import { hasNextSlideStep, nextSlideStep, previousSlideStep } from './deck-model.js';
import { NativeSlide } from './native-slides.jsx';
import { resultRows } from './poll-model.js';
import { pollKeys, polls, pollsByKey } from './polls.js';
import { PostCard } from './post-card.jsx';
import { slides } from './slides.js';
import { VoteQr } from './vote-qr.jsx';

const clamp = (value) => Math.min(slides.length - 1, Math.max(0, value));
const initialPhases = () => Object.fromEntries(pollKeys.map((key) => [key, 'tweet']));
const ARCHIVE_NOTE = `The audience voted live on ${archive.dateLabel} — scan the QR code to see how the room voted.`;

function slideFromHash() {
  const parsed = Number.parseInt(window.location.hash.slice(1), 10);
  return Number.isFinite(parsed) ? clamp(parsed - 1) : 0;
}

function JoinedCount({ count, compact = false }) {
  if (count == null) return null;
  return (
    <div className={`joined-count ${compact ? 'joined-count-compact' : ''}`}>
      <span className="joined-count-dot" aria-hidden="true" />
      <strong>{count}</strong> people joined the live vote
    </div>
  );
}

function JoinSlide({ audienceUrl, number }) {
  return (
    <div className="join-slide">
      <span className="opening-slide-number">{String(number).padStart(2, '0')}</span>
      <div className="join-meta">
        <strong>Emrecan Ulu / Jingyao Shi</strong>
        <span>SEDS Data Science Slam · {archive.dateLabel}</span>
      </div>
      <span className="join-eyebrow">INTERACTIVE PRESENTATION</span>
      <h1>WHO SPEAKS FOR THE CROWD?</h1>
      <p className="join-subtitle">This talk was interactive: the audience voted live from their phones. Voting has ended — scan to see how the room voted.</p>
      <JoinedCount count={archive.joined} />
      <VoteQr audienceUrl={audienceUrl} large label="Scan for the results." hint="How the room voted." />
    </div>
  );
}

function CandidateCard({ candidate, presentation = false, result, showResult = false, showReveal = false, closed = false }) {
  const winner = closed && result?.winner && !showReveal;
  const resultText = result ? `${result.percentage.toFixed(0)}% · ${result.count}` : '0% · 0';
  const revealTone = showReveal ? candidate.reveal?.tone : '';
  return (
    <article
      className={`candidate-card ${presentation ? 'candidate-presentation' : ''} ${winner ? 'candidate-winner' : ''} ${revealTone ? `candidate-reveal-${revealTone}` : ''}`}
    >
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
    </article>
  );
}

function PollSlide({ poll, phase, audienceUrl, number }) {
  const rows = resultRows(poll.candidates, archive.counts[poll.key]);
  const total = archiveTotal(poll.key);
  const showCandidates = phase !== 'tweet';
  const showVoting = phase === 'closed' || phase === 'reveal';
  const showReveal = phase === 'reveal';
  const actualCandidate = poll.candidates.find((candidate) => candidate.reveal?.tone === 'actual');
  return (
    <div className={`poll-slide poll-phase-${phase}`}>
      <div className="poll-heading">
        <div className="poll-heading-text">
          <div><span>{poll.eyebrow}</span><span>{String(number).padStart(2, '0')}</span></div>
          <h1>{phase === 'tweet' ? 'Read the post first.' : poll.title}</h1>
        </div>
        <div className="poll-heading-aside">
          <VoteQr audienceUrl={audienceUrl} compact label="RESULTS" hint="Scan to view." />
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
                  <span className="status-pill status-closed">VOTING CLOSED</span>
                  <strong>{total} votes</strong>
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
                    closed
                    key={candidate.id}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <footer className="poll-footer">
        <strong className="poll-archive-note">{ARCHIVE_NOTE}</strong>
      </footer>
    </div>
  );
}

function PresentationApp() {
  const [current, setCurrent] = useState(slideFromHash);
  const [phases, setPhases] = useState(initialPhases);
  const [slideSteps, setSlideSteps] = useState({});
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const hideTimer = useRef(null);
  const wheelLocked = useRef(false);

  const slide = slides[current];
  const poll = slide.type === 'poll' ? pollsByKey[slide.pollKey] : null;
  const phase = poll ? phases[poll.key] : null;
  const slideStep = slideSteps[slide.id] || 0;
  const audienceUrl = useMemo(() => {
    const url = new URL('https://emrecanulu.com/who-speaks-for-the-crowd/');
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
  }, []);

  const next = useCallback(() => {
    if (!poll) {
      if (slide.type === 'native' && hasNextSlideStep(slideStep, slide.steps)) {
        setSlideSteps((previous) => ({ ...previous, [slide.id]: nextSlideStep(slideStep, slide.steps) }));
      } else goTo(current + 1);
      return;
    }
    if (phase === 'tweet') setPollPhase(poll.key, 'candidates');
    else if (phase === 'candidates') setPollPhase(poll.key, 'closed');
    else if (phase === 'closed') setPollPhase(poll.key, 'reveal');
    else goTo(current + 1);
  }, [current, goTo, phase, poll, setPollPhase, slide, slideStep]);

  const previous = useCallback(() => {
    if (!poll) {
      if (slide.type === 'native' && slideStep > 0) {
        setSlideSteps((previousSteps) => ({ ...previousSteps, [slide.id]: previousSlideStep(slideStep) }));
      } else goTo(current - 1);
      return;
    }
    if (phase === 'reveal') setPollPhase(poll.key, 'closed');
    else if (phase === 'closed') setPollPhase(poll.key, 'candidates');
    else if (phase === 'candidates') setPollPhase(poll.key, 'tweet');
    else goTo(current - 1);
  }, [current, goTo, phase, poll, setPollPhase, slide, slideStep]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be refused by the browser; the deck keeps working.
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
        {slide.type === 'join' && <JoinSlide audienceUrl={audienceUrl} number={current + 1} />}
        {slide.type === 'poll' && <PollSlide poll={poll} phase={phase} audienceUrl={audienceUrl} number={current + 1} />}
        {slide.type === 'native' && (
          <NativeSlide
            slideKey={slide.nativeKey}
            number={current + 1}
            step={slide.backup ? Number.MAX_SAFE_INTEGER : slideStep}
            backup={slide.backup}
            audienceUrl={audienceUrl}
          />
        )}
        <a className="slide-research-link" href="https://emrecanulu.com/research/cross-constituency-aggregation-community-notes.html" target="_blank" rel="noopener noreferrer">
          emrecanulu.com/research/cross-constituency-aggregation-community-notes.html
        </a>
      </section>
      <div className="progress-track" aria-hidden="true"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <nav className="deck-controls" aria-label="Presentation controls">
        <button type="button" onClick={previous} aria-label="Previous step"><span aria-hidden="true">‹</span></button>
        <output aria-live="polite"><strong>{String(current + 1).padStart(2, '0')}</strong><span>/</span><span>{slides.length}</span></output>
        <button type="button" onClick={next} aria-label="Next step"><span aria-hidden="true">›</span></button>
        <span className="control-divider" aria-hidden="true" />
        <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}><span className="fullscreen-mark" aria-hidden="true">{isFullscreen ? '×' : '⛶'}</span></button>
      </nav>
      <p className="keyboard-hint" aria-hidden="true">← → navigate · F fullscreen</p>
    </main>
  );
}

function ArchiveCandidate({ candidate, result, mine }) {
  return (
    <article className={`candidate-card archive-candidate candidate-reveal-${candidate.reveal.tone} ${mine ? 'candidate-selected' : ''}`}>
      <div className="candidate-topline">
        <strong className="candidate-letter">{candidate.id}</strong>
        <span className="candidate-badge">{mine ? 'Your vote' : candidate.badge}</span>
      </div>
      <p>{candidate.text}</p>
      <div className="archive-result">
        <div className="archive-result-track"><div className="archive-result-fill" style={{ width: `${result.percentage}%` }} /></div>
        <strong>{result.percentage.toFixed(0)}% · {result.count}</strong>
      </div>
      <div className="archive-reveal">
        <strong>{candidate.reveal.label}</strong>
        <span>{candidate.reveal.detail}</span>
      </div>
    </article>
  );
}

function AudienceApp() {
  const ownVotes = useMemo(() => Object.fromEntries(polls.map((poll) => [poll.key, readOwnVote(poll.key)])), []);
  return (
    <main className="audience-app">
      <header className="audience-header">
        <div className="audience-brand"><span>WHO SPEAKS</span><strong>FOR THE CROWD?</strong></div>
        <div className="audience-header-status">
          <span className="connection-dot connection-closed">voting closed</span>
        </div>
      </header>
      <section className="audience-waiting archive-intro">
        <div className="waiting-mark" aria-hidden="true">A · B · C</div>
        <h1>The room has voted.</h1>
        <p>{archive.joined} people joined the SEDS Data Science Slam on {archive.dateLabel} and voted live from their phones. Here is how the room voted in both rounds.</p>
      </section>
      {polls.map((poll) => {
        const rows = resultRows(poll.candidates, archive.counts[poll.key]);
        return (
          <section className="audience-poll archive-poll" key={poll.key}>
            <div className="audience-round">
              <span>ROUND {poll.round} OF {pollKeys.length} · {archiveTotal(poll.key)} VOTES · CLOSED</span>
            </div>
            <h1>{poll.title}</h1>
            <PostCard post={poll.post} compact />
            <div className="audience-candidates">
              {poll.candidates.map((candidate, index) => (
                <ArchiveCandidate candidate={candidate} result={rows[index]} mine={ownVotes[poll.key] === candidate.id} key={candidate.id} />
              ))}
            </div>
          </section>
        );
      })}
      <p className="archive-footer">
        Read the research behind the talk: <a href="https://emrecanulu.com/research/cross-constituency-aggregation-community-notes.html">Cross-Constituency Aggregation for Community Notes</a>
      </p>
    </main>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  return params.get('audience') === '1' ? <AudienceApp /> : <PresentationApp />;
}
