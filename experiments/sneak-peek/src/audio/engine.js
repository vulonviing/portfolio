const A4 = 440;
const midiToFreq = (m) => A4 * Math.pow(2, (m - 69) / 12);
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const CHORDS = {
  Am: [57, 60, 64, 69],
  F: [53, 57, 60, 65],
  C: [48, 52, 55, 60],
  G: [55, 59, 62, 67],
  Em: [52, 55, 59, 64],
  Dm: [50, 53, 57, 62],
};

const PATTERN_ROLLING = [0, 2, 1, 2, 3, 2, 1, 2, 0, 2, 1, 2, 3, 2, 1, 2];
const PATTERN_DRIVING = [0, 2, 1, 2, 3, 2, 1, 3, 0, 2, 1, 2, 3, 2, 1, 3];
const PATTERN_CALM = [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2];

const PROGRESSIONS = {
  firstHalf: {
    bpm: 82,
    chords: ['Am', 'F', 'C', 'G'],
    pattern: PATTERN_CALM,
    gain: 0.14,
    cutoff: 1500,
    kickVel: 0.55,
    padGain: 0.05,
    sawGain: 0.035,
    reverb: 0.34,
    fourOnFloor: true,
    clap: true,
    evolution: 'steady',
  },
  halftime: {
    bpm: 100,
    chords: ['Am', 'G', 'F', 'G'],
    pattern: PATTERN_ROLLING,
    gain: 0.19,
    cutoff: 2400,
    kickVel: 0.7,
    padGain: 0.055,
    sawGain: 0.045,
    reverb: 0.28,
    fourOnFloor: true,
    clap: true,
    evolution: 'steady',
  },
  finalTen: {
    bpm: 140,
    chords: ['Am', 'F', 'C', 'G'],
    pattern: PATTERN_DRIVING,
    gain: 0.3,
    cutoff: 5400,
    kickVel: 0.92,
    padGain: 0.075,
    sawGain: 0.075,
    reverb: 0.22,
    fourOnFloor: true,
    clap: true,
    evolution: 'steady',
  },
  grind: {
    bpm: 108,
    chords: ['Am', 'G', 'F', 'G'],
    pattern: PATTERN_DRIVING,
    gain: 0.22,
    cutoff: 2600,
    kickVel: 0.78,
    padGain: 0.055,
    sawGain: 0.05,
    reverb: 0.26,
    fourOnFloor: true,
    clap: true,
    evolution: 'steady',
  },
  comeback: {
    bpm: 100,
    bpmTarget: 142,
    chords: ['Am', 'F', 'C', 'G'],
    pattern: PATTERN_ROLLING,
    gain: 0.18,
    gainTarget: 0.3,
    cutoff: 1800,
    cutoffTarget: 5400,
    kickVel: 0.68,
    kickVelTarget: 0.95,
    padGain: 0.05,
    padGainTarget: 0.075,
    sawGain: 0.04,
    sawGainTarget: 0.08,
    reverb: 0.3,
    reverbTarget: 0.22,
    riseSeconds: 65,
    fourOnFloor: true,
    clap: true,
    evolution: 'rising',
  },
  collapse: {
    bpm: 96,
    chords: ['Am', 'Em', 'Dm', 'Am'],
    pattern: PATTERN_ROLLING,
    gain: 0.2,
    gainTarget: 0.008,
    cutoff: 2400,
    cutoffTarget: 320,
    kickVel: 0.7,
    kickVelTarget: 0.1,
    padGain: 0.055,
    padGainTarget: 0.02,
    sawGain: 0.045,
    sawGainTarget: 0.01,
    reverb: 0.28,
    reverbTarget: 0.62,
    decaySeconds: 42,
    fourOnFloor: true,
    clap: true,
    evolution: 'dying',
  },
};

function evolve(p, elapsed) {
  const base = {
    bpm: p.bpm,
    gain: p.gain,
    cutoff: p.cutoff,
    kickVel: p.kickVel,
    padGain: p.padGain,
    sawGain: p.sawGain,
    reverb: p.reverb,
    lfoDepth: 500,
    density: 1,
    fourOnFloor: p.fourOnFloor,
    clap: p.clap,
  };

  if (p.evolution === 'rising') {
    const t = Math.min(1, Math.max(0, elapsed / (p.riseSeconds ?? 60)));
    const e = easeInOutCubic(t);
    return {
      ...base,
      bpm: p.bpm + (p.bpmTarget - p.bpm) * e,
      gain: p.gain + (p.gainTarget - p.gain) * e,
      cutoff: p.cutoff + (p.cutoffTarget - p.cutoff) * e,
      kickVel: p.kickVel + (p.kickVelTarget - p.kickVel) * e,
      padGain: p.padGain + (p.padGainTarget - p.padGain) * e,
      sawGain: p.sawGain + (p.sawGainTarget - p.sawGain) * e,
      reverb: p.reverb + (p.reverbTarget - p.reverb) * e,
      lfoDepth: 400 + 500 * e,
    };
  }

  if (p.evolution === 'dying') {
    const t = Math.min(1, Math.max(0, elapsed / (p.decaySeconds ?? 40)));
    const e = easeInOutCubic(t);
    return {
      ...base,
      bpm: p.bpm,
      gain: p.gain + (p.gainTarget - p.gain) * e,
      cutoff: p.cutoff + (p.cutoffTarget - p.cutoff) * e,
      kickVel: p.kickVel + (p.kickVelTarget - p.kickVel) * e,
      padGain: p.padGain + (p.padGainTarget - p.padGain) * e,
      sawGain: p.sawGain + (p.sawGainTarget - p.sawGain) * e,
      reverb: p.reverb + (p.reverbTarget - p.reverb) * e,
      lfoDepth: 500 * (1 - e * 0.85),
      density: 1 - e * 0.55,
      fourOnFloor: t < 0.55,
      clap: t < 0.4,
    };
  }

  return base;
}

