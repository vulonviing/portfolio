import { polls } from './polls.js';

const base = import.meta.env.BASE_URL;

const titles = [
  'Who Speaks for the Crowd?',
  'Which note should be shown? Wikimedia',
  'Which note should be shown? Shelter post',
  'Which note should be shown? A punchline',
  'One note. One decision.',
  '95.1% said helpful. X still did not display it.',
  'X already looks for unlikely agreement.',
  'The handshake is right. The electorate is not.',
  'We recover constituencies from voting behavior.',
  'Each camp gets its own approval rate.',
  'Enthusiasm cannot buy consent.',
  'A different rule changes who is heard.',
  '8,558 held up under independent text review.',
  'High approval. Wrong battle.',
  'The crowd is not one number.',
];

export const slides = titles.map((title, index) => {
  const id = index + 1;
  const poll = polls.find((item) => item.slideId === id);
  return poll
    ? { id, type: 'poll', title, pollKey: poll.key }
    : {
        id,
        type: 'image',
        title,
        src: `${base}slides/slide-${String(id).padStart(2, '0')}.png`,
      };
});
