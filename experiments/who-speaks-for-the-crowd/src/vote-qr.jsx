import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';

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

export function VoteQr({ audienceUrl, large = false, compact = false, label = 'Scan once.' }) {
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
