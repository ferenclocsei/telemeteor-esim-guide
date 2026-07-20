const ModelCatalog = (() => {
  let models = [];
  let osVariants = [];

  async function load() {
    const [modelsRes, osRes] = await Promise.all([
      fetch("content/models/catalog.json", { cache: "no-cache" }),
      fetch("content/models/os-variants.json", { cache: "no-cache" }),
    ]);
    const modelsData = await modelsRes.json();
    const osData = await osRes.json();
    models = modelsData.models;
    osVariants = osData.variants;
    return { models, osVariants };
  }

  function search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return models.filter(
      (m) => m.model.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q)
    );
  }

  function getOsVariants() {
    return osVariants;
  }

  function getOsVariant(id) {
    return osVariants.find((v) => v.id === id);
  }

  return { load, search, getOsVariants, getOsVariant };
})();
