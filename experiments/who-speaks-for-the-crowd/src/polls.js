const base = import.meta.env.BASE_URL;

export const pollKeys = ['case-great-wall', 'case-oxford', 'case-khamenei'];

export const polls = [
  {
    key: 'case-great-wall',
    round: 1,
    eyebrow: 'AUDIENCE VOTE 1 OF 3',
    title: 'Which note should be shown?',
    post: {
      author: 'Space Facts', handle: '@space_demo', avatar: 'SF',
      text: 'The Great Wall of China is visible from the Moon with the naked eye.',
      meta: 'Demo post',
    },
    candidates: [
      {
        id: 'A', badge: 'Candidate note',
        text: 'It becomes visible at sunrise, when the wall casts a long shadow.',
        reveal: { tone: 'false', label: 'FABRICATED FOR THIS DEMO', detail: 'No reliable source supports this explanation.' },
      },
      {
        id: 'B', badge: 'Candidate note',
        text: 'NASA says the wall is not visible from the Moon and is difficult to see even from low Earth orbit.',
        reveal: { tone: 'supported', label: 'SUPPORTED', detail: 'NASA · Great Wall image article', sourceUrl: 'https://www.nasa.gov/image-article/great-wall/' },
      },
      {
        id: 'C', badge: 'Candidate note',
        text: 'Apollo astronauts reported seeing it without magnification.',
        reveal: { tone: 'false', label: 'FABRICATED FOR THIS DEMO', detail: 'Apollo reports do not support this claim.' },
      },
    ],
  },
  {
    key: 'case-oxford',
    round: 2,
    eyebrow: 'AUDIENCE VOTE 2 OF 3',
    title: 'Which note should be shown?',
    post: {
      author: 'History Facts', handle: '@history_demo', avatar: 'HF',
      text: 'Oxford University is older than the Aztec Empire.',
      meta: 'Demo post',
    },
    candidates: [
      {
        id: 'A', badge: 'Candidate note',
        text: 'Teaching existed at Oxford by 1096. The Aztec Empire formed in 1428.',
        reveal: { tone: 'supported', label: 'SUPPORTED & RELEVANT', detail: 'University of Oxford · The Met', sourceUrl: 'https://www.ox.ac.uk/about/the-university/history' },
      },
      {
        id: 'B', badge: 'Candidate note',
        text: 'Oxford began in 1167. The Aztec Empire began with Tenochtitlan in 1325.',
        reveal: { tone: 'false', label: 'PLAUSIBLE, BUT WRONG', detail: '1167 marks rapid growth; 1325 refers to the city, not the empire.' },
      },
      {
        id: 'C', badge: 'Candidate note',
        text: 'The Aztec Empire ended in 1521 after Spanish forces captured Tenochtitlan.',
        reveal: { tone: 'context', label: 'TRUE, BUT NOT RELEVANT', detail: 'Accurate context that does not resolve the comparison.', sourceUrl: 'https://www.metmuseum.org/exhibitions/listings/2018/golden-kingdoms/exhibition-galleries' },
      },
    ],
  },
  {
    key: 'case-khamenei',
    round: 3,
    eyebrow: 'AUDIENCE VOTE 3 OF 3',
    title: 'Which note should be shown?',
    post: {
      author: 'Shia Visuals', handle: '@ShiaVisuals', avatar: 'SV', verified: true,
      text: 'May Allah protect him.',
      image: `${base}media/khamenei.png`,
      imageAlt: 'Ali Khamenei wearing a black turban and looking downward.',
      meta: 'Post reproduced for the live vote',
    },
    candidates: [
      {
        id: 'A', badge: 'Candidate note',
        text: 'Ali Khamenei was killed at age 86 in a joint U.S.–Israeli strike on 28 February 2026.',
        reveal: { tone: 'context', label: 'INFORMATIVE ALTERNATIVE', detail: 'Associated Press · 1 March 2026', sourceUrl: 'https://apnews.com/article/5b13b69b708c4ed38e8f95f5fb41a597' },
      },
      {
        id: 'B', badge: 'Candidate note',
        text: 'He had served as Iran’s supreme leader since 1989; state media confirmed his death on 1 March 2026.',
        reveal: { tone: 'context', label: 'INFORMATIVE ALTERNATIVE', detail: 'Associated Press · 1 March 2026', sourceUrl: 'https://apnews.com/article/5b13b69b708c4ed38e8f95f5fb41a597' },
      },
      {
        id: 'C', badge: 'Candidate note',
        text: 'Allah didn’t protect him.',
        reveal: { tone: 'actual', label: 'ACTUAL COMMUNITY NOTE', detail: 'The Guardian link cited by the existing note', sourceUrl: 'https://www.theguardian.com/world/2026/mar/01/ayatollah-ali-khamenei-obituary' },
      },
    ],
  },
];

export const pollsByKey = Object.fromEntries(polls.map((poll) => [poll.key, poll]));
