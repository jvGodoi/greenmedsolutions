import { getFirestore, collection, onSnapshot, deleteDoc, doc, getDoc } from "./firebase.js"

document.addEventListener("DOMContentLoaded", () => {
  const db = getFirestore()

  // --- Refs do popup "Novo Produto" ---
  const btnNovoProduto = document.getElementById("novoProduto")
  const popupNovoProduto = document.getElementById("popupNovoProduto")
  const fecharPopup = document.getElementById("fecharPopup")
  const tabela = document.querySelector(".container-conteudo-principal--produtos--tabela--estoque tbody")
  const tabelaProdutos = tabela
  const iframe = popupNovoProduto?.querySelector("iframe")
  const inputPesquisa = document.querySelector(
    ".container-conteudo-principal--produtos-cabecalho-filtro-pesquisa-btn-pesquisa",
  )

  if (!btnNovoProduto || !popupNovoProduto || !fecharPopup || !tabela || !iframe) {
    console.error("[estoque] Elementos essenciais não encontrados. Verifique o HTML.")
    return
  }

  // ---------- Helpers de abertura/fechamento ----------
  function setAriaOpen(isOpen) {
    popupNovoProduto.setAttribute("aria-hidden", String(!isOpen))
    document.body.style.overflow = isOpen ? "hidden" : ""
  }

  function openPopup(clean = true) {
    popupNovoProduto.classList.add("open")
    popupNovoProduto.style.display = "flex"
    setAriaOpen(true)
    if (clean) {
      iframe.contentWindow?.postMessage({ type: "novo-produto:limpar" }, "*")
    }
  }

  function closePopup() {
    popupNovoProduto.classList.remove("open")
    popupNovoProduto.style.display = "none"
    setAriaOpen(false)
  }

  // ---------- UI: abrir/fechar ----------
  btnNovoProduto.addEventListener("click", (e) => {
    e.preventDefault()
    openPopup(true)
  })

  fecharPopup.addEventListener("click", closePopup)

  popupNovoProduto.addEventListener("click", (e) => {
    if (e.target === popupNovoProduto) closePopup()
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup()
  })

  iframe.addEventListener("load", () => {
    try {
      const docIframe = iframe.contentDocument || iframe.contentWindow.document
      const innerClose = docIframe.getElementById("np-close")
      if (innerClose) innerClose.remove()
    } catch (err) {
      console.warn("[estoque] Não foi possível acessar o iframe para remover #np-close:", err)
    }
  })

  // ---------- Tabela: criar/atualizar/remover ----------
  function adicionarEventosNaLinha(linha) {
    const checkbox = linha.querySelector("input.tabela-checkbox")
    const editarBtn = linha.querySelector(".editar-produto")
    const deletarBtn = linha.querySelector(".deletar-produto")
    const acoes = linha.querySelector(".acoes-produto")

    if (checkbox && acoes) {
      checkbox.addEventListener("change", function () {
        if (this.checked) {
          const allCheckboxes = tabela.querySelectorAll("input.tabela-checkbox")
          allCheckboxes.forEach((cb) => {
            if (cb !== this) {
              cb.checked = false
              const otherRow = cb.closest("tr")
              const otherAcoes = otherRow?.querySelector(".acoes-produto")
              if (otherAcoes) {
                const otherButtons = otherAcoes.querySelectorAll("button")
                otherButtons.forEach((btn) => {
                  btn.disabled = true
                  btn.style.opacity = "0.5"
                  btn.style.cursor = "not-allowed"
                })
              }
            }
          })
        }

        // Enable/disable buttons for current row
        const buttons = acoes.querySelectorAll("button")
        buttons.forEach((btn) => {
          btn.disabled = !this.checked
          btn.style.opacity = this.checked ? "1" : "0.5"
          btn.style.cursor = this.checked ? "pointer" : "not-allowed"
        })
      })

      const buttons = acoes.querySelectorAll("button")
      buttons.forEach((btn) => {
        btn.disabled = true
        btn.style.opacity = "0.5"
        btn.style.cursor = "not-allowed"
      })
    }

    if (editarBtn) {
      editarBtn.addEventListener("click", async function () {
        if (this.disabled) return
        const produtoId = this.dataset.id
        if (!produtoId) return console.error("[estoque] dataset.id ausente no botão Editar")
        const snap = await getDoc(doc(db, "produtos", produtoId))
        const produto = { id: snap.id, ...snap.data() }
        abrirPopupEditar(produto)
      })
    }

    if (deletarBtn) {
      deletarBtn.addEventListener("click", async function () {
        if (this.disabled) return
        const produtoId = this.dataset.id
        if (!produtoId) return console.error("[estoque] dataset.id ausente no botão Deletar")
        if (confirm("Tem certeza que deseja deletar este produto?")) {
          await deletarProduto(produtoId)
        }
      })
    }
  }

  const adicionarOuAtualizarLinha = (produto) => {
    let linha = tabela.querySelector(`tr[data-id="${produto.id}"]`)
    if (!linha) {
      linha = tabela.insertRow()
      linha.dataset.id = produto.id
    }
    const displayId = produto.sequenceId || produto.id

    linha.dataset.nome = produto.nome || ""
    linha.dataset.quantidade = produto.quantidade || "0"
    linha.dataset.fornecedor = produto.fornecedor || ""
    linha.dataset.descricao = produto.descricao || ""
    linha.dataset.sequenceId = displayId || ""

    linha.innerHTML = `
      <td><input type="checkbox" class="tabela-checkbox" data-id="${produto.id}" /></td>
      <td>${displayId}</td>
      <td class="celulaNome">${produto.nome ?? ""}</td>
      <td class="celulaQuantidade">${produto.quantidade ?? ""}</td>
      <td class="celulaFornecedor">${produto.fornecedor ?? ""}</td>
      <td class="celulaDescricao">${produto.descricao ?? ""}</td>
      <td>
        <div class="acoes-produto">
          <button class="editar-produto" data-id="${produto.id}" type="button" title="Editar produto" disabled>Editar</button>
          <button class="deletar-produto" data-id="${produto.id}" type="button" title="Deletar produto" disabled>Deletar</button>
        </div>
      </td>
    `
    adicionarEventosNaLinha(linha)
  }

  function atualizarProdutoNaTabela(produto) {
    const linha = tabelaProdutos.querySelector(`tr[data-id="${produto.id}"]`)
    if (!linha) return console.warn(`[estoque] Linha do produto ${produto.id} não encontrada p/ atualizar.`)
    linha.querySelector(".celulaNome")?.replaceChildren(document.createTextNode(produto.nome || ""))
    linha.querySelector(".celulaQuantidade")?.replaceChildren(document.createTextNode(produto.quantidade || ""))
    linha.querySelector(".celulaFornecedor")?.replaceChildren(document.createTextNode(produto.fornecedor || ""))
    linha.querySelector(".celulaDescricao")?.replaceChildren(document.createTextNode(produto.descricao || ""))
  }

  const removerProdutoDaTabela = (produtoId) => {
    const linha = tabela.querySelector(`tr[data-id="${produtoId}"]`)
    if (linha) linha.remove()
  }

  function filtrarPorPesquisa(termo) {
    const termo_lower = (termo || "").toLowerCase().trim()
    const linhas = tabela.querySelectorAll("tr")

    linhas.forEach((linha) => {
      if (!termo_lower) {
        linha.style.display = ""
        return
      }

      // Only search in Nome column
      const nome = (linha.dataset.nome || "").toLowerCase()
      const match = nome.includes(termo_lower)

      linha.style.display = match ? "" : "none"
    })
  }

  if (inputPesquisa) {
    inputPesquisa.addEventListener("input", (e) => {
      filtrarPorPesquisa(e.target.value)
    })
  }

  // ---------- Firestore: realtime ----------
  onSnapshot(collection(db, "produtos"), (querySnapshot) => {
    tabela.innerHTML = ""
    const produtos = []
    querySnapshot.forEach((docSnap) => {
      produtos.push({ id: docSnap.id, ...docSnap.data() })
    })

    produtos.sort((a, b) => (a.sequenceId || 0) - (b.sequenceId || 0))

    produtos.forEach((produto) => {
      adicionarOuAtualizarLinha(produto)
    })
  })

  // ---------- Comunicação com o iframe ----------
  window.addEventListener("message", (event) => {
    const payload = event.data || {}
    const srcOk = event.source === iframe.contentWindow

    if (!srcOk) return

    if (payload.type === "produtoAtualizado" && payload.produto) {
      adicionarOuAtualizarLinha(payload.produto)
      closePopup()
    }

    if (payload.type === "novo-produto:salvar" && payload.produto) {
      adicionarOuAtualizarLinha(payload.produto)
      closePopup()
    }
    if (payload.type === "novo-produto:fechar") {
      closePopup()
    }
  })

  // ---------- Ações auxiliares ----------
  function abrirPopupEditar(produto) {
    openPopup(false)
    iframe.contentWindow?.postMessage({ type: "preencherForm", produto: { ...produto, id: produto.id } }, "*")
  }

  async function deletarProduto(produtoId) {
    try {
      await deleteDoc(doc(db, "produtos", produtoId))
    } catch (error) {
      console.error("[estoque] Erro ao deletar produto:", error)
    }
  }
})
