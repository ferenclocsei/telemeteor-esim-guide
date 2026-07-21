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

  function centroid(tapPoints) {
    if (!tapPoints || !tapPoints.length) return null;
    return {
      x: tapPoints.reduce((s, p) => s + p.x, 0) / tapPoints.length,
      y: tapPoints.reduce((s, p) => s + p.y, 0) / tapPoints.length,
    };
  }

  function renderTapPoints(tapPoints) {
    clearTapPoints();
    if (!tapPoints || !tapPoints.length) return;

    tapPoints.forEach((tp) => {
      // A hollow, pulsing frame sized to the element it points at — it outlines
      // the target and never covers its label.
      const el = document.createElement("div");
      el.className = "tap-point" + (tp.shape === "rect" ? " tap-point--rect" : "");
      el.style.left = `${tp.x}%`;
      el.style.top = `${tp.y}%`;
      el.style.width = `${tp.w || 86}%`;
      el.style.height = `${tp.h || 11}%`;
      if (tp.label) el.setAttribute("aria-label", tp.label);
      el.setAttribute("aria-hidden", "true");
      illustrationWrapEl.appendChild(el);
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

  // Translations are longer in some languages than the English the screens were
  // drawn with (Serbian "Upravljanje SIM karticama" is twice the width of
  // "SIM card manager"). Rather than hand-tuning every screen, shrink any label
  // that no longer fits the space it has. Must run after the SVG is in the DOM,
  // because it measures the rendered text.
  function fitScreenText(svgEl) {
    const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
    const boxWidth = vb && vb.width ? vb.width : 300;
    const PAD = 10;

    svgEl.querySelectorAll("text[data-key]").forEach((el) => {
      let len;
      try {
        len = el.getComputedTextLength();
      } catch (err) {
        return; // not rendered — nothing to measure
      }
      if (!len) return;

      const x = parseFloat(el.getAttribute("x")) || 0;
      const anchor = el.getAttribute("text-anchor") || "start";
      let avail;
      if (anchor === "middle") avail = 2 * Math.min(x - PAD, boxWidth - x - PAD);
      else if (anchor === "end") avail = x - PAD;
      else avail = boxWidth - x - PAD;

      // A label sharing its row with another one declares its own budget.
      const declared = parseFloat(el.getAttribute("data-maxw"));
      if (!Number.isNaN(declared)) avail = Math.min(avail, declared);
      if (avail <= 0 || len <= avail) return;

      const base = parseFloat(el.getAttribute("font-size")) || 14;
      el.setAttribute("font-size", Math.max(7.5, base * (avail / len)).toFixed(2));
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

    // Never show two screens at once: the previous illustration and its ring go
    // immediately, so the incoming screen fades in over the phone's own
    // background instead of being blended with the screen it replaces.
    clearTapPoints();
    if (activeSvg) activeSvg.remove();
    // Paint the wrap with the incoming screen's own background so the fade-in
    // never flashes through to whatever was behind it.
    const bgRect = svgEl.querySelector("rect");
    const bg = bgRect && bgRect.getAttribute("width") === "300" ? bgRect.getAttribute("fill") : null;
    illustrationWrapEl.style.background = bg || "#f2f2f7";
    illustrationWrapEl.appendChild(svgEl);
    activeSvg = svgEl;

    requestAnimationFrame(() => {
      fitScreenText(svgEl);
      svgEl.classList.add("is-active");
    });

    // The ring only appears once the screen it points at is actually there.
    window.setTimeout(() => {
      if (token !== renderToken) return;
      renderTapPoints(step.tapPoints || []);
    }, 240);
  }

  return { mount, setOsVariant, renderStep, fitScreenText };
})();
