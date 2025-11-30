import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js"
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    deleteDoc,
    onSnapshot,
    setDoc,
    getDocs,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js"

const firebaseConfig = {
    apiKey: "AIzaSyDV1vwxLJikHYW7E_0cZzVTr2uKU3s",
    authDomain: "teste-c146d.firebaseapp.com",
    projectId: "teste-c146d",
    storageBucket: "teste-c146d.appspot.com",
    messagingSenderId: "624684030810",
    appId: "1:624684030810:web:ead3ea1cb9f77af1f53163",
    measurementId: "G-7MYFP2S0YD",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export async function getNextId() {
    try {
        const counterRef = doc(db, "config", "productIdCounter")
        const snapshot = await getDoc(counterRef)
        let currentId = 0

        if (snapshot.exists()) {
            currentId = snapshot.data().counter || 0
        }

        const nextId = currentId + 1
        await setDoc(counterRef, { counter: nextId }, { merge: true })

        console.log("[v0] Próximo ID gerado:", nextId, "Counter atualizado para:", nextId)
        return nextId
    } catch (e) {
        console.warn("Error getting next ID:", e)
        return 1
    }
}

export async function updateProductIdCounter(newId) {
    try {
        await updateDoc(doc(db, "config", "productIdCounter"), {
            counter: newId,
            lastUpdated: serverTimestamp(),
        })
    } catch (e) {
        console.error("Error updating ID counter:", e)
    }
}

export async function adicionarProdutoFirebase(produto) {
    try {
        const nextId = await getNextId()
        console.log("[v0] Produto será criado com ID:", nextId)

        const docRef = await addDoc(collection(db, "produtos"), {
            sequenceId: nextId,
            nome: produto.nome,
            quantidade: Number.parseInt(produto.quantidade) || 0,
            fornecedor: produto.fornecedor,
            descricao: produto.descricao,
            timestamp: serverTimestamp(),
        })

        return {
            id: docRef.id,
            sequenceId: nextId,
            nome: produto.nome,
            quantidade: produto.quantidade,
            fornecedor: produto.fornecedor,
            descricao: produto.descricao,
        }
    } catch (e) {
        console.error("Erro ao adicionar produto:", e)
        return null
    }
}

export async function editarProdutoFirebase(produto) {
    try {
        await updateDoc(doc(db, "produtos", produto.id), {
            nome: produto.nome,
            quantidade: Number.parseInt(produto.quantidade) || 0,
            fornecedor: produto.fornecedor,
            descricao: produto.descricao,
            timestamp: serverTimestamp(),
        })
        return produto
    } catch (error) {
        console.error("Erro ao atualizar produto:", error)
        return null
    }
}

export async function adicionarMovimentacaoFirebase(movimentacao) {
    try {
        const movRef = await addDoc(collection(db, "movimentacoes"), {
            ...movimentacao,
            timestamp: serverTimestamp(),
        })
        return {
            id: movRef.id,
            ...movimentacao,
        }
    } catch (e) {
        console.error("Erro ao adicionar movimentação:", e)
        return null
    }
}

export async function editarMovimentacaoFirebase(id, movimentacao) {
    try {
        await updateDoc(doc(db, "movimentacoes", id), {
            ...movimentacao,
            timestamp: serverTimestamp(),
        })
        return { id, ...movimentacao }
    } catch (e) {
        console.error("Erro ao editar movimentação:", e)
        return null
    }
}

export {
    initializeApp,
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    deleteDoc,
    onSnapshot,
    getDocs,
}

async function deletarProduto(produtoId) {
    await deleteDoc(doc(db, "produtos", produtoId))
}

function abrirPopupEditar(produto) {
    const popup = document.getElementById("popupNovoProduto")
    popup.style.display = "flex"
    const iframe = popup.querySelector("iframe").contentWindow
    iframe.postMessage({ type: "preencherForm", produto }, "*")
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
