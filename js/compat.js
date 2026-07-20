// Renders the eSIM-compatibility verdict for a specific model the customer
// picked from search. Status comes from content/models/catalog.json (esim +
// optional noteKey), which is compiled from official + major-provider sources.
const Compat = (() => {
  let cardEl = null;
  let handlers = {};
  let lastVerifiedDate = "";
  const SUPPORT_EMAIL = "support@telemeteor.com";

  const ICON = { yes: "✅", region: "🟡", no: "❌" };

  function setCard(el) {
    cardEl = el;
  }

  function setMeta(date) {
    lastVerifiedDate = date || "";
  }

  function supportMailto(model) {
    const subject = `eSIM compatibility - ${model.brand} ${model.model}`;
    const body = [
      "Hello Telemeteor Support,",
      "",
      `I'd like to check eSIM compatibility for my phone: ${model.brand} ${model.model}.`,
      "",
      "Country where I bought it: [please fill in]",
      "",
      "Thank you!",
    ].join("\n");
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  function button(label, cls, onClick, isLink, href) {
    const el = document.createElement(isLink ? "a" : "button");
    if (isLink) el.href = href;
    else {
      el.type = "button";
      el.addEventListener("click", onClick);
    }
    el.className = `ts-btn ${cls}`;
    el.textContent = label;
    return el;
  }

  function show(model, h) {
    handlers = h || {};
    if (!cardEl) return;
    const status = model.esim || "region";
    cardEl.innerHTML = "";
    cardEl.className = `compat-card compat-card--${status}`;

    const icon = document.createElement("div");
    icon.className = "compat-card__icon";
    icon.textContent = ICON[status] || "🟡";
    cardEl.appendChild(icon);

    const name = document.createElement("p");
    name.className = "compat-card__model";
    name.textContent = `${model.brand} ${model.model}`;
    cardEl.appendChild(name);

    const title = document.createElement("h2");
    title.className = "compat-card__title";
    title.textContent = I18n.t(`ui.compat.title.${status}`);
    cardEl.appendChild(title);

    const sub = document.createElement("p");
    sub.className = "compat-card__sub";
    sub.textContent = I18n.t(`ui.compat.sub.${status}`);
    cardEl.appendChild(sub);

    if (model.noteKey) {
      const note = document.createElement("p");
      note.className = "compat-card__note";
      note.textContent = I18n.t(`ui.compat.note.${model.noteKey}`);
      cardEl.appendChild(note);
    }

    const actions = document.createElement("div");
    actions.className = "ts-card__actions";

    if (status !== "no") {
      actions.appendChild(
        button(I18n.t("ui.compat.cta.guide"), "ts-btn--primary", () =>
          handlers.onGuide && handlers.onGuide(model)
        )
      );
    }
    actions.appendChild(
      button(I18n.t("ui.compat.cta.support"), status === "no" ? "ts-btn--primary" : "ts-btn--muted", null, true, supportMailto(model))
    );
    actions.appendChild(
      button(I18n.t("ui.compat.cta.change"), "ts-btn--muted", () =>
        handlers.onChange && handlers.onChange()
      )
    );
    cardEl.appendChild(actions);

    if (lastVerifiedDate) {
      const disc = document.createElement("p");
      disc.className = "compat-card__disclaimer";
      disc.textContent = I18n.t("ui.compat.disclaimer", { date: lastVerifiedDate });
      cardEl.appendChild(disc);
    }
  }

  return { setCard, setMeta, show };
})();
