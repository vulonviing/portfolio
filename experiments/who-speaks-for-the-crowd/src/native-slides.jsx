const dotRange = (count) => Array.from({ length: count }, (_, index) => index);

function Reveal({ show, className = '', children }) {
  return <div className={`native-reveal ${show ? 'native-reveal-visible' : ''} ${className}`}>{children}</div>;
}

function SlideFrame({ number, eyebrow, title, footer = 'Ulu & Shi · Cross-Constituency Aggregation', className = '', children }) {
  return (
    <article className={`native-slide ${className}`}>
      <header className="native-header">
        <span>{eyebrow}</span>
        <span>{String(number).padStart(2, '0')}</span>
      </header>
      <h1 className="native-title">{title}</h1>
      <div className="native-canvas">{children}</div>
      {footer && <footer className="native-footer">{footer}</footer>}
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

function DecisionFlowSlide({ number }) {
  return (
    <SlideFrame number={number} eyebrow="WHAT IS COMMUNITY NOTES?" title="One note. One decision.">
      <div className="decision-flow">
        <div className="decision-card"><span>POST</span><strong>Someone posts<br />a claim.</strong></div>
        <FlowArrow />
        <div className="decision-card"><span>CANDIDATE NOTE</span><strong>A contributor<br />adds context.</strong></div>
        <FlowArrow />
        <div className="decision-card"><span>HELPFUL?</span><div className="decision-votes"><b>✓</b><b>−</b></div></div>
        <FlowArrow />
        <div className="decision-card"><span>VISIBILITY</span><strong className="decision-show">SHOW</strong><strong className="decision-nmr">or NMR</strong></div>
      </div>
      <div className="decision-summary"><strong>Congratulations. You are now the algorithm.</strong><span>The ratings become one visibility decision.</span></div>
    </SlideFrame>
  );
}

function ContextNote({ children }) {
  return (
    <div className="context-note">
      <div className="context-note-head"><span className="context-note-icon" aria-hidden="true">♣</span><strong>Readers added context</strong></div>
      <p>{children}</p>
    </div>
  );
}

function ApprovalPuzzleSlide({ number, step }) {
  return (
    <SlideFrame number={number} eyebrow="THE PUZZLE" title="95.1% said helpful. X still did not display it." footer="Raw-chicken case · paper/main.tex">
      <div className="puzzle-layout">
        <ContextNote>
          Raw chicken does not need to be washed<br />before cooking. Washing poultry can spread<br />bacterial contamination around the kitchen.<br />CDC · USDA
        </ContextNote>
        <div className="puzzle-results">
          <Reveal show={step >= 1} className="approval-number"><strong>95.1%</strong><span>overall approval</span></Reveal>
          <Reveal show={step >= 2} className="nmr-status"><span>X STATUS</span><strong>NEEDS MORE RATINGS</strong></Reveal>
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

function AgreementSlide({ number }) {
  return (
    <SlideFrame number={number} eyebrow="HOW X WORKS" title="X already looks for unlikely agreement.">
      <div className="agreement-grid">
        <section><span className="agreement-label agreement-coral">AMIGO</span><div className="support-visual"><Person tone="coral" /><CheckMark /><div className="support-note support-note-coral"><Person tone="coral" /></div></div><strong className="agreement-coral">Predictable support</strong></section>
        <section><span className="agreement-label agreement-green">ENEMIES SHAKE HANDS</span><HandshakeDiagram /><strong className="agreement-green">Unexpected agreement</strong></section>
      </div>
      <strong className="agreement-bottom">The system reads the rater—not only the rating.</strong>
    </SlideFrame>
  );
}

function GapSlide({ number, step }) {
  return (
    <SlideFrame number={number} eyebrow="THE GAP" title="The handshake is right. The electorate is not.">
      <div className="gap-layout">
        <div className="gap-instinct"><HandshakeDiagram compact /><strong>Good instinct</strong></div>
        <div className="gap-divider" />
        <div className="gap-points">
          <Reveal show={step >= 1} className="gap-point"><i className="bullet-blue" /><span>One learned map</span></Reveal>
          <Reveal show={step >= 2} className="gap-point"><i className="bullet-coral" /><span>One fitted visibility score</span></Reveal>
          <Reveal show={step >= 3} className="gap-point gap-point-strong"><i className="bullet-amber" /><span>Representation stays implicit</span></Reveal>
          <Reveal show={step >= 3} className="gap-callout"><strong>CCA makes constituencies explicit.</strong></Reveal>
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

function ConstituenciesSlide({ number }) {
  return (
    <SlideFrame number={number} eyebrow="OUR APPROACH" title="We recover constituencies from voting behavior.">
      <div className="clustering-flow">
        <section><strong>RATINGS</strong><RatingsMatrix /></section><FlowArrow />
        <section><strong>CO-RATING GRAPH</strong><CoRatingGraph /></section><FlowArrow />
        <section className="cluster-result"><strong>SPECTRAL CLUSTERING</strong><div className="cluster-dots"><DotGrid tone="blue" count={15} columns={5} /><DotGrid tone="amber" count={3} columns={2} /><DotGrid tone="coral" count={18} columns={6} /></div><b>k = 3</b></section>
      </div>
      <div className="metrics-strip"><strong>100,000 notes</strong><strong>200,000 raters</strong><strong>107,734 / 92,266</strong></div>
      <strong className="behavior-note">Behavior—not demographics or declared ideology.</strong>
    </SlideFrame>
  );
}

function CampApprovalSlide({ number }) {
  return (
    <SlideFrame number={number} eyebrow="CCA" title="Each camp gets its own approval rate.">
      <div className="camp-approval-layout">
        <div className="camp-side camp-side-blue"><DotGrid tone="blue" count={32} columns={8} /><span>Camp A: pA</span></div>
        <FlowArrow tone="blue" />
        <NoteGlyph className="camp-note" />
        <FlowArrow tone="coral" />
        <div className="camp-side camp-side-coral"><DotGrid tone="coral" count={32} columns={8} /><span>Camp B: pB</span></div>
      </div>
      <div className="coverage-floor">Coverage floor: ≥3 raters from every camp</div>
    </SlideFrame>
  );
}

function SoftVetoSlide({ number, step }) {
  return (
    <SlideFrame number={number} eyebrow="CCA" title="Enthusiasm cannot buy consent.">
      <div className="formula">C<sub>i</sub> = √(pA × pB)</div>
      <div className="veto-examples">
        <Reveal show={step >= 1} className="veto-card veto-pass"><span>BOTH ACCEPT</span><strong>70% × 68%</strong><b>0.69 → PASS</b></Reveal>
        <Reveal show={step >= 2} className="veto-card veto-fail"><span>ONE-SIDED</span><strong>90% × 20%</strong><b>0.42 → FAIL</b></Reveal>
      </div>
      <Reveal show={step >= 2} className="soft-veto-label"><strong>Soft veto · C<sub>i</sub> &gt; 0.5</strong></Reveal>
    </SlideFrame>
  );
}

function VisibilityResultsSlide({ number, step }) {
  return (
    <SlideFrame number={number} eyebrow="RESULTS" title="A different rule changes who is heard.">
      <div className="results-tree">
        <Reveal show={step >= 0} className="result-root"><strong>44,722</strong><span>posts</span></Reveal>
        <div className="result-branches" aria-hidden="true"><span /><span /></div>
        <Reveal show={step >= 1} className="result-box result-x"><span>X DISPLAYS</span><strong>6,832</strong><b>15%</b></Reveal>
        <Reveal show={step >= 2} className="result-box result-cca"><span>CCA QUALIFIES</span><strong>20,405</strong><b>46%</b></Reveal>
        <Reveal show={step >= 3} className="rescue-arrow"><FlowArrow tone="green" /></Reveal>
        <Reveal show={step >= 3} className="rescue-pool"><span>RESCUE POOL</span><strong>13,655</strong><b>not displayed by X<br />but CCA-qualified</b></Reveal>
      </div>
      <Reveal show={step >= 3} className="results-takeaway"><strong>Different rule. Different visibility decisions.</strong></Reveal>
    </SlideFrame>
  );
}

function TextReviewSlide({ number }) {
  return (
    <SlideFrame number={number} eyebrow="VALIDATION" title="8,558 held up under independent text review.">
      <div className="review-flow">
        <div className="review-number"><strong>13,655</strong><span>candidates</span></div><FlowArrow />
        <div className="review-card"><span>GEMMA</span><strong>TEXT REVIEW</strong><b>source + quality</b></div><FlowArrow tone="green" />
        <div className="review-number review-success"><strong>8,558</strong><span>62.7%</span></div>
      </div>
      <div className="review-caveat"><strong>Note text + visible source pointer only</strong><span>No URL opening · No source-content verification</span></div>
    </SlideFrame>
  );
}

function BattleCard({ tone, label, approval, verb, battle, children }) {
  return (
    <div className={`battle-card battle-card-${tone}`}>
      <span>{label}</span><div className="battle-approval"><strong>{approval}</strong><small>overall approval</small></div><hr />
      <b>{verb}</b><h2>{battle}</h2><p>{children}</p>
    </div>
  );
}

function YarmoukSlide({ number, step }) {
  return (
    <SlideFrame number={number} eyebrow="CASE: YARMOUK / MU’TAH" title="High approval. Wrong battle.">
      <div className="battle-grid">
        <BattleCard tone="coral" label="PLATFORM-SHOWN NOTE" approval="92.2%" verb="DESCRIBES" battle="THE BATTLE OF MU’TAH">High raw approval.<br />Lower cross-constituency support.</BattleCard>
        <Reveal show={step >= 1}><BattleCard tone="green" label="CCA ALTERNATIVE" approval="91.2%" verb="ADDRESSES" battle="THE BATTLE OF YARMOUK">Slightly lower raw approval.<br />Higher cross-constituency support.</BattleCard></Reveal>
      </div>
      <Reveal show={step >= 1} className="battle-takeaway"><strong>Lower popularity. Better-balanced support.</strong></Reveal>
    </SlideFrame>
  );
}

function ClosingSlide({ number }) {
  return (
    <article className="native-slide closing-slide">
      <span className="closing-number">{String(number).padStart(2, '0')}</span>
      <div className="closing-copy"><h1>THE CROWD IS<br />NOT ONE NUMBER.</h1><p>Every aggregation rule decides who gets heard.</p><strong>Cross-Constituency Aggregation for Community Notes</strong></div>
      <div className="closing-network"><DotGrid tone="blue" count={25} columns={5} /><div className="closing-lines closing-lines-blue" aria-hidden="true" /><NoteGlyph /><div className="closing-lines closing-lines-coral" aria-hidden="true" /><DotGrid tone="coral" count={25} columns={5} /></div>
    </article>
  );
}

const nativeSlideComponents = {
  'community-notes': DecisionFlowSlide,
  'approval-puzzle': ApprovalPuzzleSlide,
  'unlikely-agreement': AgreementSlide,
  'implicit-electorate': GapSlide,
  constituencies: ConstituenciesSlide,
  'camp-approval': CampApprovalSlide,
  'soft-veto': SoftVetoSlide,
  'visibility-results': VisibilityResultsSlide,
  'text-review': TextReviewSlide,
  yarmouk: YarmoukSlide,
  closing: ClosingSlide,
};

export function NativeSlide({ slideKey, number, step }) {
  const Component = nativeSlideComponents[slideKey];
  return Component ? <Component number={number} step={step} /> : null;
}
