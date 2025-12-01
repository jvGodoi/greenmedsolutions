import { getFirestore, collection, addDoc, doc, updateDoc, getDocs } from "./firebase.js"

const db = getFirestore()

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("formMovimentacao")
    const produtoSearch = document.getElementById("produtoSearch")
    const produtoDropdown = document.getElementById("produtoDropdown")
    const produtoId = document.getElementById("produto_id")
    const produtoNome = document.getElementById("produto_nome")
    const fornecedorInput = document.getElementById("fornecedor")
    const btnCancelar = document.getElementById("np-cancelar")
    const btnSalvar = document.getElementById("np-salvar")
    const btnClose = document.getElementById("np-close")

    let allProdutos = []
    let currentMovimentacao = null

    async function carregarProdutos() {
        try {
            const querySnapshot = await getDocs(collection(db, "produtos"))
            allProdutos = []
            querySnapshot.forEach((doc) => {
                allProdutos.push({
                    id: doc.id,
                    sequenceId: doc.data().sequenceId,
                    nome: doc.data().nome,
                    fornecedor: doc.data().fornecedor,
                    ...doc.data(),
                })
            })
        } catch (error) {
            console.error("[popup-movimentacao] Erro ao carregar produtos:", error)
        }
    }

    function filtrarProdutos(query) {
        if (!query.trim()) {
            produtoDropdown.style.display = "none"
            return
        }

        const queryLower = query.toLowerCase()
        const filtrados = allProdutos.filter(
            (p) =>
                (p.nome && p.nome.toLowerCase().includes(queryLower)) || (p.sequenceId && String(p.sequenceId).includes(query)),
        )

        if (filtrados.length === 0) {
            produtoDropdown.innerHTML = '<div style="padding: 12px; color: var(--np-muted);">Nenhum produto encontrado</div>'
            produtoDropdown.style.display = "block"
            return
        }

        produtoDropdown.innerHTML = filtrados
            .map(
                (p) => `
      <div class="produto-item" data-id="${p.id}" data-sequence="${p.sequenceId}" data-nome="${p.nome}" data-fornecedor="${p.fornecedor || ""}" style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--np-border); display: flex; justify-content: space-between; align-items: center;">
        <span><strong>${p.nome}</strong></span>
        <span style="color: var(--np-muted); font-size: 12px;">ID: ${p.sequenceId}</span>
      </div>
    `,
            )
            .join("")

        produtoDropdown.style.display = "block"

        document.querySelectorAll(".produto-item").forEach((item) => {
            item.addEventListener("click", () => {
                const id = item.getAttribute("data-id")
                const sequence = item.getAttribute("data-sequence")
                const nome = item.getAttribute("data-nome")
                const fornecedor = item.getAttribute("data-fornecedor")

                produtoId.value = id
                produtoNome.value = nome
                produtoSearch.value = `${nome} (ID: ${sequence})`

                if (fornecedor) {
                    fornecedorInput.value = fornecedor
                }

                produtoDropdown.style.display = "none"
            })
        })
    }

    produtoSearch.addEventListener("input", (e) => {
        filtrarProdutos(e.target.value)
    })

    document.addEventListener("click", (e) => {
        if (e.target !== produtoSearch && e.target !== produtoDropdown) {
            produtoDropdown.style.display = "none"
        }
    })

    await carregarProdutos()

    btnCancelar.addEventListener("click", () => {
        window.parent.postMessage({ type: "movimentacao:fechar" }, "*")
    })

    btnClose.addEventListener("click", () => {
        window.parent.postMessage({ type: "movimentacao:fechar" }, "*")
    })

    async function getNextSequenceId() {
        const snapshot = await getDocs(collection(db, "movimentacoes"))
        let maxId = 0
        snapshot.forEach((doc) => {
            const data = doc.data()
            if (data.sequenceId && data.sequenceId > maxId) {
                maxId = data.sequenceId
            }
        })
        return maxId + 1
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault()

        if (!produtoId.value) {
            alert("Selecione um produto da lista")
            return
        }

        const formData = {
            produto_id: produtoId.value,
            produto_nome: produtoNome.value,
            quantidade: Number(document.getElementById("quantidade").value),
            status: document.getElementById("status").value,
            fornecedor: document.getElementById("fornecedor").value,
            responsavel: document.getElementById("responsavel").value,
            observacoes: document.getElementById("observacoes").value,
            data_hora: new Date().toISOString(),
        }

        if (!formData.quantidade || !formData.status || !formData.responsavel) {
            alert("Preencha todos os campos obrigatórios")
            return
        }

        try {
            if (currentMovimentacao) {
                await updateDoc(doc(db, "movimentacoes", currentMovimentacao.id), {
                    ...formData,
                    data_hora: currentMovimentacao.data_hora,
                    sequenceId: currentMovimentacao.sequenceId,
                })
            } else {
                const sequenceId = await getNextSequenceId()
                await addDoc(collection(db, "movimentacoes"), {
                    ...formData,
                    sequenceId,
                })
            }

            window.parent.postMessage({ type: "movimentacao:salvar", movimentacao: formData }, "*")
        } catch (error) {
            console.error("[popup-movimentacao] Erro ao salvar:", error)
            alert("Erro ao salvar movimentação")
        }
    })

    window.addEventListener("message", (event) => {
        const { type, movimentacao } = event.data || {}

        if (type === "limpar-movimentacao") {
            form.reset()
            produtoSearch.value = ""
            produtoId.value = ""
            produtoNome.value = ""
            currentMovimentacao = null
        }

        if (type === "preencherForm" && movimentacao) {
            currentMovimentacao = movimentacao
            produtoId.value = movimentacao.produto_id || ""
            produtoNome.value = movimentacao.produto_nome || ""
            produtoSearch.value = movimentacao.produto_nome || ""
            document.getElementById("quantidade").value = movimentacao.quantidade || ""
            document.getElementById("status").value = movimentacao.status || ""
            document.getElementById("fornecedor").value = movimentacao.fornecedor || ""
            document.getElementById("responsavel").value = movimentacao.responsavel || ""
            document.getElementById("observacoes").value = movimentacao.observacoes || ""
        }
    })
})
