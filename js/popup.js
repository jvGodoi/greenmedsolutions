import { adicionarProdutoFirebase, editarProdutoFirebase } from './firebase.js';

document.addEventListener("DOMContentLoaded", () => {
    const formProduto = document.getElementById("formProduto");
    if (formProduto) {
        formProduto.addEventListener("submit", async function (e) {
            e.preventDefault();
            const nome = document.getElementById("nomeProduto").value;
            const teste = document.getElementById("testeProduto").value;
            const id = document.getElementById("idProduto")?.value; // Obtém o ID, se existir

            const produto = { nome, teste };
            if (id) {
                produto.id = id; // Se ID existe, é uma edição
                const resultado = await editarProdutoFirebase(produto);
                if (resultado) {
                    window.parent.postMessage({ type: 'produtoAtualizado', produto: resultado }, '*');
                    formProduto.reset();
                } else {
                    alert("Erro ao editar produto. Verifique o console.");
                }
            } else {
                const resultado = await adicionarProdutoFirebase(produto);
                if (resultado) {
                    window.parent.postMessage({ type: 'produtoAtualizado', produto: resultado }, '*');
                    formProduto.reset();
                } else {
                    alert("Erro ao adicionar produto. Verifique o console.");
                }
            }
        });

        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'preencherForm') {
                const { id, nome, teste } = e.data.produto;
                const idProdutoElement = document.getElementById('idProduto');
                const nomeProdutoElement = document.getElementById('nomeProduto');
                const testeProdutoElement = document.getElementById('testeProduto');

                if (idProdutoElement && nomeProdutoElement && testeProdutoElement) {
                    idProdutoElement.value = id;
                    nomeProdutoElement.value = nome;
                    testeProdutoElement.value = teste;
                } else {
                    console.error("Elementos do formulário não encontrados!");
                }
            }
        });
    } else {
        console.error("Elemento com ID 'formProduto' não encontrado! Verifique o popup.html");
    }
});