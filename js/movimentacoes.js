import { getFirestore, collection, onSnapshot, deleteDoc, doc, getDoc } from "./firebase.js"

document.addEventListener("DOMContentLoaded", () => {
  const db = getFirestore()

  // Refs
  const btnNovaMovimentacao = document.getElementById("novaMovimentacao")
  const popupNovaMovimentacao = document.getElementById("popupNovaMovimentacao")
  const fecharPopupMov = document.getElementById("fecharPopupMov")
  const tabela = document.querySelector(".container-conteudo-principal--produtos--tabela--estoque tbody")
  const iframe = popupNovaMovimentacao?.querySelector("iframe")
  const inputPesquisa = document.querySelector(
    ".container-conteudo-principal--produtos-cabecalho-filtro-pesquisa-btn-pesquisa",
  )

  if (!btnNovaMovimentacao || !popupNovaMovimentacao || !fecharPopupMov || !tabela || !iframe) {
    console.error("[movimentacoes] Elementos essenciais não encontrados")
    return
  }

  // Helpers
  function setAriaOpen(isOpen) {
    popupNovaMovimentacao.setAttribute("aria-hidden", String(!isOpen))
    document.body.style.overflow = isOpen ? "hidden" : ""
  }

  function openPopup(clean = true) {
    popupNovaMovimentacao.classList.add("open")
    popupNovaMovimentacao.style.display = "flex"
    setAriaOpen(true)
    if (clean) {
      iframe.contentWindow?.postMessage({ type: "limpar-movimentacao" }, "*")
    }
  }

  function closePopup() {
    popupNovaMovimentacao.classList.remove("open")
    popupNovaMovimentacao.style.display = "none"
    setAriaOpen(false)
  }

  // Events
  btnNovaMovimentacao.addEventListener("click", (e) => {
    e.preventDefault()
    openPopup(true)
  })

  fecharPopupMov.addEventListener("click", closePopup)

  popupNovaMovimentacao.addEventListener("click", (e) => {
    if (e.target === popupNovaMovimentacao) closePopup()
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup()
  })

  function adicionarOuAtualizarLinha(movimentacao) {
    let linha = tabela.querySelector(`tr[data-id="${movimentacao.id}"]`)
    if (!linha) {
      linha = tabela.insertRow()
      linha.dataset.id = movimentacao.id
    }

    const displayId = movimentacao.sequenceId || movimentacao.id

    const dataHora = movimentacao.data_hora ? new Date(movimentacao.data_hora).toLocaleString("pt-BR") : "-"

    linha.dataset.data_hora = movimentacao.data_hora || ""
    linha.dataset.responsavel = movimentacao.responsavel || ""
    linha.dataset.status = movimentacao.status || ""
    linha.dataset.produto_nome = movimentacao.produto_nome || ""
    linha.dataset.sequenceId = displayId || ""
    linha.dataset.fornecedor = movimentacao.fornecedor || ""

    const statusBadges = {
      entrada: '<span class="status-badge status-entrada">Entrada</span>',
      saida: '<span class="status-badge status-saida">Saída</span>',
      transferencia: '<span class="status-badge status-transferencia">Transferência</span>',
      ajuste: '<span class="status-badge status-ajuste">Ajuste</span>',
    }
    const statusHtml =
      statusBadges[movimentacao.status] || `<span class="status-badge">${movimentacao.status || "-"}</span>`

    linha.innerHTML = `
      <td><input type="checkbox" class="tabela-checkbox" data-id="${movimentacao.id}" /></td>
      <td>${displayId}</td>
      <td>${dataHora}</td>
      <td>${movimentacao.responsavel || "-"}</td>
      <td>${movimentacao.produto_nome || "-"}</td>
      <td>${movimentacao.quantidade || 0}</td>
      <td>${statusHtml}</td>
      <td>${movimentacao.fornecedor || "-"}</td>
      <td>${movimentacao.observacoes || "-"}</td>
      <td>
        <div class="acoes-produto">
          <button class="editar-movimentacao editar-produto" data-id="${movimentacao.id}" type="button" title="Editar movimentação" disabled>Editar</button>
          <button class="deletar-movimentacao deletar-produto" data-id="${movimentacao.id}" type="button" title="Deletar movimentação" disabled>Deletar</button>
        </div>
      </td>
    `

    adicionarEventosNaLinha(linha)
  }

  function adicionarEventosNaLinha(linha) {
    const checkbox = linha.querySelector("input.tabela-checkbox")
    const editarBtn = linha.querySelector(".editar-movimentacao")
    const deletarBtn = linha.querySelector(".deletar-movimentacao")
    const acoes = linha.querySelector(".acoes-produto")

    if (checkbox && acoes) {
      checkbox.addEventListener("change", function () {
        if (this.checked) {
          // Uncheck all other checkboxes
          const allCheckboxes = tabela.querySelectorAll("input.tabela-checkbox")
          allCheckboxes.forEach((cb) => {
            if (cb !== this) {
              cb.checked = false
              // Disable buttons for unchecked rows
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

      // Initialize buttons as disabled
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
        const movId = this.dataset.id
        const snap = await getDoc(doc(db, "movimentacoes", movId))
        const movimentacao = { id: snap.id, ...snap.data() }
        abrirPopupEditar(movimentacao)
      })
    }

    if (deletarBtn) {
      deletarBtn.addEventListener("click", async function () {
        if (this.disabled) return
        const movId = this.dataset.id
        if (confirm("Tem certeza que deseja deletar esta movimentação?")) {
          await deletarMovimentacao(movId)
        }
      })
    }
  }

  function filtrarPorPesquisa(termo) {
    const termo_lower = (termo || "").toLowerCase().trim()
    const linhas = tabela.querySelectorAll("tr")

    linhas.forEach((linha) => {
      if (!termo_lower) {
        linha.style.display = ""
        return
      }

      const produtoNome = (linha.dataset.produto_nome || "").toLowerCase()
      const match = produtoNome.includes(termo_lower)

      linha.style.display = match ? "" : "none"
    })
  }

  if (inputPesquisa) {
    inputPesquisa.addEventListener("input", (e) => {
      filtrarPorPesquisa(e.target.value)
    })
  }

  onSnapshot(collection(db, "movimentacoes"), (querySnapshot) => {
    tabela.innerHTML = ""
    const movimentacoes = []
    querySnapshot.forEach((docSnap) => {
      movimentacoes.push({ id: docSnap.id, ...docSnap.data() })
    })

    movimentacoes.sort((a, b) => {
      if (a.sequenceId && b.sequenceId) {
        return (a.sequenceId || 0) - (b.sequenceId || 0)
      }
      const dateA = new Date(a.data_hora || 0)
      const dateB = new Date(b.data_hora || 0)
      return dateB - dateA
    })

    movimentacoes.forEach((movimentacao) => {
      adicionarOuAtualizarLinha(movimentacao)
    })
  })

  window.addEventListener("message", (event) => {
    const payload = event.data || {}
    const srcOk = event.source === iframe.contentWindow

    if (!srcOk) return

    if (payload.type === "movimentacao:salvar" && payload.movimentacao) {
      closePopup()
    }

    if (payload.type === "movimentacao:fechar") {
      closePopup()
    }
  })

  // Helpers
  function abrirPopupEditar(movimentacao) {
    openPopup(false)
    iframe.contentWindow?.postMessage({ type: "preencherForm", movimentacao }, "*")
  }

  async function deletarMovimentacao(movId) {
    try {
      await deleteDoc(doc(db, "movimentacoes", movId))
    } catch (error) {
      console.error("[movimentacoes] Erro ao deletar:", error)
    }
  }
})
