import { getFirestore, collection, onSnapshot, deleteDoc, doc, getDoc } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    const db = getFirestore();
    const btnNovoProduto = document.getElementById('novoProduto');
    const popupNovoProduto = document.getElementById('popupNovoProduto');
    const fecharPopup = document.getElementById('fecharPopup');
    const tabela = document.querySelector('.container-conteudo-principal--produtos--tabela--estoque tbody');
    const iframe = popupNovoProduto.querySelector('iframe');
    const tabelaProdutos = document.querySelector('.container-conteudo-principal--produtos--tabela--estoque tbody');

    // Verificações para elementos nulos
    if (!btnNovoProduto || !popupNovoProduto || !fecharPopup || !tabela || !iframe) {
        console.error('Elementos essenciais não encontrados no DOM. Verifique o seu HTML!');
        return;
    }

    // Função para adicionar eventos na linha
    function adicionarEventosNaLinha(linha) {
        const checkbox = linha.querySelector('input.tabela-checkbox');
        const editarBtn = linha.querySelector('.editar-produto');
        const deletarBtn = linha.querySelector('.deletar-produto');

        // Verificação explícita para garantir que os elementos existam
        if (checkbox && editarBtn && deletarBtn) {
            checkbox.addEventListener('change', function () {
                this.closest('tr').querySelector('.acoes-produto').style.display = this.checked ? 'flex' : 'none';
            });

            editarBtn.addEventListener('click', async function () {
                const produtoId = this.dataset.id;
                if (produtoId) {
                    const produto = (await getDoc(doc(db, "produtos", produtoId))).data();
                    abrirPopupEditar(produto);
                } else {
                    console.error("dataset.id não encontrado no botão Editar!");
                }
            });

            deletarBtn.addEventListener('click', async function () {
                const produtoId = this.dataset.id;
                if (produtoId) {
                    if (confirm("Tem certeza que deseja deletar este produto?")) {
                        await deletarProduto(produtoId);
                    }
                } else {
                    console.error("dataset.id não encontrado no botão Deletar!");
                }
            });
        } else {
            console.error("Não foi possível encontrar os elementos necessários na linha da tabela!");
        }
    }

    // Função para adicionar ou atualizar uma linha na tabela
    const adicionarOuAtualizarLinha = (produto) => {
        let linha = tabela.querySelector(`tr[data-id="${produto.id}"]`);
        if (!linha) {
            linha = tabela.insertRow();
            linha.dataset.id = produto.id;
        }
        linha.innerHTML = `
            <td><input type="checkbox" class="tabela-checkbox" data-id="${produto.id}" /></td>
            <td>${produto.id}</td>
            <td class="celulaNome">${produto.nome}</td>
            <td class="celulaTeste">${produto.teste}</td>
            <td><div class="acoes-produto" style="display: none;">
                    <button class="editar-produto" data-id="${produto.id}">Editar</button>
                    <button class="deletar-produto" data-id="${produto.id}">Deletar</button>
                </div></td>
        `;
        adicionarEventosNaLinha(linha);
    };

    // Listener para mensagens do iframe
    window.addEventListener('message', (event) => {
        if (event.source === iframe.contentWindow && event.data.type === 'produtoAtualizado') {
            adicionarOuAtualizarLinha(event.data.produto);
            popupNovoProduto.style.display = 'none';
        }
    });

    // onSnapshot para atualizações em tempo real
    const unsubscribe = onSnapshot(collection(db, 'produtos'), (querySnapshot) => {
        tabela.innerHTML = '';
        querySnapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                adicionarOuAtualizarLinha({ id: change.doc.id, ...change.doc.data() });
            } else if (change.type === 'modified') {
                atualizarProdutoNaTabela({ id: change.doc.id, ...change.doc.data() });
            } else if (change.type === 'removed') {
                removerProdutoDaTabela(change.doc.id);
            }
        });
    });

    // Event listeners para o botão e popup (após verificação de elementos)
    btnNovoProduto.addEventListener('click', (event) => {
        event.preventDefault();
        popupNovoProduto.style.display = 'flex';
    });

    fecharPopup.addEventListener('click', () => {
        popupNovoProduto.style.display = 'none';
    });

    // Funções para atualizar e remover linhas
    function atualizarProdutoNaTabela(produto) {
        const linha = tabelaProdutos.querySelector(`tr[data-id="${produto.id}"]`);

        if (linha) {
            linha.cells[2].textContent = produto.nome || 'Nome não encontrado';
            linha.cells[3].textContent = produto.teste || 'Teste não encontrado';
        } else {
            console.error(`Linha para o produto com ID ${produto.id} não encontrada`);
        }
    }

    const removerProdutoDaTabela = (produtoId) => {
        const linha = tabela.querySelector(`tr[data-id="${produtoId}"]`);
        if (linha) {
            linha.remove();
        } else {
            console.warn(`Linha para o produto com ID ${produtoId} não encontrada`);
        }
    };

    function abrirPopupEditar(produto) {
        const popup = document.getElementById("popupNovoProduto");
        popup.style.display = "flex";
        const iframe = popup.querySelector('iframe').contentWindow;
        iframe.postMessage({ type: "preencherForm", produto: { ...produto, id: produto.id } }, "*");
    }

    const deletarProduto = async (produtoId) => {
        try {
            await deleteDoc(doc(db, 'produtos', produtoId));
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
        }
    };
});
