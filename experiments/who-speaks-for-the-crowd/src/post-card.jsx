import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const base = import.meta.env?.BASE_URL || '/who-speaks-for-the-crowd/';
const LIGHTBOX_MIN_ZOOM = 1;
const LIGHTBOX_MAX_ZOOM = 3;
const LIGHTBOX_CLICK_ZOOM = 2.4;
const LIGHTBOX_DRAG_THRESHOLD = 6;

function clampZoom(value) {
  return Math.min(LIGHTBOX_MAX_ZOOM, Math.max(LIGHTBOX_MIN_ZOOM, value));
}

function pointerDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function ImageLightbox({ items, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);

  const applyZoom = useCallback((nextZoom) => {
    const clamped = clampZoom(nextZoom);
    setZoom(clamped);
    if (clamped === LIGHTBOX_MIN_ZOOM) setPan({ x: 0, y: 0 });
  }, []);

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

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.ctrlKey) {
      applyZoom(zoom - event.deltaY * 0.012);
      return;
    }
    if (zoom > LIGHTBOX_MIN_ZOOM) {
      setPan((previous) => ({ x: previous.x - event.deltaX, y: previous.y - event.deltaY }));
    }
  }, [zoom, applyZoom]);

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { startDistance: pointerDistance(a, b) || 1, startZoom: zoom };
      dragRef.current = null;
      setIsDragging(true);
      return;
    }
    if (pointersRef.current.size > 2) return;
    setIsDragging(true);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
  };

  const handlePointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinchRef.current && pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      const distance = pointerDistance(a, b) || 1;
      applyZoom(pinchRef.current.startZoom * (distance / pinchRef.current.startDistance));
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > LIGHTBOX_DRAG_THRESHOLD || Math.abs(dy) > LIGHTBOX_DRAG_THRESHOLD) drag.moved = true;
    if (zoom > LIGHTBOX_MIN_ZOOM && drag.moved) {
      setPan({ x: drag.panX + dx, y: drag.panY + dy });
    }
  };

  const handlePointerUp = (event) => {
    const wasPinching = Boolean(pinchRef.current);
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (pointersRef.current.size < 2) pinchRef.current = null;
    setIsDragging(pointersRef.current.size > 0);
    if (wasPinching || pointersRef.current.size > 0) {
      dragRef.current = null;
      return;
    }
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.moved) return;
    applyZoom(zoom === LIGHTBOX_MIN_ZOOM ? LIGHTBOX_CLICK_ZOOM : LIGHTBOX_MIN_ZOOM);
  };

  return createPortal(
    <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Expanded post image" onClick={onClose}>
      <div className="image-lightbox-toolbar" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={() => applyZoom(zoom - 0.5)} disabled={zoom === LIGHTBOX_MIN_ZOOM} aria-label="Zoom out">−</button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button type="button" onClick={() => applyZoom(zoom + 0.5)} disabled={zoom === LIGHTBOX_MAX_ZOOM} aria-label="Zoom in">+</button>
        <button type="button" className="image-lightbox-close" onClick={onClose} aria-label="Close expanded image">×</button>
      </div>
      <div
        className={`image-lightbox-viewport ${zoom > LIGHTBOX_MIN_ZOOM ? 'image-lightbox-viewport-zoomed' : ''}`}
        onWheel={handleWheel}
      >
        <div
          className="image-lightbox-media"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 160ms ease',
          }}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {items.map((item) => (
            <img key={item.src} className="image-lightbox-media-img" src={item.zoomSrc || item.src} alt={item.alt} draggable="false" />
          ))}
        </div>
      </div>
      <span className="image-lightbox-hint">Tap the photo or pinch to zoom · tap the background to close</span>
    </div>,
    document.body,
  );
}

