// js/modo-escuro.js
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const slider = toggle?.querySelector('.toggle-slider');

  if (!toggle || !slider) return;

  const SYSTEM_IS_DARK = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('theme'); // 'light' | 'dark' | null
  const initial = saved || (SYSTEM_IS_DARK ? 'dark' : 'light');

  // === NOVO: aplica o tema dentro de iframes também ===
  function syncThemeToIframes(theme) {
    // Se quiser limitar, troque o seletor por '#popupNovoProduto iframe'
    document.querySelectorAll('iframe').forEach((ifr) => {
      try {
        const doc = ifr.contentDocument || ifr.contentWindow?.document;
        if (!doc) return;
        doc.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        // iframes externos ou cross-origin não podem ser tocados — ignore.
      }
    });
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const isDark = theme === 'dark';
    slider.textContent = isDark ? '🌙' : '☀️';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.classList.toggle('is-dark', isDark);
    syncThemeToIframes(theme); // <<< garante que o iframe acompanhe
  }

  applyTheme(initial);

  function toggleTheme() {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  toggle.addEventListener('click', toggleTheme);
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  });

  // === NOVO: quando o iframe carregar, reaplique o tema atual ===
  document.querySelectorAll('iframe').forEach((ifr) => {
    ifr.addEventListener('load', () => {
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      syncThemeToIframes(theme);
    });
  });
});
