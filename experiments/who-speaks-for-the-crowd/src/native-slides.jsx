import { PostCard, PostIcon } from './post-card.jsx';
import { VoteQr } from './vote-qr.jsx';
import { pollsByKey } from './polls.js';

const base = import.meta.env?.BASE_URL || '/who-speaks-for-the-crowd/';
const dotRange = (count) => Array.from({ length: count }, (_, index) => index);

function Reveal({ show, className = '', children }) {
  return <div className={`native-reveal ${show ? 'native-reveal-visible' : ''} ${className}`}>{children}</div>;
}

function SlideFrame({ number, eyebrow, title, className = '', children }) {
  return (
    <article className={`native-slide ${className}`}>
      <header className="native-header">
        <span>{eyebrow}</span>
        <span>{String(number).padStart(2, '0')}</span>
      </header>
      <h1 className="native-title">{title}</h1>
      <div className="native-canvas">{children}</div>
      <footer className="native-footer" />
    </article>
  );
}

function FlowArrow({ tone = 'neutral', className = '' }) {
  return <span className={`flow-arrow flow-arrow-${tone} ${className}`} aria-hidden="true" />;
}

function NoteGlyph({ className = '' }) {
  return (
    <div className={`note-glyph ${className}`} aria-hidden="true">
      <span /><span /><span />
    </div>
  );
}

function DotGrid({ tone, count = 30, columns = 6, className = '' }) {
  return (
    <div className={`dot-grid dot-grid-${tone} ${className}`} style={{ '--dot-columns': columns }} aria-hidden="true">
      {dotRange(count).map((dot) => <span key={dot} />)}
    </div>
  );
}

function Person({ tone }) {
  return (
    <span className={`person person-${tone}`} aria-hidden="true">
      <i className="person-head" /><i className="person-body" /><i className="person-arms" /><i className="person-leg person-leg-left" /><i className="person-leg person-leg-right" />
    </span>
  );
}

function CheckMark() {
  return <span className="check-mark" aria-hidden="true">✓</span>;
}

function ArchetypeCard({ tone, headline, detail, show = true }) {
  return (
    <div className={`archetype-card archetype-card-${tone} native-reveal ${show ? 'native-reveal-visible' : ''}`}>
      <span className="archetype-eyebrow"><i /> CANDIDATE NOTE</span>
      <strong>{headline}</strong>
      <p>{detail}</p>
    </div>
  );
}

const khameneiPost = pollsByKey['case-khamenei'].post;

function DecisionFlowSlide({ number, step = 0 }) {
  return (
    <SlideFrame number={number} eyebrow="WHAT IS COMMUNITY NOTES?" title="Not every candidate note is trying to help.">
      <div className="archetype-layout">
        <div className="archetype-top">
          {step >= 4 && (
            <div className="archetype-tweet">
              <PostCard post={khameneiPost} className="archetype-tweet-post" />
            </div>
          )}
          <div className="archetype-grid">
            <ArchetypeCard tone="green" headline="On-topic. Accurate." detail="The note that should win." show={step >= 1} />
            <ArchetypeCard tone="amber" headline="Sounds right. Isn’t." detail="Same tone and style — wrong or irrelevant information." show={step >= 2} />
            <ArchetypeCard tone="coral" headline="Troll note." detail="Doesn’t even try to be true." show={step >= 3} />
          </div>
        </div>
        {step >= 4 && (
          <div className="archetype-vote">
            <div className="archetype-vote-people"><Person tone="blue" /><Person tone="coral" /></div>
            <span className="archetype-vote-arrow" aria-hidden="true" />
            <strong className="archetype-summary">Congratulations. You are now the algorithm.</strong>
          </div>
        )}
      </div>
    </SlideFrame>
  );
}

const goldfishPost = {
  author: 'Fun Fact Friday',
  handle: '@dailyfunfacts',
  avatarImage: `${base}media/dailyfunfacts-avatar.jpg`,
  text: 'Goldfish only have a 3-second memory. That’s why they’re happy swimming in a tiny bowl forever.',
  image: `${base}media/goldfish-tweet.jpg`,
  imageAlt: 'A goldfish staring directly at the camera through its tank glass.',
  timeAgo: '4h',
  engagement: { replies: '89', reposts: '1.4K', likes: '9.2K', views: '210K' },
};

const goldfishNote = (
  <>
    Goldfish can remember things for months, not seconds — they’ve been trained to recognize
    colors, sounds, and feeding times. Small bowls are actually harmful to them.
    <br />
    University of Plymouth (2003)
  </>
);

