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
        (item) => `
        <a class="card" href="entry.html?type=${type}&slug=${encodeURIComponent(item.slug)}">
          <div class="card__meta">${item.date || ""}</div>
          <h3 class="card__title">${item.title}</h3>
          <p class="card__excerpt">${item.excerpt || ""}</p>
          ${
            item.tags && item.tags.length
              ? `<div class="tag-row">${item.tags
                  .map((t) => `<span class="tag">${t}</span>`)
                  .join("")}</div>`
              : ""
          }
          <span class="card__cta">Read more &rarr;</span>
        </a>`
      )
      .join("");
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Could not load ${type}. Run a local server: <code>python3 -m http.server</code></div>`;
    console.warn(err);
  }
}
