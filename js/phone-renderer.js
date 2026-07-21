const PhoneRenderer = (() => {
  let frameEl, screenEl, illustrationWrapEl, spotlightEl;
  let activeSvg = null;
  let tapPointEls = [];
  let fingerEl = null;
  let renderToken = 0;

  const svgTextCache = {};

  function mount() {
    frameEl = document.getElementById("phone-frame");
    screenEl = document.getElementById("phone-screen");
    illustrationWrapEl = document.getElementById("illustration-wrap");
    // A dim "spotlight" overlay that keeps a bright circle on the target and
    // gently darkens the rest — the eye goes straight to where to tap.
    spotlightEl = document.createElement("div");
    spotlightEl.className = "phone-frame__spotlight";
    spotlightEl.setAttribute("aria-hidden", "true");
    screenEl.appendChild(spotlightEl);
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

  function centroid(tapPoints) {
    if (!tapPoints || !tapPoints.length) return null;
    return {
      x: tapPoints.reduce((s, p) => s + p.x, 0) / tapPoints.length,
      y: tapPoints.reduce((s, p) => s + p.y, 0) / tapPoints.length,
    };
  }

  function fingerSvg() {
    // A clean pointing-hand cursor — reads as "tap here" without any words.
    return `
      <svg viewBox="0 0 44 48" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18 4c0-2.2 1.8-4 4-4s4 1.8 4 4v16l4-2c2-1 4.4-.3 5.5 1.6l4 7c1.7 2.9 2.2 6.3 1.4 9.6l-1.1 4.6c-.7 3-3.4 5.1-6.5 5.1H22c-2.5 0-4.9-1.1-6.5-3l-9-10.6c-1.6-1.9-1.4-4.7.5-6.2 1.6-1.3 3.9-1.2 5.4.2L18 24V4z"
          fill="#ffffff" stroke="#182746" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`;
  }

  function renderTapPoints(tapPoints) {
    clearTapPoints();
    const c = centroid(tapPoints);

    // Position / enable the spotlight on the target (or clear it).
    if (c) {
      spotlightEl.style.setProperty("--spot-x", `${c.x}%`);
      spotlightEl.style.setProperty("--spot-y", `${c.y}%`);
      spotlightEl.classList.add("is-active");
    } else {
      spotlightEl.classList.remove("is-active");
    }

    if (!tapPoints || !tapPoints.length) return;

    tapPoints.forEach((tp, i) => {
      const el = document.createElement("div");
      el.className = "tap-point" + (tp.shape === "rect" ? " tap-point--rect" : "");
      el.style.left = `${tp.x}%`;
      el.style.top = `${tp.y}%`;
      if (tp.shape === "rect") {
        el.style.width = "42%";
        el.style.height = `${Math.max(tp.radius * 2, 24)}px`;
      }
      if (tp.label) el.setAttribute("aria-label", tp.label);
      el.setAttribute("aria-hidden", "true");
      illustrationWrapEl.appendChild(el);
      tapPointEls.push(el);
      requestAnimationFrame(() => el.classList.add("is-visible"));

      if (i === 0) {
        fingerEl = document.createElement("div");
        fingerEl.className = "tap-finger";
        fingerEl.innerHTML = fingerSvg();
        fingerEl.style.left = `${tp.x}%`;
        fingerEl.style.top = `${tp.y}%`;
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
