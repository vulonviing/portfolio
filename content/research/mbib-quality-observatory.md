# MBIB Quality Observatory

This repository audits the **Media Bias Identification Benchmark (MBIB)**. It keeps the summary tables, figures, task cards, and LLM review exports under `results/` and `reports/`. Large dataset caches and downloaded model weights are not tracked in git.

The pipeline includes:

- dataset loading and normalization for all 8 MBIB tasks
- label balance, sentence length, and cross-task overlap checks
- near-duplicate detection
- three embedding-based cleanlab probes for label-noise estimation
- zero-shot transfer with a BABE-fine-tuned RoBERTa baseline
- LLM review of flagged rows

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If you want to run notebook 06, add your API key to `.env`:

```bash
OPENAI_API_KEY=...
```

## Reproducing the full pipeline

Run the notebooks in order:

| Notebook | Purpose |
| --- | --- |
| `01_load_mbib.ipynb` | Download MBIB from Hugging Face and cache per-task parquet files |
| `02_quality_metrics.ipynb` | Compute size, balance, length, vocabulary, and cross-task overlap summaries |
| `03_duplicates_and_noise.ipynb` | Detect near-duplicates and run the three cleanlab probes |
| `04_error_analysis.ipynb` | Evaluate the BABE baseline across MBIB tasks |
| `05_export_report.ipynb` | Build the master summary table and final report inputs |
| `06_gabriel_validation.ipynb` | Run LLM review on flagged rows |
| `07_results_walkthrough.ipynb` | Load the saved results and summarize them |

To regenerate the markdown task cards from the committed summaries:

```bash
python -m scripts.regenerate_reports
```

To review the saved results, open `notebooks/07_results_walkthrough.ipynb`.

## External downloads

These files are required to rerun the pipeline, but they are not tracked here.

| Component | Link | Used in |
| --- | --- | --- |
| MBIB dataset | https://huggingface.co/datasets/mediabiasgroup/mbib-base | Notebook 01 |
| MiniLM | https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 | Near-duplicate search and label-noise probe |
| BGE-small | https://huggingface.co/BAAI/bge-small-en-v1.5 | Label-noise probe |
| E5-small | https://huggingface.co/intfloat/e5-small-v2 | Label-noise probe |
| BABE RoBERTa baseline | https://huggingface.co/vulonviing/roberta-babe-baseline | Notebook 04 |
| BABE baseline training repo | https://github.com/vulonviing/babe-roberta-baseline | Reference for the baseline model |

Notes:

- `01_load_mbib.ipynb` downloads the dataset and writes local parquet caches to `data/processed/`.
- `sentence-transformers` and `transformers` download model weights to your local cache on first use.
- The repo keeps the analysis outputs, not the raw cached inputs.

## Results Summary

The tracked summaries cover **810,953 rows** across 8 MBIB tasks.

- The largest overlap pairs are `linguistic_bias` ↔ `racial_bias` (8,940 shared sentences), `gender_bias` ↔ `linguistic_bias` (8,574), `gender_bias` ↔ `racial_bias` (7,056), `gender_bias` ↔ `hate_speech` (6,816), and `cognitive_bias` ↔ `fake_news` (5,230).
- The highest mean noise rates are in `linguistic_bias`, `cognitive_bias`, and `fake_news`. The lowest is `gender_bias`.
- Near-duplicate rates stay low across the benchmark. The highest sampled near-duplicate rate is `gender_bias` at 1.16%.
- The highest macro-F1 is `political_bias` (`0.6856`). The lowest is `racial_bias` (`0.3492`).
- LLM disagreement is highest for `political_bias` (71%) and lowest for `racial_bias` (23%).

## Key findings

### 1. Cross-task leakage is substantial

The largest quality problem is not class imbalance or duplication. It is task leakage across the benchmark.

- `linguistic_bias` ↔ `racial_bias`: **8,940** shared sentences
- `gender_bias` ↔ `linguistic_bias`: **8,574**
- `gender_bias` ↔ `racial_bias`: **7,056**
- `gender_bias` ↔ `hate_speech`: **6,816**
- `hate_speech` ↔ `linguistic_bias`: **6,414**
- `cognitive_bias` ↔ `fake_news`: **5,230**

This can inflate transfer results when the same sentence appears across tasks.

### 2. The three cleanlab probes agree on which tasks are noisiest

Mean issue rates from the three embedding probes:

