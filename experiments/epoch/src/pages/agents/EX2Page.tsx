/**
 * EX2Page — "External Perspective (Stage 2)" detail screen.
 *
 * EX2 runs once, immediately before the Stage-2 human gate (F1 for the
 * tabular pipeline, F2 for UC4). It reads the exact finished-deliverable
 * payload the human is about to review and produces a short, source-grounded
 * commentary restricted to a fixed list of official institutions. Advisory
 * only — see ExternalCommentaryView.
 */
import ExternalCommentaryView from "../../components/external/ExternalCommentaryView";

export default function EX2Page() {
  return (
    <ExternalCommentaryView
      agentKey="ex2"
      agentLabel="EX2"
      title="External Perspective (Stage 2)"
      description="An independent, source-grounded read of the finished deliverable about to reach the Stage-2 human gate, drawn only from a fixed list of official institutions. It does not re-derive the analysis and cannot change what is about to be approved — it exists to give the reviewer one more perspective before final sign-off."
    />
  );
}
