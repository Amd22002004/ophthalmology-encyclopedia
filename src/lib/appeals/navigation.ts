export type ObservedElementPosition = "before" | "visible" | "after";

export function buildAppealHref(investigationSlug?: string) {
  const slug = investigationSlug?.trim();
  return slug ? `/appeal?investigation=${encodeURIComponent(slug)}` : "/appeal";
}

export function getObservedElementPosition({
  isIntersecting,
  top,
  bottom,
}: {
  isIntersecting: boolean;
  top: number;
  bottom: number;
}): ObservedElementPosition {
  if (isIntersecting) return "visible";
  return bottom <= 0 && top < 0 ? "after" : "before";
}

export function isFloatingAppealVisible({
  triggerPosition,
  endVisible,
}: {
  triggerPosition: ObservedElementPosition;
  endVisible: boolean;
}) {
  return triggerPosition === "after" && !endVisible;
}

