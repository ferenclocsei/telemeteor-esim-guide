const Troubleshoot = (() => {
  let flow = null;
  const nodesById = {};
  let trail = [];
  let currentId = null;
  let cardEl = null;

  // The support email is always English, regardless of UI language.
  const EN_OS = {
    ios: "iPhone (iOS)",
    "android-samsung": "Samsung Galaxy",
    "android-pixel": "Google Pixel",
    "android-generic": "Android phone",
  };
  const EN_DELIVERY = { link: "Quick Link", qr: "QR code", manual: "Manual entry" };

  async function load() {
    if (flow) return;
    const res = await fetch("content/structure/troubleshoot.json", { cache: "no-cache" });
    flow = await res.json();
    flow.nodes.forEach((n) => {
      nodesById[n.id] = n;
    });
  }

  function start() {
    trail = [];
    render(flow.start);
  }

  function rerender() {
    if (currentId) render(currentId);
  }

  function record(node, answer) {
    if (node.emailLabel) trail.push({ emailLabel: node.emailLabel, answer });
  }

  function buildMailto() {
    const device =
      (typeof DevicePicker !== "undefined" && EN_OS[DevicePicker.current]) || "my phone";
    const delivery =
      (typeof DeliveryPicker !== "undefined" && EN_DELIVERY[DeliveryPicker.current]) || "";
    const lines = [
      "Hello Telemeteor Support,",
      "",
      "My eSIM is installed but I still have a problem. Details:",
      "",
      `Device: ${device}`,
    ];
    if (delivery) lines.push(`Installation method: ${delivery}`);
    if (trail.length) {
      lines.push("", "Troubleshooting steps I already went through:");
      trail.forEach((t) => lines.push(`- ${t.emailLabel}: ${t.answer}`));
    }
    lines.push("", "Problem description: [please describe briefly what you see]", "", "Thank you!");
    const subject = `eSIM issue - ${device}`;
    return (
      `mailto:${flow.supportEmail}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(lines.join("\n"))}`
    );
  }

  function button(label, className, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `ts-btn ${className}`;
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function render(id) {
    const node = nodesById[id];
    if (!node || !cardEl) return;
    currentId = id;
    cardEl.innerHTML = "";

    const icon = document.createElement("div");
    icon.className = "ts-card__icon";
    icon.textContent = node.icon || "🛟";
    cardEl.appendChild(icon);

    const h = document.createElement("h2");
    h.className = "ts-card__title";
    h.textContent = I18n.t(`ts.${id}.title`);
    cardEl.appendChild(h);

    const p = document.createElement("p");
    p.className = "ts-card__body";
    p.textContent = I18n.t(`ts.${id}.body`);
    cardEl.appendChild(p);

    const actions = document.createElement("div");
    actions.className = "ts-card__actions";

    if (node.type === "intro") {
      actions.appendChild(button(I18n.t("ui.ts.start"), "ts-btn--primary", () => render(node.next)));
    } else if (node.type === "check") {
      actions.appendChild(
        button(I18n.t("ui.ts.solved"), "ts-btn--solved", () => {
          record(node, "this fixed it");
          render(node.solved);
        })
      );
      actions.appendChild(
        button(I18n.t("ui.ts.notsolved"), "ts-btn--muted", () => {
          record(node, "tried, didn't help");
          render(node.notsolved);
        })
      );
    } else if (node.type === "question") {
      actions.appendChild(
        button(I18n.t("ui.ts.yes"), "ts-btn--primary", () => {
          record(node, "yes");
          render(node.yes);
        })
      );
      actions.appendChild(
        button(I18n.t("ui.ts.no"), "ts-btn--muted", () => {
          record(node, "no");
          render(node.no);
        })
      );
    } else if (node.type === "info") {
      actions.appendChild(button(I18n.t("ui.ts.next"), "ts-btn--primary", () => render(node.next)));
    } else if (node.type === "end-success") {
      actions.appendChild(button(I18n.t("ui.ts.restart"), "ts-btn--muted", () => start()));
    } else if (node.type === "end-support") {
      const a = document.createElement("a");
      a.className = "ts-btn ts-btn--primary";
      a.href = buildMailto();
      a.textContent = I18n.t("ui.ts.email-cta");
      actions.appendChild(a);

      const note = document.createElement("p");
      note.className = "ts-card__note";
      note.textContent = I18n.t("ui.ts.email-note", { email: flow.supportEmail });
      actions.appendChild(note);

      actions.appendChild(button(I18n.t("ui.ts.restart"), "ts-btn--muted", () => start()));
    }

    cardEl.appendChild(actions);
  }

  return {
    load,
    start,
    rerender,
    setCard(el) {
      cardEl = el;
    },
  };
})();
