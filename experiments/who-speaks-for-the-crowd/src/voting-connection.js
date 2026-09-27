const productionApi = 'https://vote-api.emrecanulu.com';

export function connectVotingApi(onStatus, EventSourceType = EventSource) {
  onStatus('connecting');
  const source = new EventSourceType(`${productionApi}/v1/connection`);
  source.onopen = () => onStatus('connected');
  source.onerror = () => onStatus('disconnected');
  return () => {
    source.close();
  };
}
