document.addEventListener("DOMContentLoaded", function () {
  const nav = document.querySelector("nav.navegacao");
  if (!nav.classList.contains("reduzido")) {
    nav.classList.add("reduzido");
  }
});

document
  .querySelector(".navegacao-seta--voltar")
  .addEventListener("click", function () {
    const nav = document.querySelector("nav.navegacao");
    if (nav.classList.contains("reduzido")) {
      nav.classList.remove("reduzido");
    } else {
      nav.classList.add("reduzido");
    }
  });
