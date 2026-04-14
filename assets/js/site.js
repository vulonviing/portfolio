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

function injectSneakPeekTeaser() {
  if (document.querySelector("[data-sneak-peek-teaser]")) return;

  const footer = document.querySelector(".site-footer");
  if (!footer) return;

  const footerLinks = footer.querySelectorAll("a");
  const mediumLink = Array.from(footerLinks).find((link) =>
    link.href.includes("medium.com/@emrecanulu"),
  );

  if (!mediumLink) return;

  const teaser = document.createElement("a");
  teaser.href = "/sneak-peek/";
  teaser.className = "site-footer__sneak-peek";
  teaser.dataset.sneakPeekTeaser = "true";
  teaser.setAttribute("aria-label", "Open the Sneak Peek experience");
  teaser.setAttribute("title", "Open Sneak Peek");
  teaser.setAttribute("rel", "nofollow");
  teaser.innerHTML = `
    <span class="site-footer__sneak-peek-label">
      <span class="site-footer__sneak-peek-word site-footer__sneak-peek-word--gold">Sneak</span>
      <span class="site-footer__sneak-peek-word site-footer__sneak-peek-word--ember">Peek</span>
    </span>
  `;

  mediumLink.insertAdjacentElement("afterend", teaser);
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

document.addEventListener("DOMContentLoaded", () => {
  syncThemeWithPreference();
  highlightNav();
  setYear();
  setupThemeToggle();
  injectSneakPeekTeaser();
});
