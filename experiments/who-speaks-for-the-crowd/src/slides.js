import { polls } from './polls.js';

const researchSlides = [
  { key: 'community-notes', title: 'One note. One decision.', steps: 1 },
  { key: 'approval-puzzle', title: '95.1% said helpful. X still did not display it.', steps: 3 },
  { key: 'unlikely-agreement', title: 'X already looks for unlikely agreement.', steps: 1 },
  { key: 'implicit-electorate', title: 'The handshake is right. The electorate is not.', steps: 4 },
  { key: 'constituencies', title: 'We recover constituencies from voting behavior.', steps: 1 },
  { key: 'camp-approval', title: 'Each camp gets its own approval rate.', steps: 1 },
  { key: 'soft-veto', title: 'Enthusiasm cannot buy consent.', steps: 3 },
  { key: 'visibility-results', title: 'A different rule changes who is heard.', steps: 4 },
  { key: 'text-review', title: '8,558 held up under independent text review.', steps: 1 },
  { key: 'yarmouk', title: 'High approval. Wrong battle.', steps: 2 },
  { key: 'closing', title: 'The crowd is not one number.', steps: 1 },
];

export const slides = [
  { id: 'cover', type: 'cover', title: 'Who Speaks for the Crowd?' },
  { id: 'join', type: 'join', title: "You're part of the crowd" },
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
];
