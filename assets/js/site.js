async function injectPartial(selector, url) {
  const host = document.querySelector(selector);
  if (!host) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    host.innerHTML = await res.text();
  } catch (err) {
    console.warn(`Could not load partial ${url}:`, err);
  }
}

function highlightNav() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll(`[data-nav="${page}"]`).forEach((el) => {
    el.classList.add("is-active");
  });
}

function setYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    injectPartial("[data-include='header']", "partials/header.html"),
    injectPartial("[data-include='footer']", "partials/footer.html"),
  ]);
  highlightNav();
  setYear();
});
