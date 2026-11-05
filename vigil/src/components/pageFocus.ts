/**
 * Moves focus to the current page's h1, made focusable for this (tabindex -1, so it never joins the tab order),
 * or to <main> while a lazily loaded screen has no heading yet. Screen readers then announce the new page.
 */
export function focusPage(): void {
  const h1 = document.querySelector<HTMLElement>('#main h1');
  if (h1 && !h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
  (h1 ?? document.getElementById('main'))?.focus({ preventScroll: true });
}
