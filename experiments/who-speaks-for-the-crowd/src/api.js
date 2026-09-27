const productionApi = 'https://vote-api.emrecanulu.com';

export const apiBase = import.meta.env.VITE_VOTE_API_URL
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8001'
    : productionApi);

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}, base = apiBase) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Keep the status-based message when the service did not return JSON.
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return null;
  return response.json();
}

// participantId is only ever sent by the audience route's own recurring poll:
// it piggy-backs this existing request as a liveness heartbeat instead of
// adding a separate periodic call. The presenter route never passes one.
export const getState = (signal, participantId) => request(
  participantId ? `/v1/state?participantId=${encodeURIComponent(participantId)}` : '/v1/state',
  { signal },
);

export const submitVote = ({ runId, pollKey, choice, participantId }) => request('/v1/vote', {
  method: 'PUT',
  body: JSON.stringify({ runId, pollKey, choice, participantId }),
});

export const joinRun = ({ runId, participantId }) => request('/v1/join', {
  method: 'PUT',
  body: JSON.stringify({ runId, participantId }),
});

// Best-effort, fire-and-forget: sendBeacon works during page unload when a
// normal fetch would be cancelled. Not periodic -- fires at most once, when
// the tab is actually being closed or navigated away from (not merely
// backgrounded or locked; see reportClosedOnUnload below).
export function reportClosed({ runId, participantId }) {
  const body = new Blob([JSON.stringify({ runId, participantId })], { type: 'application/json' });
  navigator.sendBeacon?.(`${apiBase}/v1/presence/closed`, body);
}
