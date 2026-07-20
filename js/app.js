(async function boot() {
  const DEFAULT_OS = "ios";
  const DEFAULT_DELIVERY = "qr";
  const DEFAULT_IOS_VERSION = "modern";
  // Wizard order: device first (everyone knows what phone they hold),
  // then iOS version (iOS only), then installation method, then the guide.
  const PANEL_IDS = ["device", "iosversion", "delivery", "guide"];

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
    // The overflow flag must be recomputed once the guide is actually visible
    // (a hidden panel reports zero heights).
    if (id === "guide") updateStepTextOverflow();
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

  await ModelCatalog.load();
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
    // Reset scroll and flag overflow so the fade hint only shows when
    // there genuinely is more text below the fold.
    stepTextEl.scrollTop = 0;
    updateStepTextOverflow();
  }

  function updateStepTextOverflow() {
    stepTextEl.classList.toggle(
      "is-scrollable",
      stepTextEl.scrollHeight > stepTextEl.clientHeight + 2
    );
  }

  window.addEventListener("resize", updateStepTextOverflow);

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
    readParam("os", "esim-guide-os", DEFAULT_OS)
  );

  IosVersionPicker.init(
    document.getElementById("ios-version-options"),
    onIosVersionSelected,
    readParam("iosv", "esim-guide-iosv", DEFAULT_IOS_VERSION)
  );

  langSelectEl.addEventListener("change", async (e) => {
    await I18n.load(e.target.value);
    DeliveryPicker.init(document.getElementById("delivery-options"), onDeliverySelected, DeliveryPicker.current);
    DevicePicker.init(document.getElementById("os-options"), onDeviceSelected, DevicePicker.current);
    IosVersionPicker.init(document.getElementById("ios-version-options"), onIosVersionSelected, IosVersionPicker.current);
    await updateContent();
    showPanel(currentPanel);
  });

  await updateContent();
  showPanel("device");
})();
