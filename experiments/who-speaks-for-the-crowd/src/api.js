const productionApi = 'https://vote-api.emrecanulu.com';
const operatorBuild = import.meta.env.MODE === 'operator';
const localToken = operatorBuild ? document.querySelector('meta[name="local-token"]')?.content : null;

export const apiBase = operatorBuild ? `${window.location.origin}/api/operator` : import.meta.env.VITE_VOTE_API_URL
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8001'
    : productionApi);
const audienceApiBase = operatorBuild ? productionApi : apiBase;

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
      ...(operatorBuild && base.startsWith(window.location.origin) ? { 'X-Local-Lab-Token': localToken } : {}),
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

export const getState = (signal) => request(operatorBuild ? '/state' : '/v1/state', { signal });
export async function getVotingHealth(signal) {
  const health = await request(operatorBuild ? '/health' : '/healthz', { cache: 'no-store', signal });
  if (health?.status !== 'ok') throw new ApiError('Voting API is not healthy');
  return health;
}
export const resetRun = () => request('/reset', { method: 'POST' });
export const openPoll = (pollKey) => request(`/polls/${pollKey}/open`, { method: 'POST' });
export const closePoll = (pollKey) => request(`/polls/${pollKey}/close`, { method: 'POST' });
export const reopenPoll = (pollKey) => request(`/polls/${pollKey}/reopen`, { method: 'POST' });
export const startVotingService = () => request('/api/service/start', { method: 'POST' }, window.location.origin);
export const stopVotingService = () => request('/api/service/stop', { method: 'POST' }, window.location.origin);

export const submitVote = ({ runId, pollKey, choice, participantId }) => request('/v1/vote', {
  method: 'PUT',
  body: JSON.stringify({ runId, pollKey, choice, participantId }),
}, audienceApiBase);

export const joinRun = ({ runId, participantId }) => request('/v1/join', {
  method: 'PUT',
  body: JSON.stringify({ runId, participantId }),
}, audienceApiBase);

async function downloadCsv(path, filename) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: operatorBuild ? { 'X-Local-Lab-Token': localToken } : {},
  });
  if (!response.ok) throw new ApiError(`Export failed (${response.status})`, response.status);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const downloadExport = () => downloadCsv('/export/summary', 'science-slam-results');
export const downloadRawExport = () => downloadCsv('/export/raw', 'science-slam-raw-votes');
