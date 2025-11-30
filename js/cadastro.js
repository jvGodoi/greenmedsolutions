import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js"
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js"
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js"

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
const auth = getAuth(app)
const db = getFirestore(app)

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("cadastroForm")

    form.addEventListener("submit", async (e) => {
        e.preventDefault()

        const email = document.getElementById("email").value.trim()
        const username = document.getElementById("username").value.trim()
        const password = document.getElementById("password").value
        const confirmPassword = document.getElementById("confirmPassword").value

        // Validation
        if (!email || !username || !password || !confirmPassword) {
            showError("Todos os campos são obrigatórios")
            return
        }

        if (password.length < 6) {
            showError("A senha deve ter pelo menos 6 caracteres")
            return
        }

        if (password !== confirmPassword) {
            showError("As senhas não coincidem")
            return
        }

        try {
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            await setDoc(doc(db, "usuarios", user.uid), {
                uid: user.uid,
                email: email,
                username: username,
                isAdmin: false,
                createdAt: new Date().toISOString(),
                role: "user",
            })

            showSuccess("Cadastro realizado com sucesso! Redirecionando...")
            setTimeout(() => {
                window.location.href = "./index.html"
            }, 2000)
        } catch (error) {
            console.error("Erro ao cadastrar:", error)
            if (error.code === "auth/email-already-in-use") {
                showError("Este email já está registrado")
            } else if (error.code === "auth/invalid-email") {
                showError("Email inválido")
            } else {
                showError("Erro ao criar conta: " + error.message)
            }
        }
    })

    function showError(message) {
        const messageDiv = document.createElement("div")
        messageDiv.className = "error-message"
        messageDiv.textContent = message
        form.insertBefore(messageDiv, form.firstChild)

        setTimeout(() => {
            messageDiv.remove()
        }, 5000)
    }

    function showSuccess(message) {
        const messageDiv = document.createElement("div")
        messageDiv.className = "success-message"
        messageDiv.textContent = message
        form.insertBefore(messageDiv, form.firstChild)
    }
})
