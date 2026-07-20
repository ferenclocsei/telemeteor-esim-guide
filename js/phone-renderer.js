const PhoneRenderer = (() => {
  let frameEl, screenEl, illustrationWrapEl;
  let activeSvg = null;
  let tapPointEls = [];
  let renderToken = 0;
  const svgTextCache = {};

  function mount() {
    frameEl = document.getElementById("phone-frame");
    screenEl = document.getElementById("phone-screen");
    illustrationWrapEl = document.getElementById("illustration-wrap");
  }

  function setOsVariant(osVariant) {
    frameEl.className = "phone-frame";
    frameEl.classList.add(`phone-frame--${osVariant}`);
  }

  function clearTapPoints() {
    tapPointEls.forEach((el) => el.remove());
    tapPointEls = [];
  }

  function renderTapPoints(tapPoints) {
    clearTapPoints();
    tapPoints.forEach((tp) => {
      const el = document.createElement("div");
      el.className = "tap-point" + (tp.shape === "rect" ? " tap-point--rect" : "");
      el.style.left = `${tp.x}%`;
      el.style.top = `${tp.y}%`;
      if (tp.shape === "rect") {
        el.style.width = "34%";
        el.style.height = `${Math.max(tp.radius * 2, 24)}px`;
      }
      if (tp.label) el.setAttribute("aria-label", tp.label);
      el.setAttribute("aria-hidden", "true");
      screenEl.appendChild(el);
      tapPointEls.push(el);
      requestAnimationFrame(() => el.classList.add("is-visible"));
    });
  }

  async function fetchSvgMarkup(path) {
    if (svgTextCache[path]) return svgTextCache[path];
    const res = await fetch(path, { cache: "no-cache" });
    const text = await res.text();
    svgTextCache[path] = text;
    return text;
  }

  function applyScreenText(svgEl) {
    svgEl.querySelectorAll("[data-key]").forEach((el) => {
      el.textContent = I18n.t(el.getAttribute("data-key"));
    });
  }

  async function renderStep(step) {
    const token = ++renderToken;
    const markup = await fetchSvgMarkup(`assets/illustrations/${step.illustration}`);
    if (token !== renderToken) return; // a newer step was requested meanwhile

    const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
    const svgEl = doc.documentElement;
    applyScreenText(svgEl);
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svgEl.classList.add("phone-frame__illustration");
    svgEl.setAttribute("role", "img");
    svgEl.setAttribute("aria-label", step.title || "");

    const prevSvg = activeSvg;
    illustrationWrapEl.appendChild(svgEl);
    activeSvg = svgEl;

    requestAnimationFrame(() => {
      svgEl.classList.add("is-active");
      if (prevSvg) {
        prevSvg.classList.add("is-leaving");
        prevSvg.classList.remove("is-active");
        window.setTimeout(() => prevSvg.remove(), 360);
      }
    });

    renderTapPoints(step.tapPoints || []);
  }

  return { mount, setOsVariant, renderStep };
})();
