export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_STORAGE_KEY = 'anlamazdin-language';
export const LANGUAGES = ['en', 'tr'];

const NOTE_NAMES = {
  en: ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'],
  tr: ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'],
};

const SECTION_LABELS = {
  en: {
    wish: 'I wish',
    'wish-1': 'I wish',
    verse: 'Didn’t I say?',
    'verse-2': 'Didn’t I say?',
    chorus: 'You wouldn’t understand',
    'chorus-2': 'You wouldn’t understand',
  },
  tr: {
    wish: 'Dilerim ki',
    'wish-1': 'Dilerim ki',
    verse: 'Demedim mi?',
    'verse-2': 'Demedim mi?',
    chorus: 'Anlamazdın',
    'chorus-2': 'Anlamazdın',
  },
};

const COPY = {
  en: {
    pageTitle: 'Anlamazdın — An Interactive Piano and Violin Tribute',
    pageDescription: 'An interactive piano and violin tribute inspired by Ayla Dikmen’s Anlamazdın.',
    backToPortfolio: 'Back to portfolio',
    languageLabel: 'Choose language',
    creditsLabel: 'Sample and notation credits',
    pianoLabel: 'Two-octave piano keyboard',
    playNote: (note) => `Play ${note}`,
    playingSection: (section) => `Playing section: ${section}`,
    soundPlayerLabel: 'Anlamazdın piano and violin player',
    seekLabel: 'Seek backward or forward through the song',
    noticeEyebrow: 'Before you begin',
    noticeTitle: 'Computer and headphones required.',
    noticeBody: 'This experience is designed for a computer and headphones. The instrument files are already loading in the background.',
    noticeLoading: 'Preparing sound',
    noticeAccept: 'OK, continue',
    rotateEyebrow: 'Phone experience',
    rotateTitle: 'Turn your phone sideways.',
    rotateBody: 'Anlamazdın is composed for a wide screen. Loading continues while you rotate your phone.',
    mixControls: 'Instrument volume controls',
    mixer: 'Mixer',
    openMixer: 'Open instrument mixer',
    closeMixer: 'Close instrument mixer',
    pianoMix: 'Piano',
    violinMix: 'Violin',
    restart: 'Play from the beginning',
    pause: 'Pause',
    resume: 'Resume',
    noteEntryLabel: 'Note-entry experience',
    step: 'STEP',
    melodyReady: 'MELODY READY',
    nextSyllable: 'NEXT SYLLABLE',
    startOver: 'Start over',
    completedSyllables: (count) => `${count} syllables completed`,
    pianoPreparing: 'Loading the piano sample',
    arrangementPreparing: 'Loading all piano and violin samples',
    loadingPatience: 'Please be patient — the experiment will begin when every instrument is ready.',
    loadingFiles: (loaded, total) => `${loaded} of ${total} instrument files ready`,
    audioUnavailable: 'Audio could not be loaded. Reload the page to try again.',
    wrongNote: 'Not this one. Listen a little closer.',
    touchKey: 'Touch the glowing key.',
    pressPlay: 'Your melody is complete. Press play to begin.',
    play: 'PLAY',
    songKey: 'B minor',
    rightsSummary: 'Unofficial tribute · Rights & credits',
    unofficialShort: 'Unofficial, non-commercial interactive tribute. No original master recording is used.',
  },
  tr: {
    pageTitle: 'Anlamazdın — İnteraktif Piyano ve Keman Deneyi',
    pageDescription: 'Ayla Dikmen’in Anlamazdın eserinden ilham alan interaktif piyano ve keman deneyimi.',
    backToPortfolio: 'Portfolyoya dön',
    languageLabel: 'Dil seç',
    creditsLabel: 'Ses örnekleri ve nota kaynakları',
    pianoLabel: 'İki oktavlık piyano klavyesi',
    playNote: (note) => `${note} notasını çal`,
    playingSection: (section) => `Çalan bölüm: ${section}`,
    soundPlayerLabel: 'Anlamazdın piyano ve keman çaları',
    seekLabel: 'Şarkıda ileri veya geri sar',
    noticeEyebrow: 'Başlamadan önce',
    noticeTitle: 'Bilgisayar ve kulaklık gerekli.',
    noticeBody: 'Bu deneyim bilgisayar ve kulaklık için tasarlandı. Enstrüman dosyaları arka planda şimdiden yükleniyor.',
    noticeLoading: 'Ses hazırlanıyor',
    noticeAccept: 'Tamam, devam et',
    rotateEyebrow: 'Telefon deneyimi',
    rotateTitle: 'Telefonunu yatay çevir.',
    rotateBody: 'Anlamazdın geniş ekran için bestelendi. Telefonunu çevirirken ses dosyaları yüklenmeye devam ediyor.',
    mixControls: 'Enstrüman ses kontrolleri',
    mixer: 'Mikser',
    openMixer: 'Enstrüman mikserini aç',
    closeMixer: 'Enstrüman mikserini kapat',
    pianoMix: 'Piyano',
    violinMix: 'Keman',
    restart: 'Baştan çal',
    pause: 'Duraklat',
    resume: 'Devam et',
    noteEntryLabel: 'Nota giriş deneyimi',
    step: 'ADIM',
    melodyReady: 'MELODİ HAZIR',
    nextSyllable: 'SIRADAKİ HECE',
    startOver: 'Baştan al',
    completedSyllables: (count) => `${count} hece tamamlandı`,
    pianoPreparing: 'Piyano örneği yükleniyor',
    arrangementPreparing: 'Tüm piyano ve keman sesleri yükleniyor',
    loadingPatience: 'Lütfen sabırlı olun — bütün enstrümanlar hazır olduğunda deney başlayacak.',
    loadingFiles: (loaded, total) => `${total} ses dosyasından ${loaded} tanesi hazır`,
    audioUnavailable: 'Ses yüklenemedi. Yeniden denemek için sayfayı yenileyin.',
    wrongNote: 'Bu değil. Biraz daha dinle.',
    touchKey: 'Parlayan tuşa dokun.',
    pressPlay: 'Melodin tamamlandı. Başlamak için çal tuşuna bas.',
    play: 'ÇAL',
    songKey: 'Si minör',
    rightsSummary: 'Resmî olmayan çalışma · Haklar',
    unofficialShort: 'Resmî olmayan, ticari olmayan interaktif saygı çalışmasıdır. Orijinal master kayıt kullanılmaz.',
  },
};

export function normalizeLanguage(value) {
  return LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE;
}

export function copyFor(language) {
  return COPY[normalizeLanguage(language)];
}

export function noteName(midi, language) {
  return NOTE_NAMES[normalizeLanguage(language)][midi % 12];
}

export function sectionLabel(sectionId, language, fallback = '') {
  return SECTION_LABELS[normalizeLanguage(language)][sectionId] ?? fallback;
}

export function readStoredLanguage(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    return normalizeLanguage(target?.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function storeLanguage(language, storage) {
  const normalized = normalizeLanguage(language);
  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // A blocked storage API must not block the language control.
  }
  return normalized;
}
