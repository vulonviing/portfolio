# MBIB Quality Observatory

An audit of the **Media Bias Identification Benchmark (MBIB)** — looking at what's actually inside the eight tasks, where annotation breaks down, and how much of the benchmark is silently overlapping.

## What the pipeline does

- Loads and normalizes all eight MBIB tasks
- Computes label balance, sentence length, and cross-task overlap statistics
- Detects near-duplicates
- Runs three embedding-based **cleanlab** probes for label-noise estimation
- Evaluates a **BABE-fine-tuned RoBERTa baseline** as a zero-shot transfer benchmark
- Uses an LLM to review flagged rows from each task

## Results summary

The tracked summaries cover **810,953 rows** across 8 MBIB tasks.

## Key findings

### 1. Cross-task leakage is substantial

The largest quality problem isn't class imbalance or duplication — it's **task leakage** across the benchmark.

- `linguistic_bias` ↔ `racial_bias`: **8,940** shared sentences
- `gender_bias` ↔ `linguistic_bias`: **8,574**
- `gender_bias` ↔ `racial_bias`: **7,056**
- `gender_bias` ↔ `hate_speech`: **6,816**
- `cognitive_bias` ↔ `fake_news`: **5,230**

This inflates transfer results when the same sentence appears across tasks.

### 2. Three cleanlab probes agree on the noisiest tasks

| Task | MiniLM | BGE-small | E5-small |
|---|---:|---:|---:|
| `linguistic_bias` | 39.52% | 40.28% | 38.72% |
| `cognitive_bias` | 40.00% | 38.50% | 38.10% |
| `fake_news` | 37.56% | 35.80% | 36.20% |
| `political_bias` | 26.18% | 24.50% | 22.68% |
| `racial_bias` | 23.18% | 21.48% | 22.96% |
| `text_level_bias` | 20.26% | 19.46% | 19.26% |
| `hate_speech` | 15.78% | 11.82% | 13.02% |
| `gender_bias` | 11.74% | 11.58% | 12.30% |

`linguistic_bias`, `cognitive_bias`, and `fake_news` consistently look the least reliable. `gender_bias` is consistently the cleanest.

### 3. Duplicates are not the main problem

Exact duplicate rates are all below **0.24%**. Sampled near-duplicate rates stay between **0.00%** and **1.16%**. The benchmark's issues are about annotation quality and task boundaries, not bulk repetition.

### 4. Zero-shot transfer is highly uneven

Macro-F1 of the BABE-fine-tuned RoBERTa baseline on a 5k evaluation sample:

| Task | Macro-F1 |
|---|---:|
| `political_bias` | 0.6856 |
| `text_level_bias` | 0.5935 |
| `linguistic_bias` | 0.5524 |
| `cognitive_bias` | 0.5284 |
| `gender_bias` | 0.5064 |
| `hate_speech` | 0.5049 |
| `fake_news` | 0.5043 |
| `racial_bias` | 0.3492 |

### 5. LLM review shows high disagreement on flagged rows

Disagreement between committed labels and LLM review on 100 flagged rows per task:

| Task | Disagreement rate |
|---|---:|
| `political_bias` | 71% |
| `linguistic_bias` | 69% |
| `text_level_bias` | 61% |
| `cognitive_bias` | 60% |
| `hate_speech` | 50% |
| `fake_news` | 45% |
| `gender_bias` | 27% |
| `racial_bias` | 23% |

## Combined view

Across the pipeline, the same pattern keeps showing up:

- The largest tasks are also where cross-task reuse is most visible
- Label-noise estimates and LLM disagreement both point to unstable annotations in a small subset of tasks
- Duplicate rates stay low — the weak points are not deduplication issues
- MBIB should be read as a **mixed-quality collection**, not a uniformly clean shared standard