function GoldfishExampleSlide({ number, step = 0, audienceUrl }) {
  const showTweetBody = step !== 3;
  const showSmallPhoto = step === 0 || step === 2;
  const showBigPhotoInNoteSlot = step === 1;
  const showBigPhotoAsBody = step === 3;
  const showNote = step === 2 || step === 3;

  return (
    <SlideFrame number={number} eyebrow="COMMUNITY NOTES 101" title="A wrong tweet. A note that fixes it.">
      <div className="example-layout">
        <article className="post-card post-card-with-media">
          {showTweetBody && (
            <>
              <header className="post-author">
                <img className="post-avatar post-avatar-image" src={goldfishPost.avatarImage} alt="" draggable="false" />
                <div className="post-identity">
                  <strong>{goldfishPost.author}</strong>
                  <span>{goldfishPost.handle}</span>
                </div>
                <div className="post-header-meta" aria-hidden="true">
                  <span className="post-time">· {goldfishPost.timeAgo}</span>
                  <span className="post-spark"><img src={`${base}media/grok-logo.png`} alt="" draggable="false" /></span>
                  <span className="post-more">•••</span>
                </div>
              </header>
              <p className="post-text">{goldfishPost.text}</p>
              {showSmallPhoto && (
                <div className="post-media-grid post-media-grid-single">
                  <span className="post-media-static">
                    <img className="post-media" src={goldfishPost.image} alt={goldfishPost.imageAlt} draggable="false" />
                  </span>
                </div>
              )}
              <div className="post-actions" aria-hidden="true">
                <div className="post-actions-group">
                  <span className="post-action"><PostIcon name="comment" />{goldfishPost.engagement.replies}</span>
                  <span className="post-action"><PostIcon name="repost" />{goldfishPost.engagement.reposts}</span>
                  <span className="post-action"><PostIcon name="heart" />{goldfishPost.engagement.likes}</span>
                  <span className="post-action"><PostIcon name="views" />{goldfishPost.engagement.views}</span>
                </div>
                <div className="post-actions-extra">
                  <span className="post-action-icon"><PostIcon name="bookmark" /></span>
                  <span className="post-action-icon"><PostIcon name="share" /></span>
                </div>
              </div>
            </>
          )}
          {showBigPhotoInNoteSlot && (
            <div className="goldfish-big-photo">
              <img src={goldfishPost.image} alt={goldfishPost.imageAlt} draggable="false" />
            </div>
          )}
          {showBigPhotoAsBody && (
            <div className="goldfish-big-photo goldfish-big-photo-top">
              <img src={goldfishPost.image} alt={goldfishPost.imageAlt} draggable="false" />
            </div>
          )}
          {showNote && (
            <div className="post-note">
              <div className="post-note-head">
                <span className="post-note-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-4.8 7.6 8.5 8.5 0 0 1-3.7.9 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </span>
                <strong>Community Note</strong>
              </div>
              <p>{goldfishNote}</p>
            </div>
          )}
        </article>
        <div className="example-qr-panel">
          <VoteQr audienceUrl={audienceUrl} large label="Scan to join" />
          <p>Keep your phone out — you’ll vote on real cases next.</p>
        </div>
      </div>
    </SlideFrame>
  );
}

const rawChickenPost = {
  author: 'Home Kitchen Hacks',
  handle: '@dailyfoodhacks',
  avatarImage: `${base}media/home-kitchen-hacks-avatar.jpg`,
  text: 'PSA: always wash your raw chicken thoroughly before cooking. Basic food safety 101.',
  timeAgo: '22s',
  engagement: { replies: '12', reposts: '34', likes: '210', views: '8.4K' },
  meta: 'Mar 14, 2024',
};
// Real tweet, real Community Note (Feb 2024) -- a teaching example for the
// camp-approval/soft-veto math, not one of the three actual voting cases.
// Candidate A (the rejected, dismissive one) is written for this talk, not
// an archived note; candidate B is the real note, kept verbatim.
const muskWindowsExample = {
  post: {
    author: 'Elon Musk',
    handle: '@elonmusk',
    verified: true,
    avatarImage: `${base}media/elonmusk-avatar-v2.jpg`,
    sourceUrl: 'https://x.com/elonmusk/status/1761881852833419771',
    text: 'Just bought a new PC and it won’t let me use it unless I create a Microsoft account. This is messed up.',
    timeAgo: '2y',
    engagement: { replies: '8.9K', reposts: '2.1K', likes: '74K', views: '18M' },
    meta: 'Feb 25, 2024',
  },
  candidates: [
    {
      id: 'A',
      text: 'Sir, this is a laptop, not a moon landing. Millions of people click “skip” every day — maybe ask an intern.',
      reveal: { detail: 'Illustrative, written for this talk — not an archived note' },
    },
    {
      id: 'B',
      text: 'It is still possible to set up the latest version of Windows without a Microsoft account.',
      reveal: { detail: 'Real Community Note, Feb 2024. Musk called it “failing”; it held up anyway.' },
    },
  ],
};

