type ScrollTarget = {
  getBoundingClientRect: () => { top: number };
};

type ScheduleFrame = (callback: () => void) => void;
type ScrollViewport = {
  scrollTo: (options?: ScrollToOptions) => void;
  scrollY: number;
};

export function scheduleCooperationApplicationScroll(
  target: ScrollTarget | null,
  isDesktop: boolean,
  scheduleFrame: ScheduleFrame,
  viewport: ScrollViewport,
  offset = 96,
) {
  if (!isDesktop) return;
  scheduleFrame(() => {
    if (!target) return;
    viewport.scrollTo({
      behavior: "smooth",
      top: Math.max(0, viewport.scrollY + target.getBoundingClientRect().top - offset),
    });
  });
}
