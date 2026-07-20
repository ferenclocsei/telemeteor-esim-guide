const DeliveryPicker = (() => {
  const OPTIONS = [
    { id: "link", icon: "🔗", nameKey: "ui.delivery.link.name", descKey: "ui.delivery.link.desc" },
    { id: "qr", icon: "▦", nameKey: "ui.delivery.qr.name", descKey: "ui.delivery.qr.desc" },
    { id: "manual", icon: "⌨️", nameKey: "ui.delivery.manual.name", descKey: "ui.delivery.manual.desc" },
  ];

  let containerEl;
  let current = "qr";
  let onSelect = () => {};
  let linkAvailable = true;

  function linkName() {
    const os = typeof DevicePicker !== "undefined" ? DevicePicker.current : "ios";
    return os === "ios" ? I18n.t("ui.delivery.link.name-ios") : I18n.t("ui.delivery.link.name-android");
  }

  function linkDesc() {
    const os = typeof DevicePicker !== "undefined" ? DevicePicker.current : "ios";
    return os === "ios" ? I18n.t("ui.delivery.link.desc-ios") : I18n.t("ui.delivery.link.desc-android");
  }

  function render() {
    containerEl.innerHTML = "";
    OPTIONS.forEach((opt) => {
      const disabled = opt.id === "link" && !linkAvailable;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-card" + (disabled ? " option-card--disabled" : "");
      btn.setAttribute("aria-pressed", String(opt.id === current));
      btn.disabled = disabled;
      const name = opt.id === "link" ? linkName() : I18n.t(opt.nameKey);
      const desc = opt.id === "link" ? linkDesc() : I18n.t(opt.descKey);
      const badge = disabled ? `<span class="option-card__badge">${I18n.t("ui.iosversion.legacy.badge")}</span>` : "";
      btn.innerHTML = `
        <span class="option-card__icon">${opt.icon}</span>
        <span class="option-card__name">${name}</span>
        <span class="option-card__desc">${desc}</span>
        ${badge}
      `;
      if (!disabled) btn.addEventListener("click", () => select(opt.id));
      containerEl.appendChild(btn);
    });
  }

  function select(id) {
    current = id;
    render();
    onSelect(id);
  }

  function setLinkAvailable(available) {
    linkAvailable = available;
    if (!available && current === "link") {
      select("qr");
    } else {
      render();
    }
  }

  function init(container, changeCallback, initial) {
    containerEl = container;
    onSelect = changeCallback;
    if (initial) current = initial;
    render();
  }

  return {
    init,
    select,
    refresh: render,
    setLinkAvailable,
    currentName: () => (current === "link" ? linkName() : I18n.t(OPTIONS.find((o) => o.id === current).nameKey)),
    get current() {
      return current;
    },
  };
})();
