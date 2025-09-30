// js/acessibilidade.js
(function () {
  'use strict';

  const STORAGE_KEY = 'a11y_state_v4';

  // Limites
  const conf = {
    font:   { min: 0, max: 5, step: 1, toScale: (i) => +(1 + i * 0.10).toFixed(2) },
    letter: { min: 0, max: 5, step: 1, toUnit:  (i) => i },
    line:   { min: 0, max: 5, step: 1, toScale: (i) => +(1 + i * 0.25).toFixed(2) }
  };

  const scope = document.documentElement;

  // Painel
  const panel       = document.querySelector('.a11y-panel');
  const outFont     = document.getElementById('out-font');
  const outLetter   = document.getElementById('out-letter');
  const outLine     = document.getElementById('out-line');
  const themeSelect = document.getElementById('theme-select');
  const invertBtn   = document.getElementById('invert-switch');
  const btnReset    = document.getElementById('a11y-reset');
  const live        = document.getElementById('a11y-live');

  // Botões Claro/Escuro (fora do painel)
  const btnTemaClaro  = document.getElementById('tema-claro');
  const btnTemaEscuro = document.getElementById('tema-escuro');

  // Persistência
  const loadState = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; } };
  const saveState = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

  let state = loadState() || { fontIdx: 0, letterIdx: 1, lineIdx: 1, theme: 'light', invert: false };

  function applyState(){
    // Tipografia
    scope.style.setProperty('--a11y-font-scale',  conf.font.toScale(state.fontIdx));
    scope.style.setProperty('--a11y-letter-unit', conf.letter.toUnit(state.letterIdx));
    scope.style.setProperty('--a11y-line-scale',  conf.line.toScale(state.lineIdx));

    // Tema + inversão
    scope.setAttribute('data-theme', state.theme);
    scope.setAttribute('data-invert', state.invert ? '1' : '0');

    // Atualiza UI
    if (outFont)   outFont.textContent   = String(state.fontIdx);
    if (outLetter) outLetter.textContent = String(state.letterIdx);
    if (outLine)   outLine.textContent   = String(state.lineIdx);
    if (themeSelect) themeSelect.value   = state.theme;
    updateInvertButton();
    updateThemeButtonsUI();

    saveState(state);
  }

  function updateInvertButton(){
    if (!invertBtn) return;
    invertBtn.setAttribute('aria-checked', String(state.invert));
    invertBtn.textContent = state.invert ? 'Ativado' : 'Desativado';
  }

  function updateThemeButtonsUI(){
    if (btnTemaClaro){
      const isLight = state.theme === 'light';
      btnTemaClaro.classList.toggle('is-active', isLight);
      btnTemaClaro.setAttribute('aria-pressed', String(isLight));
    }
    if (btnTemaEscuro){
      const isDark = state.theme === 'dark';
      btnTemaEscuro.classList.toggle('is-active', isDark);
      btnTemaEscuro.setAttribute('aria-pressed', String(isDark));
    }
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const announce = (msg) => {
    if (!live) return;
    live.textContent = '';
    requestAnimationFrame(() => (live.textContent = msg));
  };

  /* ---------------- Listeners ---------------- */

  // Painel: botões +/- 
  if (panel){
    panel.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      switch (a.dataset.action) {
        case 'inc-font':   state.fontIdx   = clamp(state.fontIdx + conf.font.step,   conf.font.min,   conf.font.max); break;
        case 'dec-font':   state.fontIdx   = clamp(state.fontIdx - conf.font.step,   conf.font.min,   conf.font.max); break;
        case 'inc-letter': state.letterIdx = clamp(state.letterIdx + conf.letter.step, conf.letter.min, conf.letter.max); break;
        case 'dec-letter': state.letterIdx = clamp(state.letterIdx - conf.letter.step, conf.letter.min, conf.letter.max); break;
        case 'inc-line':   state.lineIdx   = clamp(state.lineIdx + conf.line.step,   conf.line.min,   conf.line.max); break;
        case 'dec-line':   state.lineIdx   = clamp(state.lineIdx - conf.line.step,   conf.line.min,   conf.line.max); break;
      }
      applyState();
    });
  }

  // Dropdown: suporta todos os temas
  if (themeSelect){
    themeSelect.addEventListener('change', () => {
      const t = themeSelect.value || 'light';
      if (t !== state.theme){
        state.theme = t;
        applyState();
        announce(`Tema alterado para ${labelFromTheme(t)}`);
      }
    });
  }

  // Switch Inverter cores
  if (invertBtn){
    invertBtn.addEventListener('click', () => {
      state.invert = !state.invert;
      applyState();
      announce(`Inversão de cores ${state.invert ? 'ativada' : 'desativada'}`);
    });
  }

  // Botões Claro/Escuro (não quebram sepia/high)
  if (btnTemaClaro){
    btnTemaClaro.addEventListener('click', () => {
      state.theme = 'light';
      applyState();
      announce('Tema Claro ativado');
    });
  }
  if (btnTemaEscuro){
    btnTemaEscuro.addEventListener('click', () => {
      state.theme = 'dark';
      applyState();
      announce('Tema Escuro ativado');
    });
  }

  // Acessibilidade pelo teclado
  function bindArrowKeys(outId, onInc, onDec){
    const el = document.getElementById(outId);
    if (!el) return;
    el.tabIndex = 0;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp'){ onInc(); e.preventDefault(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown'){ onDec(); e.preventDefault(); }
    });
  }
  bindArrowKeys('out-font',   () => { state.fontIdx = clamp(state.fontIdx + 1, conf.font.min, conf.font.max); applyState(); },
                                () => { state.fontIdx = clamp(state.fontIdx - 1, conf.font.min, conf.font.max); applyState(); });
  bindArrowKeys('out-letter', () => { state.letterIdx = clamp(state.letterIdx + 1, conf.letter.min, conf.letter.max); applyState(); },
                                () => { state.letterIdx = clamp(state.letterIdx - 1, conf.letter.min, conf.letter.max); applyState(); });
  bindArrowKeys('out-line',   () => { state.lineIdx = clamp(state.lineIdx + 1, conf.line.min, conf.line.max); applyState(); },
                                () => { state.lineIdx = clamp(state.lineIdx - 1, conf.line.min, conf.line.max); applyState(); });

  // Reset
  if (btnReset){
    btnReset.addEventListener('click', () => {
      state = { fontIdx: 0, letterIdx: 1, lineIdx: 1, theme: 'light', invert: false };
      applyState();
      announce('Preferências redefinidas.');
    });
  }

  function labelFromTheme(t){
    return t === 'light' ? 'Claro'
         : t === 'dark'  ? 'Escuro'
         : t === 'sepia' ? 'Sépia'
         : t === 'high'  ? 'Alto contraste'
         : t;
  }

  // Inicializa
  applyState();
})();