const ICONS = {
  comment: <path d="M21 11.5c0 4.4-4 8-9 8-1 0-2-.1-3-.4L3 21l1.4-4.2C3.5 15.4 3 13.5 3 11.5 3 7.1 7 3.5 12 3.5s9 3.6 9 8z" />,
  repost: <><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />,
  views: <><line x1="4" y1="20" x2="4" y2="14" /><line x1="10" y1="20" x2="10" y2="10" /><line x1="16" y1="20" x2="16" y2="4" /></>,
  bookmark: <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />,
  share: <><path d="M12 3v12" /><polyline points="7 8 12 3 17 8" /><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></>,
};

function PostIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export function PostCard({ post, compact = false, note, className = '' }) {
  const [expandedMedia, setExpandedMedia] = useState(null);
  const media = post.images || (post.image ? [{ src: post.image, alt: post.imageAlt }] : []);
  const hasMedia = media.length > 0;
  const isSplitDocument = media.length > 1 && media.every((item) => item.splitDocument);
  const zoomable = post.zoomable !== false;
  return (
    <article className={`post-card ${compact ? 'post-card-compact' : ''} ${hasMedia ? 'post-card-with-media' : ''} ${className}`}>
      <header className="post-author">
        {post.avatarImage ? (
          <img className="post-avatar post-avatar-image" src={post.avatarImage} alt="" draggable="false" />
        ) : (
          <span className="post-avatar post-avatar-default" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8.2" r="3.8" /><path d="M4.5 20c0-4.1 3.4-7.4 7.5-7.4s7.5 3.3 7.5 7.4" /></svg>
          </span>
        )}
        <div className="post-identity">
          <strong>{post.author}{post.verified && <span className="post-verified" aria-label="Verified account">✓</span>}</strong>
          <span>{post.handle}</span>
        </div>
        <div className="post-header-meta" aria-hidden="true">
          {post.timeAgo && <span className="post-time">· {post.timeAgo}</span>}
          <span className="post-spark"><img src={`${base}media/grok-logo.png`} alt="" draggable="false" /></span>
          <span className="post-more">•••</span>
        </div>
      </header>
      <p className="post-text">{post.text}</p>
      {hasMedia && (
        <div className={`post-media-grid ${media.length > 1 ? 'post-media-grid-multiple' : 'post-media-grid-single'} ${isSplitDocument ? 'post-media-grid-split-document' : ''}`}>
          {media.map((item) => (
            zoomable ? (
              <button
                className={`post-media-button ${item.prominent ? 'post-media-button-prominent' : ''}`}
                type="button"
                onClick={() => setExpandedMedia(isSplitDocument ? media : [item])}
                aria-label={`Enlarge image: ${item.alt}`}
                key={item.src}
              >
                <img className="post-media" src={item.src} alt={item.alt} draggable="false" />
                <span className="post-media-zoom" aria-hidden="true">⌕</span>
              </button>
            ) : (
              <span className={`post-media-static ${item.prominent ? 'post-media-button-prominent' : ''}`} key={item.src}>
                <img className="post-media" src={item.src} alt={item.alt} draggable="false" />
              </span>
            )
          ))}
        </div>
      )}
      {post.meta && <div className="post-meta">{post.meta}</div>}
      <div className="post-actions" aria-hidden="true">
        <div className="post-actions-group">
          <span className="post-action"><PostIcon name="comment" />{post.engagement?.replies}</span>
          <span className="post-action"><PostIcon name="repost" />{post.engagement?.reposts}</span>
          <span className="post-action"><PostIcon name="heart" />{post.engagement?.likes}</span>
          <span className="post-action"><PostIcon name="views" />{post.engagement?.views}</span>
        </div>
        <div className="post-actions-extra">
          <span className="post-action-icon"><PostIcon name="bookmark" /></span>
          <span className="post-action-icon"><PostIcon name="share" /></span>
        </div>
      </div>
      {note && (
        <div className="post-note">
          <div className="post-note-head">
            <span className="post-note-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-4.8 7.6 8.5 8.5 0 0 1-3.7.9 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </span>
            <strong>Community Note</strong>
          </div>
          <p>{note}</p>
        </div>
      )}
      {expandedMedia && <ImageLightbox items={expandedMedia} onClose={() => setExpandedMedia(null)} />}
    </article>
  );
}
