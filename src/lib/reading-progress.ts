export const READING_PROGRESS_ROOT_SELECTOR = "[data-reading-progress-root]";

export function getReadingProgressValue() {
  const progressRoot = document.querySelector<HTMLElement>(READING_PROGRESS_ROOT_SELECTOR);

  if (!progressRoot) {
    return 0;
  }

  const scrollY = window.scrollY;
  const rootRect = progressRoot.getBoundingClientRect();
  const rootTop = rootRect.top + scrollY;
  const rootHeight = Math.max(progressRoot.scrollHeight, rootRect.height);
  const rootBottom = rootTop + rootHeight;
  const readableDistance = rootHeight - window.innerHeight;
  const progress =
    readableDistance <= 0
      ? scrollY >= rootTop
        ? 100
        : 0
      : ((scrollY - rootTop) / (rootBottom - window.innerHeight - rootTop)) * 100;

  return Math.min(100, Math.max(0, progress));
}
