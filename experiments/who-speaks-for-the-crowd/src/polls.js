const base = import.meta.env?.BASE_URL || '/who-speaks-for-the-crowd/';

export const pollKeys = ['case-great-wall', 'case-oxford', 'case-khamenei'];

export const polls = [
  {
    key: 'case-great-wall',
    round: 1,
    eyebrow: 'AUDIENCE VOTE 1 OF 3',
    title: 'Which note should be shown?',
    post: {
      author: 'Inevitable West', handle: '@Inevitablewest', avatar: 'IW', verified: true,
      avatarImage: `${base}media/inevitable-west-avatar.jpg`,
      sourceUrl: 'https://x.com/Inevitablewest/status/1891443393684774979',
      text: 'German schools are holding mock elections. The AfD are winning every single one by a massive majority.\n\nThe kids are going to be just fine.',
      timeAgo: '17h',
      engagement: { replies: '428', reposts: '1.2K', likes: '8.6K', views: '312K' },
      images: [
        {
          src: `${base}media/afd-juniorwahl-parties.jpg`,
          alt: 'Close-up of the Juniorwahl party list showing the AfD at 63.49 percent, followed by the CDU at 14.29 percent.',
          splitDocument: true,
        },
        {
          src: `${base}media/afd-juniorwahl-pie-chart.jpg`,
          alt: 'Close-up of the Juniorwahl second-vote pie chart.',
          splitDocument: true,
        },
      ],
      meta: 'Feb 17, 2025',
    },
    candidates: [
      {
        id: 'A', badge: 'Candidate note',
        text: 'The AfD did not win “every single one by a massive majority.” Instead, they placed fourth with 15.5%. This was the result of the U18 federal election, in which nearly 170,000 young people participated.',
        reveal: { tone: 'actual', label: 'ACTUAL COMMUNITY NOTE', detail: 'Community Note 1891720468169720267', sourceUrl: 'https://x.com/i/birdwatch/n/1891720468169720267' },
      },
      {
        id: 'B', badge: 'Candidate note',
        text: 'This image shows the nationwide Juniorwahl result. The AfD won 63.49% of the youth vote across Germany.',
        reveal: { tone: 'false', label: 'PLAUSIBLE, BUT INVENTED', detail: 'The image reports one school in Pirna, not a nationwide result.' },
      },
      {
        id: 'C', badge: 'Candidate note',
        text: 'Juniorwahl and U18 elections are educational projects; their results do not count toward the official Bundestag election.',
        reveal: { tone: 'context', label: 'TRUE, BUT NOT RELEVANT', detail: 'Accurate context that does not test the post’s nationwide claim.' },
      },
    ],
  },
  {
    key: 'case-oxford',
    round: 2,
    eyebrow: 'AUDIENCE VOTE 2 OF 3',
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
    round: 3,
    eyebrow: 'AUDIENCE VOTE 3 OF 3',
    title: 'Which note should be shown?',
    post: {
      author: 'Shia Visuals', handle: '@ShiaVisuals', avatar: 'SV',
      avatarImage: `${base}media/shia-visuals-avatar.jpg`,
      text: 'May Allah protect him.',
      timeAgo: '6h',
      engagement: { replies: '92', reposts: '340', likes: '2.8K', views: '145K' },
      zoomable: false,
      image: `${base}media/khamenei.png`,
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
