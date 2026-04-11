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

const THEME_KEY = "theme-preference";
const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");

function getStoredTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
  } catch (err) {
    console.warn("Could not read theme preference:", err);
    return null;
  }
}

function getResolvedTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme) return storedTheme;
  return themeMedia.matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  updateThemeToggle(theme);
}

function syncThemeWithPreference() {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    applyTheme(storedTheme);
    return;
  }

  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
  updateThemeToggle(getResolvedTheme());
}

function updateThemeToggle(currentTheme = getResolvedTheme()) {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    button.dataset.nextTheme = nextTheme;
    button.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    button.setAttribute("title", `Switch to ${nextTheme} mode`);
    button.setAttribute("aria-pressed", String(currentTheme === "dark"));
  });
}

function setupThemeToggle() {
  updateThemeToggle(getResolvedTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = button.dataset.nextTheme === "dark" ? "dark" : "light";

      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch (err) {
        console.warn("Could not persist theme preference:", err);
      }

      applyTheme(nextTheme);
    });
  });
}

function handleSystemThemeChange() {
  if (!getStoredTheme()) {
    syncThemeWithPreference();
  }
}

if (typeof themeMedia.addEventListener === "function") {
  themeMedia.addEventListener("change", handleSystemThemeChange);
} else if (typeof themeMedia.addListener === "function") {
  themeMedia.addListener(handleSystemThemeChange);
}

document.addEventListener("DOMContentLoaded", async () => {
  syncThemeWithPreference();
  await Promise.all([
    injectPartial("[data-include='header']", "partials/header.html"),
    injectPartial("[data-include='footer']", "partials/footer.html"),
  ]);
  highlightNav();
  setYear();
  setupThemeToggle();
});
