import { absoluteUrl } from "@/lib/seo";
import { buildCooperationTracking, type CooperationTracking } from "./tracking";

export type CooperationSearchParams = Record<string, string | string[] | undefined>;

export function cooperationTrackingFromSearchParams(searchParams: CooperationSearchParams, path: string, pageTitle: string): CooperationTracking {
  const url = new URL(absoluteUrl(path));
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") url.searchParams.set(key, value);
    else if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, item));
  }
  return { ...buildCooperationTracking(url), pageTitle };
}
