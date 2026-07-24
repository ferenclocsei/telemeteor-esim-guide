// A small set of hand-drawn line icons — one consistent style (24px grid,
// 2px round strokes, currentColor) so the whole guide feels designed, not
// pasted together from emoji. Used by the step badge and the delivery cards.
const Icons = (() => {
  const svg = (inner, extra = "") =>
    `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
    `xmlns="http://www.w3.org/2000/svg" ${extra}>${inner}</svg>`;

  const GLYPHS = {
    // Preparation — a clipboard with a tick.
    prepare: svg(
      '<rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/>' +
        '<path d="M9 4.5V3.6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.9"/>' +
        '<path d="M8.8 13.2l2.4 2.4 4.4-4.8"/>'
    ),
    // Settings — an unmistakable cog (not a sunburst).
    gear: svg(
      '<circle cx="12" cy="12" r="2.9"/>' +
        '<path d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
      ''
    ),
    // Camera.
    camera: svg(
      '<path d="M4 8.7a2 2 0 0 1 2-2h1.3l.9-1.5a1 1 0 0 1 .86-.5h5.9a1 1 0 0 1 .86.5l.9 1.5H18a2 2 0 0 1 2 2v7.6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>' +
        '<circle cx="12" cy="12.5" r="3.1"/>'
    ),
    // QR viewfinder with a few code cells.
    scan: svg(
      '<path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M20 8.5V6a2 2 0 0 0-2-2h-2.5M4 15.5V18a2 2 0 0 0 2 2h2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5"/>' +
        '<g stroke="none" fill="currentColor"><rect x="9" y="9" width="2.1" height="2.1" rx="0.4"/>' +
        '<rect x="12.9" y="9" width="2.1" height="2.1" rx="0.4"/>' +
        '<rect x="9" y="12.9" width="2.1" height="2.1" rx="0.4"/>' +
        '<rect x="12.9" y="12.9" width="2.1" height="2.1" rx="0.4"/></g>'
    ),
    // Chain link.
    link: svg(
      '<path d="M9.7 14.3l4.6-4.6"/>' +
        '<path d="M8.4 12.2l-1.7 1.7a3 3 0 1 0 4.24 4.24l1.7-1.7"/>' +
        '<path d="M15.6 11.8l1.7-1.7a3 3 0 0 0-4.24-4.24l-1.7 1.7"/>'
    ),
    // Envelope.
    email: svg(
      '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/>' +
        '<path d="M4.6 7.6l6.3 5a1.8 1.8 0 0 0 2.2 0l6.3-5"/>'
    ),
    // Bell.
    bell: svg(
      '<path d="M6.6 10a5.4 5.4 0 0 1 10.8 0c0 4.6 2 6 2 6H4.6s2-1.4 2-6z"/>' +
        '<path d="M10.1 19a2 2 0 0 0 3.8 0"/>'
    ),
    // Type it in — a keyboard.
    keyboard: svg(
      '<rect x="3" y="7" width="18" height="10" rx="2.3"/>' +
        '<path d="M6.7 10.6h.01M9.9 10.6h.01M13.1 10.6h.01M16.3 10.6h.01M8.5 13.6h7"/>'
    ),
    // Sparkles — something was found.
    sparkle: svg(
      '<path d="M11 4l1.5 3.8L16.3 9.3 12.5 10.8 11 14.6 9.5 10.8 5.7 9.3 9.5 7.8z"/>' +
        '<path d="M17.5 14.2l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/>',
      ''
    ),
    // Confirm — a ticked circle.
    check: svg(
      '<circle cx="12" cy="12" r="8.4"/>' + '<path d="M8.4 12.3l2.4 2.4 4.7-5.2"/>'
    ),
    // Add — a plus in a circle.
    add: svg(
      '<circle cx="12" cy="12" r="8.4"/>' + '<path d="M12 8.4v7.2M8.4 12h7.2"/>'
    ),
    // Globe — roaming.
    globe: svg(
      '<circle cx="12" cy="12" r="8.4"/>' +
        '<path d="M3.6 12h16.8"/>' +
        '<path d="M12 3.6c2.5 2.7 2.5 14.1 0 16.8c-2.5-2.7-2.5-14.1 0-16.8z"/>'
    ),
    // Signal bars — pick the data line.
    signal: svg(
      '<path d="M5 17v-2.2M9.7 17v-5M14.3 17V8.6M19 17V4.8"/>',
      'stroke-width="2.4"'
    ),
    // Download to a tray.
    download: svg(
      '<path d="M12 4.2v9.6"/><path d="M8.2 10.4l3.8 3.8 3.8-3.8"/><path d="M5 18.5h14"/>'
    ),
    // Price tag — name the plan.
    tag: svg(
      '<path d="M4 12.9V5.6a1.6 1.6 0 0 1 1.6-1.6h7.2a2 2 0 0 1 1.42.6l4.9 4.9a2 2 0 0 1 0 2.83l-5.79 5.79a2 2 0 0 1-2.83 0l-4.9-4.9A2 2 0 0 1 4 12.9z"/>' +
        '<circle cx="8.4" cy="8.4" r="1.15" fill="currentColor" stroke="none"/>'
    ),
    // Phone handset — call/SMS line.
    phone: svg(
      '<path d="M6.6 4.6h3l1.5 3.9-2 1.5a11 11 0 0 0 4.9 4.9l1.5-2 3.9 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.6 6.8 2 2 0 0 1 6.6 4.6z"/>'
    ),
    // Success rosette — all done.
    done: svg(
      '<circle cx="12" cy="9.6" r="5.9"/>' +
        '<path d="M9.3 9.3l2 2 3.9-4.2"/>' +
        '<path d="M8.7 14.6L7 20.4l5-2.3 5 2.3-1.7-5.8"/>'
    ),
    // Fallback — a target that says "here".
    target: svg(
      '<circle cx="12" cy="12" r="7.6"/>' +
        '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>'
    ),
  };

  // Which glyph leads each guide step, matched most-specific first.
  const STEP_RULES = [
    [/done|all-set|finish/, "done"],
    [/downloading|installing/, "download"],
    [/roaming/, "globe"],
    [/select-data-line|data-line/, "signal"],
    [/line-preferences/, "phone"],
    [/label/, "tag"],
    [/email/, "email"],
    [/camera/, "camera"],
    [/scan|qr/, "scan"],
    [/link/, "link"],
    [/notification|allow/, "bell"],
    [/manual|enter/, "keyboard"],
    [/detected|found/, "sparkle"],
    [/continue|confirm/, "check"],
    [/add-/, "add"],
    [/settings|cellular|connection|sim-manager|network|sims|find-sim/, "gear"],
    [/before-you-start/, "prepare"],
  ];

  function get(name) {
    return GLYPHS[name] || GLYPHS.target;
  }
  function forStep(id) {
    const key = String(id || "");
    for (const [re, name] of STEP_RULES) if (re.test(key)) return GLYPHS[name];
    return GLYPHS.target;
  }
  return { get, forStep };
})();
