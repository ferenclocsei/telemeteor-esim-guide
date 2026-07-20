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

  function search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return models.filter((m) => {
      if (m.model.toLowerCase().includes(q)) return true;
      if (m.brand.toLowerCase().includes(q)) return true;
      if (`${m.brand} ${m.model}`.toLowerCase().includes(q)) return true;
      if (m.aliases && m.aliases.some((a) => a.toLowerCase().includes(q))) return true;
      return false;
    });
  }

  function getOsVariants() {
    return osVariants;
  }

  function getOsVariant(id) {
    return osVariants.find((v) => v.id === id);
  }

  return { load, search, getOsVariants, getOsVariant, getMeta };
})();
