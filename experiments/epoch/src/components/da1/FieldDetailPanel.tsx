/**
 * FieldDetailPanel — right-most detail drawer for the selected field.
 * Shows: priority badge, LLM reason, resolved binding, DA1 recommendation,
 * and alternative targets.
 */
import type { CatalogTarget, FieldMapping } from "../../api/types";

interface Props {
  field: FieldMapping | null;
  /** The currently-assigned catalog target for this field */
  assignedTarget: CatalogTarget | null;
  decision?: string;
  reviewedAt?: string;
  /** Called when the user picks an alternative target or restores the recommended */
  onPickAlternative?: (target: CatalogTarget) => void;
  readOnly?: boolean;
}

const PRIORITY_STYLES: Record<string, string> = {
  core:     "bg-teal/15 text-teal border-teal/40",
  related:  "bg-gray-700/60 text-gray-300 border-gray-600",
  optional: "bg-gray-800 text-gray-500 border-gray-700",
};

const BINDING_FIELDS = [
  ["source_table",  "Source table"],
  ["source_column", "Source column"],
  ["aggregation",   "Aggregation"],
] as const;

/** True when two catalog targets refer to the same catalog entry. */
function sameTarget(a: CatalogTarget | null, b: CatalogTarget | null): boolean {
  if (!a || !b) return false;
  return a.kind === b.kind && a.name === b.name;
}

export default function FieldDetailPanel({
  field,
  assignedTarget,
  decision,
  reviewedAt,
  onPickAlternative,
  readOnly,
}: Props) {
  if (!field) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-xs">
        Click a field to see details
      </div>
    );
  }

  const priorityStyle =
    PRIORITY_STYLES[field.priority] ?? PRIORITY_STYLES.optional;

  // DA1's original recommendation (catalog_targets[0])
  const recommended: CatalogTarget | null = field.catalog_targets?.[0] ?? null;
  const isRecommendedActive = sameTarget(assignedTarget, recommended);

  // Alternatives — everything beyond the first target, deduped against recommended
  const alternatives = (field.alternative_targets ?? []).filter(
    (t) =>
      !sameTarget(t, recommended) &&
      !sameTarget(t, assignedTarget),
  );

  return (
    <div className="flex min-w-0 flex-col gap-3 text-sm">
      {/* Field identity */}
      <div>
        <div className="font-mono text-xs text-gray-500 mb-0.5">{field.field_id}</div>
        <div className="font-semibold text-gray-100 break-words">{field.field_name}</div>
        <div className="text-xs text-gray-500 mt-0.5 capitalize">{field.role}</div>
        <div className="mt-0.5 font-mono text-[10px] text-gray-600">
          DA1 status: {field.status}
        </div>
      </div>

      {/* Priority */}
      <div>
        <div className="text-xs uppercase tracking-widest text-gray-600 mb-1.5">
          Priority
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium capitalize ${priorityStyle}`}
        >
          {field.priority}
        </span>
      </div>

      {decision && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-600 mb-1.5">
            Human decision
          </div>
          <span className="font-mono text-xs text-gray-300">{decision}</span>
          {reviewedAt && (
            <div className="mt-1 font-mono text-[10px] text-gray-600">
              reviewed {reviewedAt}
            </div>
          )}
        </div>
      )}

      {/* LLM reason */}
      {field.reason && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-600 mb-1.5">
            DA1 reason
          </div>
          <p className="break-words rounded-lg border border-gray-700/50 bg-gray-800/60 p-2 text-xs leading-5 text-gray-300 [overflow-wrap:anywhere]">
            {field.reason}
          </p>
        </div>
      )}

      {/* Current assignment */}
      {assignedTarget && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-600 mb-1.5">
            Mapped to
          </div>
          <div className="space-y-1.5 rounded-lg border border-teal/20 bg-teal/8 p-2">
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
              <span className="font-mono text-xs text-gray-500">{assignedTarget.kind}</span>
              <span className="min-w-0 break-all font-semibold text-teal">{assignedTarget.name}</span>
            </div>
            {/* Source binding details */}
            {BINDING_FIELDS.map(([field_key, label]) => {
              const val = (assignedTarget as unknown as Record<string, unknown>)[field_key];
              if (!val) return null;
              const display = typeof val === "string" ? val : JSON.stringify(val);
              return (
                <div key={field_key} className="grid min-w-0 grid-cols-[5.75rem_minmax(0,1fr)] gap-2 text-xs">
                  <span className="text-gray-600">{label}</span>
                  <span className="min-w-0 break-all font-mono text-gray-300">{display}</span>
                </div>
              );
            })}
            {/* Filters */}
            {assignedTarget.filters && (assignedTarget.filters as unknown[]).length > 0 && (
              <div className="text-xs">
                <span className="text-gray-600">Filters </span>
                <span className="break-all font-mono text-[10px] text-gray-400">
                  {JSON.stringify(assignedTarget.filters)}
                </span>
              </div>
            )}
            {/* Quality flags */}
            {assignedTarget.quality_flags && assignedTarget.quality_flags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {assignedTarget.quality_flags.map((f, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 rounded"
                  >
                    {typeof f === "string" ? f : JSON.stringify(f)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DA1 Recommendation — always shown when present so an accidental Clear
          doesn't lose sight of it. Shows a "Restore" button when not active. */}
      {recommended && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-600 mb-1.5">
            Recommended (DA1)
          </div>
          <div
            className={[
              "flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2 text-xs",
              isRecommendedActive
                ? "bg-teal/8 border-teal/20"
                : "bg-gray-800/40 border-gray-700/50",
            ].join(" ")}
          >
            <span className="font-mono text-gray-500 text-[10px]">{recommended.kind}</span>
            <span
              className={`min-w-0 flex-1 truncate font-semibold ${isRecommendedActive ? "text-teal" : "text-gray-300"}`}
              title={recommended.name}
            >
              {recommended.name}
            </span>
            {isRecommendedActive ? (
              <span className="text-[10px] text-teal/60 italic">active</span>
            ) : !readOnly ? (
              <button
                onClick={() => onPickAlternative?.(recommended)}
                className="text-[10px] px-1.5 py-0.5 rounded border border-teal/30 text-teal hover:bg-teal/10 transition-colors flex-shrink-0"
                title="Restore DA1's original recommendation"
              >
                Restore
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Alternative quick-picks */}
      {alternatives.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-600 mb-1.5">
            Alternatives
          </div>
          <div className="flex flex-wrap gap-1.5">
            {alternatives.map((alt) =>
              readOnly ? (
                <span
                  key={`${alt.kind}:${alt.name}`}
                  className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400"
                >
                  {alt.kind[0]}:{alt.name}
                </span>
              ) : (
                <button
                  key={`${alt.kind}:${alt.name}`}
                  onClick={() => onPickAlternative?.(alt)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-gray-700 bg-gray-800 text-gray-400 hover:border-teal/40 hover:text-teal transition-colors"
                  title={`Assign ${alt.kind}:${alt.name}`}
                >
                  {alt.kind[0]}:{alt.name}
                </button>
              ),
            )}
          </div>
          {!readOnly && (
            <p className="text-xs text-gray-600 mt-1">
              Click to assign, or drag from the catalog.
            </p>
          )}
        </div>
      )}

      {!assignedTarget && !readOnly && decision === "pending" && (
        <div className="text-xs text-yellow-400/70 bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-2.5">
          No human decision yet. Approve the recommendation, choose a catalog
          target, exclude the field, or mark it unresolved.
        </div>
      )}
    </div>
  );
}
