/** @returns {string} Experiment home (menu) URL for the current deploy base. */
export function homeUrl() {
  return import.meta.env.BASE_URL;
}

/** @param {number} step */
export function demoUrl(step) {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  url.searchParams.set('step', String(step));
  return `${url.pathname}${url.search}`;
}
