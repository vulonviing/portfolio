// @refresh reset
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ArrangementEngine } from './audio/ArrangementEngine';
import { copyFor, noteName, readStoredLanguage, sectionLabel, storeLanguage } from './i18n';
import { buildSongEvents, MOTIF, sectionAt, SECTIONS, SONG, TAIL_SECONDS } from './music/score';
import {
  activePianoMidis,
  musicalProgressPercent,
  orbitSectionId,
  ORBIT_SECTIONS,
  shouldUseLowPowerMode,
  vinylRotationDegrees,
} from './music/playbackView';
import { buildTimelineBins, timelinePercent } from './music/timeline';
import { experienceReducer, initialExperience } from './state/experience';

const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);
const KEYBOARD_NOTES = Array.from({ length: 24 }, (_, index) => 48 + index);
const VIOLIN_LIFT_AT = SECTIONS.find((section) => section.id === 'verse-2')?.start ?? 0;

function isBlack(midi) {
  return BLACK_KEYS.has(midi % 12);
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

function formatMegabytes(bytes) {
  return `${((bytes || 0) / 1_000_000).toFixed(1)} MB`;
}

function AudioLoading({ progress, t }) {
  const total = Math.max(1, progress?.total || 1);
  const loaded = Math.min(total, progress?.loaded || 0);
  const totalBytes = Math.max(1, progress?.totalBytes || 1);
  const loadedBytes = Math.min(totalBytes, progress?.loadedBytes || 0);
  const percent = Math.max(6, Math.round((loadedBytes / totalBytes) * 100));
  const label = progress?.stage === 'arrangement' ? t.arrangementPreparing : t.pianoPreparing;
  const loadedMegabytes = formatMegabytes(loadedBytes);
  const totalMegabytes = formatMegabytes(totalBytes);

  return (
    <div className="audio-loading" role="status" aria-live="polite">
      <p>{t.loadingPatience}</p>
      <div className="audio-loading__label">
        <span>{label}</span>
        <strong>{loadedMegabytes} / {totalMegabytes}</strong>
      </div>
      <span className="audio-loading__track" aria-hidden="true">
        <i style={{ width: `${percent}%` }} />
      </span>
      <small>{t.loadingFiles(loaded, total)}</small>
    </div>
  );
}

function PianoKeyboard({ activeMidis = [], disabled, language, mistakeMidi, onPress, targetMidi, t }) {
  const scrollerRef = useRef(null);
  const whiteNotes = KEYBOARD_NOTES.filter((midi) => !isBlack(midi));
  const blackNotes = KEYBOARD_NOTES.filter(isBlack);

  useEffect(() => {
    if (!targetMidi || !scrollerRef.current) return;
    const key = scrollerRef.current.querySelector(`[data-midi="${targetMidi}"]`);
    key?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [targetMidi]);

  const keyClass = (midi, kind) => [
    'piano-key',
    `piano-key--${kind}`,
    targetMidi === midi ? 'is-target' : '',
    activeMidis.includes(midi) ? 'is-active' : '',
    mistakeMidi === midi ? 'is-mistake' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="keyboard-scroll" ref={scrollerRef}>
      <div className="piano" role="group" aria-label={t.pianoLabel}>
        <div className="white-keys">
          {whiteNotes.map((midi) => (
            <button
              aria-label={t.playNote(noteName(midi, language))}
              className={keyClass(midi, 'white')}
              data-midi={midi}
              disabled={disabled}
              key={midi}
              onClick={() => onPress(midi)}
              type="button"
            >
              {targetMidi === midi && <span className="key-dot" aria-hidden="true" />}
            </button>
          ))}
        </div>
        {blackNotes.map((midi) => {
          const whiteKeysBefore = KEYBOARD_NOTES.filter((note) => note < midi && !isBlack(note)).length;
          return (
            <button
              aria-label={t.playNote(noteName(midi, language))}
              className={keyClass(midi, 'black')}
              data-midi={midi}
              disabled={disabled}
              key={midi}
              onClick={() => onPress(midi)}
              style={{ left: `${(whiteKeysBefore / whiteNotes.length) * 100}%` }}
              type="button"
            >
              {targetMidi === midi && <span className="key-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecordOrbit({ language, playback, position, section, t }) {
  const activeSection = orbitSectionId(section.id);
  const progress = musicalProgressPercent(position, playback.duration, TAIL_SECONDS);
  const rotation = vinylRotationDegrees(position);

  return (
    <div className="record-orbit" aria-label={t.playingSection(section.label)}>
      <div className="orbit-ring orbit-ring--outer" aria-hidden="true" />
      <div className="orbit-ring orbit-ring--inner" aria-hidden="true" />
      {ORBIT_SECTIONS.map((item) => (
        <span
          className={`orbit-label orbit-label--${item.position} ${activeSection === item.id ? 'is-active' : ''}`}
          key={item.id}
        >
          <i aria-hidden="true" />
          {sectionLabel(item.id, language)}
        </span>
      ))}
      <div className="center-vinyl" style={{ transform: `rotate(${rotation}deg)` }} aria-hidden="true">
        <span>
          <b>{String(progress).padStart(2, '0')}</b>
          <small>Anlamazdın</small>
        </span>
      </div>
    </div>
  );
}

function SoundHorizon({
  engine,
  events,
  language,
  lowPowerMode,
  mixLevels,
  onMixChange,
  onRestart,
  onScrub,
  onSeek,
  onToggle,
  playback,
  section,
  t,
}) {
  const canvasRef = useRef(null);
  const redrawRef = useRef(() => {});
  const playbackRef = useRef(playback);
  const visualPositionRef = useRef(playback.position);
  const timeDomain = useRef(new Uint8Array(lowPowerMode ? 128 : 256));
  const frequency = useRef(new Uint8Array(lowPowerMode ? 64 : 128));
  const bins = useMemo(
    () => buildTimelineBins(events, playback.duration, lowPowerMode ? 180 : 280),
    [events, lowPowerMode, playback.duration],
  );
  const isPlaying = playback.status === 'playing';
  const [draftPosition, setDraftPosition] = useState(playback.position);
  const isDragging = useRef(false);
  playbackRef.current = playback;
  visualPositionRef.current = isDragging.current ? draftPosition : playback.position;

  useEffect(() => {
    if (!isDragging.current) setDraftPosition(playback.position);
  }, [playback.position]);

  async function commitSeek(value = draftPosition) {
    isDragging.current = false;
    const next = Number(value);
    visualPositionRef.current = next;
    setDraftPosition(next);
    try {
      await onSeek(next);
    } finally {
      onScrub(null);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frameInterval = 1000 / (lowPowerMode ? 24 : 45);
    let animationFrame = 0;
    let lastDrawAt = 0;

    function scheduleNextFrame() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(draw);
    }

    function draw(frameTime = performance.now(), force = false) {
      if (isPlaying && !reduceMotion && !force && frameTime - lastDrawAt < frameInterval) {
        scheduleNextFrame();
        return;
      }
      lastDrawAt = frameTime;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, lowPowerMode ? 1 : 1.5);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const horizonY = height * 0.57;
      const binWidth = width / bins.length;
      const livePosition = isDragging.current
        ? visualPositionRef.current
        : isPlaying ? engine.getPosition() : playbackRef.current.position;
      const progress = Math.min(1, livePosition / playbackRef.current.duration);
      const lightX = progress * width;
      const wash = context.createLinearGradient(0, 0, 0, height);
      wash.addColorStop(0, 'rgba(19, 15, 14, .18)');
      wash.addColorStop(1, 'rgba(8, 7, 7, .72)');
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);

      bins.forEach((bin, index) => {
        const x = index * binWidth;
        const played = x <= lightX;
        const boost = played ? 1.65 : 0.68;
        if (bin.harmony) {
          context.fillStyle = `rgba(238, 231, 220, ${Math.min(.34, bin.harmony * .25 * boost)})`;
          context.fillRect(x, horizonY - bin.harmony * height * .22, Math.max(1, binWidth * .68), bin.harmony * height * .42);
        }
        if (bin.melody) {
          context.fillStyle = `rgba(182, 139, 82, ${Math.min(.58, bin.melody * .39 * boost)})`;
          context.fillRect(x, horizonY - bin.melody * height * .37, Math.max(1, binWidth * .48), bin.melody * height * .37);
        }
        if (bin.violin) {
          context.fillStyle = `rgba(112, 35, 52, ${Math.min(.62, bin.violin * .5 * boost)})`;
          context.fillRect(x, horizonY, Math.max(1.2, binWidth * .9), bin.violin * height * .32);
        }
      });

      context.strokeStyle = 'rgba(215, 197, 173, .16)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, horizonY + .5);
      context.lineTo(width, horizonY + .5);
      context.stroke();

      if (isPlaying && !reduceMotion && engine.readAnalyserFrame(timeDomain.current, frequency.current)) {
        const liveWidth = Math.min(360, width * .3);
        const startX = Math.max(0, lightX - liveWidth / 2);
        const endX = Math.min(width, lightX + liveWidth / 2);
        let frequencySum = 0;
        const frequencySampleCount = Math.min(64, frequency.current.length);
        for (let index = 0; index < frequencySampleCount; index += 1) frequencySum += frequency.current[index];
        const energy = frequencySum / (frequencySampleCount * 255);
        const glow = context.createRadialGradient(lightX, horizonY, 0, lightX, horizonY, liveWidth * .58);
        glow.addColorStop(0, `rgba(182, 139, 82, ${.08 + energy * .22})`);
        glow.addColorStop(1, 'rgba(182, 139, 82, 0)');
        context.fillStyle = glow;
        context.fillRect(startX, 0, endX - startX, height);
        context.strokeStyle = `rgba(222, 188, 142, ${.42 + energy * .42})`;
        context.lineWidth = 1.15;
        context.beginPath();
        for (let index = 0; index < timeDomain.current.length; index += 1) {
          const x = startX + (index / (timeDomain.current.length - 1)) * (endX - startX);
          const sample = (timeDomain.current[index] - 128) / 128;
          const y = horizonY + sample * height * (.11 + energy * .14);
          if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.stroke();
      }

      const slitWidth = Math.min(132, Math.max(74, width * .085));
      const slit = context.createLinearGradient(lightX - slitWidth, 0, lightX + slitWidth, 0);
      slit.addColorStop(0, 'rgba(182, 139, 82, 0)');
      slit.addColorStop(.36, 'rgba(182, 139, 82, .035)');
      slit.addColorStop(.5, 'rgba(236, 211, 176, .2)');
      slit.addColorStop(.64, 'rgba(182, 139, 82, .035)');
      slit.addColorStop(1, 'rgba(182, 139, 82, 0)');
      context.fillStyle = slit;
      context.fillRect(lightX - slitWidth, 0, slitWidth * 2, height);

      const aperture = context.createRadialGradient(lightX, horizonY, 0, lightX, horizonY, slitWidth * .9);
      aperture.addColorStop(0, 'rgba(239, 216, 183, .24)');
      aperture.addColorStop(1, 'rgba(182, 139, 82, 0)');
      context.fillStyle = aperture;
      context.fillRect(lightX - slitWidth, horizonY - slitWidth, slitWidth * 2, slitWidth * 2);
      if (isPlaying && !reduceMotion) scheduleNextFrame();
    }

    const redraw = () => {
      window.cancelAnimationFrame(animationFrame);
      draw(performance.now(), true);
    };
    const resizeObserver = new ResizeObserver(redraw);
    redrawRef.current = redraw;
    resizeObserver.observe(canvas);
    redraw();
    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
      redrawRef.current = () => {};
    };
  }, [bins, engine, isPlaying, lowPowerMode]);

  useEffect(() => {
    if (!isPlaying || isDragging.current) redrawRef.current();
  }, [draftPosition, isPlaying, playback.position]);

  return (
    <aside className="sound-horizon" aria-label={t.soundPlayerLabel}>
      <canvas className="sound-horizon-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="horizon-markers" aria-hidden="true">
        {SECTIONS.map((item) => (
          <span className={`marker marker--${item.kind}`} key={item.id} style={{ left: `${timelinePercent(item.start, playback.duration)}%` }}>
            <span className="sr-only">{sectionLabel(item.id, language, item.label)}</span>
          </span>
        ))}
      </div>
      <input
        aria-label={t.seekLabel}
        aria-valuetext={`${formatTime(draftPosition)} / ${formatTime(playback.duration)}`}
        className="horizon-seek"
        max={playback.duration}
        min="0"
        onBlur={() => {
          if (isDragging.current) commitSeek();
        }}
        onChange={(event) => {
          const next = Number(event.target.value);
          setDraftPosition(next);
          onScrub(next);
        }}
        onKeyDown={() => { isDragging.current = true; }}
        onKeyUp={(event) => commitSeek(event.currentTarget.value)}
        onPointerCancel={() => {
          isDragging.current = false;
          setDraftPosition(playback.position);
          onScrub(null);
        }}
        onPointerDown={(event) => {
          isDragging.current = true;
          onScrub(Number(event.currentTarget.value));
        }}
        onPointerUp={(event) => commitSeek(event.currentTarget.value)}
        step="0.1"
        type="range"
        value={draftPosition}
      />
      <div className="horizon-mix" role="group" aria-label={t.mixControls}>
        {['piano', 'violin'].map((track) => {
          const percent = Math.round(mixLevels[track] * 100);
          const label = track === 'piano' ? t.pianoMix : t.violinMix;
          return (
            <label key={track}>
              <span>{label}</span>
              <input
                aria-label={label}
                aria-valuetext={`${percent}%`}
                max="200"
                min="0"
                onChange={(event) => onMixChange(track, Number(event.target.value) / 100)}
                step="1"
                type="range"
                value={percent}
              />
              <output>{percent}</output>
            </label>
          );
        })}
      </div>
      <div className="horizon-meta horizon-meta--left">
        <span>{formatTime(isDragging.current ? draftPosition : playback.position)} / {formatTime(playback.duration)}</span>
        <strong>{section.label}</strong>
      </div>
      <div className="horizon-meta horizon-meta--right">
        <button aria-label={t.restart} className="horizon-restart" onClick={onRestart} type="button">↺</button>
        <button aria-label={isPlaying ? t.pause : t.resume} className="horizon-play" onClick={onToggle} type="button">
          {isPlaying ? 'Ⅱ' : '▶'}
        </button>
      </div>
    </aside>
  );
}

function LanguageSwitch({ language, onChange, t }) {
  return (
    <div className="language-switch" role="group" aria-label={t.languageLabel}>
      {['en', 'tr'].map((item) => (
        <button
          aria-pressed={language === item}
          className={language === item ? 'is-active' : ''}
          key={item}
          onClick={() => onChange(item)}
          type="button"
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function RightsDisclosure({ t }) {
  return (
    <details className="rights-disclosure">
      <summary>{t.rightsSummary}</summary>
      <div className="rights-panel">
        <div lang="en">
          <strong>Rights & credits</strong>
          <p>
            Unofficial, non-commercial interactive tribute to Ayla Dikmen’s <i>Anlamazdın</i>. No original master
            recording or streaming-platform audio is used; all sound is rendered in the browser from a custom piano
            and violin arrangement. The composition and lyrics remain the property of their respective rights holders.
            No affiliation or endorsement is implied.
          </p>
        </div>
        <div lang="tr">
          <strong>Haklar ve kaynaklar</strong>
          <p>
            Ayla Dikmen’in <i>Anlamazdın</i> eserine yönelik resmî olmayan, ticari olmayan interaktif bir saygı
            çalışmasıdır. Orijinal master kayıt veya dijital müzik platformu sesi kullanılmaz; bütün ses özel piyano
            ve keman düzenlemesiyle tarayıcıda üretilir. Eserin beste ve söz hakları ilgili hak sahiplerine aittir.
            Herhangi bir bağlantı veya onay ima edilmez.
          </p>
        </div>
        <nav className="rights-links" aria-label={t.creditsLabel}>
          <a href="https://sfzinstruments.github.io/pianos/salamander/" rel="noreferrer" target="_blank">
            Salamander Grand Piano · Alexander Holm · CC BY 3.0
          </a>
          <a href="https://github.com/sgossner/VSCO-2-CE" rel="noreferrer" target="_blank">
            VSCO 2 CE · Gossner, Dalzell & Hickler/Soundemote · CC0
          </a>
          <a href="https://www.gitaregitim.net/wp-content/uploads/2016/10/Anlamazdin_nota.pdf" rel="noreferrer" target="_blank">
            Notation reference · Musa Çetiner
          </a>
        </nav>
      </div>
    </details>
  );
}

export default function App() {
  const [language, setLanguage] = useState(readStoredLanguage);
  const [state, dispatch] = useReducer(experienceReducer, initialExperience);
  const [playback, setPlayback] = useState({
    status: 'idle',
    loadStatus: 'idle',
    loadProgress: { stage: 'idle', loaded: 0, total: 21, loadedBytes: 0, totalBytes: 20_378_504 },
    position: 0,
    duration: SONG.duration,
  });
  const events = useMemo(() => buildSongEvents(), []);
  const engine = useMemo(() => new ArrangementEngine(
    events,
    SONG.duration,
    { violinLiftAt: VIOLIN_LIFT_AT },
  ), [events]);
  const lowPowerMode = useMemo(() => shouldUseLowPowerMode({
    hardwareConcurrency: navigator.hardwareConcurrency || 8,
    deviceMemory: navigator.deviceMemory || 8,
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }), []);
  const mistakeTimer = useRef(null);
  const liveKeyTimer = useRef(null);
  const inputBusy = useRef(false);
  const playButtonRef = useRef(null);
  const [livePressedMidis, setLivePressedMidis] = useState([]);
  const [mixLevels, setMixLevels] = useState({ piano: 1, violin: 1 });
  const [scrubPosition, setScrubPosition] = useState(null);
  const t = copyFor(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.pageDescription);
  }, [language, t.pageDescription, t.pageTitle]);

  useEffect(() => {
    const enterTimer = window.setTimeout(() => dispatch({ type: 'ENTER' }), 380);
    const unsubscribe = engine.subscribe((snapshot) => {
      setPlayback(snapshot);
      if (snapshot.status === 'ended') dispatch({ type: 'END' });
    });
    engine.prepare({ resume: false }).catch(() => {
      // The loader exposes a retry state if preloading fails.
    });
    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(mistakeTimer.current);
      window.clearTimeout(liveKeyTimer.current);
      unsubscribe();
      engine.destroy();
    };
  }, [engine]);

  const complete = state.step >= MOTIF.length;
  const audioReady = playback.loadStatus === 'ready';
  const target = complete ? null : MOTIF[state.step];
  const hasStarted = ['playing', 'paused', 'ended'].includes(state.phase);
  const currentSection = sectionAt(playback.position);
  const displayedSection = {
    ...currentSection,
    label: sectionLabel(currentSection.id, language, currentSection.label),
  };
  const arrangedMidis = useMemo(
    () => activePianoMidis(events, playback.position),
    [events, playback.position],
  );
  const listeningMidis = useMemo(
    () => [...new Set([...arrangedMidis, ...livePressedMidis])],
    [arrangedMidis, livePressedMidis],
  );

  useEffect(() => {
    if (!complete || hasStarted || !playButtonRef.current) return;
    const scrollTimer = window.setTimeout(() => {
      playButtonRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
      playButtonRef.current?.focus({ preventScroll: true });
    }, 120);
    return () => window.clearTimeout(scrollTimer);
  }, [complete, hasStarted]);

  async function handleKeyPress(midi) {
    if (hasStarted || !audioReady || inputBusy.current) return;
    inputBusy.current = true;
    try {
      const correct = !complete && midi === target.midi;
      const duration = correct ? target.durationBeats * (60 / SONG.bpm) : 0.34;
      await engine.preview(midi, duration, correct ? 0.66 : 0.5);
      if (complete || state.phase !== 'ready') return;
      if (correct) {
        dispatch({ type: 'PRESS_CORRECT', midi });
        return;
      }
      dispatch({ type: 'PRESS_WRONG', midi });
      window.clearTimeout(mistakeTimer.current);
      mistakeTimer.current = window.setTimeout(() => dispatch({ type: 'CLEAR_MISTAKE' }), 420);
    } catch {
      // The visible load state below offers a retry without substituting a fake instrument.
    } finally {
      inputBusy.current = false;
    }
  }

  async function startSong() {
    try {
      await engine.start(0);
      dispatch({ type: 'PLAY' });
    } catch {
      // Loading errors are reflected by playback.loadStatus.
    }
  }

  async function playAlong(midi) {
    setLivePressedMidis((current) => [...new Set([...current, midi])]);
    window.clearTimeout(liveKeyTimer.current);
    liveKeyTimer.current = window.setTimeout(() => setLivePressedMidis([]), 260);
    try {
      await engine.preview(midi, 0.55, 0.52);
    } catch {
      // The arrangement remains usable if an individual play-along note fails.
    }
  }

  async function togglePlayback() {
    if (playback.status === 'playing') {
      engine.pause();
      dispatch({ type: 'PAUSE' });
    } else if (playback.status === 'ended') {
      dispatch({ type: 'RESTART_SONG' });
      await engine.restart();
    } else {
      dispatch({ type: 'RESUME' });
      await engine.resume();
    }
  }

  async function restartSong() {
    dispatch({ type: 'RESTART_SONG' });
    await engine.restart();
  }

  async function seekSong(position) {
    if (state.phase === 'ended' && position < playback.duration) dispatch({ type: 'SEEK' });
    await engine.seek(position);
  }

  function changeMix(track, level) {
    setMixLevels((current) => ({ ...current, [track]: level }));
    engine.setTrackLevel(track, track === 'violin' ? level * 2 : level);
  }

  function changeLanguage(nextLanguage) {
    setLanguage(storeLanguage(nextLanguage));
  }

  return (
    <main className={`experience ${hasStarted ? 'is-listening' : ''} ${lowPowerMode ? 'is-low-power' : ''}`}>
      <div className="grain" aria-hidden="true" />
      <header className="site-header">
        <a className="wordmark" href={import.meta.env.BASE_URL}>anlamazdın.</a>
        <div className="record-meta"><span>AYLA DİKMEN</span><span>1976</span></div>
        <div className="header-actions">
          <RightsDisclosure t={t} />
          <LanguageSwitch language={language} onChange={changeLanguage} t={t} />
          <a className="back-link" href="/">
            <span className="back-label">{t.backToPortfolio}</span><span>↗</span>
          </a>
        </div>
      </header>

      {!hasStarted && (
        <section className="hero" aria-labelledby="experience-title">
          <h1 id="experience-title">anlamazdın.</h1>
        </section>
      )}

      <section className={`ritual ${complete ? 'is-complete' : ''}`} aria-label={t.noteEntryLabel}>
        {!hasStarted && (
          <>
            <div className="step-row">
              <div className="step-counter">
                <span>{t.step}</span>
                <strong>{String(Math.min(state.step + 1, MOTIF.length)).padStart(2, '0')}</strong>
                <i>/ {String(MOTIF.length).padStart(2, '0')}</i>
              </div>
              <div className="target-note" aria-live="polite">
                <span>{complete ? t.melodyReady : t.nextSyllable}</span>
                <strong>{complete ? '⋯' : target.syllable}</strong>
                {!complete && <small>{noteName(target.midi, language)}</small>}
              </div>
              <button className="reset-button" disabled={state.step === 0} onClick={() => dispatch({ type: 'RESET' })} type="button">
                {t.startOver}
              </button>
            </div>

            <PianoKeyboard
              activeMidis={[]}
              disabled={state.phase === 'entering' || !audioReady || complete}
              language={language}
              mistakeMidi={state.mistakeMidi}
              onPress={handleKeyPress}
              targetMidi={target?.midi}
              t={t}
            />

            <div className="note-trail" aria-label={t.completedSyllables(state.step)}>
              {MOTIF.map((note, index) => (
                <span className={index < state.step ? 'is-filled' : ''} key={`${note.midi}-${index}`}>
                  <b>{note.syllable}</b>
                  <small>{index < state.step ? noteName(note.midi, language) : String(index + 1).padStart(2, '0')}</small>
                </span>
              ))}
            </div>

            <div className="action-zone">
              {playback.loadStatus === 'loading' || playback.loadStatus === 'idle' ? (
                <AudioLoading progress={playback.loadProgress} t={t} />
              ) : (!complete || playback.loadStatus === 'error') && (
                <p aria-live="polite">
                  {playback.loadStatus === 'error'
                      ? t.audioUnavailable
                      : state.mistakeMidi
                        ? t.wrongNote
                        : t.touchKey}
                </p>
              )}
              {complete && (
                <div className="play-ready">
                  <span>{t.pressPlay}</span>
                  <button className="run-button" disabled={!audioReady} onClick={startSong} ref={playButtonRef} type="button">
                    <strong>{t.play}</strong><i>▶</i>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

      </section>

      {hasStarted && (
        <section className="listening-field" aria-live="polite">
          <RecordOrbit
            language={language}
            playback={playback}
            position={scrubPosition ?? playback.position}
            section={displayedSection}
            t={t}
          />
          <div className="listening-piano">
            <PianoKeyboard
              activeMidis={listeningMidis}
              disabled={false}
              language={language}
              mistakeMidi={null}
              onPress={playAlong}
              targetMidi={null}
              t={t}
            />
          </div>
        </section>
      )}

      {!hasStarted && <footer className="site-footer">
        <span>{t.songKey} · {SONG.meter} · {Math.round(SONG.bpm)} BPM</span>
        <span className="footer-disclaimer">{t.unofficialShort}</span>
        <div className="license-links">
          <a href="https://sfzinstruments.github.io/pianos/salamander/" rel="noreferrer" target="_blank">Salamander Piano · Alexander Holm · CC BY 3.0</a>
          <a href="https://github.com/sgossner/VSCO-2-CE" rel="noreferrer" target="_blank">VSCO 2 CE Violin · CC0</a>
        </div>
      </footer>}

      {hasStarted && (
        <SoundHorizon
          engine={engine}
          events={events}
          language={language}
          lowPowerMode={lowPowerMode}
          mixLevels={mixLevels}
          onMixChange={changeMix}
          onRestart={restartSong}
          onScrub={setScrubPosition}
          onSeek={seekSong}
          onToggle={togglePlayback}
          playback={playback}
          section={displayedSection}
          t={t}
        />
      )}
    </main>
  );
}
