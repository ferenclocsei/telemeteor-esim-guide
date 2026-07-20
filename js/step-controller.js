const StepController = (() => {
  let steps = [];
  let index = 0;
  let onChange = () => {};
  let onBackAtStart = () => {};
  let onComplete = () => {};

  let prevBtn, nextBtn, progressEl, progressLabelEl;
  let keyHandlerBound = false;
  let touchStartX = null;

  function mountControls() {
    prevBtn = document.getElementById("step-prev");
    nextBtn = document.getElementById("step-next");
    progressEl = document.getElementById("step-progress");
    progressLabelEl = document.getElementById("step-progress-label");

    prevBtn.addEventListener("click", () => goTo(index - 1));
    nextBtn.addEventListener("click", () => goTo(index + 1));

    if (!keyHandlerBound) {
      document.addEventListener("keydown", (e) => {
        const panel = document.getElementById("panel-guide");
        if (panel.hidden) return;
        if (e.key === "ArrowRight") goTo(index + 1);
        if (e.key === "ArrowLeft") goTo(index - 1);
      });
      const panel = document.getElementById("guide-panel");
      panel.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
      });
      panel.addEventListener("touchend", (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          if (dx < 0) goTo(index + 1);
          else goTo(index - 1);
        }
        touchStartX = null;
      });
      keyHandlerBound = true;
    }
  }

  function renderProgress() {
    progressEl.innerHTML = "";
    steps.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "step-progress__dot" + (i === index ? " step-progress__dot--active" : "");
      progressEl.appendChild(dot);
    });
    progressLabelEl.textContent = I18n.t("ui.nav.step-of", {
      current: index + 1,
      total: steps.length,
    });
    nextBtn.textContent = index === steps.length - 1 ? I18n.t("ui.nav.restart") : I18n.t("ui.nav.next");
  }

  function goTo(i) {
    if (!steps.length) return;
    if (i < 0) {
      onBackAtStart();
      return;
    }
    if (i >= steps.length) {
      onComplete();
      return;
    }
    index = i;
    renderProgress();
    onChange(steps[index], index, steps.length);
  }

  function init(newSteps, changeCallback, backAtStartCallback, completeCallback) {
    steps = newSteps;
    index = 0;
    onChange = changeCallback;
    onBackAtStart = backAtStartCallback || (() => {});
    onComplete = completeCallback || (() => {});
    if (!prevBtn) mountControls();
    if (steps.length) {
      renderProgress();
      onChange(steps[0], 0, steps.length);
    }
  }

  return { init, goTo };
})();
