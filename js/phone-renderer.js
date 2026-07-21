const PhoneRenderer = (() => {
  let frameEl, screenEl, illustrationWrapEl;
  let activeSvg = null;
  let tapPointEls = [];
  let fingerEl = null;
  let renderToken = 0;
  let lastStep = null;
  const svgTextCache = {};

  // On mobile the mockup is small, so instead of shrinking the whole phone
  // screen (tiny text), we crop the SVG to a full-width band centred on the
  // action — this enlarges the content ~2x and never clips a row sideways.
  const VIEWBOX_W = 300;
  const VIEWBOX_H = 630;
  const BAND_H = 250; // visible band height (viewBox units) on mobile
  const mobileMq = window.matchMedia("(max-width: 599px)");

  function mount() {
    frameEl = document.getElementById("phone-frame");
    screenEl = document.getElementById("phone-screen");
    illustrationWrapEl = document.getElementById("illustration-wrap");
    // Re-render when crossing the mobile/desktop boundary so the crop + tap
    // points recompute for the new layout.
    mobileMq.addEventListener("change", () => {
      if (lastStep) renderStep(lastStep);
    });
  }

  function setOsVariant(osVariant) {
    frameEl.className = "phone-frame";
    frameEl.classList.add(`phone-frame--${osVariant}`);
  }

  function clearTapPoints() {
    tapPointEls.forEach((el) => el.remove());
    tapPointEls = [];
    if (fingerEl) {
      fingerEl.remove();
      fingerEl = null;
    }
  }

  // Returns { top } — the top of the visible band in viewBox units — for the
  // current step's tap-point centroid, or a centred band when there are none.
  function bandTop(tapPoints) {
    let cyFrac = 0.5;
    if (tapPoints && tapPoints.length) {
      cyFrac =
        tapPoints.reduce((s, p) => s + p.y, 0) / tapPoints.length / 100;
    }
    const cy = cyFrac * VIEWBOX_H;
    return Math.min(VIEWBOX_H - BAND_H, Math.max(0, cy - BAND_H / 2));
  }

  function fingerSvg() {
    // A clean pointing-hand cursor — reads as "tap here" without any words.
    return `
      <svg viewBox="0 0 44 48" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18 4c0-2.2 1.8-4 4-4s4 1.8 4 4v16l4-2c2-1 4.4-.3 5.5 1.6l4 7c1.7 2.9 2.2 6.3 1.4 9.6l-1.1 4.6c-.7 3-3.4 5.1-6.5 5.1H22c-2.5 0-4.9-1.1-6.5-3l-9-10.6c-1.6-1.9-1.4-4.7.5-6.2 1.6-1.3 3.9-1.2 5.4.2L18 24V4z"
          fill="#ffffff" stroke="#182746" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`;
  }

  function renderTapPoints(tapPoints, top) {
    clearTapPoints();
    if (!tapPoints || !tapPoints.length) return;
    const mobile = mobileMq.matches;

    tapPoints.forEach((tp, i) => {
      // On mobile the visible band is [top, top+BAND_H]; map the point into it.
      let yPct = tp.y;
      if (mobile) {
        yPct = (((tp.y / 100) * VIEWBOX_H - top) / BAND_H) * 100;
      }
      const el = document.createElement("div");
      el.className = "tap-point" + (tp.shape === "rect" ? " tap-point--rect" : "");
      el.style.left = `${tp.x}%`;
      el.style.top = `${yPct}%`;
      if (tp.shape === "rect") {
        el.style.width = mobile ? "80%" : "34%";
        el.style.height = mobile ? "20%" : `${Math.max(tp.radius * 2, 24)}px`;
      } else if (mobile) {
        el.style.width = "26%";
        el.style.height = "22%";
      }
      if (tp.label) el.setAttribute("aria-label", tp.label);
      el.setAttribute("aria-hidden", "true");
      illustrationWrapEl.appendChild(el);
      tapPointEls.push(el);
      requestAnimationFrame(() => el.classList.add("is-visible"));

      // A pointing finger on the first (primary) tap point.
      if (i === 0) {
        fingerEl = document.createElement("div");
        fingerEl.className = "tap-finger";
        fingerEl.innerHTML = fingerSvg();
        fingerEl.style.left = `${tp.x}%`;
        fingerEl.style.top = `${yPct}%`;
        illustrationWrapEl.appendChild(fingerEl);
        requestAnimationFrame(() => fingerEl.classList.add("is-visible"));
      }
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
    lastStep = step;
    const token = ++renderToken;
    const markup = await fetchSvgMarkup(`assets/illustrations/${step.illustration}`);
    if (token !== renderToken) return; // a newer step was requested meanwhile

    const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
    const svgEl = doc.documentElement;
    applyScreenText(svgEl);

    const mobile = mobileMq.matches;
    const top = bandTop(step.tapPoints);
    if (mobile) {
      // Show a full-width, action-centred band → big, readable text.
      svgEl.setAttribute("viewBox", `0 ${top} ${VIEWBOX_W} ${BAND_H}`);
      svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    } else {
      svgEl.setAttribute("viewBox", `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`);
      svgEl.setAttribute("preserveAspectRatio", "xMidYMid slice");
    }
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

    renderTapPoints(step.tapPoints || [], top);
  }

  return { mount, setOsVariant, renderStep };
})();
