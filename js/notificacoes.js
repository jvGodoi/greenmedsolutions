/* ===== Notificações – lógica ===== */
/* Este módulo assume que os elementos do HTML existem (ids e classes).
   Integra com o botão do sino, popover de lista e modal de detalhe.
   Tecla de atalho: "N" abre/fecha o popover.
*/

; (() => {
  /* ====== Dados de EXEMPLO (troque por fetch/REST) ======
     Cada item: { id, titulo, texto, conteudo, quando, href, unread } */
  let notificacoes = [
    {
      id: "n1",
      titulo: "Nova atualização disponível",
      texto: "Uma nova versão do sistema está disponível para instalação.",
      conteudo:
        'Versão 2.8.1 disponível.\n\nNovidades:\n• Melhorias de desempenho\n• Correções de segurança\n\nClique em "Ir para" para abrir a página de atualização.',
      quando: "Há 5 minutos",
      href: "#atualizacao",
      unread: true,
    },
    {
      id: "n2",
      titulo: "Backup concluído",
      texto: "O backup automático dos seus dados foi concluído com sucesso.",
      conteudo:
        "Backup finalizado às 13:02.\nTotal de arquivos: 1.245\nTamanho: 2,4 GB\n\nVocê pode restaurar itens a partir do painel de Backups.",
      quando: "Há 1 hora",
      href: "#backup",
      unread: true,
    },
    {
      id: "n3",
      titulo: "Manutenção programada",
      texto: "O sistema entrará em manutenção amanhã às 02:00.",
      conteudo:
        "Janela de manutenção: 02:00–03:30 (BRT).\nServiços afetados: autenticação e relatórios.\n\nDurante o período, o login pode ficar indisponível.",
      quando: "Há 3 horas",
      href: "#manutencao",
      unread: false,
    },
    {
      id: "n4",
      titulo: "Novo comentário",
      texto: "Você recebeu um novo comentário no seu relatório.",
      conteudo: '"Conferi os números da seção 3 e acrescentei observações."\n\nAbra o relatório para responder.',
      quando: "Ontem",
      href: "#comentario",
      unread: false,
    },
  ]

  /* ====== Refs ====== */
  const refs = {
    // header
    btn: document.getElementById("btnNotificacoes"),
    badge: document.getElementById("notifBadge"),
    live: document.getElementById("notifLive"),
    // popover (lista)
    pop: document.getElementById("notifPopover"),
    sub: document.getElementById("notifSubtitle"),
    list: document.getElementById("listaNotificacoes"),
    btnClose: document.getElementById("btnFechar"),
    btnDelAll: document.getElementById("btnExcluirTodas"),
    selBar: document.getElementById("selBar"),
    selInfo: document.getElementById("selInfo"),
    btnSelAll: document.getElementById("btnSelecionarTudo"),
    btnDelSel: document.getElementById("btnExcluirSelecionadas"),
    // modal
    modal: document.getElementById("notifModal"),
    backdrop: document.getElementById("notifBackdrop"),
    modalTitle: document.getElementById("modalTitle"),
    modalMeta: document.getElementById("modalMeta"),
    modalText: document.getElementById("modalText"),
    modalLink: document.getElementById("modalLink"),
    btnModalClose: document.getElementById("btnModalClose"),
    btnModalClose2: document.getElementById("btnModalClose2"),
  }

  /* ===== Helpers ===== */
  function unreadCount() {
    return notificacoes.filter((n) => n.unread).length
  }

  function escapeHtml(s = "") {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;")
  }

  function announce(msg) {
    if (!refs.live) return
    refs.live.textContent = ""
    setTimeout(() => (refs.live.textContent = msg), 40)
  }

  /* ===== Render da lista ===== */
  function render() {
    // header
    const unread = unreadCount()
    if (refs.sub) refs.sub.textContent = `(${unread} nova${unread === 1 ? "" : "s"})`
    if (refs.badge) refs.badge.textContent = String(notificacoes.length)

    // lista
    if (!refs.list) return
    refs.list.innerHTML = ""

    if (!notificacoes.length) {
      refs.list.innerHTML = `<div style="color:var(--text-muted);padding:.75rem 0;">Nenhuma notificação por aqui.</div>`
      updateSelectionUI()
      return
    }

    for (const n of notificacoes) {
      const card = document.createElement("div")
      card.className = "notif-card"
      card.dataset.id = n.id
      card.innerHTML = `
        <input type="checkbox" aria-label="Selecionar ${escapeHtml(n.titulo)}" />
        <div>
          <p class="notif-card-title">
            ${escapeHtml(n.titulo)}
            ${n.unread ? '<span class="notif-dot" title="Nova"></span>' : ""}
          </p>
          <p class="notif-card-text">${escapeHtml(n.texto)}</p>
          <div class="notif-card-meta">${escapeHtml(n.quando)}</div>
        </div>
        <div class="notif-card-actions">
          <button class="notif-btn-open" type="button" data-open>Abrir</button>
        </div>
      `
      refs.list.appendChild(card)
    }
    updateSelectionUI()
  }

  /* ===== Ações - Popover ===== */
  function deleteAll() {
    if (!notificacoes.length) return
    // TODO: integração real: await fetch('/notifications', { method: 'DELETE' })
    notificacoes = []
    announce("Todas as notificações foram excluídas.")
    render()
  }

  function selectedIds() {
    return Array.from(refs.list.querySelectorAll('input[type="checkbox"]:checked'))
      .map((el) => el.closest(".notif-card")?.dataset.id)
      .filter(Boolean)
  }

  function deleteSelected() {
    const ids = selectedIds()
    if (!ids.length) return
    // TODO: integração real: await fetch('/notifications/bulk-delete', { method:'POST', body: JSON.stringify({ ids }) })
    notificacoes = notificacoes.filter((n) => !ids.includes(n.id))
    announce(`${ids.length} notificação(ões) excluída(s).`)
    render()
  }

  function toggleSelectAll() {
    const boxes = refs.list.querySelectorAll('input[type="checkbox"]')
    const all = Array.from(boxes).every((b) => b.checked)
    boxes.forEach((b) => (b.checked = !all))
    updateSelectionUI()
  }

  function updateSelectionUI() {
    const q = selectedIds().length
    refs.selInfo.textContent = `${q} selecionada(s)`
    refs.selBar.setAttribute("aria-hidden", q ? "false" : "true")
    refs.btnDelSel.disabled = q === 0
  }

  /* ===== Popover - abrir/fechar + acessibilidade ===== */
  let lastFocused = null

  function openPopover() {
    if (refs.pop.getAttribute("aria-hidden") === "false") return
    lastFocused = document.activeElement
    refs.pop.setAttribute("aria-hidden", "false")
    refs.btn?.setAttribute("aria-expanded", "true")

    document.addEventListener("mousedown", handleOutside, { capture: true })
    document.addEventListener("keydown", onEscPopover)
    document.addEventListener("keydown", focusTrapPopover)

    // foco inicial
    refs.btnDelAll.focus()
  }

  function closePopover() {
    if (refs.pop.getAttribute("aria-hidden") === "true") return
    refs.pop.setAttribute("aria-hidden", "true")
    refs.btn?.setAttribute("aria-expanded", "false")

    document.removeEventListener("mousedown", handleOutside, { capture: true })
    document.removeEventListener("keydown", onEscPopover)
    document.removeEventListener("keydown", focusTrapPopover)

    lastFocused?.focus()
  }

  function handleOutside(e) {
    if (!refs.pop.contains(e.target) && e.target !== refs.btn) {
      closePopover()
    }
  }
  function onEscPopover(e) {
    if (e.key === "Escape") closePopover()
  }

  function focusTrapPopover(e) {
    if (e.key !== "Tab") return
    const f = refs.pop.querySelectorAll('button,[href],input,[tabindex]:not([tabindex="-1"])')
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

  /* ===== Modal (detalhe) ===== */
  let modalLastFocused = null

  function openModal(notif) {
    // Preenche
    refs.modalTitle.textContent = notif.titulo
    refs.modalMeta.textContent = notif.quando
    refs.modalText.textContent = notif.conteudo || notif.texto || ""
    refs.modalLink.href = notif.href || "#"

    // Marca como lida
    notif.unread = false
    // TODO: integração real: await fetch(`/notifications/${notif.id}/read`, { method:'POST' })
    render()

    // Fecha popover e abre modal
    closePopover()

    modalLastFocused = document.activeElement
    refs.backdrop.setAttribute("aria-hidden", "false")
    refs.modal.setAttribute("aria-hidden", "false")

    document.addEventListener("keydown", onEscModal)
    document.addEventListener("keydown", focusTrapModal)

    // foco inicial do modal
    refs.btnModalClose.focus()
  }

  function closeModal() {
    refs.backdrop.setAttribute("aria-hidden", "true")
    refs.modal.setAttribute("aria-hidden", "true")
    document.removeEventListener("keydown", onEscModal)
    document.removeEventListener("keydown", focusTrapModal)
    modalLastFocused?.focus()
  }

  function onEscModal(e) {
    if (e.key === "Escape") closeModal()
  }

  function focusTrapModal(e) {
    if (e.key !== "Tab") return
    const f = refs.modal.querySelectorAll('button,[href],input,[tabindex]:not([tabindex="-1"])')
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

  /* ===== Eventos ===== */
  // Abrir/fechar por clique
  refs.btn?.addEventListener("click", () => {
    const open = refs.pop.getAttribute("aria-hidden") === "false"
    open ? closePopover() : openPopover()
  })

  // Popover – botões
  refs.btnClose?.addEventListener("click", closePopover)
  refs.btnDelAll?.addEventListener("click", deleteAll)
  refs.btnDelSel?.addEventListener("click", deleteSelected)
  refs.btnSelAll?.addEventListener("click", toggleSelectAll)

  // Popover – delegação
  refs.list?.addEventListener("change", (e) => {
    if (e.target.matches('input[type="checkbox"]')) updateSelectionUI()
  })
  refs.list?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open]")
    if (btn) {
      const id = e.target.closest(".notif-card")?.dataset.id
      const n = notificacoes.find((x) => x.id === id)
      if (n) openModal(n)
    }
  })

  // Modal
  refs.backdrop?.addEventListener("click", closeModal)
  refs.btnModalClose?.addEventListener("click", closeModal)
  refs.btnModalClose2?.addEventListener("click", closeModal)

  /* ===== Inicialização ===== */
  render()

  /* ===== Exemplo de integração (opcional)
     Descomente e adapte conforme sua API:

  async function loadNotifications() {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    notificacoes = data.items; // garanta o mesmo formato de objeto
    render();
  }

  async function deleteAllServer() {
    await fetch('/api/notifications', { method:'DELETE' });
    notificacoes = [];
    render();
  }

  */
})()
