
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDV1vwxLJkl5JikHYW7E_0cZzVTr2uKU3s",
    authDomain: "teste-c146d.firebaseapp.com",
    projectId: "teste-c146d",
    storageBucket: "teste-c146d.appspot.com",
    messagingSenderId: "624684030810",
    appId: "1:624684030810:web:ead3ea1cb9f77af1f53163",
    measurementId: "G-7MYFP2S0YD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function adicionarProdutoFirebase(produto) {
    try {
        const docRef = await addDoc(collection(db, "produtos"), {
            ...produto,
            timestamp: serverTimestamp(),
        });
        console.log("Produto adicionado com ID:", docRef.id);
        return { ...produto, id: docRef.id };
    } catch (e) {
        console.error("Erro ao adicionar produto:", e);
        return null;
    }
}

export async function editarProdutoFirebase(produto) {
    try {
        await updateDoc(doc(db, "produtos", produto.id), {
            nome: produto.nome,
            teste: produto.teste,
            timestamp: serverTimestamp(),
        });
        console.log("Produto atualizado com sucesso!");
        return produto;
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        return null;
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
    onSnapshot
};

async function deletarProduto(produtoId) {
    await deleteDoc(doc(db, "produtos", produtoId));
}

function abrirPopupEditar(produto) {
    const popup = document.getElementById("popupNovoProduto");
    popup.style.display = "flex";
    const iframe = popup.querySelector('iframe').contentWindow;
    iframe.postMessage({ type: "preencherForm", produto }, "*");

}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
