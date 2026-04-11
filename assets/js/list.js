function bindCardNavigation(mount) {
  mount.querySelectorAll("[data-entry-url]").forEach((card) => {
    const navigateToEntry = () => {
      const url = card.dataset.entryUrl;
      if (!url) return;
      window.location.href = url;
    };

    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      navigateToEntry();
    });

    card.addEventListener("keydown", (event) => {
      if (event.target.closest("a")) return;
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      navigateToEntry();
    });
  });
}

async function loadList(type, mountSelector) {
  const mount = document.querySelector(mountSelector);
  if (!mount) return;

  try {
    const res = await fetch(`content/${type}/_index.json`);
    if (!res.ok) throw new Error(res.statusText);
    const items = await res.json();

    if (!items.length) {
      mount.innerHTML = `<div class="empty-state">Nothing here yet.</div>`;
      return;
    }

    mount.innerHTML = items
      .map(
        (item) => {
          const entryUrl = `entry.html?type=${type}&slug=${encodeURIComponent(item.slug)}`;

          return `
        <article class="card card--interactive" data-entry-url="${entryUrl}" tabindex="0" role="link" aria-label="Open ${item.title}">
          <div class="card__meta">${item.date || ""}</div>
          <h3 class="card__title">
            <a class="card__title-link" href="${entryUrl}">${item.title}</a>
          </h3>
          <p class="card__excerpt">${item.excerpt || ""}</p>
          ${
            item.tags && item.tags.length
              ? `<div class="tag-row">${item.tags
                  .map((t) => `<span class="tag">${t}</span>`)
                  .join("")}</div>`
              : ""
          }
          <div class="card__actions">
            <a class="card__cta" href="${entryUrl}">Read more</a>
            ${
              item.repo
                ? `<a class="card__repo" href="${item.repo}" target="_blank" rel="noopener noreferrer" aria-label="Open ${item.title} on GitHub">GitHub</a>`
                : ""
            }
          </div>
        </article>`;
        }
      )
      .join("");

    bindCardNavigation(mount);
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Could not load ${type}. Run a local server: <code>python3 -m http.server</code></div>`;
    console.warn(err);
  }
}
