// js/movimentacoes.js
document.addEventListener('DOMContentLoaded', () => {
  const btnNovo = document.getElementById('novoProduto');        // desktop
  const btnNovoRes = document.getElementById('novoProdutoRes');  // mobile (se existir)
  const popup = document.getElementById('popupNovoProduto');
  const btnFechar = document.getElementById('fecharPopup');
  const iframe = popup?.querySelector('iframe');

  if (!popup || !btnFechar || !iframe) {
    console.warn('[movimentacoes] Elementos do popup não encontrados.');
    return;
  }

  // ---- helpers ----
  function setAriaOpen(isOpen) {
    popup.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function openPopup(clean = true) {
    popup.classList.add('open');
    popup.style.display = 'flex';
    setAriaOpen(true);
    if (clean) {
      // pede para o formulário limpar os campos (se ele implementar)
      iframe.contentWindow?.postMessage({ type: 'novo-produto:limpar' }, '*');
    }
  }

  function closePopup() {
    popup.classList.remove('open');
    popup.style.display = 'none';
    setAriaOpen(false);
  }

  // ---- abrir (desktop + responsivo) ----
  const handleOpen = (e) => { e?.preventDefault(); openPopup(true); };
  btnNovo?.addEventListener('click', handleOpen);
  btnNovoRes?.addEventListener('click', handleOpen);

  // ---- fechar (botão externo) ----
  btnFechar.addEventListener('click', closePopup);

  // fechar clicando fora do card
  popup.addEventListener('click', (e) => {
    if (e.target === popup) closePopup();
  });

  // fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup();
  });

  // ---- manter só 1 botão de fechar (remove o interno do iframe) ----
  iframe.addEventListener('load', () => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      // botão do layout do formulário que queremos esconder/remover
      const innerClose = doc.getElementById('np-close');
      if (innerClose) innerClose.remove(); // remove completamente
      // alternativa (se preferir apenas esconder):
      // if (innerClose) innerClose.style.display = 'none';
    } catch (err) {
      console.warn('[movimentacoes] Não foi possível acessar o iframe para remover o botão interno:', err);
    }
  });

  // ---- mensagens vindas do formulário (iframe) ----
  window.addEventListener('message', (e) => {
    const { type } = e.data || {};
    if (!type) return;

    if (type === 'novo-produto:fechar' || type === 'novo-produto:salvar') {
      // Fechamos aqui; a gravação/atualização da tabela pode ser tratada em outro script
      closePopup();
    }

    // suporte legados, caso o formulário antigo ainda envie
    if (type === 'produtoAtualizado') {
      closePopup();
    }
  });
});
