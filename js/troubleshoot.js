const Troubleshoot = (() => {
  let flow = null;
  const nodesById = {};
  const svgCache = {};
  let trail = [];
  let currentId = null;
  let cardEl = null;

  // Main checklist path, for the progress bar.
  const MAIN_PATH = [
    "region",
    "airplane",
    "esim-on",
    "data-line",
    "roaming",
    "apn",
    "network",
    "restart",
  ];

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
    if (node.emailLabel) {
      // Avoid duplicates if the user goes back and forth.
      trail = trail.filter((t) => t.emailLabel !== node.emailLabel);
      trail.push({ emailLabel: node.emailLabel, answer });
    }
  }

  function buildMailto() {
    const device =
      (typeof DevicePicker !== "undefined" && EN_OS[DevicePicker.current]) || "my phone";
    const delivery =
      (typeof DeliveryPicker !== "undefined" && EN_DELIVERY[DeliveryPicker.current]) || "";
    const lines = [
      "Hello Telemeteor Support,",
      "",
      "My eSIM is installed but I still have no working internet. Details:",
      "",
      `Device: ${device}`,
    ];
    if (delivery) lines.push(`Installation method: ${delivery}`);
    if (trail.length) {
      lines.push("", "Troubleshooting steps I already went through:");
      trail.forEach((t) => lines.push(`- ${t.emailLabel}: ${t.answer}`));
    }
    lines.push(
      "",
      "Problem description: [please describe briefly what you see on your screen]",
      "",
      "Country/city I'm in now: [please fill in]",
      "",
      "Thank you!"
    );
    const subject = `eSIM issue - ${device}`;
    return (
      `mailto:${flow.supportEmail}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(lines.join("\n"))}`
    );
  }

  async function fetchSvg(path) {
    if (svgCache[path]) return svgCache[path];
    const res = await fetch(`assets/illustrations/${path}`, { cache: "no-cache" });
    const text = await res.text();
    svgCache[path] = text;
    return text;
  }

  async function renderPhone(container, illustration, token, getToken) {
    const markup = await fetchSvg(illustration);
    if (token !== getToken()) return;
    const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
    const svg = doc.documentElement;
    svg.querySelectorAll("[data-key]").forEach((el) => {
      el.textContent = I18n.t(el.getAttribute("data-key"));
    });
    // Anchor to the top so the status bar + screen title stay visible.
    svg.setAttribute("preserveAspectRatio", "xMidYMin slice");
    svg.classList.add("ts-phone__svg");
    container.innerHTML = "";
    container.appendChild(svg);
    // Same guard as the guide: shrink any label a translation made too wide.
    requestAnimationFrame(() => PhoneRenderer.fitScreenText(svg));
  }

  function button(label, className, onClick, isLink, href) {
    const el = document.createElement(isLink ? "a" : "button");
    if (isLink) {
      el.href = href;
    } else {
      el.type = "button";
      el.addEventListener("click", onClick);
    }
    el.className = `ts-btn ${className}`;
    el.textContent = label;
    return el;
  }

  let renderToken = 0;

  function render(id) {
    const node = nodesById[id];
    if (!node || !cardEl) return;
    currentId = id;
    const token = ++renderToken;
    cardEl.innerHTML = "";

    // Progress bar for the main checklist.
    const mainIdx = MAIN_PATH.indexOf(id);
    if (mainIdx >= 0) {
      const prog = document.createElement("div");
      prog.className = "ts-progress";
      prog.innerHTML =
        `<span class="ts-progress__fill" style="width:${((mainIdx + 1) / MAIN_PATH.length) * 100}%"></span>`;
      cardEl.appendChild(prog);
      const count = document.createElement("p");
      count.className = "ts-progress__count";
      count.textContent = I18n.t("ui.ts.progress", { current: mainIdx + 1, total: MAIN_PATH.length });
      cardEl.appendChild(count);
    }

    // Visual: phone illustration if present, otherwise a big emoji badge.
    if (node.illustration) {
      const phone = document.createElement("div");
      phone.className = "ts-phone";
      const screen = document.createElement("div");
      screen.className = "ts-phone__screen";
      phone.appendChild(screen);
      cardEl.appendChild(phone);
      renderPhone(screen, node.illustration, token, () => renderToken);
    } else if (node.icon) {
      const icon = document.createElement("div");
      icon.className = "ts-card__icon";
      icon.textContent = node.icon;
      cardEl.appendChild(icon);
    }

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
    } else if (node.type === "question") {
      actions.appendChild(
        button(I18n.t("ui.ts.yes"), "ts-btn--yes", () => {
          record(node, "yes");
          render(node.yes);
        })
      );
      actions.appendChild(
        button(I18n.t("ui.ts.no"), "ts-btn--no", () => {
          record(node, "no");
          render(node.no);
        })
      );
    } else if (node.type === "fix") {
      actions.appendChild(
        button(I18n.t("ui.ts.solved"), "ts-btn--yes", () => {
          record(node, "this fixed it");
          render(node.solved);
        })
      );
      actions.appendChild(
        button(I18n.t("ui.ts.notsolved"), "ts-btn--no", () => {
          record(node, "tried, still not working");
          render(node.notsolved);
        })
      );
    } else if (node.type === "reassure") {
      actions.appendChild(button(I18n.t("ui.ts.restart"), "ts-btn--muted", () => start()));
    } else if (node.type === "end-success") {
      actions.appendChild(button(I18n.t("ui.ts.restart"), "ts-btn--muted", () => start()));
    } else if (node.type === "end-support") {
      actions.appendChild(
        button(I18n.t("ui.ts.email-cta"), "ts-btn--primary", null, true, buildMailto())
      );
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
