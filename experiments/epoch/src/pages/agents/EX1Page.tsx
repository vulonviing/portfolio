/**
 * EX1Page — "External Perspective (Stage 1)" detail screen.
 *
 * EX1 runs once, immediately before the Stage-1 human gate (R2 for the
 * tabular pipeline, the RC1.2/RM1.2/RD3 mapping gate for UC4). It reads the
 * exact payload the human is about to review and produces a short,
 * source-grounded commentary restricted to a fixed list of official
 * institutions. Advisory only — see ExternalCommentaryView.
 */
import ExternalCommentaryView from "../../components/external/ExternalCommentaryView";

export default function EX1Page() {
  return (
    <ExternalCommentaryView
      agentKey="ex1"
      agentLabel="EX1"
      title="External Perspective (Stage 1)"
      description="An independent, source-grounded read of the scope or mapping decision about to reach the Stage-1 human gate, drawn only from a fixed list of official institutions. It does not decide anything and cannot change the approved boundary — it exists to give the reviewer one more perspective before they approve or reject."
    />
  );
}
