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

export const getState = (signal) => request('/v1/state', { signal });

export const submitVote = ({ runId, pollKey, choice, participantId }) => request('/v1/vote', {
  method: 'PUT',
  body: JSON.stringify({ runId, pollKey, choice, participantId }),
});

export const joinRun = ({ runId, participantId }) => request('/v1/join', {
  method: 'PUT',
  body: JSON.stringify({ runId, participantId }),
});
