// js/estoque.js
import { getFirestore, collection, onSnapshot, deleteDoc, doc, getDoc } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const db = getFirestore();

  // --- Refs do popup "Novo Produto" ---
  const btnNovoProduto   = document.getElementById('novoProduto');
  const popupNovoProduto = document.getElementById('popupNovoProduto');
  const fecharPopup      = document.getElementById('fecharPopup');
  const tabela           = document.querySelector('.container-conteudo-principal--produtos--tabela--estoque tbody');
  const tabelaProdutos   = tabela; // mesma ref
  const iframe           = popupNovoProduto?.querySelector('iframe');

  if (!btnNovoProduto || !popupNovoProduto || !fecharPopup || !tabela || !iframe) {
    console.error('[estoque] Elementos essenciais não encontrados. Verifique o HTML.');
    return;
  }

  // ---------- Helpers de abertura/fechamento ----------
  function setAriaOpen(isOpen) {
    popupNovoProduto.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function openPopup(clean = true) {
    popupNovoProduto.classList.add('open');
    popupNovoProduto.style.display = 'flex';
    setAriaOpen(true);
    if (clean) {
      // pede para o formulário limpar os campos (se implementado no popup.html)
      iframe.contentWindow?.postMessage({ type: 'novo-produto:limpar' }, '*');
    }
  }

  function closePopup() {
    popupNovoProduto.classList.remove('open');
    popupNovoProduto.style.display = 'none';
    setAriaOpen(false);
  }

  // ---------- UI: abrir/fechar ----------
  btnNovoProduto.addEventListener('click', (e) => {
    e.preventDefault();
    openPopup(true);
  });

  fecharPopup.addEventListener('click', closePopup);

  // fechar clicando no backdrop
  popupNovoProduto.addEventListener('click', (e) => {
    if (e.target === popupNovoProduto) closePopup();
  });

  // fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup();
  });

  // Remover o botão de fechar interno do iframe (manter só 1 "X")
  iframe.addEventListener('load', () => {
    try {
      const docIframe = iframe.contentDocument || iframe.contentWindow.document;
      const innerClose = docIframe.getElementById('np-close');
      if (innerClose) innerClose.remove(); // some de vez
    } catch (err) {
      console.warn('[estoque] Não foi possível acessar o iframe para remover #np-close:', err);
    }
  });

  // ---------- Tabela: criar/atualizar/remover ----------
  function adicionarEventosNaLinha(linha) {
    const checkbox  = linha.querySelector('input.tabela-checkbox');
    const editarBtn = linha.querySelector('.editar-produto');
    const deletarBtn= linha.querySelector('.deletar-produto');
    const acoes     = linha.querySelector('.acoes-produto');

    if (checkbox && acoes) {
      checkbox.addEventListener('change', function () {
        if (!acoes) return;
        acoes.style.display = this.checked ? 'flex' : 'none';
      });
    }

    if (editarBtn) {
      editarBtn.addEventListener('click', async function () {
        const produtoId = this.dataset.id;
        if (!produtoId) return console.error('[estoque] dataset.id ausente no botão Editar');
        const snap = await getDoc(doc(db, 'produtos', produtoId));
        const produto = { id: snap.id, ...snap.data() };
        abrirPopupEditar(produto);
      });
    }

    if (deletarBtn) {
      deletarBtn.addEventListener('click', async function () {
        const produtoId = this.dataset.id;
        if (!produtoId) return console.error('[estoque] dataset.id ausente no botão Deletar');
        if (confirm('Tem certeza que deseja deletar este produto?')) {
          await deletarProduto(produtoId);
        }
      });
    }
  }

  const adicionarOuAtualizarLinha = (produto) => {
    let linha = tabela.querySelector(`tr[data-id="${produto.id}"]`);
    if (!linha) {
      linha = tabela.insertRow();
      linha.dataset.id = produto.id;
    }
    linha.innerHTML = `
      <td><input type="checkbox" class="tabela-checkbox" data-id="${produto.id}" /></td>
      <td>${produto.id}</td>
      <td class="celulaNome">${produto.nome ?? ''}</td>
      <td class="celulaTeste">${produto.teste ?? ''}</td>
      <td>
        <div class="acoes-produto" style="display:none; gap:.5rem;">
          <button class="editar-produto"  data-id="${produto.id}" type="button">Editar</button>
          <button class="deletar-produto" data-id="${produto.id}" type="button">Deletar</button>
        </div>
      </td>
    `;
    adicionarEventosNaLinha(linha);
  };

  function atualizarProdutoNaTabela(produto) {
    const linha = tabelaProdutos.querySelector(`tr[data-id="${produto.id}"]`);
    if (!linha) return console.warn(`[estoque] Linha do produto ${produto.id} não encontrada p/ atualizar.`);
    linha.querySelector('.celulaNome')?.replaceChildren(document.createTextNode(produto.nome || ''));
    linha.querySelector('.celulaTeste')?.replaceChildren(document.createTextNode(produto.teste || ''));
  }

  const removerProdutoDaTabela = (produtoId) => {
    const linha = tabela.querySelector(`tr[data-id="${produtoId}"]`);
    if (linha) linha.remove();
  };

  // ---------- Firestore: realtime ----------
  onSnapshot(collection(db, 'produtos'), (querySnapshot) => {
    // reconstrução simples para manter ordenação do Firestore
    tabela.innerHTML = '';
    querySnapshot.forEach((docSnap) => {
      adicionarOuAtualizarLinha({ id: docSnap.id, ...docSnap.data() });
    });
  });

  // ---------- Comunicação com o iframe ----------
  // Recebe eventos do formulário dentro do iframe
  window.addEventListener('message', (event) => {
    const payload = event.data || {};
    const srcOk = event.source === iframe.contentWindow;

    if (!srcOk) return;

    if (payload.type === 'produtoAtualizado' && payload.produto) {
      adicionarOuAtualizarLinha(payload.produto);
      closePopup();
    }

    // compatível com o novo protocolo
    if (payload.type === 'novo-produto:salvar' && payload.produto) {
      adicionarOuAtualizarLinha(payload.produto);
      closePopup();
    }
    if (payload.type === 'novo-produto:fechar') {
      closePopup();
    }
  });

  // ---------- Ações auxiliares ----------
  function abrirPopupEditar(produto) {
    openPopup(false); // não limpar, vamos preencher
    // envia dados para o formulário no iframe
    iframe.contentWindow?.postMessage(
      { type: 'preencherForm', produto: { ...produto, id: produto.id } },
      '*'
    );
  }

  async function deletarProduto(produtoId) {
    try {
      await deleteDoc(doc(db, 'produtos', produtoId));
    } catch (error) {
      console.error('[estoque] Erro ao deletar produto:', error);
    }
  }
});
