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

  // Accept the many ways a host site or browser can spell a language and fold
  // them onto our four supported codes. Returns null if we can't map it.
  const LANG_ALIASES = {
    hun: "hu",
    magyar: "hu",
    eng: "en",
    srp: "sr",
    srb: "sr",
    "sr-latn": "sr",
    "sr-cyrl": "sr",
    "sr-rs": "sr",
    hrv: "hr",
    "hr-hr": "hr",
  };

  function normalizeLang(code) {
    if (!code) return null;
    const c = String(code).toLowerCase().trim();
    if (SUPPORTED.includes(c)) return c;
    if (LANG_ALIASES[c]) return LANG_ALIASES[c];
    const two = c.slice(0, 2);
    if (SUPPORTED.includes(two)) return two;
    if (LANG_ALIASES[two]) return LANG_ALIASES[two];
    return null;
  }

  // Priority: an explicit hand-off from the host site (telemeteor.com) wins,
  // whether it arrives as a ?lang= URL parameter or a server-injected global /
  // <html data-esim-lang="…">. Then the visitor's own earlier choice, then the
  // browser, then Hungarian.
  function resolveInitialLang() {
    const url = new URL(window.location.href);
    const fromUrl = normalizeLang(url.searchParams.get("lang"));
    if (fromUrl) return fromUrl;

    const injected = normalizeLang(
      window.TELEMETEOR_ESIM_LANG || document.documentElement.getAttribute("data-esim-lang")
    );
    if (injected) return injected;

    const stored = normalizeLang(window.localStorage.getItem("esim-guide-lang"));
    if (stored) return stored;

    const nav = normalizeLang(navigator.language);
    if (nav) return nav;

    return "hu";
  }

  async function load(lang) {
    currentLang = normalizeLang(lang) || "hu";
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
    normalizeLang,
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
