// ===== Filtro de Produtos – JS =====
(() => {
  'use strict';

  const LS_KEY = 'estoque_filtros_v1';

  /* ---- Refs ---- */
  const btnAbrir = document.getElementById('btnAbrirFiltro');
  const backdrop = document.getElementById('filtroBackdrop');
  const modal = document.getElementById('filtroModal');

  const form = document.getElementById('filtroForm');
  const inpId = document.getElementById('fId');
  const inpNome = document.getElementById('fNome');
  const inpCategoria = document.getElementById('fCategoria');
  const inpQtdMin = document.getElementById('fQtdMin');
  const inpQtdMax = document.getElementById('fQtdMax');
  const inpFornecedor = document.getElementById('fFornecedor');

  const btnFecharX = document.getElementById('btnFiltroFecharX');
  const btnCancelar = document.getElementById('btnFiltroCancelar');
  const btnLimpar = document.getElementById('btnFiltroLimpar');
  const btnAplicar = document.getElementById('btnFiltroAplicar');

  const tbody = document.getElementById('produtosTabela'); // sua tabela

  /* ---- Estado ---- */
  let lastFocused = null;

  /* ---- Modal A11y ---- */
  function openModal(){
    lastFocused = document.activeElement;
    backdrop.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-hidden', 'false');
    document.addEventListener('keydown', onEsc);
    document.addEventListener('keydown', focusTrap);
    // foco inicial
    inpId.focus();
  }

  function closeModal(){
    backdrop.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onEsc);
    document.removeEventListener('keydown', focusTrap);
    lastFocused?.focus();
  }

  function onEsc(e){ if(e.key === 'Escape') closeModal(); }

  function focusTrap(e){
    if(e.key !== 'Tab') return;
    const f = modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if(!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if(e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
    else if(!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
  }

  /* ---- Helpers ---- */
  function readCriteria(){
    const id = (inpId.value || '').trim();
    const nome = (inpNome.value || '').trim().toLowerCase();
    const categoria = (inpCategoria.value || '').trim().toLowerCase();
    const fornecedor = (inpFornecedor.value || '').trim().toLowerCase();

    const qtdMin = inpQtdMin.value !== '' ? Number(inpQtdMin.value) : null;
    const qtdMax = inpQtdMax.value !== '' ? Number(inpQtdMax.value) : null;

    return { id, nome, categoria, qtdMin, qtdMax, fornecedor };
  }

  function saveCriteria(c){
    try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch(_) {}
  }

  function loadCriteria(){
    try {
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    } catch(_) { return null; }
  }

  function restoreForm(c){
    if(!c) return;
    inpId.value = c.id || '';
    inpNome.value = c.nome || '';
    inpCategoria.value = c.categoria || '';
    inpQtdMin.value = c.qtdMin ?? '';
    inpQtdMax.value = c.qtdMax ?? '';
    inpFornecedor.value = c.fornecedor || '';
  }

  function clearForm(){
    form.reset();
  }

  function matches(value, needle){
    if(!needle) return true;
    return String(value || '').toLowerCase().includes(needle);
  }

  /* ---- Aplicação local na tabela (#produtosTabela) ----
     Requer que cada <tr> tenha os data-atributos:
     data-id, data-nome, data-categoria, data-quantidade, data-fornecedor
  */
  function applyToTable(criteria){
    if(!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(tr => {
      const rid = tr.getAttribute('data-id') || '';
      const rnome = (tr.getAttribute('data-nome') || '').toLowerCase();
      const rcategoria = (tr.getAttribute('data-categoria') || '').toLowerCase();
      const rfornecedor = (tr.getAttribute('data-fornecedor') || '').toLowerCase();
      const rquant = Number(tr.getAttribute('data-quantidade') || '0');

      let ok = true;

      if(criteria.id && String(rid).trim() !== criteria.id.trim()) ok = false;
      if(ok && !matches(rnome, criteria.nome)) ok = false;
      if(ok && !matches(rcategoria, criteria.categoria)) ok = false;
      if(ok && criteria.qtdMin != null && rquant < criteria.qtdMin) ok = false;
      if(ok && criteria.qtdMax != null && rquant > criteria.qtdMax) ok = false;
      if(ok && !matches(rfornecedor, criteria.fornecedor)) ok = false;

      tr.style.display = ok ? '' : 'none';
    });
  }

  /* ---- Evento público para integração externa ---- */
  function emitCriteria(criteria){
    document.dispatchEvent(new CustomEvent('estoque:apply-filters', { detail: criteria }));
  }

  /* ---- Eventos ---- */
  btnAbrir?.addEventListener('click', () => openModal());
  backdrop?.addEventListener('click', () => closeModal());
  btnFecharX?.addEventListener('click', () => closeModal());
  btnCancelar?.addEventListener('click', () => closeModal());

  btnLimpar?.addEventListener('click', () => {
    clearForm();
    const criteria = readCriteria();
    saveCriteria(criteria);
    applyToTable(criteria);     // limpa filtros (mostra tudo)
    emitCriteria(criteria);
  });

  btnAplicar?.addEventListener('click', () => {
    const criteria = readCriteria();
    saveCriteria(criteria);
    applyToTable(criteria);
    emitCriteria(criteria);
    closeModal();
  });

  // Restaura últimos filtros ao carregar
  const saved = loadCriteria();
  if(saved){
    restoreForm(saved);
    applyToTable(saved);
    emitCriteria(saved);
  }

})();
