function highlightNav() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll(`[data-nav="${page}"]`).forEach((el) => {
    el.classList.add("is-active");
  });
}

function setYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

function injectSneakPeekTeaser() {
  if (document.querySelector("[data-sneak-peek-teaser]")) return;

  const footer = document.querySelector(".site-footer");
  if (!footer) return;

  const footerLinks = footer.querySelectorAll("a");
  const mediumLink = Array.from(footerLinks).find((link) =>
    link.href.includes("medium.com/@emrecanulu"),
  );

  if (!mediumLink) return;

  const teaser = document.createElement("a");
  teaser.href = "/sneak-peek/";
  teaser.rel = "nofollow";
  teaser.className = "site-footer__sneak-peek";
  teaser.dataset.sneakPeekTeaser = "true";
  teaser.setAttribute("aria-label", "Open the Sneak Peek experience");
  teaser.setAttribute("title", "Open Sneak Peek");
  teaser.setAttribute("rel", "nofollow");
  teaser.innerHTML = `
    <span class="site-footer__sneak-peek-label">
      <span class="site-footer__sneak-peek-word site-footer__sneak-peek-word--gold">Sneak</span>
      <span class="site-footer__sneak-peek-word site-footer__sneak-peek-word--ember">Peek</span>
    </span>
  `;

  mediumLink.insertAdjacentElement("afterend", teaser);
}

const THEME_KEY = "theme-preference";
const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");

function getStoredTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
  } catch (err) {
    console.warn("Could not read theme preference:", err);
    return null;
  }
}

function getResolvedTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme) return storedTheme;
  return themeMedia.matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  updateThemeToggle(theme);
}

function syncThemeWithPreference() {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    applyTheme(storedTheme);
    return;
  }

  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
  updateThemeToggle(getResolvedTheme());
}

function updateThemeToggle(currentTheme = getResolvedTheme()) {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    button.dataset.nextTheme = nextTheme;
    button.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    button.setAttribute("title", `Switch to ${nextTheme} mode`);
    button.setAttribute("aria-pressed", String(currentTheme === "dark"));
  });
}

function setupThemeToggle() {
  updateThemeToggle(getResolvedTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = button.dataset.nextTheme === "dark" ? "dark" : "light";

      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch (err) {
        console.warn("Could not persist theme preference:", err);
      }

      applyTheme(nextTheme);
    });
  });
}

