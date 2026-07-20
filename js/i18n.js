const I18n = (() => {
  const SUPPORTED = ["hu", "en", "sr", "hr"];
  const FALLBACK_LANG = "en";

  let currentLang = "hu";
  let currentStrings = null;
  let fallbackStrings = null;
  let usedFallbackKey = false;

  async function fetchLangFile(lang) {
    const res = await fetch(`content/strings/${lang}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Missing strings for ${lang}`);
    return res.json();
  }

  function resolveInitialLang() {
    const url = new URL(window.location.href);
    const urlLang = url.searchParams.get("lang");
    if (urlLang && SUPPORTED.includes(urlLang)) return urlLang;

    const stored = window.localStorage.getItem("esim-guide-lang");
    if (stored && SUPPORTED.includes(stored)) return stored;

    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(nav)) return nav;

    return "hu";
  }

  async function load(lang) {
    currentLang = SUPPORTED.includes(lang) ? lang : "hu";
    currentStrings = await fetchLangFile(currentLang);
    fallbackStrings =
      currentLang === FALLBACK_LANG ? currentStrings : await fetchLangFile(FALLBACK_LANG);

    window.localStorage.setItem("esim-guide-lang", currentLang);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", currentLang);
    window.history.replaceState({}, "", url);

    document.documentElement.lang = currentLang;
    applyStaticText();
  }

  function lookup(store, key) {
    if (!store) return undefined;
    if (key.startsWith("ui.")) return store.ui ? store.ui[key.slice(3)] : undefined;
    if (key.startsWith("screen.")) return store.screen ? store.screen[key.slice(7)] : undefined;
    return store.steps ? store.steps[key] : undefined;
  }

  usedFallbackKey = false;

  function t(key, vars) {
    let value = lookup(currentStrings, key);
    if (value === undefined) {
      value = lookup(fallbackStrings, key);
      if (value !== undefined) usedFallbackKey = true;
    }
    if (value === undefined) return key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
      });
    }
    return value;
  }

  function consumeFallbackFlag() {
    const used = usedFallbackKey;
    usedFallbackKey = false;
    return used;
  }

  function applyStaticText() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
  }

  return {
    supported: SUPPORTED,
    load,
    t,
    resolveInitialLang,
    applyStaticText,
    consumeFallbackFlag,
    get currentLang() {
      return currentLang;
    },
    get reviewMeta() {
      return currentStrings ? currentStrings.reviewMeta : null;
    },
  };
})();
