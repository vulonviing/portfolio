const base = import.meta.env.BASE_URL;

export const pollKeys = ['case-wikimedia', 'case-shelter', 'case-punchline'];

export const polls = [
  {
    key: 'case-wikimedia',
    slideId: 2,
    round: 1,
    eyebrow: 'AUDIENCE VOTE 1 OF 3',
    title: 'Which note should be shown?',
    tweetAlt: 'Elon Musk asks why the Wikimedia Foundation needs money to operate Wikipedia.',
    tweetImage: `${base}slides/slide-02.png`,
    crop: { x: 52.5, y: 16.5, width: 28.4, height: 40.8 },
    candidates: [
      {
        id: 'A',
        badge: 'Existing note',
        illustrative: false,
        text: 'The Wikimedia Foundation is a charitable nonprofit that provides free access to Wikipedia. A text-only English copy is about 51 GB, while all media and supported languages total about 428 TB. In 2022, Wikimedia reported $154M in revenue and $145M in expenses.',
        source: 'Wikipedia size estimates · Wikimedia annual report',
      },
      {
        id: 'B',
        badge: 'Illustrative candidate',
        illustrative: true,
        text: 'A downloadable copy is not the same as operating Wikipedia. Donations also support software, security, legal defense, staff, and access across hundreds of languages.',
        source: 'Placeholder — source review required',
      },
      {
        id: 'C',
        badge: 'Illustrative candidate',
        illustrative: true,
        text: 'The post compares storage size with the Foundation’s full operating costs. That comparison alone does not show that the remaining expenses are unnecessary.',
        source: 'Placeholder — source review required',
      },
    ],
  },
  {
    key: 'case-shelter',
    slideId: 3,
    round: 2,
    eyebrow: 'AUDIENCE VOTE 2 OF 3',
    title: 'Which note should be shown?',
    tweetAlt: 'A user describes repeatedly going to a bomb shelter with their family.',
    tweetImage: `${base}slides/slide-03.png`,
    crop: { x: 56.3, y: 1.5, width: 26.1, height: 25.5 },
    candidates: [
      {
        id: 'A',
        badge: 'Illustrative candidate',
        illustrative: true,
        text: 'The post describes a personal experience but gives no date, location, alert record, or other detail that readers can independently check.',
        source: 'Placeholder — source review required',
      },
      {
        id: 'B',
        badge: 'Existing note',
        illustrative: false,
        text: 'This user is notorious for creating clickbait content and seeking high levels of engagement. The user resides in Lucknow, India, and not Israel.',
        source: 'Source cited by the existing note',
      },
      {
        id: 'C',
        badge: 'Illustrative candidate',
        illustrative: true,
        text: 'A helpful note should address a checkable claim in the post. Claims about the author’s motives or residence do not establish whether this account is accurate.',
        source: 'Placeholder — source review required',
      },
    ],
  },
  {
    key: 'case-punchline',
    slideId: 4,
    round: 3,
    eyebrow: 'AUDIENCE VOTE 3 OF 3',
    title: 'Which note should be shown?',
    tweetAlt: 'A post with a photograph of Ali Khamenei says, “May Allah protect him.”',
    tweetImage: `${base}slides/slide-04.png`,
    crop: { x: 34.5, y: 15.8, width: 31, height: 55.4 },
    candidates: [
      {
        id: 'A',
        badge: 'Illustrative candidate',
        illustrative: true,
        text: 'The caption expresses a wish rather than a specific factual claim. A Community Note may not be necessary unless readers are likely to be misled.',
        source: 'Placeholder — source review required',
      },
      {
        id: 'B',
        badge: 'Illustrative candidate',
        illustrative: true,
        text: 'If current reporting materially changes how readers understand this post, a neutral note should state that update directly and link to a reliable report.',
        source: 'Placeholder — source review required',
      },
      {
        id: 'C',
        badge: 'Existing note',
        illustrative: false,
        text: 'Allah didn’t protect him.',
        source: 'The Guardian link cited by the existing note',
      },
    ],
  },
];

export const pollsByKey = Object.fromEntries(polls.map((poll) => [poll.key, poll]));