| Task | MiniLM | BGE-small | E5-small |
| --- | ---: | ---: | ---: |
| `linguistic_bias` | 39.52% | 40.28% | 38.72% |
| `cognitive_bias` | 40.00% | 38.50% | 38.10% |
| `fake_news` | 37.56% | 35.80% | 36.20% |
| `political_bias` | 26.18% | 24.50% | 22.68% |
| `racial_bias` | 23.18% | 21.48% | 22.96% |
| `text_level_bias` | 20.26% | 19.46% | 19.26% |
| `hate_speech` | 15.78% | 11.82% | 13.02% |
| `gender_bias` | 11.74% | 11.58% | 12.30% |

The ordering is stable across probes. `linguistic_bias`, `cognitive_bias`, and `fake_news` consistently look the least reliable. `gender_bias` is consistently the cleanest.

### 3. Duplicates are not the main problem

Exact duplicate rates are all below **0.24%**. Sampled near-duplicate rates remain low as well, between **0.00%** and **1.16%**.

That means the benchmark issues are mostly about annotation quality and task boundaries, not bulk repetition.

### 4. Zero-shot transfer is highly uneven

Macro-F1 of the BABE-fine-tuned RoBERTa baseline on the 5k evaluation sample:

| Task | Macro-F1 |
| --- | ---: |
| `political_bias` | 0.6856 |
| `text_level_bias` | 0.5935 |
| `linguistic_bias` | 0.5524 |
| `cognitive_bias` | 0.5284 |
| `gender_bias` | 0.5064 |
| `hate_speech` | 0.5049 |
| `fake_news` | 0.5043 |
| `racial_bias` | 0.3492 |

`political_bias` has the highest macro-F1 and `racial_bias` the lowest. That gap matches the broader variation across tasks.

### 5. LLM review shows high disagreement on many flagged rows

Disagreement between the committed labels and the LLM review on 100 flagged rows per task:

| Task | Disagreement rate |
| --- | ---: |
| `political_bias` | 71% |
| `linguistic_bias` | 69% |
| `text_level_bias` | 61% |
| `cognitive_bias` | 60% |
| `hate_speech` | 50% |
| `fake_news` | 45% |
| `gender_bias` | 27% |
| `racial_bias` | 23% |

Disagreement is highest in `political_bias`, `linguistic_bias`, and `cognitive_bias`. `racial_bias` is lower, but still not negligible.

### 6. Combined View

Across the pipeline, the same pattern keeps showing up:

- the largest tasks are also where cross-task reuse is most visible
- label-noise estimates and LLM disagreement both point to unstable annotations in a small subset of tasks
- duplicate rates stay low, so the benchmark’s weak points are not simple deduplication issues
- the benchmark should be read as a mixed-quality collection of tasks rather than a uniformly clean shared standard

## Representative examples

These examples come from the saved flagged pool and LLM review outputs. They show how the embedding filter and the LLM review differ.

### A. High-consensus flags that look like clear annotation mistakes

| Task | Text | Original | Score | LLM | Why it matters |
| --- | --- | ---: | ---: | ---: | --- |
| `hate_speech` | "waiting for the day i m not working and a white hoe talk to me crazy cause i ma beat her ass" | 0 | 3 | - | The given label says clean, but the sentence contains explicit slur-driven hostility. |
| `hate_speech` | "my girlfriend is a nurse in ny and it has slowed down but sure argue with a primary source of information" | 1 | 3 | 0 | A normal argument was labeled as hate speech. |
| `cognitive_bias` | "Gun homicide is down 49 percent in the past 12 years" | 1 | 3 | 0 | A factual claim was labeled as cognitive bias. |
| `cognitive_bias` | "Usually it s about 900 a month to get health coverage Florida s program has reduced that on average to about 150 a month" | 1 | 3 | 0 | A factual cost comparison was labeled as cognitive bias. |
| `political_bias` | "Featured image via Flickr user Gage Skidmore CC BY SA 2 0" | 1 | 3 | 0 | A photo attribution line was labeled as political bias. |
| `linguistic_bias` | "platform 3 is used by northbound trains on the ecml down slow line and trains on the hertford loop line use platform 4" | 1 | 3 | 0 | A train-platform description was labeled as linguistic bias. |
| `linguistic_bias` | "bobby bare jr born june 28 1966 is a grammy nominated american musician who has recorded several solo albums" | 1 | 3 | 0 | A biographical sentence was labeled as linguistic bias. |

### B. "Word trap" false alarms dismissed by the LLM

The smaller models often react to surface words without understanding the actual claim.

