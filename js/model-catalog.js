const ModelCatalog = (() => {
  let models = [];
  let osVariants = [];
  let catalogMeta = {};

  async function load() {
    const [modelsRes, osRes] = await Promise.all([
      fetch("content/models/catalog.json", { cache: "no-cache" }),
      fetch("content/models/os-variants.json", { cache: "no-cache" }),
    ]);
    const modelsData = await modelsRes.json();
    const osData = await osRes.json();
    models = modelsData.models;
    catalogMeta = { lastVerifiedDate: modelsData.lastVerifiedDate };
    osVariants = osData.variants;
    return { models, osVariants };
  }

  function getMeta() {
    return catalogMeta;
  }

  // Fold away the noise people actually type: case, spaces, dashes, "+"/"plus",
  // so "iphone15promax", "iPhone 15 Pro Max" and "iphone-15-pro-max" all match.
  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\bplus\b/g, "+")
      .replace(/[^a-z0-9+]/g, "");
  }

  function haystack(m) {
    const parts = [m.brand, m.model, `${m.brand} ${m.model}`, ...(m.aliases || [])];
    return parts.map(norm);
  }

  // Ranked, typo/spacing-tolerant search. Returns exact-ish matches first.
  function search(query) {
    const raw = query.trim();
    if (!raw) return [];
    const nq = norm(raw);
    if (!nq) return [];
    const tokens = raw.toLowerCase().split(/[^a-z0-9+]+/).map(norm).filter(Boolean);

    const scored = [];
    for (const m of models) {
      const hs = haystack(m);
      let score = 0;
      // Whole normalized query appears in a field.
      if (hs.some((h) => h.includes(nq))) score = 100 - Math.min(60, hs[1].length - nq.length);
      // Otherwise: every typed token appears somewhere (handles word order / extra words).
      else if (tokens.length && tokens.every((t) => hs.some((h) => h.includes(t)))) score = 40;
      if (score > 0) {
        if (norm(`${m.brand} ${m.model}`).startsWith(nq)) score += 30;
        scored.push({ m, score });
      }
    }
    scored.sort((a, b) => b.score - a.score || a.m.model.length - b.m.model.length);
    return scored.map((s) => s.m);
  }

  function getOsVariants() {
    return osVariants;
  }

  function getOsVariant(id) {
    return osVariants.find((v) => v.id === id);
  }

  return { load, search, getOsVariants, getOsVariant, getMeta };
})();
