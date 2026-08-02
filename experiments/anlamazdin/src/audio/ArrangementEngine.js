const PIANO_ANCHORS = [33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72];
const VIOLIN_ANCHORS = [57, 60, 64, 67, 69, 72, 76];
const BASE_URL = import.meta.env?.BASE_URL ?? '/anlamazdin/';
const PIANO_BASE = `${BASE_URL}audio/piano`;
const VIOLIN_BASE = `${BASE_URL}audio/violin`;
const SAMPLE_VERSION = 'wav-20260801-2';

export const AUDIO_SAMPLE_BYTES = {
  piano: 15_642_402,
  violin: 4_736_102,
  total: 20_378_504,
};

export const VIOLIN_MIX = {
  base: 0.864,
  lifted: 1.008,
  rampSeconds: 4,
};

const PIANO_SAMPLE_BYTES = new Map([
  [33, 1_495_610], [36, 1_432_516], [39, 1_418_874], [42, 1_312_810],
  [45, 1_023_946], [48, 1_028_040], [51, 1_033_156], [54, 1_036_224],
  [57, 1_003_484], [60, 1_039_976], [63, 1_016_444], [66, 944_142],
  [69, 856_766], [72, 1_000_414],
]);

const VIOLIN_SAMPLE_BYTES = new Map([
  [57, 731_868], [60, 778_248], [64, 654_128], [67, 652_602],
  [69, 657_116], [72, 628_782], [76, 633_358],
]);

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiName(midi) {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function nearestAnchor(midi, anchors) {
  return anchors.reduce((nearest, candidate) => (
    Math.abs(candidate - midi) < Math.abs(nearest - midi) ? candidate : nearest
  ));
}

export function chooseSampleAnchor(midi, anchors, preferredAnchor) {
  return anchors.includes(preferredAnchor) ? preferredAnchor : nearestAnchor(midi, anchors);
}

function impulseResponse(context, seconds = 2.15, decay = 3.3) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, decay);
    }
  }
  return buffer;
}

export function clampPosition(position, duration) {
  return Math.max(0, Math.min(Number(position) || 0, duration));
}

export function violinMixLevel(position, liftAt) {
  const rampStart = Math.max(0, liftAt - VIOLIN_MIX.rampSeconds);
  if (position <= rampStart) return VIOLIN_MIX.base;
  if (position >= liftAt) return VIOLIN_MIX.lifted;
  const progress = (position - rampStart) / Math.max(0.001, liftAt - rampStart);
  return VIOLIN_MIX.base + (VIOLIN_MIX.lifted - VIOLIN_MIX.base) * progress;
}

export function firstPlayableEvent(events, position) {
  const index = events.findIndex((event) => event.time + event.duration > position - 0.02);
  return index === -1 ? events.length : index;
}

export class ArrangementEngine {
  constructor(events, duration, { violinLiftAt = Number.POSITIVE_INFINITY } = {}) {
    this.events = events;
    this.duration = duration;
    this.violinLiftAt = violinLiftAt;
    this.context = null;
    this.master = null;
    this.analyser = null;
    this.reverbBuffer = null;
    this.previewBus = null;
    this.pianoBus = null;
    this.pedalBus = null;
    this.violinBus = null;
    this.pianoSamples = new Map();
    this.violinSamples = new Map();
    this.pianoSamplePromises = new Map();
    this.violinSamplePromises = new Map();
    this.loadStatus = 'idle';
    this.loadProgress = {
      stage: 'idle', loaded: 0, total: 21, loadedBytes: 0, totalBytes: AUDIO_SAMPLE_BYTES.total,
    };
    this.errorMessage = null;
    this.trackSources = new Set();
    this.schedulerTimer = null;
    this.progressTimer = null;
    this.listeners = new Set();
    this.status = 'idle';
    this.position = 0;
    this.contextStart = 0;
    this.positionAtStart = 0;
    this.nextIndex = 0;
  }

