document.querySelector(".conteudo-login--form").addEventListener("submit", (e) => {
    e.preventDefault(); // Evita o comportamento padrão de recarregar a página

    const usuario = document.querySelector(".input-usuario").value.trim();
    const senha = document.querySelector(".input-pswd").value.trim();

    // Credenciais de teste
    const adminUsuario = "admin";
    const adminSenha = "teste";

    if (usuario === adminUsuario && senha === adminSenha) {
        // Redireciona para a página de estoque
        window.location.href = "./estoque.html";
    } else {
        // Exibe mensagem de erro
        alert("Usuário ou senha incorretos!");
    }
    if (usuario === adminUsuario && senha === adminSenha) {
        console.log("Login bem-sucedido, redirecionando...");
        window.location.href = "./estoque.html";
    } else {
        console.log("Usuário ou senha incorretos!");
        alert("Usuário ou senha incorretos!");
    }

});

