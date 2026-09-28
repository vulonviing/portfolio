const base = import.meta.env?.BASE_URL || '/who-speaks-for-the-crowd/';

export const pollKeys = ['case-oxford', 'case-khamenei'];

export const polls = [
  {
    key: 'case-oxford',
    round: 1,
    eyebrow: 'AUDIENCE VOTE 1 OF 2',
    title: 'Which note should be shown?',
    post: {
      author: 'Legitimate Targets', handle: '@LegitTargets', avatar: 'LT', verified: true,
      avatarImage: `${base}media/legitimate-targets-avatar.jpg`,
      sourceUrl: 'https://x.com/LegitTargets/status/1862791177592050074',
      text: 'BREAKING: German AfD Party says they will LEAVE the EU if they win February elections.',
      timeAgo: '3d',
      engagement: { replies: '156', reposts: '890', likes: '4.2K', views: '198K' },
      zoomable: false,
      images: [
        {
          src: `${base}media/afd-eu-weidel.jpg`,
          alt: 'Portrait of AfD co-leader Alice Weidel.',
        },
        {
          src: `${base}media/afd-eu-flag.jpg`,
          alt: 'European Union flag covered by a red prohibition symbol.',
        },
      ],
      meta: 'Nov 30, 2024',
    },
    candidates: [
      {
        id: 'A', badge: 'Candidate note',
        text: 'The AfD program calls for an immediate German exit from both the EU and the euro if the party enters government. No public referendum is proposed.',
        reveal: { tone: 'false', label: 'PLAUSIBLE, BUT INVENTED', detail: 'The real proposal includes a public vote rather than an automatic exit.' },
      },
      {
        id: 'B', badge: 'Candidate note',
        text: 'The AfD announced that if they win the election, they plan to let the people decide through a vote whether Germany should remain in the EU.',
        reveal: { tone: 'actual', label: 'ACTUAL COMMUNITY NOTE', detail: 'Community Note 1862981658447905254', sourceUrl: 'https://x.com/i/birdwatch/n/1862981658447905254' },
      },
      {
        id: 'C', badge: 'Candidate note',
        text: 'The AfD proposes leaving the eurozone but remaining in the European Union, similar to Denmark. The post confuses EU and euro membership.',
        reveal: { tone: 'false', label: 'PLAUSIBLE, BUT INVENTED', detail: 'The proposal discusses EU membership, not only the common currency.' },
      },
    ],
  },
  {
    key: 'case-khamenei',
    round: 2,
    eyebrow: 'AUDIENCE VOTE 2 OF 2',
    title: 'Which note should be shown?',
    post: {
      author: 'Shia Visuals', handle: '@ShiaVisuals', avatar: 'SV',
      avatarImage: `${base}media/shia-visuals-avatar.jpg`,
      text: 'May Allah protect him.',
      timeAgo: '6h',
      engagement: { replies: '92', reposts: '340', likes: '2.8K', views: '145K' },
      zoomable: false,
      image: `${base}media/khamenei.jpg`,
      imageAlt: 'Ali Khamenei wearing a black turban and looking downward.',
      meta: 'Feb 28, 2026',
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
