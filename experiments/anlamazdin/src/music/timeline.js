const TRACKS = ['harmony', 'melody', 'violin', 'pedal'];

export function buildTimelineBins(events, duration, count = 320) {
  const safeDuration = Math.max(0.001, duration);
  const bins = Array.from({ length: count }, () => ({ harmony: 0, melody: 0, violin: 0 }));

  events.forEach((event) => {
    if (!TRACKS.includes(event.track)) return;
    const track = event.track === 'pedal' ? 'harmony' : event.track;
    const start = Math.max(0, Math.floor((event.time / safeDuration) * count));
    const end = Math.min(count - 1, Math.ceil(((event.time + event.duration) / safeDuration) * count));
    const energy = Math.min(1, event.velocity * (0.82 + Math.sqrt(event.duration) * 0.34));
    for (let index = start; index <= end; index += 1) {
      bins[index][track] = Math.max(bins[index][track], energy);
    }
  });

  return bins;
}

export function timelinePercent(time, duration) {
  if (!duration) return 0;
  return Math.max(0, Math.min(100, (time / duration) * 100));
}
