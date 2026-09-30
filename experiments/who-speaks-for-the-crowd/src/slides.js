import { polls } from './polls.js';

const researchSlides = [
  { key: 'community-notes', title: 'One note. One decision.', steps: 7 },
  { key: 'implicit-electorate', title: 'A hyperactive minority held the note back.', steps: 3 },
  { key: 'cca-proposal', title: 'What do we propose? CCA.', steps: 2 },
  { key: 'constituencies', title: 'We recover constituencies from voting behavior.', steps: 3 },
  { key: 'topic-signatures', title: 'Which cluster agrees more depends on the topic.', steps: 1 },
  { key: 'camp-approval', title: 'Each cluster gets its own approval rate.', steps: 5 },
  { key: 'soft-veto', title: 'Enthusiasm cannot buy consent.', steps: 8 },
  { key: 'rescue-pipeline', title: 'A different rule changes who is heard.', steps: 3 },
  { key: 'closing', title: 'Thank you.', steps: 1 },
];

// Backup slides always render fully revealed (see App.jsx), so `steps` stays
// at 1 regardless of the slide's own step count — otherwise advancing past a
// backup slide would silently consume several "next" presses before moving on.
const backupSlides = [
  { key: 'visibility-results', title: 'A different rule changes who is heard.', steps: 1 },
  { key: 'text-review', title: 'An AI judge read all 13,655 candidate notes.', steps: 1 },
  { key: 'yarmouk', title: '3,000 soldiers. But which battle?', steps: 1 },
];

export const slides = [
  { id: 'join', type: 'join', title: 'Who Speaks for the Crowd?' },
  {
    id: 'goldfish-example', type: 'native', nativeKey: 'goldfish-example', title: 'A wrong tweet. A note that fixes it.', steps: 6,
  },
  ...polls.map((poll) => ({
    id: `poll-${poll.key}`,
    type: 'poll',
    title: poll.title,
    pollKey: poll.key,
  })),
  ...researchSlides.map((slide) => ({
    id: `research-${slide.key}`,
    type: 'native',
    nativeKey: slide.key,
    title: slide.title,
    steps: slide.steps,
  })),
  ...backupSlides.map((slide) => ({
    id: `backup-${slide.key}`,
    type: 'native',
    nativeKey: slide.key,
    title: slide.title,
    steps: slide.steps,
    backup: true,
  })),
];
