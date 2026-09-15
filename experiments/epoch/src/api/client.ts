// Static data client for the published EPOCH example viewer.
import { USECASE_SLUGS } from "../lib/routes";
import type {
  ActiveSet,
  CorpusArtifacts,
  PipelineFamily,
  ProvisionMap,
  Stage2Binding,
  TopologyLibrary,
  UsecaseDetail,
  UsecaseSummary,
} from "./types";

const DATA_BASE = `${import.meta.env.BASE_URL}data`.replace(/\/+$/g, "");

function slugFor(usecaseId: string): string {
  return USECASE_SLUGS[usecaseId] ?? usecaseId;
}

async function getJson<T>(path: string): Promise<T> {
  const url = `${DATA_BASE}/${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Static data unavailable: ${url}`);
  return response.json() as Promise<T>;
}

async function getText(path: string): Promise<string> {
  const url = `${DATA_BASE}/${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Static data unavailable: ${url}`);
  return response.text();
}

export const fetchUsecases = (): Promise<UsecaseSummary[]> => getJson("usecases.json");

export const fetchUsecase = (id: string): Promise<UsecaseDetail> =>
  getJson(`usecases/${slugFor(id)}/detail.json`);

export const fetchRegistrySnapshot = (): Promise<string> => getText("registry-public.json");

export const fetchActiveSet = (id: string): Promise<ActiveSet> =>
  getJson(`usecases/${slugFor(id)}/active.json`);

export const fetchCorpus = (id: string): Promise<CorpusArtifacts> =>
  getJson(`usecases/${slugFor(id)}/corpus.json`);

export const fetchProvisions = (id: string): Promise<ProvisionMap> =>
  getJson(`usecases/${slugFor(id)}/provisions.json`);

export const fetchTopologyLibrary = (): Promise<TopologyLibrary> =>
  getJson("topology/library.json");

export const fetchStage2Binding = (
  topologyId: string,
  family: PipelineFamily = "tabular",
): Promise<Stage2Binding> =>
  getJson(`topology/${encodeURIComponent(topologyId)}/stage2-${family}.json`);