function makeImpulseResponse(ctx, seconds = 2.8, decay = 2.6) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const channel = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return buffer;
}

function makeNoiseBuffer(ctx, seconds = 0.3) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function createEngine() {
  let ctx = null;
  let master = null;
  let filter = null;
  let reverbSend = null;
  let lfoDepth = null;
  let noiseBuffer = null;
  let running = false;
  let schedulerTimer = null;
  let nextNoteTime = 0;
  let noteIndex = 0;
  let moodStartTime = 0;
  let lastBusUpdate = 0;

  let scenario = 'comeback';

  async function ensureContext() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0;

    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;
    filter.Q.value = 0.8;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.18;
    lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 500;
    lfo.connect(lfoDepth);
    lfoDepth.connect(filter.frequency);
    lfo.start();

    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulseResponse(ctx);

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.9;

    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.28;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -10;
    compressor.knee.value = 6;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.2;

    filter.connect(master);
    filter.connect(reverbSend);
    reverbSend.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(master);
    master.connect(compressor);
    compressor.connect(ctx.destination);

    noiseBuffer = makeNoiseBuffer(ctx);
  }

  function updateBuses(ramp = 0.25) {
    if (!ctx) return;
    const p = PROGRESSIONS[scenario] ?? PROGRESSIONS.halftime;
    const ev = evolve(p, ctx.currentTime - moodStartTime);
    const now = ctx.currentTime;

    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(Math.max(0.001, ev.gain), now + ramp);

    filter.frequency.cancelScheduledValues(now);
    filter.frequency.setValueAtTime(filter.frequency.value, now);
    filter.frequency.linearRampToValueAtTime(
      Math.max(160, ev.cutoff),
      now + ramp,
    );

    reverbSend.gain.cancelScheduledValues(now);
    reverbSend.gain.setValueAtTime(reverbSend.gain.value, now);
    reverbSend.gain.linearRampToValueAtTime(ev.reverb, now + ramp);

    lfoDepth.gain.cancelScheduledValues(now);
    lfoDepth.gain.setValueAtTime(lfoDepth.gain.value, now);
    lfoDepth.gain.linearRampToValueAtTime(ev.lfoDepth, now + ramp);
  }

  function playPiano(time, midi, duration, velocity) {
    const freq = midiToFreq(midi);
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = freq;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2.003;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.18;

    const vf = ctx.createBiquadFilter();
    vf.type = 'lowpass';
    vf.Q.value = 0.7;
    vf.frequency.setValueAtTime(freq * 6, time);
    vf.frequency.exponentialRampToValueAtTime(
      Math.max(80, freq * 2.2),
      time + 0.35,
    );

    const amp = ctx.createGain();
    amp.gain.value = 0;

    osc1.connect(vf);
    osc2.connect(osc2Gain);
    osc2Gain.connect(vf);
    vf.connect(amp);
    amp.connect(filter);

    amp.gain.setValueAtTime(0, time);
    amp.gain.linearRampToValueAtTime(velocity, time + 0.005);
    amp.gain.exponentialRampToValueAtTime(
      Math.max(velocity * 0.22, 0.0001),
      time + 0.18,
    );
    amp.gain.setTargetAtTime(0.0001, time + duration, 0.12);

    const stopAt = time + duration + 0.4;
    osc1.start(time);
    osc2.start(time);
    osc1.stop(stopAt);
    osc2.stop(stopAt);
  }

  function playSawPad(time, midi, duration, velocity) {
    const freq = midiToFreq(midi);
    const detunes = [-8, -3, 3, 8];
    const vf = ctx.createBiquadFilter();
    vf.type = 'lowpass';
    vf.Q.value = 1;
    vf.frequency.setValueAtTime(freq * 2.2, time);
    vf.frequency.linearRampToValueAtTime(freq * 3.6, time + duration * 0.5);

    const amp = ctx.createGain();
    amp.gain.value = 0;

    detunes.forEach((d) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = d;
      o.connect(vf);
      o.start(time);
      o.stop(time + duration + 0.6);
    });
    vf.connect(amp);
    amp.connect(filter);

    amp.gain.setValueAtTime(0, time);
    amp.gain.linearRampToValueAtTime(velocity, time + 0.35);
    amp.gain.setTargetAtTime(0.0001, time + duration * 0.85, 0.3);
  }

  function playBass(time, midi, duration, velocity) {
    const freq = midiToFreq(midi);
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = freq;

    const vf = ctx.createBiquadFilter();
    vf.type = 'lowpass';
    vf.Q.value = 1.4;
    vf.frequency.setValueAtTime(freq * 5, time);
    vf.frequency.exponentialRampToValueAtTime(
      Math.max(80, freq * 1.4),
      time + 0.25,
    );

    const amp = ctx.createGain();
    amp.gain.value = 0;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.8;

    osc.connect(vf);
    sub.connect(subGain);
    subGain.connect(vf);
    vf.connect(amp);
    amp.connect(master);

    amp.gain.setValueAtTime(0, time);
    amp.gain.linearRampToValueAtTime(velocity, time + 0.01);
    amp.gain.exponentialRampToValueAtTime(
      Math.max(velocity * 0.4, 0.0001),
      time + 0.12,
    );
    amp.gain.setTargetAtTime(0.0001, time + duration * 0.8, 0.1);

    osc.start(time);
    sub.start(time);
    osc.stop(time + duration + 0.3);
    sub.stop(time + duration + 0.3);
  }

  function playKick(time, velocity) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.16);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, time);
    amp.gain.linearRampToValueAtTime(velocity, time + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

    osc.connect(amp);
    amp.connect(master);
    osc.start(time);
    osc.stop(time + 0.35);
  }

  function playClap(time, velocity) {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1600;
    bp.Q.value = 1.2;

    [0, 0.012, 0.024].forEach((offset, i) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const g = ctx.createGain();
      const t = time + offset;
      const v = velocity * (i === 2 ? 1 : 0.6);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (i === 2 ? 0.18 : 0.04));
      src.connect(g);
      g.connect(bp);
      src.start(t);
      src.stop(t + 0.3);
    });

    bp.connect(master);
  }

  function scheduleNote(time, idx, p, ev) {
    if (ev.density < 1 && Math.random() > ev.density) return;

    const chordIdx = Math.floor(idx / 16) % p.chords.length;
    const stepInChord = idx % 16;
    const chord = CHORDS[p.chords[chordIdx]];
    const patternIdx = p.pattern[stepInChord % p.pattern.length];
    const baseNote = chord[patternIdx % chord.length];
    const secondsPer16 = 60 / ev.bpm / 4;

    const arpVel = 0.42 + 0.12 * Math.sin(idx * 0.63);
    playPiano(time, baseNote, secondsPer16 * 1.6, arpVel);

    if (stepInChord === 0) {
      playSawPad(time, chord[0], secondsPer16 * 15, ev.sawGain);
      playSawPad(time, chord[2] + 12, secondsPer16 * 15, ev.sawGain * 0.6);
      chord.slice(0, 3).forEach((n) => {
        playPiano(time, n - 12, secondsPer16 * 12, ev.padGain);
      });
    }

    const isBeat = stepInChord % 4 === 0;
    const beatInBar = stepInChord / 4;

    if (isBeat) {
      playBass(time, chord[0] - 24, secondsPer16 * 3.5, 0.45);

      if (ev.fourOnFloor) {
        playKick(time, ev.kickVel);
      } else if (beatInBar === 0) {
        playKick(time, ev.kickVel);
      }

      if (ev.clap && (beatInBar === 1 || beatInBar === 3)) {
        playClap(time, 0.55);
      }
    }
  }

  function scheduler() {
    if (!running) return;

    if (ctx.currentTime - lastBusUpdate > 0.2) {
      updateBuses(0.3);
      lastBusUpdate = ctx.currentTime;
    }

    while (nextNoteTime < ctx.currentTime + 0.12) {
      const p = PROGRESSIONS[scenario] ?? PROGRESSIONS.halftime;
      const ev = evolve(p, nextNoteTime - moodStartTime);
      scheduleNote(nextNoteTime, noteIndex, p, ev);
      nextNoteTime += 60 / ev.bpm / 4;
      noteIndex++;
    }

    schedulerTimer = setTimeout(scheduler, 25);
  }

  async function start() {
    await ensureContext();
    if (ctx.state === 'suspended') await ctx.resume();
    running = true;
    moodStartTime = ctx.currentTime;
    nextNoteTime = ctx.currentTime + 0.15;
    noteIndex = 0;
    lastBusUpdate = 0;
    updateBuses(1.6);
    scheduler();
  }

  function stop() {
    running = false;
    if (schedulerTimer) {
      clearTimeout(schedulerTimer);
      schedulerTimer = null;
    }
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.6);
    }
  }

  function setScenario(next) {
    if (!PROGRESSIONS[next]) return;
    if (next === scenario) return;
    scenario = next;
    if (ctx) {
      moodStartTime = ctx.currentTime;
    }
    updateBuses(1.0);
  }

  return { start, stop, setScenario };
}
