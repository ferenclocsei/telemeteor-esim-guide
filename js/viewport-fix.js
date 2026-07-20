// iOS Safari (esp. opened via SMS/Messages in-app browser) sometimes locks in
// a wrong initial zoom level while the page is still loading translated
// content. Nudging the viewport meta tag after load forces WebKit to
// recompute the scale, the same effect a manual pinch-zoom has.
window.addEventListener("load", function () {
  var viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return;
  var original = viewport.getAttribute("content");
  viewport.setAttribute("content", original + ", maximum-scale=1");
  setTimeout(function () {
    viewport.setAttribute("content", original);
  }, 300);
});
