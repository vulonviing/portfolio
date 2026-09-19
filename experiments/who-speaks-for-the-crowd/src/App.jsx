import { useCallback, useEffect, useRef, useState } from 'react';
import { slides } from './slides.js';

const clamp = (value) => Math.min(slides.length - 1, Math.max(0, value));

function slideFromHash() {
  const parsed = Number.parseInt(window.location.hash.slice(1), 10);
  return Number.isFinite(parsed) ? clamp(parsed - 1) : 0;
}

export default function App() {
  const [current, setCurrent] = useState(slideFromHash);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const hideTimer = useRef(null);
  const pointerStart = useRef(null);
  const swipeHandled = useRef(false);
  const wheelLocked = useRef(false);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2200);
  }, []);

  const goTo = useCallback((index) => {
    const next = clamp(index);
    setCurrent(next);
    window.history.replaceState(null, '', `#${next + 1}`);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const previous = useCallback(() => goTo(current - 1), [current, goTo]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen could not be changed.', error);
    }
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(event.key)) {
        event.preventDefault();
        next();
      } else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) {
        event.preventDefault();
        previous();
      } else if (event.key === 'Home') {
        event.preventDefault();
        goTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        goTo(slides.length - 1);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFullscreen();
      }
      showControls();
    };

    const handleWheel = (event) => {
      if (Math.abs(event.deltaY) < 28 || wheelLocked.current) return;
      event.preventDefault();
      wheelLocked.current = true;
      if (event.deltaY > 0) next();
      else previous();
      window.setTimeout(() => {
        wheelLocked.current = false;
      }, 520);
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

  useEffect(() => {
    [slides[current - 1], slides[current + 1]].filter(Boolean).forEach((slide) => {
      const image = new Image();
      image.src = slide.src;
    });
  }, [current]);

  const slide = slides[current];
  const progress = ((current + 1) / slides.length) * 100;

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
      if (deltaX < 0) next();
      else previous();
      window.setTimeout(() => {
        swipeHandled.current = false;
      }, 0);
    }
  };

  const handlePreviousClick = () => {
    if (!swipeHandled.current) previous();
  };

  const handleNextClick = () => {
    if (!swipeHandled.current) next();
  };

  return (
    <main
      className={`deck ${controlsVisible ? 'controls-visible' : ''}`}
      onPointerMove={showControls}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="ambient ambient-blue" aria-hidden="true" />
      <div className="ambient ambient-coral" aria-hidden="true" />

      <section className="slide-stage" aria-label={`Slide ${current + 1} of ${slides.length}`}>
        <img key={slide.id} className="slide-image" src={slide.src} alt={slide.title} draggable="false" />
      </section>

      <button
        className="click-zone click-zone-left"
        type="button"
        onClick={handlePreviousClick}
        disabled={current === 0}
        aria-label="Previous slide"
      />
      <button
        className="click-zone click-zone-right"
        type="button"
        onClick={handleNextClick}
        disabled={current === slides.length - 1}
        aria-label="Next slide"
      />

      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <nav className="deck-controls" aria-label="Presentation controls">
        <button type="button" onClick={previous} disabled={current === 0} aria-label="Previous slide">
          <span aria-hidden="true">‹</span>
        </button>
        <output aria-live="polite">
          <strong>{String(current + 1).padStart(2, '0')}</strong>
          <span>/</span>
          <span>{slides.length}</span>
        </output>
        <button type="button" onClick={next} disabled={current === slides.length - 1} aria-label="Next slide">
          <span aria-hidden="true">›</span>
        </button>
        <span className="control-divider" aria-hidden="true" />
        <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
          <span className="fullscreen-mark" aria-hidden="true">{isFullscreen ? '×' : '⛶'}</span>
        </button>
      </nav>

      <p className="keyboard-hint" aria-hidden="true">← → navigate · F fullscreen</p>
    </main>
  );
}
