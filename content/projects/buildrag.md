# BuildRAG

A fully local Retrieval-Augmented Generation chatbot for document-based Q&A. No cloud, no API keys, no data leaving the machine.

## What it does

- Ingests documents, chunks them, and indexes them in a local **Chroma** vector store
- Runs queries against a local LLM via **Ollama**
- Uses **LangChain** as the orchestration layer
- Exposes everything through a **Streamlit** UI
- Cites sources for every answer

## Retrieval strategies

- **Similarity search** — the baseline cosine match
- **MMR (Maximal Marginal Relevance)** — for diverse, non-redundant results
- **Score filtering** — drop low-confidence chunks before they reach the model

## Tooling

I built debugging and document management views into the UI so you can inspect what the retriever is actually returning, swap chunking parameters, and rebuild the index without restarting.

## Why local?

Because RAG over sensitive documents shouldn't require shipping them to a third-party API. Everything in BuildRAG runs on your laptop.

## Stack

`Python` · `Streamlit` · `LangChain` · `Chroma` · `Ollama`
