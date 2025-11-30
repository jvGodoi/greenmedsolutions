import { getFirestore, collection, getDocs } from "./firebase.js"

const db = getFirestore()
    ; (() => {
        const btnAbrir = document.getElementById("btnAbrirFiltro")
        const backdrop = document.getElementById("filtroBackdrop")
        const modal = document.getElementById("filtroModal")

        const form = document.getElementById("filtroForm")
        const inpStatus = document.getElementById("fStatus")
        const inpProduto = document.getElementById("fProduto")
        const produtoDropdown = document.getElementById("fProdutoDropdown")
        const inpResponsavel = document.getElementById("fResponsavel")
        const inpFornecedor = document.getElementById("fFornecedor")

        const btnFecharX = document.getElementById("btnFiltroFecharX")
        const btnCancelar = document.getElementById("btnFiltroCancelar")
        const btnLimpar = document.getElementById("btnFiltroLimpar")
        const btnAplicar = document.getElementById("btnFiltroAplicar")

        const tbody = document.getElementById("movimentacoesTabela")

        let lastFocused = null
        let allProdutos = []
        let allResponsaveis = []
        let allFornecedores = []

        async function carregarProdutos() {
            try {
                const querySnapshot = await getDocs(collection(db, "produtos"))
                allProdutos = []
                querySnapshot.forEach((doc) => {
                    allProdutos.push({
                        id: doc.id,
                        sequenceId: doc.data().sequenceId,
                        nome: doc.data().nome,
                        ...doc.data(),
                    })
                })
            } catch (error) {
                console.error("[filtro-movimentacoes] Erro ao carregar produtos:", error)
            }
        }

        async function carregarDadosMovimentacoes() {
            try {
                const querySnapshot = await getDocs(collection(db, "movimentacoes"))
                const responsaveisSet = new Set()
                const fornecedoresSet = new Set()

                querySnapshot.forEach((doc) => {
                    const data = doc.data()
                    if (data.responsavel && data.responsavel.trim()) {
                        responsaveisSet.add(data.responsavel.trim())
                    }
                    if (data.fornecedor && data.fornecedor.trim()) {
                        fornecedoresSet.add(data.fornecedor.trim())
                    }
                })

                allResponsaveis = Array.from(responsaveisSet).sort()
                allFornecedores = Array.from(fornecedoresSet).sort()
            } catch (error) {
                console.error("[filtro-movimentacoes] Erro ao carregar dados das movimentações:", error)
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
          <div class="produto-item" data-nome="${p.nome}" style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--np-border); display: flex; justify-content: space-between; align-items: center;">
            <span><strong>${p.nome}</strong></span>
            <span style="color: var(--np-muted); font-size: 12px;">ID: ${p.sequenceId}</span>
          </div>
        `,
                )
                .join("")

            produtoDropdown.style.display = "block"

            // Add click listeners to items
            document.querySelectorAll(".produto-item").forEach((item) => {
                item.addEventListener("click", () => {
                    const nome = item.getAttribute("data-nome")
                    inpProduto.value = nome
                    produtoDropdown.style.display = "none"
                })
            })
        }

        function filtrarResponsaveis(query) {
            const dropdown = document.getElementById("fResponsavelDropdown")
            if (!dropdown) return

            if (!query.trim()) {
                dropdown.style.display = "none"
                return
            }

            const queryLower = query.toLowerCase()
            const filtrados = allResponsaveis.filter((r) => r.toLowerCase().includes(queryLower))

            if (filtrados.length === 0) {
                dropdown.innerHTML = '<div style="padding: 12px; color: var(--np-muted);">Nenhum responsável encontrado</div>'
                dropdown.style.display = "block"
                return
            }

            dropdown.innerHTML = filtrados
                .map(
                    (r) => `
          <div class="responsavel-item" data-nome="${r}" style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--np-border);">
            <span>${r}</span>
          </div>
        `,
                )
                .join("")

            dropdown.style.display = "block"

            document.querySelectorAll(".responsavel-item").forEach((item) => {
                item.addEventListener("click", () => {
                    const nome = item.getAttribute("data-nome")
                    inpResponsavel.value = nome
                    dropdown.style.display = "none"
                })
            })
        }

        function filtrarFornecedores(query) {
            const dropdown = document.getElementById("fFornecedorDropdown")
            if (!dropdown) return

            if (!query.trim()) {
                dropdown.style.display = "none"
                return
            }

            const queryLower = query.toLowerCase()
            const filtrados = allFornecedores.filter((f) => f.toLowerCase().includes(queryLower))

            if (filtrados.length === 0) {
                dropdown.innerHTML = '<div style="padding: 12px; color: var(--np-muted);">Nenhum fornecedor encontrado</div>'
                dropdown.style.display = "block"
                return
            }

            dropdown.innerHTML = filtrados
                .map(
                    (f) => `
          <div class="fornecedor-item" data-nome="${f}" style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--np-border);">
            <span>${f}</span>
          </div>
        `,
                )
                .join("")

            dropdown.style.display = "block"

            document.querySelectorAll(".fornecedor-item").forEach((item) => {
                item.addEventListener("click", () => {
                    const nome = item.getAttribute("data-nome")
                    inpFornecedor.value = nome
                    dropdown.style.display = "none"
                })
            })
        }

        inpProduto?.addEventListener("input", (e) => {
            filtrarProdutos(e.target.value)
        })

        inpResponsavel?.addEventListener("input", (e) => {
            filtrarResponsaveis(e.target.value)
        })

        inpFornecedor?.addEventListener("input", (e) => {
            filtrarFornecedores(e.target.value)
        })

        document.addEventListener("click", (e) => {
            if (e.target !== inpProduto && e.target !== produtoDropdown) {
                produtoDropdown.style.display = "none"
            }

            const respDropdown = document.getElementById("fResponsavelDropdown")
            if (respDropdown && e.target !== inpResponsavel && e.target !== respDropdown) {
                respDropdown.style.display = "none"
            }

            const fornDropdown = document.getElementById("fFornecedorDropdown")
            if (fornDropdown && e.target !== inpFornecedor && e.target !== fornDropdown) {
                fornDropdown.style.display = "none"
            }
        })

        function openModal() {
            lastFocused = document.activeElement
            backdrop.setAttribute("aria-hidden", "false")
            modal.setAttribute("aria-hidden", "false")
            document.addEventListener("keydown", onEsc)
            inpStatus.focus()
            carregarProdutos()
            carregarDadosMovimentacoes()
        }

        function closeModal() {
            backdrop.setAttribute("aria-hidden", "true")
            modal.setAttribute("aria-hidden", "true")
            document.removeEventListener("keydown", onEsc)
            lastFocused?.focus()
        }

        function onEsc(e) {
            if (e.key === "Escape") closeModal()
        }

        function readCriteria() {
            const status = inpStatus.value.trim().toLowerCase()
            const produto = inpProduto.value.trim().toLowerCase()
            const responsavel = inpResponsavel.value.trim().toLowerCase()
            const fornecedor = inpFornecedor.value.trim().toLowerCase()
            return { status, produto, responsavel, fornecedor }
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

        function applyToTable(criteria) {
            if (!tbody) return

            const rows = tbody.querySelectorAll("tr")
            rows.forEach((tr) => {
                const rstatus = (tr.getAttribute("data-status") || "").toLowerCase()
                const rproduto = (tr.getAttribute("data-produto_nome") || "").toLowerCase()
                const rresponsavel = (tr.getAttribute("data-responsavel") || "").toLowerCase()
                const rfornecedor = (tr.getAttribute("data-fornecedor") || "").toLowerCase()

                let ok = true

                if (criteria.status && rstatus !== criteria.status) ok = false
                if (ok && !matches(rproduto, criteria.produto)) ok = false
                if (ok && !matches(rresponsavel, criteria.responsavel)) ok = false
                if (ok && !matches(rfornecedor, criteria.fornecedor)) ok = false

                tr.style.display = ok ? "" : "none"
            })
        }

        btnAbrir?.addEventListener("click", () => openModal())
        backdrop?.addEventListener("click", () => closeModal())
        btnFecharX?.addEventListener("click", () => closeModal())
        btnCancelar?.addEventListener("click", () => closeModal())

        btnLimpar?.addEventListener("click", () => {
            clearForm()
            applyToTable({ status: "", produto: "", responsavel: "", fornecedor: "" })
        })

        btnAplicar?.addEventListener("click", () => {
            const criteria = readCriteria()
            applyToTable(criteria)
            closeModal()
        })
    })()
