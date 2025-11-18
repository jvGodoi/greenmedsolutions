// /js/perfil.js
(() => {
  'use strict';

  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

  // Toast
  function toast(msg){
    const t = $('#profile-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._tid);
    toast._tid = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // Persistência (pode trocar por API)
  const KEY = 'profile_state_v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  let state = load();

  // Refs
  const btnOpen   = $('#btnProfile');
  const backdrop  = $('#profile-modal');
  const panel     = $('.profile-panel', backdrop);
  const btnClose  = $('#profile-close');
  const btnCancel = $('#profile-cancel');
  const btnSave   = $('#profile-save');

  const form = $('#profileForm');
  const fields = {
    username:  $('#username'),
    firstName: $('#firstName'),
    lastName:  $('#lastName'),
    email:     $('#email'),
    birth:     $('#birth'),
  };

  const avatarInput = $('#avatarInput');
  const avatarImg   = $('#avatarImg');
  const avatarPh    = $('#avatarPh');

  // Focus trap
  let lastFocused = null, removeTrap = null;
  function trap(enable){
    if (!enable){ if (removeTrap) removeTrap(); removeTrap=null; return; }
    function onKey(e){
      if (e.key !== 'Tab') return;
      const fs = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', panel)
        .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (!fs.length) return;
      const first = fs[0], last = fs[fs.length-1];
      if (e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);
    removeTrap = () => document.removeEventListener('keydown', onKey);
  }

  // Helpers
  function open(){
    lastFocused = document.activeElement;
    backdrop.setAttribute('aria-hidden','false');
    btnOpen.setAttribute('aria-expanded','true');
    // Carregar estado
    fields.username.value  = state.username  || '';
    fields.firstName.value = state.firstName || '';
    fields.lastName.value  = state.lastName  || '';
    fields.email.value     = state.email     || '';
    fields.birth.value     = state.birth     || '';
    // Avatar
    if (state.avatar){
      avatarImg.src = state.avatar;
      avatarImg.style.display = 'block';
      avatarPh.style.display  = 'none';
    } else {
      avatarImg.removeAttribute('src');
      avatarImg.style.display = 'none';
      avatarPh.style.display  = 'block';
    }
    setTimeout(() => fields.username.focus(), 30);
    trap(true);
  }
  function close(){
    backdrop.setAttribute('aria-hidden','true');
    btnOpen.setAttribute('aria-expanded','false');
    trap(false);
    if (lastFocused) lastFocused.focus();
  }
  function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function setError(input, msg){
    const span = form.querySelector(`[data-error-for="${input.id}"]`);
    if (span) span.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validate(){
    let ok = true;
    setError(fields.username,'');
    setError(fields.email,'');
    if (!fields.username.value.trim()){ setError(fields.username, 'Informe um usuário.'); ok = false; }
    if (!fields.email.value.trim()){ setError(fields.email, 'Informe um e-mail.'); ok = false; }
    else if (!isEmail(fields.email.value.trim())){ setError(fields.email, 'E-mail inválido.'); ok = false; }
    return ok;
  }
  function readFileAsDataUrl(file){
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  // Events — open/close
  btnOpen?.addEventListener('click', open);
  btnClose?.addEventListener('click', close);
  btnCancel?.addEventListener('click', (e) => { e.preventDefault(); close(); });
  backdrop?.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && backdrop.getAttribute('aria-hidden') === 'false') close();
  });

  // Avatar
  avatarInput?.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')){ toast('Selecione uma imagem.'); return; }
    const dataUrl = await readFileAsDataUrl(file);
    state.avatar = dataUrl; save(state);
    avatarImg.src = dataUrl; avatarImg.style.display='block'; avatarPh.style.display='none';
  });
  $('#btnRemovePhoto')?.addEventListener('click', () => {
    delete state.avatar; save(state);
    avatarImg.removeAttribute('src'); avatarImg.style.display='none'; avatarPh.style.display='block';
  });

  // Salvar
  btnSave?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!validate()){ toast('Corrija os erros acima.'); return; }
    state = {
      ...state,
      username:  fields.username.value.trim(),
      firstName: fields.firstName.value.trim(),
      lastName:  fields.lastName.value.trim(),
      email:     fields.email.value.trim(),
      birth:     fields.birth.value
    };
    save(state);
    close();
    const nome = [state.firstName, state.lastName].filter(Boolean).join(' ');
    const resumo = [
      state.username ? `@${state.username}` : null,
      nome || null,
      state.email || null,
      state.birth ? new Date(state.birth).toLocaleDateString('pt-BR') : null
    ].filter(Boolean).join(' • ');
    toast(resumo ? `Perfil salvo: ${resumo}` : 'Perfil salvo.');
  });
})();
