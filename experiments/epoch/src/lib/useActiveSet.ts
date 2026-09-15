import { useQuery } from "@tanstack/react-query";
import { fetchActiveSet } from "../api/client";
import type { ActiveSet } from "../api/types";

/** Shared query for the single published example of the selected use case. */
export function useActiveSet(selectedUsecase: string | null) {
  return useQuery<ActiveSet>({
    queryKey: ["active", selectedUsecase],
    queryFn: () => fetchActiveSet(selectedUsecase!),
    enabled: !!selectedUsecase,
  });
}
