; (() => {
  const LS_KEY = "estoque_filtros_v1"

  /* ---- Refs ---- */
  const btnAbrir = document.getElementById("btnAbrirFiltro")
  const backdrop = document.getElementById("filtroBackdrop")
  const modal = document.getElementById("filtroModal")

  const form = document.getElementById("filtroForm")
  const inpId = document.getElementById("fId")
  const inpNome = document.getElementById("fNome")
  const inpQtdMin = document.getElementById("fQtdMin")
  const inpQtdMax = document.getElementById("fQtdMax")
  const inpFornecedor = document.getElementById("fFornecedor")
  const inpDescricao = document.getElementById("fDescricao")

  const btnFecharX = document.getElementById("btnFiltroFecharX")
  const btnCancelar = document.getElementById("btnFiltroCancelar")
  const btnLimpar = document.getElementById("btnFiltroLimpar")
  const btnAplicar = document.getElementById("btnFiltroAplicar")

  const tbody = document.getElementById("produtosTabela")

  /* ---- Estado ---- */
  let lastFocused = null

  /* ---- Modal A11y ---- */
  function openModal() {
    lastFocused = document.activeElement
    backdrop.setAttribute("aria-hidden", "false")
    modal.setAttribute("aria-hidden", "false")
    document.addEventListener("keydown", onEsc)
    document.addEventListener("keydown", focusTrap)
    inpId.focus()
  }

  function closeModal() {
    backdrop.setAttribute("aria-hidden", "true")
    modal.setAttribute("aria-hidden", "true")
    document.removeEventListener("keydown", onEsc)
    document.removeEventListener("keydown", focusTrap)
    lastFocused?.focus()
  }

  function onEsc(e) {
    if (e.key === "Escape") closeModal()
  }

  function focusTrap(e) {
    if (e.key !== "Tab") return
    const f = modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
    if (!f.length) return
    const first = f[0],
      last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      last.focus()
      e.preventDefault()
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus()
      e.preventDefault()
    }
  }

  /* ---- Helpers ---- */
  function readCriteria() {
    const id = inpId.value !== "" ? Number(inpId.value) : null
    const nome = (inpNome.value || "").trim().toLowerCase()
    const fornecedor = (inpFornecedor.value || "").trim().toLowerCase()
    const descricao = (inpDescricao.value || "").trim().toLowerCase()

    const qtdMin = inpQtdMin.value !== "" ? Number(inpQtdMin.value) : null
    const qtdMax = inpQtdMax.value !== "" ? Number(inpQtdMax.value) : null

    return { id, nome, qtdMin, qtdMax, fornecedor, descricao }
  }

  function saveCriteria(c) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(c))
    } catch (_) { }
  }

  function loadCriteria() {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch (_) {
      return null
    }
  }

  function restoreForm(c) {
    if (!c) return
    inpId.value = c.id ?? ""
    inpNome.value = c.nome || ""
    inpQtdMin.value = c.qtdMin ?? ""
    inpQtdMax.value = c.qtdMax ?? ""
    inpFornecedor.value = c.fornecedor || ""
    inpDescricao.value = c.descricao || ""
  }

  function clearForm() {
    form.reset()
  }

  function matches(value, needle) {
    if (!needle) return true
    return String(value || "")
      .toLowerCase()
      .includes(needle)
  }

  /* ---- Aplicação local na tabela ---- */
  function applyToTable(criteria) {
    if (!tbody) return

    const rows = tbody.querySelectorAll("tr")
    rows.forEach((tr) => {
      const rsequenceId = tr.getAttribute("data-sequenceId") ? Number(tr.getAttribute("data-sequenceId")) : null
      const rnome = (tr.getAttribute("data-nome") || "").toLowerCase()
      const rfornecedor = (tr.getAttribute("data-fornecedor") || "").toLowerCase()
      const rdescricao = (tr.getAttribute("data-descricao") || "").toLowerCase()
      const rquant = Number(tr.getAttribute("data-quantidade") || "0")

      let ok = true

      if (criteria.id != null && rsequenceId !== criteria.id) ok = false
      if (ok && !matches(rnome, criteria.nome)) ok = false
      if (ok && !matches(rfornecedor, criteria.fornecedor)) ok = false
      if (ok && !matches(rdescricao, criteria.descricao)) ok = false
      if (ok && criteria.qtdMin != null && rquant < criteria.qtdMin) ok = false
      if (ok && criteria.qtdMax != null && rquant > criteria.qtdMax) ok = false

      tr.style.display = ok ? "" : "none"
    })
  }

  /* ---- Evento público ---- */
  function emitCriteria(criteria) {
    document.dispatchEvent(new CustomEvent("estoque:apply-filters", { detail: criteria }))
  }

  /* ---- Eventos ---- */
  btnAbrir?.addEventListener("click", () => openModal())
  backdrop?.addEventListener("click", () => closeModal())
  btnFecharX?.addEventListener("click", () => closeModal())
  btnCancelar?.addEventListener("click", () => closeModal())

  btnLimpar?.addEventListener("click", () => {
    clearForm()
    const criteria = readCriteria()
    saveCriteria(criteria)
    applyToTable(criteria)
    emitCriteria(criteria)
  })

  btnAplicar?.addEventListener("click", () => {
    const criteria = readCriteria()
    saveCriteria(criteria)
    applyToTable(criteria)
    emitCriteria(criteria)
    closeModal()
  })

  const saved = loadCriteria()
  if (saved) {
    restoreForm(saved)
    applyToTable(saved)
    emitCriteria(saved)
  }
})()
