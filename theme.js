const storageKey = 'focus-habitat-theme';
const validTheme = value => value === 'light' || value === 'dark';

export function initTheme() {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const query = new URLSearchParams(window.location.search).get('qa-theme');
  const preview = validTheme(query);
  let choice = preview ? query : null;
  if (!preview) {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (validTheme(stored)) choice = stored;
    } catch { /* Privacy settings can deny storage; the control still works. */ }
  }
  let theme = choice ?? (system.matches ? 'dark' : 'light');
  function render() {
    root.setAttribute('data-theme', theme);
    if (!button) return;
    const dark = theme === 'dark';
    const label = root.lang === 'tr'
      ? (dark ? 'Açık temaya geç' : 'Koyu temaya geç')
      : (dark ? 'Switch to light theme' : 'Switch to dark theme');
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.hidden = false;
  }
  function toggle() {
    choice = theme = theme === 'dark' ? 'light' : 'dark';
    if (!preview) {
      try { window.localStorage.setItem(storageKey, choice); }
      catch { /* The explicit selection remains valid for this page. */ }
    }
    render();
  }
  function followSystem() {
    if (choice) return;
    theme = system.matches ? 'dark' : 'light';
    render();
  }
  function syncSavedChoice() {
    if (preview) return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      choice = validTheme(stored) ? stored : null;
    } catch { /* Preserve an in-memory selection when storage is unavailable. */ }
    theme = choice ?? (system.matches ? 'dark' : 'light');
    render();
  }
  function restore(event) { if (event.persisted) syncSavedChoice(); }
  function storageChanged(event) {
    if (event.key === storageKey || event.key === null) syncSavedChoice();
  }
  function leave(event) { if (!event.persisted) destroy(); }
  function destroy() {
    button?.removeEventListener('click', toggle);
    system.removeEventListener('change', followSystem);
    window.removeEventListener('pagehide', leave);
    window.removeEventListener('pageshow', restore);
    window.removeEventListener('storage', storageChanged);
  }
  render();
  button?.addEventListener('click', toggle);
  system.addEventListener('change', followSystem);
  // Keep controls live when the browser restores this document from its page cache.
  window.addEventListener('pagehide', leave);
  window.addEventListener('pageshow', restore);
  window.addEventListener('storage', storageChanged);
  return { destroy };
}
