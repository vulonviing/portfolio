const base = import.meta.env.BASE_URL;

const titles = [
  'Who Speaks for the Crowd?',
  'Would you show this note? A factual correction',
  'Would you show this note? An unsupported attack',
  'Would you show this note? A troll punchline',
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

export const slides = titles.map((title, index) => ({
  id: index + 1,
  type: 'image',
  title,
  src: `${base}slides/slide-${String(index + 1).padStart(2, '0')}.png`,
}));
