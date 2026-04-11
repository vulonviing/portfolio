function setMeta(name, value, attr = "name") {
  if (!value) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

async function loadEntry() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const slug = params.get("slug");
  const mount = document.querySelector("[data-entry]");
  const backLink = document.querySelector("[data-back]");
  const metaEl = document.querySelector("[data-meta]");
  const repoLink = document.querySelector("[data-repo]");

  if (!mount) return;

  if (!type || !slug) {
    mount.innerHTML = `<div class="empty-state">No entry specified.</div>`;
    return;
  }

  if (backLink) {
    backLink.href = `${type}.html`;
    backLink.textContent = `\u2190 Back to ${type}`;
  }
  if (metaEl) metaEl.textContent = type;
  if (repoLink) repoLink.hidden = true;

  try {
    const [indexRes, mdRes] = await Promise.all([
      fetch(`content/${type}/_index.json`),
      fetch(`content/${type}/${slug}.md`),
    ]);

    if (!mdRes.ok) throw new Error("Markdown not found");

    const md = await mdRes.text();
    mount.innerHTML = marked.parse(md);

    if (indexRes.ok) {
      const items = await indexRes.json();
      const item = items.find((i) => i.slug === slug);
      if (item) {
        const fullTitle = `${item.title} — Emrecan Ulu`;
        document.title = fullTitle;
        const desc = item.excerpt || `${item.title} by Emrecan Ulu, Data Scientist in Munich.`;

        setMeta("description", desc);
        setMeta("og:title", fullTitle, "property");
        setMeta("og:description", desc, "property");
        setMeta("og:url", window.location.href, "property");
        setMeta("twitter:title", fullTitle);
        setMeta("twitter:description", desc);

        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute("href", window.location.href);

        if (metaEl && item.date) metaEl.textContent = `${type} · ${item.date}`;
        if (repoLink && item.repo) {
          repoLink.href = item.repo;
          repoLink.hidden = false;
        }
      }
    }
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Could not load this entry. Run a local server: <code>python3 -m http.server</code></div>`;
    console.warn(err);
  }
}

document.addEventListener("DOMContentLoaded", loadEntry);
