const DevicePicker = (() => {
  // Generic device-silhouette glyphs (not brand trademarks) — accent color + notch
  // style echoes the matching .phone-frame bezel variant for visual consistency.
  const phoneGlyph = (accent, notch) => `
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="1.5" width="16" height="21" rx="4" stroke="${accent}" stroke-width="1.6"/>
      ${notch}
    </svg>`;
  const ICONS = {
    apple: phoneGlyph("#182746", '<rect x="9.5" y="3.4" width="5" height="1.8" rx="0.9" fill="#182746"/>'),
    samsung: phoneGlyph("#1447e6", '<circle cx="12" cy="4.3" r="1" fill="#1447e6"/>'),
    pixel: phoneGlyph("#e8710a", '<circle cx="12" cy="4.3" r="1" fill="#e8710a"/>'),
    android: phoneGlyph("#5b6b8c", '<circle cx="12" cy="4.3" r="1" fill="#5b6b8c"/>'),
    xiaomi: phoneGlyph("#ff6900", '<circle cx="12" cy="4.3" r="1" fill="#ff6900"/>'),
  };

  let osOptionsEl, searchInputEl, resultsEl, emptyEl;
  let current = "ios";
  let onSelect = () => {};
  let onModelPick = null;
  let onNoMatch = null;

  function statusBadge(status) {
    if (status === "stub") return `<span class="option-card__badge">${I18n.t("ui.os.status.stub")}</span>`;
    if (status === "needs-review")
      return `<span class="option-card__badge">${I18n.t("ui.os.status.needs-review")}</span>`;
    return "";
  }

  function renderOsButtons() {
    osOptionsEl.innerHTML = "";
    ModelCatalog.getOsVariants().forEach((variant) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-card";
      btn.setAttribute("aria-pressed", String(variant.id === current));
      btn.innerHTML = `
        <span class="option-card__icon">${ICONS[variant.icon] || phoneGlyph("#5b6b8c", "")}</span>
        <span class="option-card__name">${I18n.t(variant.labelKey)}</span>
        ${statusBadge(variant.status)}
      `;
      btn.addEventListener("click", () => select(variant.id));
      osOptionsEl.appendChild(btn);
    });
  }

  function renderSearchResults(query) {
    const matches = ModelCatalog.search(query);
    resultsEl.innerHTML = "";
    const q = query.trim();
    const substantive = q.replace(/[^a-z0-9]/gi, "").length >= 3;
    emptyEl.hidden = true;

    // No match on a real-looking query → offer the "probably not supported,
    // check it yourself" verdict instead of a dead end.
    if (matches.length === 0) {
      if (substantive && onNoMatch) {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "model-results__unknown";
        btn.textContent = I18n.t("ui.os.search.unknown-cta");
        btn.addEventListener("click", () => {
          searchInputEl.value = "";
          resultsEl.innerHTML = "";
          onNoMatch(q);
        });
        li.appendChild(btn);
        resultsEl.appendChild(li);
      } else {
        emptyEl.hidden = !q;
      }
      return;
    }

    matches.slice(0, 8).forEach((m) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      // Show the internal model code when a name maps to several variants
      // (e.g. Redmi Note 13 Pro 4G vs 5G) so the pick is unambiguous.
      const nameSpan = document.createElement("span");
      nameSpan.textContent = `${m.brand} ${m.model}`;
      btn.appendChild(nameSpan);
      if (m.code) {
        const codeSpan = document.createElement("span");
        codeSpan.className = "model-results__code";
        codeSpan.textContent = m.code;
        btn.appendChild(codeSpan);
      }
      btn.addEventListener("click", () => {
        searchInputEl.value = "";
        resultsEl.innerHTML = "";
        emptyEl.hidden = true;
        // Show the eSIM compatibility verdict for the exact model chosen,
        // instead of jumping straight into the guide.
        if (onModelPick) onModelPick(m);
      });
      li.appendChild(btn);
      resultsEl.appendChild(li);
    });
  }

  function select(id) {
    current = id;
    renderOsButtons();
    onSelect(id);
  }

  function init(container, changeCallback, initial, modelPickCallback, noMatchCallback) {
    osOptionsEl = document.getElementById("os-options");
    searchInputEl = document.getElementById("model-search-input");
    resultsEl = document.getElementById("model-results");
    emptyEl = document.getElementById("model-search-empty");
    onSelect = changeCallback;
    if (modelPickCallback) onModelPick = modelPickCallback;
    if (noMatchCallback) onNoMatch = noMatchCallback;
    if (initial) current = initial;

    renderOsButtons();
    searchInputEl.addEventListener("input", (e) => renderSearchResults(e.target.value));
  }

  return {
    init,
    select,
    setCurrent(id) {
      current = id;
      renderOsButtons();
    },
    get current() {
      return current;
    },
  };
})();