function InfluenceGroup({ tone, label, force, strength, figures }) {
  return (
    <div className={`influence-group influence-group-${tone}`}>
      <div className="influence-group-label">
        <span className="influence-group-name">{label}</span>
        <span className="influence-group-force" aria-label={`Force: ${force} out of 10`}>
          <span className="influence-force-meter" aria-hidden="true">
            {dotRange(10).map((level) => <i className={level < strength ? 'is-active' : ''} key={level} />)}
          </span>
          <span>FORCE</span>
          <span>{force} OUT OF 10</span>
        </span>
      </div>
      <div className="influence-group-figures">
        {figures.map((mark, index) => (
          <div className={`influence-figure influence-${tone}`} key={index}>
            <Person tone={tone} />
            <span className={`influence-mark influence-mark-${mark === '✓' ? 'positive' : 'negative'}`}>{mark}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfluenceRow() {
  return (
    <div className="influence-row" aria-label="A hyperactive minority outweighs a quiet, positive majority">
      <InfluenceGroup tone="coral" label="AMIGO" force={2} strength={2} figures={['✓', '✓']} />
      <InfluenceGroup tone="blue" label="NORMAL" force={5} strength={5} figures={['✓', '✓', '✓', '✓', '✓']} />
      <InfluenceGroup tone="amber" label="STRONG VOTER" force={8} strength={8} figures={['×', '×']} />
    </div>
  );
}

function ApprovalPuzzleSlide({ number, step }) {
  return (
    <SlideFrame number={number} eyebrow="THE PUZZLE" title="95.1% said helpful. X still did not display it.">
      <div className="puzzle-layout">
        <PostCard
          post={rawChickenPost}
          note={<>Raw chicken does not need to be washed before cooking. Washing poultry can spread bacterial contamination around the kitchen.<br />CDC · USDA</>}
        />
        <div className="puzzle-results">
          <Reveal show={step >= 1} className="approval-number">
            <strong>95.1%</strong>
            <span>overall approval</span>
            <b className="status-pill">Status: NOT SHOWN</b>
          </Reveal>
          <Reveal show={step >= 2} className="puzzle-takeaway"><strong>High approval was not enough.</strong></Reveal>
        </div>
      </div>
    </SlideFrame>
  );
}

function HandshakeDiagram({ compact = false }) {
  return (
    <div className={`handshake-diagram ${compact ? 'handshake-compact' : ''}`}>
      <Person tone="blue" /><CheckMark /><div className="handshake-note"><NoteGlyph /></div><CheckMark /><Person tone="coral" />
    </div>
  );
}

const DOMINANCE_SPARSE = [
  [24, 18], [64, 18], [104, 18], [144, 18],
  [24, 58], [144, 58],
  [24, 100], [144, 100],
  [24, 142], [144, 142],
  [24, 182], [64, 182], [104, 182], [144, 182],
];
const DOMINANCE_HEAVY = [[64, 58], [104, 100], [64, 142]];
const DOMINANCE_ESTIMATE = [280, 100];

function DominanceDiagram() {
  return (
    <svg className="dominance-graph" viewBox="0 0 320 220" aria-label="A few raters supply most of the model's observations">
      <g className="dominance-edges-sparse">
        {DOMINANCE_SPARSE.map(([x, y], index) => (
          <line key={`sparse-${index}`} x1={x} y1={y} x2={DOMINANCE_ESTIMATE[0]} y2={DOMINANCE_ESTIMATE[1]} />
        ))}
      </g>
      <g className="dominance-edges-heavy">
        {DOMINANCE_HEAVY.map(([x, y], index) => (
          <line key={`heavy-${index}`} x1={x} y1={y} x2={DOMINANCE_ESTIMATE[0]} y2={DOMINANCE_ESTIMATE[1]} />
        ))}
      </g>
      <g className="dominance-nodes-sparse">
        {DOMINANCE_SPARSE.map(([x, y], index) => <circle key={`sparse-node-${index}`} cx={x} cy={y} r="5" />)}
      </g>
      <g className="dominance-nodes-heavy">
        {DOMINANCE_HEAVY.map(([x, y], index) => <circle key={`heavy-node-${index}`} cx={x} cy={y} r="7.5" />)}
      </g>
      <circle className="dominance-estimate" cx={DOMINANCE_ESTIMATE[0]} cy={DOMINANCE_ESTIMATE[1]} r="9" />
    </svg>
  );
}

function AgreementSlide({ number }) {
  return (
    <SlideFrame number={number} eyebrow="HOW X WORKS" title="X already looks for unlikely agreement.">
      <div className="agreement-layout">
        <div className="agreement-grid">
          <section><span className="agreement-label agreement-coral">AMIGO</span><div className="support-visual"><Person tone="coral" /><CheckMark /><div className="support-note support-note-coral"><Person tone="coral" /></div></div><strong className="agreement-coral">Predictable support</strong></section>
          <section><span className="agreement-label agreement-amber">HYPERACTIVE MINORITY</span><DominanceDiagram /><strong className="agreement-amber">A few raters set the axis</strong></section>
        </div>
        <strong className="agreement-bottom">Even a high, correct-looking vote can stall — the system is scoring rater quality and intent, not counting the vote itself.</strong>
      </div>
    </SlideFrame>
  );
}

function GapSlide({ number, step }) {
  return (
    <SlideFrame number={number} eyebrow="THE ANSWER" title="A hyperactive minority held the note back.">
      <div className="puzzle-layout puzzle-layout-dominance">
        <PostCard
          post={rawChickenPost}
          note={<>Raw chicken does not need to be washed before cooking. Washing poultry can spread bacterial contamination around the kitchen.<br />CDC · USDA</>}
        />
        <div className="puzzle-results">
          <Reveal show={step >= 1} className="approval-block">
            <InfluenceRow />
            <div className="approval-number">
              <strong>95.1%</strong>
              <span>overall approval</span>
              <b className="status-pill">Status: NOT SHOWN</b>
            </div>
          </Reveal>
          <Reveal show={step >= 2} className="puzzle-takeaway"><strong>A few raters decided — not the room.</strong></Reveal>
        </div>
      </div>
    </SlideFrame>
  );
}

function RatingsMatrix() {
  const values = ['✓','×','','✓','×','','×','','✓','×','','✓','','✓','×','','✓','×','✓','×','','✓','×','','×','','✓','×','','✓','','✓','×','','✓','×'];
  return <div className="ratings-matrix">{values.map((value, index) => <span className={value === '✓' ? 'rating-yes' : value === '×' ? 'rating-no' : ''} key={index}>{value}</span>)}</div>;
}

function CoRatingGraph() {
  return (
    <svg className="co-rating-graph" viewBox="0 0 300 220" aria-label="Co-rating graph">
      <g className="graph-edges"><line x1="52" y1="48" x2="145" y2="25" /><line x1="52" y1="48" x2="68" y2="176" /><line x1="52" y1="48" x2="178" y2="150" /><line x1="145" y1="25" x2="68" y2="176" /><line x1="145" y1="25" x2="235" y2="82" /><line x1="145" y1="25" x2="178" y2="150" /><line x1="68" y1="176" x2="178" y2="150" /><line x1="178" y1="150" x2="235" y2="82" /><line x1="235" y1="82" x2="267" y2="197" /></g>
      <g className="graph-nodes"><circle className="node-blue" cx="52" cy="48" r="17" /><circle className="node-blue" cx="145" cy="25" r="17" /><circle className="node-blue" cx="235" cy="82" r="17" /><circle className="node-coral" cx="68" cy="176" r="17" /><circle className="node-coral" cx="178" cy="150" r="17" /><circle className="node-coral" cx="267" cy="197" r="17" /></g>
    </svg>
  );
}

function CountryFlag({ country }) {
  return (
    <svg className="cca-country-flag" viewBox="0 0 48 32" aria-hidden="true">
      {country === 'switzerland' && <><rect x="8" width="32" height="32" fill="#da291c" /><path d="M21 6h6v7h7v6h-7v7h-6v-7h-7v-6h7z" fill="#fff" /></>}
      {country === 'belgium' && <><rect width="16" height="32" fill="#111" /><rect x="16" width="16" height="32" fill="#fdda24" /><rect x="32" width="16" height="32" fill="#ef3340" /></>}
      {country === 'bosnia' && <><rect width="48" height="32" fill="#002395" /><path d="M16 0h24v32z" fill="#fecb00" />{[[12, 3], [16, 8], [20, 13], [24, 18], [28, 23], [32, 28]].map(([x, y]) => <circle cx={x} cy={y} r="1.8" fill="#fff" key={x} />)}</>}
      {country === 'northern-ireland' && <><rect width="48" height="32" fill="#012169" /><path d="M0 0l48 32M48 0L0 32" stroke="#fff" strokeWidth="8" /><path d="M0 0l48 32M48 0L0 32" stroke="#c8102e" strokeWidth="3.5" /><path d="M24 0v32M0 16h48" stroke="#fff" strokeWidth="11" /><path d="M24 0v32M0 16h48" stroke="#c8102e" strokeWidth="5" /></>}
    </svg>
  );
}

function CcaProposalSlide({ number }) {
  return (
    <SlideFrame number={number} eyebrow="OUR PROPOSAL" title="What do we propose? CCA.">
      <div className="cca-proposal-layout">
        <div className="cca-proposal-name">
          <strong>CCA</strong>
          <span>Cross-Constituency<br />Aggregation</span>
        </div>
        <div className="cca-inspiration">
          <strong>INSPIRED BY DECISIONS THAT NEED SUPPORT ACROSS GROUPS</strong>
          <div className="cca-country-grid">
            <div><CountryFlag country="switzerland" /><b>SWITZERLAND</b><span>People + cantons</span></div>
            <div><CountryFlag country="belgium" /><b>BELGIUM</b><span>Linguistic groups</span></div>
            <div><CountryFlag country="bosnia" /><b>BOSNIA</b><span>Constituent peoples</span></div>
            <div><CountryFlag country="northern-ireland" /><b>N. IRELAND</b><span>Parallel consent</span></div>
          </div>
          <p>We look for a middle ground that every group can accept.</p>
        </div>
        <div className="cca-commitments">
          <div className="cca-commitment cca-commitment-limit"><span>WHAT WE DO NOT PROMISE</span><strong>A drop-in replacement for X’s full algorithm.</strong></div>
          <div className="cca-commitment cca-commitment-built"><span>WHAT WE BUILT</span><strong>A working implementation on real ratings.</strong></div>
        </div>
      </div>
    </SlideFrame>
  );
}

function ConstituenciesSlide({ number }) {
  return (
    <SlideFrame number={number} eyebrow="OUR APPROACH" title="We recover constituencies from voting behavior.">
      <div className="clustering-flow">
        <section><strong>RATINGS</strong><RatingsMatrix /></section><FlowArrow />
        <section><strong>CO-RATING GRAPH</strong><CoRatingGraph /></section><FlowArrow />
        <section className="cluster-result">
          <strong>SPECTRAL CLUSTERING</strong>
          <div className="cluster-dots">
            <div className="cluster-dot-group"><b>107,734 raters</b><DotGrid tone="blue" count={16} columns={4} /></div>
            <div className="cluster-dot-group"><b>92,266 raters</b><DotGrid tone="coral" count={16} columns={4} /></div>
          </div>
        </section>
      </div>
      <div className="metrics-strip"><strong>100,000 notes</strong><strong>200,000 raters</strong></div>
      <strong className="behavior-note">Behavior—not demographics or declared ideology.</strong>
    </SlideFrame>
  );
}

function TopicSignaturesSlide({ number, backup }) {
  return (
    <SlideFrame number={number} eyebrow={`${backup ? 'BACKUP · ' : ''}CHECKING THE CLUSTERS`} title="Which cluster agrees more depends on the topic.">
      <div className="topic-evidence-layout">
        <div className="topic-evidence-main">
          <figure className="topic-evidence-figure">
            <img src={`${base}media/cn-topic-signatures.png`} alt="Average note approval by topic: the higher-approval cluster changes across the 13 topics; bubble size represents note count." />
          </figure>
          <div className="topic-evidence-point">
            <span>THE PATTERN</span>
            <strong>Not one strict cluster and one lenient cluster.</strong>
            <p>The higher-approval cluster changes with the topic.</p>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

function CampApprovalSlide({ number }) {
  return (
    <SlideFrame number={number} eyebrow="CCA" title="Each cluster gets its own approval rate.">
      <div className="camp-approval-layout">
        <div className="camp-side camp-side-blue"><strong className="camp-size">107,734 raters</strong><DotGrid tone="blue" count={32} columns={8} /><span>CLUSTER A: pA</span></div>
        <FlowArrow tone="blue" />
        <div className="camp-example-center">
          <div className="camp-approval-header">
            <span>GEOMETRIC MEAN</span>
            <strong>C<sub>i</sub> = √(p<sub>A</sub> × p<sub>B</sub>)</strong>
            <p>(the balance point both clusters can accept on this note)</p>
          </div>
          <PostCard post={muskWindowsExample.post} className="camp-example-post" />
        </div>
        <FlowArrow tone="coral" className="camp-arrow-inward" />
        <div className="camp-side camp-side-coral"><strong className="camp-size">92,266 raters</strong><DotGrid tone="coral" count={32} columns={8} /><span>CLUSTER B: pB</span></div>
      </div>
    </SlideFrame>
  );
}

function CandidateCommunityNote({ candidate, show, tone }) {
  return (
    <Reveal show={show} className={`veto-note veto-note-${tone}`}>
      <div className="post-note-head">
        <span className="post-note-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-4.8 7.6 8.5 8.5 0 0 1-3.7.9 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg></span>
        <strong>Community Note</strong><span className="veto-note-letter">{candidate.id}</span>
      </div>
      <p>{candidate.text}</p>
    </Reveal>
  );
}

function SoftVetoSlide({ number, step }) {
  const oneSidedNote = muskWindowsExample.candidates.find((candidate) => candidate.id === 'A');
  const balancedNote = muskWindowsExample.candidates.find((candidate) => candidate.id === 'B');
  return (
    <SlideFrame number={number} eyebrow="CCA" title="Enthusiasm cannot buy consent.">
      <div className="soft-veto-layout">
        <div className="soft-veto-tweet-shell">
          <PostCard post={muskWindowsExample.post} className="soft-veto-post" />
        </div>
        <div className="soft-veto-explainer">
          <span>GEOMETRIC MEAN</span>
          <strong>C<sub>i</sub> = √(p<sub>A</sub> × p<sub>B</sub>)</strong>
          <p>Multiply approvals; take square root.</p>
        </div>
        {/* Each note sits in the same grid row as the result it leads to
            (DOM order = row order below), so the connecting arrow always
            lands on the right box regardless of how tall the card or the
            note text is -- they used to drift apart independently. */}
        <CandidateCommunityNote candidate={oneSidedNote} show={step >= 1} tone="fail" />
        <Reveal show={step >= 1} className="veto-result veto-result-fail">
          <span>IF APPROVAL IS ONE-SIDED</span>
          <div className="veto-result-columns">
            <div className="veto-result-col"><strong>√(84% × 22%) ≈ 0.43</strong><b>FAIL · below 0.5</b></div>
            <div className="veto-result-col veto-result-alt"><strong>(84% + 22%) / 2 = 0.53</strong><b>plain average pass</b></div>
          </div>
        </Reveal>
        <CandidateCommunityNote candidate={balancedNote} show={step >= 2} tone="pass" />
        <Reveal show={step >= 2} className="veto-result veto-result-pass">
          <span>IF BOTH CLUSTERS APPROVE</span>
          <div className="veto-result-columns">
            <div className="veto-result-col"><strong>√(70% × 68%) ≈ 0.69</strong><b>PASS · above 0.5</b></div>
            <div className="veto-result-col veto-result-alt"><strong>(70% + 68%) / 2 = 0.69</strong><b>plain average agrees here</b></div>
          </div>
        </Reveal>
      </div>
    </SlideFrame>
  );
}

function VisibilityResultsSlide({ number, backup, step }) {
  return (
    <SlideFrame number={number} eyebrow={`${backup ? 'BACKUP · ' : ''}RESULTS`} title="A different rule changes who is heard.">
      <div className="results-flow">
        <div className="results-line">
          <Reveal show={step >= 0} className="result-root"><strong>44,722</strong><span>posts</span></Reveal>
          <Reveal show={step >= 1} className="result-flow-arrow"><FlowArrow tone="ink" /></Reveal>
          <Reveal show={step >= 1} className="result-box result-cca"><span>CCA QUALIFIES</span><strong>20,405</strong><b>46%</b></Reveal>
          <Reveal show={step >= 2} className="result-flow-arrow"><FlowArrow tone="green" /></Reveal>
          <Reveal show={step >= 2} className="rescue-pool"><span>RESCUE POOL</span><strong>13,655</strong><b>not displayed by X<br />but CCA-qualified</b></Reveal>
        </div>
        <Reveal show={step >= 3} className="result-overlap-note">
          <strong>6,750 already displayed by X</strong>
          <span>X displays 6,832 in total; 82 do not meet CCA requirements.</span>
        </Reveal>
      </div>
    </SlideFrame>
  );
}

function RescuePipelineSlide({ number, step }) {
  return (
    <SlideFrame number={number} eyebrow="RESULTS" title="A different rule changes who is heard.">
      <div className="pipeline-flow">
        <div className="pipeline-line">
          <div className="result-root"><strong>44,722</strong><span>posts</span></div>
          <Reveal show={step >= 1} className="result-flow-arrow"><FlowArrow tone="green" /></Reveal>
          <Reveal show={step >= 1} className="rescue-pool"><span>RESCUE POOL</span><strong>13,655</strong><b>not displayed by X<br />but CCA-qualified</b></Reveal>
          <Reveal show={step >= 2} className="result-flow-arrow"><FlowArrow tone="green" /></Reveal>
          <Reveal show={step >= 2} className="pipeline-review">
            <div className="review-card review-card-compact">
              <span className="review-ai-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 2 2.1 6.1L20 10l-5.9 1.9L12 18l-2.1-6.1L4 10l5.9-1.9L12 2Z" />
                  <path d="m19 17 .7 1.3L21 19l-1.3.7L19 21l-.7-1.3L17 19l1.3-.7L19 17Z" />
                </svg>
              </span>
              <strong>AI TEXT REVIEW</strong>
              <b>Checks sourcing + quality</b>
            </div>
            <div className="review-number review-success"><strong>8,558</strong><span>held up · 62.7%</span></div>
          </Reveal>
        </div>
      </div>
    </SlideFrame>
  );
}

function TextReviewSlide({ number, backup, step }) {
  return (
    <SlideFrame number={number} eyebrow={`${backup ? 'BACKUP · ' : ''}VALIDATION`} title="An AI judge read all 13,655 candidate notes.">
      <div className="review-flow">
        <div className="review-number"><strong>13,655</strong><span>candidate notes</span></div><FlowArrow />
        <div className="review-center">
          <div className="review-card">
            <span className="review-ai-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 2 2.1 6.1L20 10l-5.9 1.9L12 18l-2.1-6.1L4 10l5.9-1.9L12 2Z" />
                <path d="m19 17 .7 1.3L21 19l-1.3.7L19 21l-.7-1.3L17 19l1.3-.7L19 17Z" />
              </svg>
            </span>
            <strong>AI TEXT REVIEW</strong>
            <b>Checks sourcing + quality</b>
          </div>
          <div className="review-method">
            <span>Gemma 4 31B IT · zero-shot rubric · score ≥ 50</span>
            <span>BF16 · 2× NVIDIA L40S · vLLM 0.25.0</span>
            <small>Note text only · No URL opening or source-content verification</small>
          </div>
        </div><FlowArrow tone="green" />
        <div className="review-results">
          <div className="review-number review-success"><strong>8,558</strong><span>held up · 62.7%</span></div>
          <Reveal show={step >= 1} className="review-breakdown">
            <span className="review-breakdown-label">OTHER OUTCOMES</span>
            <div className="review-outcome-list">
              <div className="review-outcome review-outcome-screen"><strong>3,279</strong><div><b>Not suitable as sourced context</b><small>Screened out before quality scoring</small></div></div>
              <div className="review-outcome review-outcome-quality"><strong>1,818</strong><div><b>AI-rated quality below the bar</b><small>Rubric score under 50</small></div></div>
            </div>
            <span className="review-breakdown-label review-first-pass-label">FIRST PASS · ALL 13,655 NOTES</span>
            <ul className="review-label-list">
              <li className="review-label-sourced"><b>10,096</b><span>with a visible source</span></li>
              <li className="review-label-opinion"><b>1,703</b><span>opinion / speculation</span></li>
              <li className="review-label-irrelevant"><b>1,340</b><span>irrelevant / spam</span></li>
              <li className="review-label-unsourced"><b>373</b><span>unsourced</span></li>
              <li className="review-label-hostile"><b>142</b><span>hostile</span></li>
              <li className="review-label-unresolved"><b>1</b><span>unresolved</span></li>
            </ul>
          </Reveal>
        </div>
      </div>
    </SlideFrame>
  );
}

function BattleNote({ tone, label, approval, score, children }) {
  return (
    <div className={`battle-note battle-note-${tone}`}>
      <div className="post-note-head">
        <span className="post-note-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-4.8 7.6 8.5 8.5 0 0 1-3.7.9 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg></span>
        <strong>Community Note</strong>
      </div>
      <p>{children}</p>
      <div className="battle-note-stats"><span>{label}</span><strong>{approval} <small>overall approval</small></strong><b>CCA {score}</b></div>
    </div>
  );
}

// Post text/date: X oEmbed. Media, current avatar, and engagement snapshot (2026-09-26): FxTwitter mirror.
// The paired note decisions and scores come from the research paper and selection_log.parquet.
const yarmoukPost = {
  author: 'Jvnior', handle: '@Jvnior', verified: true,
  avatarImage: `${base}media/yarmouk-jvnior-avatar.jpg`,
  sourceUrl: 'https://x.com/Jvnior/status/1987985480952975416',
  text: '3,000 Muslims defeated 200,000 Romans.\n\nIt can easily happen again.',
  engagement: { replies: '3,895', reposts: '1,560', likes: '15,571', views: '2,976,459' },
  image: `${base}media/yarmouk-jvnior-post.jpg`,
  imageAlt: 'Image attached to the original post: a small formation facing a much larger army in a desert.',
  zoomable: false,
  meta: 'Nov 10, 2025',
};

function YarmoukSlide({ number, step, backup }) {
  return (
    <SlideFrame number={number} eyebrow={`${backup ? 'BACKUP · ' : ''}CASE: YARMOUK / MU’TAH`} title="3,000 soldiers. But which battle?">
      <div className="battle-layout">
        <PostCard post={yarmoukPost} className="battle-post" />
        <div className="battle-notes">
          <BattleNote tone="coral" label="X DISPLAYED" approval="92.2%" score="0.774">The Battle of Mu’tah was fought between the Byzantine Empire and the First Islamic State. The true size of the armies is considered to be around 10,000 for the Byzantines and 3000 for the Muslims. It ended with a Byzantine victory.</BattleNote>
          <Reveal show={step >= 1}><BattleNote tone="green" label="CCA ALTERNATIVE" approval="91.2%" score="0.837">The post refers to the Battle of Yarmouk (636 AD), but reliable estimates put Muslim forces at 15,000–40,000, not 3,000, vs. 15,000–150,000 Byzantines. 3,000 Muslims fought at the earlier Battle of Mu’tah (629 AD).</BattleNote></Reveal>
          <Reveal show={step >= 1} className="battle-takeaway"><strong>Less raw approval. More balanced support.</strong></Reveal>
        </div>
      </div>
    </SlideFrame>
  );
}

function ClosingSlide({ number }) {
  return (
    <article className="native-slide closing-slide">
      <span className="closing-number">{String(number).padStart(2, '0')}</span>
      <div className="closing-content">
        <span>Cross-Constituency Aggregation for Community Notes</span>
        <h1>Any questions?</h1>
        <p>Emrecan Ulu · Jingyao Shi</p>
        <div className="closing-contact">
          <div className="closing-emails">
            <span>Emrecan · <a href="mailto:emrecanulu@outlook.com">emrecanulu@outlook.com</a></span>
            <span>Jingyao · xxxx@xxx.com</span>
          </div>
          <a href="https://github.com/vulonviing/cross-constituency-aggregation-community-notes" target="_blank" rel="noopener noreferrer">
            github.com/vulonviing/cross-constituency-aggregation-community-notes
          </a>
        </div>
      </div>
    </article>
  );
}

const nativeSlideComponents = {
  'community-notes': DecisionFlowSlide,
  'goldfish-example': GoldfishExampleSlide,
  'approval-puzzle': ApprovalPuzzleSlide,
  'unlikely-agreement': AgreementSlide,
  'implicit-electorate': GapSlide,
  'cca-proposal': CcaProposalSlide,
  constituencies: ConstituenciesSlide,
  'topic-signatures': TopicSignaturesSlide,
  'camp-approval': CampApprovalSlide,
  'soft-veto': SoftVetoSlide,
  'rescue-pipeline': RescuePipelineSlide,
  'visibility-results': VisibilityResultsSlide,
  'text-review': TextReviewSlide,
  yarmouk: YarmoukSlide,
  closing: ClosingSlide,
};

export function NativeSlide({
  slideKey, number, step, backup, audienceUrl,
}) {
  const Component = nativeSlideComponents[slideKey];
  return Component ? <Component number={number} step={step} backup={backup} audienceUrl={audienceUrl} /> : null;
}