function setupResonanceCards() {
  const cards = Array.from(document.querySelectorAll("[data-resonance-card]"));
  const soundButton = document.querySelector("[data-resonance-sound]");
  if (!cards.length || !soundButton) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioContext = null;
  let soundEnabled = true;
  let activeCard = null;
  let stopActivePreview = null;
  let previewRequest = 0;
  let arrangementPromise = null;

  function setSoundButton(label, { blocked = false, pressed = soundEnabled } = {}) {
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = pressed ? "●" : "◌";
    soundButton.replaceChildren(icon, document.createTextNode(` ${label}`));
    soundButton.setAttribute("aria-pressed", String(pressed));
    soundButton.classList.toggle("is-blocked", blocked);
  }

  function midiToFrequency(midi) {
    return 440 * (2 ** ((midi - 69) / 12));
  }

  function loadAnlamazdinArrangement() {
    arrangementPromise ||= import("/experiments/anlamazdin/src/music/score.js?v=full-hover-20260802")
      .then(({ buildSongEvents, SONG }) => ({ events: buildSongEvents(), duration: SONG.duration }));
    return arrangementPromise;
  }

  function schedulePianoNote(context, destination, midi, start, duration, velocity = .5, toneName = "natural") {
    const fundamental = context.createOscillator();
    const overtone = context.createOscillator();
    const gain = context.createGain();
    const tone = context.createBiquadFilter();
    const peak = Math.max(.012, velocity * .17);

    fundamental.type = "triangle";
    overtone.type = "sine";
    fundamental.frequency.value = midiToFrequency(midi);
    overtone.frequency.value = midiToFrequency(midi + 12);
    tone.type = "lowpass";
    tone.frequency.value = toneName === "pedal" ? 1150 : toneName === "warm" ? 1750 : 2350;
    tone.Q.value = .7;

    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + .012);
    gain.gain.exponentialRampToValueAtTime(Math.max(.003, peak * .24), start + Math.min(.34, duration * .42));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration + .48);

    fundamental.connect(gain);
    overtone.connect(gain);
    gain.connect(tone);
    tone.connect(destination);
    fundamental.start(start);
    overtone.start(start);
    fundamental.stop(start + duration + .52);
    overtone.stop(start + duration + .52);
    return [fundamental, overtone];
  }

  function scheduleViolinNote(context, destination, midi, start, duration, velocity = .2) {
    const nodes = [-5, 4].map((detune) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = "sawtooth";
      oscillator.frequency.value = midiToFrequency(midi);
      oscillator.detune.value = detune;
      filter.type = "lowpass";
      filter.frequency.value = 920;
      filter.Q.value = 1.4;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(.006, velocity * .07), start + Math.min(.72, duration * .32));
      gain.gain.setValueAtTime(Math.max(.006, velocity * .07), start + Math.max(.74, duration - .8));
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      oscillator.start(start);
      oscillator.stop(start + duration + .04);
      return oscillator;
    });
    return nodes;
  }

  function playAnlamazdinPreview(arrangement) {
    if (!audioContext || audioContext.state !== "running") return;
    stopActivePreview?.();

    const master = audioContext.createGain();
    master.gain.value = .78;
    master.connect(audioContext.destination);
    const scheduledNodes = new Set();
    let schedulerTimer = 0;
    let nextEventIndex = 0;
    let stopped = false;
    const playbackStart = audioContext.currentTime + .06;

    function remember(nodes) {
      nodes.forEach((node) => {
        scheduledNodes.add(node);
        node.addEventListener("ended", () => scheduledNodes.delete(node), { once: true });
      });
    }

    function scheduleAhead() {
      if (stopped) return;
      const elapsed = audioContext.currentTime - playbackStart;
      const horizon = elapsed + 1.4;
      while (
        nextEventIndex < arrangement.events.length
        && arrangement.events[nextEventIndex].time <= horizon
      ) {
        const event = arrangement.events[nextEventIndex];
        const when = playbackStart + event.time;
        const duration = Math.max(.08, event.duration);
        if (event.track === "violin") {
          remember(scheduleViolinNote(audioContext, master, event.midi, when, duration, event.velocity));
        } else {
          const tone = event.track === "pedal" ? "pedal" : event.tone;
          remember(schedulePianoNote(
            audioContext,
            master,
            event.midi,
            when,
            duration,
            event.velocity,
            tone,
          ));
        }
        nextEventIndex += 1;
      }
      if (nextEventIndex >= arrangement.events.length && elapsed > arrangement.duration + .5) {
        window.clearInterval(schedulerTimer);
      }
    }

    scheduleAhead();
    schedulerTimer = window.setInterval(scheduleAhead, 250);
    stopActivePreview = () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(schedulerTimer);
      const now = audioContext.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(.0001, master.gain.value), now);
      master.gain.exponentialRampToValueAtTime(.0001, now + .2);
      scheduledNodes.forEach((node) => {
        try { node.stop(now + .22); } catch (_error) { /* already stopped */ }
      });
      window.setTimeout(() => master.disconnect(), 260);
      stopActivePreview = null;
    };
  }

  function stopPreview() {
    previewRequest += 1;
    stopActivePreview?.();
  }

  async function playCardPreview(card) {
    if (!soundEnabled || card?.dataset.audioPreview !== "anlamazdin") return;
    const request = ++previewRequest;
    try {
      const arrangement = await loadAnlamazdinArrangement();
      if (request !== previewRequest || activeCard !== card || !soundEnabled) return;
      playAnlamazdinPreview(arrangement);
    } catch {
      setSoundButton("Preview unavailable", { blocked: true, pressed: false });
    }
  }

  async function enableSound() {
    if (!AudioContextClass) {
      soundEnabled = false;
      soundButton.disabled = true;
      setSoundButton("Sound unavailable");
      return false;
    }
    audioContext ||= new AudioContextClass();
    await audioContext.resume();
    if (audioContext.state !== "running") throw new Error("Audio context is still suspended");
    soundEnabled = true;
    setSoundButton("Hover sound on", { pressed: true });
    playCardPreview(activeCard);
    return true;
  }

  function disableSound() {
    soundEnabled = false;
    stopPreview();
    setSoundButton("Hover sound off", { pressed: false });
  }

  function activateCard(card) {
    if (activeCard === card) return;
    stopPreview();
    activeCard = card;
    if (soundEnabled) {
      if (!audioContext || audioContext.state !== "running") {
        enableSound().catch(() => setSoundButton("Click to enable hover sound", { blocked: true }));
      } else {
        playCardPreview(card);
      }
      return;
    }
    if (card.dataset.audioPreview) {
      enableSound().catch(() => setSoundButton("Click to enable hover sound", { blocked: true }));
    }
  }

  function deactivateCard(card) {
    if (activeCard !== card) return;
    activeCard = null;
    stopPreview();
  }

  soundButton.addEventListener("click", () => {
    if (soundEnabled) {
      disableSound();
    } else {
      enableSound().catch(() => setSoundButton("Sound blocked by browser", { blocked: true }));
    }
  });

  cards.forEach((card) => {
    card.addEventListener("pointerenter", () => activateCard(card));
    card.addEventListener("pointerleave", () => deactivateCard(card));
    card.addEventListener("focusin", () => activateCard(card));
    card.addEventListener("focusout", (event) => {
      if (!card.contains(event.relatedTarget)) deactivateCard(card);
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopPreview();
    } else if (soundEnabled && activeCard) {
      playCardPreview(activeCard);
    }
  });
  window.addEventListener("pagehide", stopPreview);
}

function handleSystemThemeChange() {
  if (!getStoredTheme()) {
    syncThemeWithPreference();
  }
}

if (typeof themeMedia.addEventListener === "function") {
  themeMedia.addEventListener("change", handleSystemThemeChange);
} else if (typeof themeMedia.addListener === "function") {
  themeMedia.addListener(handleSystemThemeChange);
}

document.addEventListener("DOMContentLoaded", () => {
  syncThemeWithPreference();
  highlightNav();
  setYear();
  setupThemeToggle();
  injectSneakPeekTeaser();
  setupResonanceCards();
});
