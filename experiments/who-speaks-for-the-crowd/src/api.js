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

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
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

export const getState = () => request('/v1/state');
export const resetRun = () => request('/v1/admin/run/reset', { method: 'POST' });
export const openPoll = (pollKey) => request(`/v1/admin/polls/${pollKey}/open`, { method: 'POST' });
export const closePoll = (pollKey) => request(`/v1/admin/polls/${pollKey}/close`, { method: 'POST' });
export const reopenPoll = (pollKey) => request(`/v1/admin/polls/${pollKey}/reopen`, { method: 'POST' });

export const submitVote = ({ runId, pollKey, choice, participantId }) => request('/v1/vote', {
  method: 'PUT',
  body: JSON.stringify({ runId, pollKey, choice, participantId }),
});

async function downloadCsv(path, filename) {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) throw new ApiError(`Export failed (${response.status})`, response.status);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const downloadExport = () => downloadCsv('/v1/admin/export', 'science-slam-results');
export const downloadRawExport = () => downloadCsv('/v1/admin/export/raw', 'science-slam-raw-votes');