| Task | Text | Original | Trigger words | LLM |
| --- | --- | ---: | --- | ---: |
| `gender_bias` | "cleaning if my wife is feeling down ill go out of my way to do extra cleaning and it makes her light up every time" | 0 | wife, cleaning | 0 |
| `gender_bias` | "the show said her mom is a nurse which is why she was going with her to ethiopia to scope out the hospitals" | 0 | her, mom, nurse | 0 |
| `racial_bias` | "i love cooking and my wife is a frequent smoker and loves good food so hell yes id be interested" | 0 | wife | 0 |
| `racial_bias` | "my wife is a teacher im a nurse i feel this so much thats exactly what its like and its infuriating and unbelievable" | 0 | wife, nurse | 0 |

### C. Political criticism is not the same as hate speech

The LLM layer is useful when the sentence is aggressive but not identity-targeted.

| Text | Original | LLM | Interpretation |
| --- | ---: | ---: | --- |
| "The pathological liar and thief is Trump He constantly lied..." | 0 | 0 | Harsh political criticism, not hate speech. |
| "Sounds racist to me So much for a color blind society" | 0 | 0 | Commenting on racism is not itself hate speech. |
| "Mike5 that s a horrible attitude And delicate Donald Trump can t even take satire on TV" | 0 | 0 | Political mockery, not identity-directed hate. |

### D. Formally Worded Racist Claims That Small Models Missed

Some hard cases use formal or technical wording rather than explicit slurs.

| Text | Original | Score | Small-model pattern | LLM |
| --- | ---: | ---: | --- | ---: |
| "there is scientific evidence that backs the fact that black people are just less intelligent than other races thats just how it is" | 1 | 3 | The wording sounds formal and factual, so the small models wanted to flip it | 1 |
| "there is no scientific basis to argue that africans are genetically less intelligent than whites theyve got smaller brains" | 1 | 3 | Mixed framing hides the racist content | 1 |
| "black people are the best aggressive helpers" | 0 | 3 | The label is unstable and the sentence is racially loaded | 1 |

These rows are a good example of where embeddings alone are not enough.

### E. Some rows appear to be assigned to the wrong task

| Task | Text | Original | Likely issue |
| --- | --- | ---: | --- |
| `racial_bias` | "us gays are indecisive im shocked" | 0 | Sexual-orientation content inside the racial-bias task. |
| `racial_bias` | "a good girl is a nurse a bad girl becomes a doctor" | 0 | Gender stereotype, not racial bias. |
| `racial_bias` | "i was legitimately suspected to be gay in high school because im emotionally sensitive not that being gay is bad though" | 1 | Again, sexual-orientation content rather than racial bias. |

### F. Rows Where the LLM Changed or Confirmed the Label

| Task | Text | Original | Score | What happened |
| --- | --- | ---: | ---: | --- |
| `fake_news` | "Spanish was the first European language spoken in this country" | 0 | 2 | A context-sensitive historical claim. The LLM kept it as clean. |
| `text_level_bias` | "Cat s look cute but they are actually quite vile creatures" | 0 | 3 | The LLM treated the full sentence as biased or toxic and flipped it to 1. |
| `gender_bias` | "Melissa shouldn t talk economics That s like me talking about a new designer purse or something" | 1 | 3 | The LLM confirmed the stereotype rather than dismissing it. |

## Why These Examples Matter

- the filter stage surfaces a broad candidate pool
- the review stage removes many keyword-based false alarms
- some benchmark problems are annotation errors, while others are task-assignment errors
- the hardest cases combine label quality, task boundaries, and wording

## Repository layout

```text
.
├── data/
│   └── processed/
│       └── .gitkeep
├── notebooks/
├── reports/
│   ├── cognitive_bias.md
│   ├── fake_news.md
│   ├── gender_bias.md
│   ├── hate_speech.md
│   ├── linguistic_bias.md
│   ├── political_bias.md
│   ├── racial_bias.md
│   └── text_level_bias.md
├── results/
├── scripts/
│   ├── export_top_flagged_to_csv.py
│   ├── regenerate_reports.py
│   └── run_extra_validation.py
├── src/
├── tests/
├── .gitignore
├── README.md
└── requirements.txt
```

## Notes for this repo

- `results/` is versioned so the analysis can be reviewed without rerunning the notebooks.
- `data/processed/` is ignored because the local parquet cache is large and can be rebuilt.
- The active pipeline uses the three-model cleanlab workflow.
