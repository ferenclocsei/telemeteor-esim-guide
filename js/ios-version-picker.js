const IosVersionPicker = (() => {
  const OPTIONS = [
    { id: "modern", nameKey: "ui.iosversion.modern.name", descKey: "ui.iosversion.modern.desc" },
    { id: "legacy", nameKey: "ui.iosversion.legacy.name", descKey: "ui.iosversion.legacy.desc" },
  ];

  let sectionEl, containerEl;
  let current = "modern";
  let onSelect = () => {};

  function render() {
    containerEl.innerHTML = "";
    OPTIONS.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-card option-card--compact";
      btn.setAttribute("aria-pressed", String(opt.id === current));
      btn.innerHTML = `
        <span class="option-card__name">${I18n.t(opt.nameKey)}</span>
        <span class="option-card__desc">${I18n.t(opt.descKey)}</span>
      `;
      btn.addEventListener("click", () => select(opt.id));
      containerEl.appendChild(btn);
    });
  }

  function select(id) {
    current = id;
    render();
    onSelect(id);
  }

  function setVisible(visible) {
    sectionEl.hidden = !visible;
  }

  function init(container, changeCallback, initial) {
    sectionEl = document.getElementById("ios-version-picker");
    containerEl = container;
    onSelect = changeCallback;
    if (initial) current = initial;
    render();
  }

  return {
    init,
    select,
    refresh: render,
    setVisible,
    get current() {
      return current;
    },
  };
})();
