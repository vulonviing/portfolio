function redirectLegacyEntry() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const slug = params.get("slug");

  if (!type || !slug) return;

  const normalizedType = type === "projects" || type === "research" ? type : null;
  if (!normalizedType) return;

  window.location.replace(`/${normalizedType}/${encodeURIComponent(slug)}.html`);
}

document.addEventListener("DOMContentLoaded", redirectLegacyEntry);
