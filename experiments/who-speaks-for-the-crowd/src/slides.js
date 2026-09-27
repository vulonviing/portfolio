import { polls } from './polls.js';

const researchSlides = [
  { key: 'community-notes', title: 'One note. One decision.', steps: 1 },
  { key: 'approval-puzzle', title: '95.1% said helpful. X still did not display it.', steps: 3 },
  { key: 'unlikely-agreement', title: 'X already looks for unlikely agreement.', steps: 1 },
  { key: 'implicit-electorate', title: 'A hyperactive minority held the note back.', steps: 2 },
  { key: 'cca-proposal', title: 'What do we propose? CCA.', steps: 1 },
  { key: 'constituencies', title: 'We recover constituencies from voting behavior.', steps: 1 },
  { key: 'camp-approval', title: 'Each cluster gets its own approval rate.', steps: 1 },
  { key: 'soft-veto', title: 'Enthusiasm cannot buy consent.', steps: 3 },
  { key: 'rescue-pipeline', title: 'A different rule changes who is heard.', steps: 3 },
  { key: 'yarmouk', title: '3,000 soldiers. But which battle?', steps: 2 },
  { key: 'closing', title: 'Any questions?', steps: 1 },
];

// Backup slides always render fully revealed (see App.jsx), so `steps` stays
// at 1 regardless of the slide's own step count — otherwise advancing past a
// backup slide would silently consume several "next" presses before moving on.
const backupSlides = [
  { key: 'topic-signatures', title: 'Which cluster agrees more depends on the topic.', steps: 1 },
  { key: 'visibility-results', title: 'A different rule changes who is heard.', steps: 1 },
  { key: 'text-review', title: 'An AI judge read all 13,655 candidate notes.', steps: 1 },
];

export const slides = [
  { id: 'join', type: 'join', title: 'Who Speaks for the Crowd?' },
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
