const ContentLoader = (() => {
  const structureCache = {};

  async function fetchStructure(osVariant) {
    if (structureCache[osVariant]) return structureCache[osVariant];
    const res = await fetch(`content/structure/${osVariant}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Missing structure for ${osVariant}`);
    const data = await res.json();
    structureCache[osVariant] = data;
    return data;
  }

  function filterByDelivery(steps, deliveryMethod) {
    return steps.filter(
      (step) => step.appliesTo.includes("all") || step.appliesTo.includes(deliveryMethod)
    );
  }

  function filterByIosVersion(steps, iosVersionTier) {
    return steps.filter((step) => !step.iosVersion || step.iosVersion.includes(iosVersionTier));
  }

  function resolveStepText(step) {
    return {
      ...step,
      title: I18n.t(step.titleKey),
      body: I18n.t(step.bodyKey),
      warning: step.warningKey ? I18n.t(step.warningKey) : null,
      tapPoints: step.tapPoints.map((tp) => ({
        ...tp,
        label: tp.labelKey ? I18n.t(tp.labelKey) : "",
      })),
    };
  }

  async function load(osVariant, deliveryMethod, iosVersionTier) {
    const structure = await fetchStructure(osVariant);
    let filtered = filterByDelivery(structure.steps, deliveryMethod);
    filtered = filterByIosVersion(filtered, iosVersionTier || "modern");
    I18n.consumeFallbackFlag();
    const steps = filtered.map(resolveStepText);
    const usedFallback = I18n.consumeFallbackFlag();
    return {
      osVariant: structure.osVariant,
      status: structure.status,
      osVersionRange: structure.osVersionRange,
      lastVerifiedDate: structure.lastVerifiedDate || null,
      steps,
      usedFallback,
    };
  }

  return { load };
})();
