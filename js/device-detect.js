// Best-effort device detection from the browser.
// What IS detectable: iOS vs Android, iOS version (→ modern/legacy tier),
//   Android version, and on Chromium the model code (→ Samsung / Pixel / other).
// What is NOT detectable from a web page: the exact iPhone model, and whether
//   the phone is carrier-unlocked (SIM-lock status is not exposed to browsers).
//   We are honest about that and never claim it.
const DeviceDetect = (() => {
  function parseIosVersion(ua) {
    const m = ua.match(/OS (\d+)[_.](\d+)(?:[_.](\d+))?/);
    if (!m) return null;
    return { major: +m[1], minor: +m[2] };
  }

  function iosTier(ver) {
    if (!ver) return "modern";
    if (ver.major > 17) return "modern";
    if (ver.major === 17 && ver.minor >= 4) return "modern";
    return "legacy";
  }

  function androidVariantFromModel(model) {
    if (!model) return "android-generic";
    const m = model.toLowerCase();
    if (m.startsWith("pixel")) return "android-pixel";
    if (m.startsWith("sm-") || m.includes("samsung") || m.startsWith("galaxy"))
      return "android-samsung";
    return "android-generic";
  }

  async function detect() {
    const ua = navigator.userAgent || "";
    const isIos =
      /iPhone|iPad|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isIos) {
      const ver = parseIosVersion(ua);
      return {
        confident: true,
        osVariant: "ios",
        iosTier: iosTier(ver),
        version: ver ? `${ver.major}.${ver.minor}` : null,
        deviceName: "iPhone",
        osName: ver ? `iOS ${ver.major}.${ver.minor}` : "iOS",
      };
    }

    const isAndroid = /Android/.test(ua);
    if (isAndroid) {
      let model = null;
      let platformVersion = null;
      // High-entropy client hints (Chromium) give the real model + OS version.
      if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
          const hints = await navigator.userAgentData.getHighEntropyValues([
            "model",
            "platformVersion",
          ]);
          model = hints.model || null;
          platformVersion = hints.platformVersion || null;
        } catch (e) {
          /* ignore, fall back to UA string */
        }
      }
      // Fallback: pull model + version out of the UA string.
      if (!model) {
        const mm = ua.match(/Android [\d.]+; ?([^;)]+)/);
        if (mm) model = mm[1].trim();
      }
      const av = ua.match(/Android (\d+)/);
      const androidMajor = platformVersion
        ? platformVersion.split(".")[0]
        : av
        ? av[1]
        : null;
      const osVariant = androidVariantFromModel(model);
      const brand =
        osVariant === "android-pixel"
          ? "Google Pixel"
          : osVariant === "android-samsung"
          ? "Samsung Galaxy"
          : "Android";
      return {
        confident: osVariant !== "android-generic" || !!androidMajor,
        osVariant,
        iosTier: null,
        version: androidMajor,
        deviceName: brand,
        osName: androidMajor ? `Android ${androidMajor}` : "Android",
      };
    }

    return { confident: false, osVariant: null };
  }

  return { detect };
})();