  async ensureContext({ resume = true } = {}) {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContextClass();

      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -17;
      compressor.knee.value = 11;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.014;
      compressor.release.value = 0.42;

      this.master = this.context.createGain();
      this.master.gain.value = 0.84;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.78;
      this.master.connect(compressor);
      compressor.connect(this.analyser);
      this.analyser.connect(this.context.destination);

      this.reverbBuffer = impulseResponse(this.context);
      this.previewBus = this.createBus({ level: 0.82, send: 0.13, reverb: 0.4 });
    }
    if (resume && this.context.state === 'suspended') await this.context.resume();
  }

  loadSample(midi, base, extension, target, promises, suffix = '') {
    if (target.has(midi)) return Promise.resolve();
    if (promises.has(midi)) return promises.get(midi);

    const promise = (async () => {
      const filename = `${midiName(midi).replace('#', 's')}${suffix}.${extension}`;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20_000);
      try {
        const response = await fetch(`${base}/${filename}?v=${SAMPLE_VERSION}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Sample could not load: ${filename}`);
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('audio/')) throw new Error(`Wrong audio asset path: ${filename}`);
        const decoded = await this.context.decodeAudioData(await response.arrayBuffer());
        target.set(midi, decoded);
      } finally {
        window.clearTimeout(timeout);
        promises.delete(midi);
      }
    })();
    promises.set(midi, promise);
    return promise;
  }

  async loadSamples(anchors, base, extension, target, promises, suffix = '', onLoaded, sampleBytes) {
    const queue = anchors.filter((midi) => !target.has(midi));
    const workerCount = Math.min(3, queue.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (queue.length) {
        const midi = queue.shift();
        await this.loadSample(midi, base, extension, target, promises, suffix);
        onLoaded?.(sampleBytes.get(midi) || 0);
      }
    });
    await Promise.all(workers);
  }

  loadPianoSample(midi) {
    const anchor = nearestAnchor(midi, PIANO_ANCHORS);
    return this.loadSample(anchor, PIANO_BASE, 'wav', this.pianoSamples, this.pianoSamplePromises, 'v8');
  }

  loadPianoSamples(onLoaded) {
    return this.loadSamples(
      PIANO_ANCHORS, PIANO_BASE, 'wav', this.pianoSamples, this.pianoSamplePromises, 'v8', onLoaded,
      PIANO_SAMPLE_BYTES,
    );
  }

  loadViolinSamples(onLoaded) {
    return this.loadSamples(
      VIOLIN_ANCHORS, VIOLIN_BASE, 'wav', this.violinSamples, this.violinSamplePromises, '', onLoaded,
      VIOLIN_SAMPLE_BYTES,
    );
  }

  async preparePreview(midi) {
    await this.ensureContext();
    const anchor = nearestAnchor(midi, PIANO_ANCHORS);
    if (this.pianoSamples.has(anchor)) {
      this.loadStatus = 'ready';
      return;
    }
    this.loadStatus = 'loading';
    this.loadProgress = {
      stage: 'piano', loaded: 0, total: 1, loadedBytes: 0,
      totalBytes: PIANO_SAMPLE_BYTES.get(anchor) || 0,
    };
    this.errorMessage = null;
    this.emit();
    try {
      await this.loadPianoSample(midi);
      this.loadProgress = {
        ...this.loadProgress, loaded: 1, loadedBytes: this.loadProgress.totalBytes,
      };
      this.loadStatus = 'ready';
      this.emit();
    } catch (error) {
      this.loadStatus = 'error';
      this.errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Anlamazdın audio preview]', error);
      this.emit();
      throw error;
    }
  }

  async prepare({ resume = true } = {}) {
    try {
      await this.ensureContext({ resume });
    } catch (error) {
      this.loadStatus = 'error';
      this.errorMessage = error instanceof Error ? error.message : String(error);
      this.emit();
      throw error;
    }
    if (this.pianoSamples.size === PIANO_ANCHORS.length && this.violinSamples.size === VIOLIN_ANCHORS.length) {
      this.loadStatus = 'ready';
      this.loadProgress = {
        stage: 'arrangement', loaded: 21, total: 21,
        loadedBytes: AUDIO_SAMPLE_BYTES.total, totalBytes: AUDIO_SAMPLE_BYTES.total,
      };
      this.emit();
      return;
    }
    const loadedPianoBytes = [...this.pianoSamples.keys()]
      .reduce((sum, midi) => sum + (PIANO_SAMPLE_BYTES.get(midi) || 0), 0);
    const loadedViolinBytes = [...this.violinSamples.keys()]
      .reduce((sum, midi) => sum + (VIOLIN_SAMPLE_BYTES.get(midi) || 0), 0);
    this.loadStatus = 'loading';
    this.loadProgress = {
      stage: 'arrangement',
      loaded: this.pianoSamples.size + this.violinSamples.size,
      total: PIANO_ANCHORS.length + VIOLIN_ANCHORS.length,
      loadedBytes: loadedPianoBytes + loadedViolinBytes,
      totalBytes: AUDIO_SAMPLE_BYTES.total,
    };
    this.errorMessage = null;
    this.emit();
    try {
      const markLoaded = (bytes) => {
        this.loadProgress = {
          ...this.loadProgress,
          loaded: this.loadProgress.loaded + 1,
          loadedBytes: Math.min(
            this.loadProgress.totalBytes,
            this.loadProgress.loadedBytes + bytes,
          ),
        };
        this.emit();
      };
      await Promise.all([this.loadPianoSamples(markLoaded), this.loadViolinSamples(markLoaded)]);
      this.loadStatus = 'ready';
      this.loadProgress = {
        ...this.loadProgress,
        loaded: this.loadProgress.total,
        loadedBytes: this.loadProgress.totalBytes,
      };
      this.emit();
    } catch (error) {
      this.loadStatus = 'error';
      this.errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Anlamazdın arrangement]', error);
      this.emit();
      throw error;
    }
  }

  createBus({ level = 1, send = 0.14, reverb = 0.42 } = {}) {
    const dry = this.context.createGain();
    const sendNode = this.context.createGain();
    const convolver = this.context.createConvolver();
    const reverbGain = this.context.createGain();
    const output = this.context.createGain();
    output.gain.value = level;
    sendNode.gain.value = send;
    convolver.buffer = this.reverbBuffer;
    reverbGain.gain.value = reverb;
    dry.connect(output);
    dry.connect(sendNode);
    sendNode.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(output);
    output.connect(this.master);
    return { input: dry, output };
  }

  playNote({
    instrument,
    midi,
    when,
    duration,
    velocity,
    destination,
    sourceSet = null,
    tone = 'natural',
    articulation = 'natural',
    sampleAnchor,
  }) {
    const isViolin = instrument === 'violin';
    const anchors = isViolin ? VIOLIN_ANCHORS : PIANO_ANCHORS;
    const samples = isViolin ? this.violinSamples : this.pianoSamples;
    const anchor = chooseSampleAnchor(midi, anchors, sampleAnchor);
    const source = this.context.createBufferSource();
    const envelope = this.context.createGain();
    source.buffer = samples.get(anchor);
    source.playbackRate.value = Math.pow(2, (midi - anchor) / 12);

    const attack = isViolin
      ? articulation === 'pad'
        ? Math.min(0.32, duration * 0.16)
        : Math.min(0.11, duration * 0.2)
      : tone === 'pedal'
        ? 0.018
        : 0.008;
    const release = isViolin
      ? articulation === 'pad' ? 1.05 : 0.68
      : tone === 'pedal' ? 0.62 : tone === 'warm' ? 0.24 : 0.38;
    const releaseStart = when + Math.max(0.08, duration);
    const peak = Math.max(0.012, velocity);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(peak, when + attack);
    envelope.gain.setValueAtTime(peak, releaseStart);
    envelope.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);

    if ((tone === 'warm' || tone === 'pedal') && !isViolin) {
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = tone === 'pedal' ? 3000 : 3400;
      filter.Q.value = 0.38;
      source.connect(filter);
      filter.connect(envelope);
    } else {
      source.connect(envelope);
    }
    envelope.connect(destination);
    source.start(when);
    source.stop(releaseStart + release + 0.08);
    if (sourceSet) {
      sourceSet.add(source);
      source.addEventListener('ended', () => sourceSet.delete(source), { once: true });
    }
  }

  async preview(midi, duration = 0.4, velocity = 0.62) {
    await this.preparePreview(midi);
    this.playNote({
      instrument: 'piano',
      midi,
      when: this.context.currentTime + 0.015,
      duration,
      velocity,
      destination: this.previewBus.input,
    });
  }

  getPosition() {
    if (this.status !== 'playing' || !this.context) return this.position;
    return Math.min(this.duration, this.positionAtStart + this.context.currentTime - this.contextStart);
  }

  readAnalyserFrame(timeDomain, frequency) {
    if (!this.analyser || !timeDomain || !frequency) return false;
    this.analyser.getByteTimeDomainData(timeDomain);
    this.analyser.getByteFrequencyData(frequency);
    return true;
  }

  async start(position = 0) {
    await this.prepare();
    this.stopSession();
    this.position = clampPosition(position, this.duration);
    this.positionAtStart = this.position;
    this.contextStart = this.context.currentTime + 0.08;
    this.nextIndex = firstPlayableEvent(this.events, this.position);
    this.pianoBus = this.createBus({ level: 0.88, send: 0.14, reverb: 0.42 });
    this.pedalBus = this.createBus({ level: 0.72, send: 0.32, reverb: 0.62 });
    this.violinBus = this.createBus({ level: VIOLIN_MIX.base, send: 0.24, reverb: 0.5 });
    const violinGain = this.violinBus.output.gain;
    const rampStart = Math.max(0, this.violinLiftAt - VIOLIN_MIX.rampSeconds);
    violinGain.setValueAtTime(violinMixLevel(this.position, this.violinLiftAt), this.contextStart);
    if (Number.isFinite(this.violinLiftAt) && this.position < this.violinLiftAt) {
      const rampStartAt = this.contextStart + Math.max(0, rampStart - this.position);
      const rampEndAt = this.contextStart + Math.max(0, this.violinLiftAt - this.position);
      if (this.position < rampStart) violinGain.setValueAtTime(VIOLIN_MIX.base, rampStartAt);
      violinGain.linearRampToValueAtTime(VIOLIN_MIX.lifted, rampEndAt);
    }
    this.status = 'playing';
    this.schedule();
    this.startProgress();
    this.emit();
  }

  schedule() {
    if (this.status !== 'playing') return;
    const horizon = this.getPosition() + 0.3;
    while (this.nextIndex < this.events.length && this.events[this.nextIndex].time <= horizon) {
      const event = this.events[this.nextIndex];
      const elapsed = Math.max(0, this.positionAtStart - event.time);
      const remaining = event.duration - elapsed;
      if (remaining > 0.02) {
        const when = this.contextStart + Math.max(0, event.time - this.positionAtStart);
        const isViolin = event.track === 'violin';
        const isPedal = event.track === 'pedal';
        this.playNote({
          instrument: isViolin ? 'violin' : 'piano',
          midi: event.midi,
          when: Math.max(this.context.currentTime, when),
          duration: remaining,
          velocity: event.velocity,
          tone: event.tone,
          articulation: event.articulation,
          sampleAnchor: event.sampleAnchor,
          destination: isViolin ? this.violinBus.input : isPedal ? this.pedalBus.input : this.pianoBus.input,
          sourceSet: this.trackSources,
        });
      }
      this.nextIndex += 1;
    }
    this.schedulerTimer = window.setTimeout(() => this.schedule(), 30);
  }

  startProgress() {
    this.progressTimer = window.setInterval(() => {
      this.position = this.getPosition();
      if (this.position >= this.duration) {
        this.position = this.duration;
        this.status = 'ended';
        this.stopSession(false);
      }
      this.emit();
    }, 80);
  }

  pause() {
    if (this.status !== 'playing') return;
    this.position = this.getPosition();
    this.status = 'paused';
    this.stopSession(false);
    this.emit();
  }

  resume() {
    if (this.status === 'paused') return this.start(this.position);
    return Promise.resolve();
  }

  restart() {
    return this.start(0);
  }

  async seek(position) {
    const target = clampPosition(position, this.duration);
    if (this.status === 'playing') return this.start(target);
    this.stopSession(false);
    this.position = target;
    this.status = target >= this.duration ? 'ended' : 'paused';
    this.emit();
  }

  stopSession(reset = false) {
    if (this.schedulerTimer) window.clearTimeout(this.schedulerTimer);
    if (this.progressTimer) window.clearInterval(this.progressTimer);
    this.schedulerTimer = null;
    this.progressTimer = null;
    this.trackSources.forEach((source) => {
      try { source.stop(); } catch { /* source already ended */ }
    });
    this.trackSources.clear();
    [this.pianoBus, this.pedalBus, this.violinBus].forEach((bus) => bus?.output.disconnect());
    this.pianoBus = null;
    this.pedalBus = null;
    this.violinBus = null;
    if (reset) this.position = 0;
  }

  stop() {
    this.status = 'idle';
    this.stopSession(true);
    this.emit();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return {
      status: this.status,
      loadStatus: this.loadStatus,
      loadProgress: this.loadProgress,
      position: this.getPosition(),
      duration: this.duration,
      errorMessage: this.errorMessage,
    };
  }

  emit() {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  destroy() {
    this.stopSession(true);
    this.listeners.clear();
    this.context?.close();
  }
}
