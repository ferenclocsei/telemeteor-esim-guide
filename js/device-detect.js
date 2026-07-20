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
      // Two hard limits on iOS, both by Apple's design, not bugs we can fix:
      //  - The exact model (e.g. "iPhone 15 Pro Max") is NEVER exposed to a
      //    web page — Safari only ever says "iPhone".
      //  - On recent iOS the reported OS version in the UA is frozen/capped
      //    (e.g. iOS 26 can report "18_7"), so it is NOT trustworthy to show.
      // We therefore display only "iPhone" and never a precise version number.
      // The parsed version is still used internally for the modern/legacy tier:
      // a capped-high value reads as modern (correct), a genuinely old device
      // still reports its real low version and reads as legacy (correct).
      const ver = parseIosVersion(ua);
      return {
        confident: true,
        osVariant: "ios",
        iosTier: iosTier(ver),
        version: null,
        deviceName: "iPhone",
        osName: null,
        modelHidden: true,
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
