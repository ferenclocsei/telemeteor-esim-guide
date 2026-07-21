(async function boot() {
  const DEFAULT_OS = "ios";
  const DEFAULT_DELIVERY = "qr";
  const DEFAULT_IOS_VERSION = "modern";
  // Wizard order: device first (everyone knows what phone they hold),
  // then iOS version (iOS only), then installation method, then the guide.
  // "compat" and "troubleshoot" sit outside the wizard flow (no breadcrumb chip).
  const PANEL_IDS = ["device", "iosversion", "delivery", "guide", "compat", "troubleshoot"];

  function readParam(name, storageKey, fallback) {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get(name);
    if (fromUrl) return fromUrl;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) return stored;
    return fallback;
  }

  function persistParam(name, storageKey, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(name, value);
    window.history.replaceState({}, "", url);
    window.localStorage.setItem(storageKey, value);
  }

  const stepTitleEl = document.getElementById("step-title");
  const stepBodyEl = document.getElementById("step-body");
  const stepWarningEl = document.getElementById("step-warning");
  const stepEyebrowEl = document.getElementById("step-eyebrow");
  const stepTextEl = document.getElementById("step-text");
  const fallbackNoticeEl = document.getElementById("fallback-notice");
  const langSelectEl = document.getElementById("lang-select");
  const wizardProgressEl = document.getElementById("wizard-progress");
  const guideVerifiedEl = document.getElementById("guide-verified");
  const deliveryBackBtn = document.getElementById("delivery-back");

  const panels = {};
  PANEL_IDS.forEach((id) => {
    panels[id] = document.getElementById(`panel-${id}`);
  });

  let currentPanel = "device";

  function isIosSelected() {
    return typeof DevicePicker !== "undefined" && DevicePicker.current === "ios";
  }

  function showPanel(id) {
    currentPanel = id;
    PANEL_IDS.forEach((key) => {
      panels[key].hidden = key !== id;
    });
    wizardProgressEl.hidden = id === "troubleshoot" || id === "compat";
    const isIos = isIosSelected();
    let num = 0;
    wizardProgressEl.querySelectorAll("[data-wizard-progress]").forEach((el) => {
      const step = el.getAttribute("data-wizard-progress");
      const hidden = step === "iosversion" && !isIos;
      el.hidden = hidden;
      if (!hidden) {
        num += 1;
        el.querySelector(".wizard-progress__num").textContent = String(num);
      }
      const done = PANEL_IDS.indexOf(step) < PANEL_IDS.indexOf(id);
      el.classList.toggle("is-active", step === id);
      el.classList.toggle("is-done", done);
      el.disabled = !done;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (id === "guide") syncStepDetails(false);
  }

  // Completed breadcrumb chips are clickable: jump straight back to that step.
  wizardProgressEl.querySelectorAll("[data-wizard-progress]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.classList.contains("is-done")) showPanel(el.getAttribute("data-wizard-progress"));
    });
  });

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showPanel(btn.getAttribute("data-back")));
  });

  // The delivery panel's back target depends on the chosen OS.
  deliveryBackBtn.addEventListener("click", () => {
    showPanel(isIosSelected() ? "iosversion" : "device");
  });

  // Troubleshooter: reachable from the home screen and from the guide;
  // back returns to wherever the visitor came from.
  let tsReturnPanel = "device";
  Troubleshoot.setCard(document.getElementById("ts-card"));

  async function openTroubleshoot() {
    await Troubleshoot.load();
    tsReturnPanel = currentPanel === "troubleshoot" ? "device" : currentPanel;
    Troubleshoot.start();
    showPanel("troubleshoot");
  }

  document.getElementById("ts-entry-home").addEventListener("click", openTroubleshoot);
  document.getElementById("ts-entry-guide").addEventListener("click", openTroubleshoot);
  document.getElementById("ts-back").addEventListener("click", () => showPanel(tsReturnPanel));

  // ---- eSIM compatibility verdict (from the exact-model search) ----
  // (Compat.setMeta runs after ModelCatalog.load, below.)
  Compat.setCard(document.getElementById("compat-card"));

  function onModelPick(model) {
    Compat.show(model, {
      onGuide: async (m) => {
        DevicePicker.setCurrent(m.osVariant);
        await updateContent();
        showPanel(m.osVariant === "ios" ? "iosversion" : "delivery");
      },
      onChange: () => showPanel("device"),
    });
    showPanel("compat");
  }

  document.getElementById("compat-back").addEventListener("click", () => showPanel("device"));

  await ModelCatalog.load();
  Compat.setMeta(ModelCatalog.getMeta().lastVerifiedDate);
  PhoneRenderer.mount();

  const initialLang = readParam("lang", "esim-guide-lang", I18n.resolveInitialLang());
  await I18n.load(initialLang);
  langSelectEl.value = I18n.currentLang;

  function onStepChange(step) {
    PhoneRenderer.renderStep(step);
    stepEyebrowEl.textContent = DeliveryPicker.currentName();
    stepTitleEl.textContent = step.title;
    stepBodyEl.textContent = step.body;
    if (step.warning) {
      stepWarningEl.hidden = false;
      stepWarningEl.textContent = step.warning;
    } else {
      stepWarningEl.hidden = true;
    }
    syncStepDetails(true);
  }

  // The instruction (title) carries the message; the full description sits
  // behind an optional "More details" toggle — open by default on desktop
  // (there is room), collapsed on mobile so the phone stays the hero.
  const desktopQuery = window.matchMedia("(min-width: 960px)");
  const stepDetailsEl = document.getElementById("step-details");

  function syncStepDetails(collapseOnMobile) {
    if (desktopQuery.matches) {
      stepDetailsEl.open = true;
    } else if (collapseOnMobile) {
      stepDetailsEl.open = false;
    }
  }

  function onGuideBackAtStart() {
    showPanel("delivery");
  }

  function onGuideComplete() {
    showPanel("device");
  }

  async function updateContent() {
    const osVariant = DevicePicker.current;
    const deliveryMethod = DeliveryPicker.current;
    const iosVersionTier = IosVersionPicker.current;
    persistParam("os", "esim-guide-os", osVariant);
    persistParam("delivery", "esim-guide-delivery", deliveryMethod);
    persistParam("iosv", "esim-guide-iosv", iosVersionTier);

    const isIos = osVariant === "ios";
    IosVersionPicker.setVisible(isIos);
    DeliveryPicker.setLinkAvailable(!isIos || iosVersionTier === "modern");

    const content = await ContentLoader.load(osVariant, deliveryMethod, iosVersionTier);
    fallbackNoticeEl.hidden = !content.usedFallback;
    if (content.lastVerifiedDate) {
      guideVerifiedEl.hidden = false;
      guideVerifiedEl.textContent = I18n.t("ui.guide.verified", {
        date: content.lastVerifiedDate,
      });
    } else {
      guideVerifiedEl.hidden = true;
    }
    PhoneRenderer.setOsVariant(osVariant);
    StepController.init(content.steps, onStepChange, onGuideBackAtStart, onGuideComplete);
    DeliveryPicker.refresh();
  }

  async function onDeviceSelected() {
    await updateContent();
    showPanel(DevicePicker.current === "ios" ? "iosversion" : "delivery");
  }

  async function onIosVersionSelected() {
    await updateContent();
    showPanel("delivery");
  }

  async function onDeliverySelected() {
    await updateContent();
    showPanel("guide");
  }

  DeliveryPicker.init(
    document.getElementById("delivery-options"),
    onDeliverySelected,
    readParam("delivery", "esim-guide-delivery", DEFAULT_DELIVERY)
  );

  DevicePicker.init(
    document.getElementById("os-options"),
    onDeviceSelected,
    readParam("os", "esim-guide-os", DEFAULT_OS),
    onModelPick
  );

  IosVersionPicker.init(
    document.getElementById("ios-version-options"),
    onIosVersionSelected,
    readParam("iosv", "esim-guide-iosv", DEFAULT_IOS_VERSION)
  );

  langSelectEl.addEventListener("change", async (e) => {
    await I18n.load(e.target.value);
    DeliveryPicker.init(document.getElementById("delivery-options"), onDeliverySelected, DeliveryPicker.current);
    DevicePicker.init(document.getElementById("os-options"), onDeviceSelected, DevicePicker.current, onModelPick);
    IosVersionPicker.init(document.getElementById("ios-version-options"), onIosVersionSelected, IosVersionPicker.current);
    await updateContent();
    Troubleshoot.rerender();
    renderDetectBanner();
    showPanel(currentPanel);
  });

  // ---- Auto-detection: offer to start from the phone we recognise ----
  const detectBannerEl = document.getElementById("detect-banner");
  const detectDeviceEl = document.getElementById("detect-device");
  const detectIconEl = document.getElementById("detect-icon");
  const detectNoteEl = document.getElementById("detect-note");
  let detected = null;

  function renderDetectBanner() {
    if (!detected || !detected.confident) {
      detectBannerEl.hidden = true;
      return;
    }
    const parts = [detected.deviceName];
    if (detected.osName && detected.osName !== detected.deviceName) parts.push(detected.osName);
    detectDeviceEl.textContent = parts.join(" · ");
    detectIconEl.textContent = detected.osVariant === "ios" ? "📱" : "🤖";
    // iOS hides the exact model + a trustworthy version, so we say so honestly.
    if (detected.modelHidden) {
      detectNoteEl.textContent = I18n.t("ui.detect.ios-note");
      detectNoteEl.hidden = false;
    } else {
      detectNoteEl.hidden = true;
    }
    detectBannerEl.hidden = false;
  }

  async function applyDetection() {
    if (!detected || !detected.confident) return;
    // Re-init pickers with detected values (sets state without auto-advancing).
    DevicePicker.init(document.getElementById("os-options"), onDeviceSelected, detected.osVariant);
    detectBannerEl.hidden = true;
    if (detected.osVariant === "ios") {
      // iOS never reveals a trustworthy version, so we pre-select the likely
      // tier but still land on the version step for the user to confirm.
      IosVersionPicker.init(
        document.getElementById("ios-version-options"),
        onIosVersionSelected,
        detected.iosTier || "modern"
      );
      await updateContent();
      showPanel("iosversion");
    } else {
      // Android's version comes from client hints and is reliable — skip ahead.
      await updateContent();
      showPanel("delivery");
    }
  }

  document.getElementById("detect-go").addEventListener("click", applyDetection);
  document.getElementById("detect-no").addEventListener("click", () => {
    detectBannerEl.hidden = true;
  });

  await updateContent();
  showPanel("device");

  // Run detection after first paint so it never delays the initial render.
  DeviceDetect.detect().then((result) => {
    detected = result;
    renderDetectBanner();
  });
})();
