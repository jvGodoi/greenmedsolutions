// js/popup.js
// Carrega como <script type="module" src="./js/popup.js"></script>
import { adicionarProdutoFirebase, editarProdutoFirebase } from "./firebase.js"

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formProduto")
  if (!form) {
    console.error("Elemento com ID 'formProduto' não encontrado! Verifique o popup.html")
    return
  }

  // refs
  const idInput = document.getElementById("idProduto")
  const nomeInput = document.getElementById("nomeProduto")
  const quantidadeInput = document.getElementById("quantidadeProduto")
  const fornecedorInput = document.getElementById("fornecedorProduto")
  const descricaoInput = document.getElementById("descricaoProduto")
  const salvarBtn = document.getElementById("np-salvar")
  const cancelarBtn = document.getElementById("np-cancelar")
  const closeBtn = document.getElementById("np-close")

  // foco inicial com pequeno atraso (garante render)
  setTimeout(() => nomeInput?.focus?.(), 50)

  // helpers de erro
  function setError(input, msg) {
    const span = form.querySelector(`[data-error-for="${input.id}"]`)
    if (span) span.textContent = msg || ""
    input.classList.toggle("is-invalid", !!msg)
    input.setAttribute("aria-invalid", msg ? "true" : "false")
  }
  function clearError(input) {
    setError(input, "")
  }
  // remove erro on input
  ;[nomeInput, quantidadeInput, fornecedorInput, descricaoInput].forEach((el) => {
    if (el) el.addEventListener("input", () => clearError(el))
  })

  // fechar via parent
  function fecharPopup() {
    window.parent?.postMessage({ type: "novo-produto:fechar" }, "*")
  }
  cancelarBtn?.addEventListener("click", fecharPopup)
  closeBtn?.addEventListener("click", fecharPopup)

  // preencher formulário (modo edição) via postMessage
  window.addEventListener("message", (e) => {
    if (!e?.data) return
    if (e.data.type === "preencherForm") {
      const { id, nome, quantidade, fornecedor, descricao } = e.data.produto || {}
      if (idInput) idInput.value = id ?? ""
      if (nomeInput) nomeInput.value = nome ?? ""
      if (quantidadeInput) quantidadeInput.value = quantidade ?? ""
      if (fornecedorInput) fornecedorInput.value = fornecedor ?? ""
      if (descricaoInput) descricaoInput.value = descricao ?? ""
      setTimeout(() => nomeInput?.focus?.(), 50)
    }
    if (e.data.type === "novo-produto:limpar") {
      form.reset()
      if (idInput) idInput.value = ""
      setTimeout(() => nomeInput?.focus?.(), 50)
    }
  })

  // SUBMIT ÚNICO (validação + Firebase + mensagens ao parent)
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    let ok = true

    if (!nomeInput?.value.trim()) {
      setError(nomeInput, "Informe o nome do produto.")
      ok = false
    } else clearError(nomeInput)

    if (!quantidadeInput?.value?.trim()) {
      setError(quantidadeInput, "Informe a quantidade.")
      ok = false
    } else clearError(quantidadeInput)

    if (!fornecedorInput?.value.trim()) {
      setError(fornecedorInput, "Informe o fornecedor.")
      ok = false
    } else clearError(fornecedorInput)

    if (!descricaoInput?.value.trim()) {
      setError(descricaoInput, "Informe a descrição.")
      ok = false
    } else clearError(descricaoInput)

    if (!ok) return

    // monta o objeto
    const produto = {
      id: idInput?.value?.trim() || null,
      nome: nomeInput.value.trim(),
      quantidade: Number.parseInt(quantidadeInput.value.trim()) || 0,
      fornecedor: fornecedorInput.value.trim(),
      descricao: descricaoInput.value.trim(),
    }

    // desabilita UI enquanto envia
    const oldText = salvarBtn?.textContent
    if (salvarBtn) {
      salvarBtn.disabled = true
      salvarBtn.textContent = "Salvando..."
    }

    try {
      let resultado
      if (produto.id) {
        // edição
        resultado = await editarProdutoFirebase(produto)
      } else {
        // novo
        resultado = await adicionarProdutoFirebase(produto)
      }

      if (!resultado) {
        throw new Error("Operação Firebase retornou resultado inválido.")
      }

      // informa a página mãe e fecha
      window.parent?.postMessage({ type: "produtoAtualizado", produto: resultado }, "*")

      if (salvarBtn) salvarBtn.textContent = "Salvo!"
      setTimeout(() => {
        form.reset()
        fecharPopup()
      }, 250)
    } catch (err) {
      console.error(err)
      alert("Não foi possível salvar o produto. Tente novamente.")
    } finally {
      // restaura botão (se ainda não fechou)
      setTimeout(() => {
        if (salvarBtn) {
          salvarBtn.disabled = false
          salvarBtn.textContent = oldText || "Salvar"
        }
      }, 300)
    }
  })
})
