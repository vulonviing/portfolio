import manifest from "../route-manifest.json";

export const USECASE_SLUGS: Record<string, string> = manifest.usecases;

export const SLUG_TO_USECASE: Record<string, string> = Object.fromEntries(
  Object.entries(USECASE_SLUGS).map(([key, slug]) => [slug, key]),
);

export const DEFAULT_USECASE_SLUG = "uc4";

export function routeForUsecase(usecaseKey: string | null, path: string): string {
  const slug = (usecaseKey && USECASE_SLUGS[usecaseKey]) || DEFAULT_USECASE_SLUG;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${slug}${normalized}`;
}
