const viewPagesBtn = document.getElementById("viewPages");
const viewContinuousBtn = document.getElementById("viewContinuous");
const proofContinuous = document.getElementById("proofContinuous");
const emptyContinuous = document.getElementById("emptyContinuous");
let activeFrame = document.getElementById("continuousFrameA");
let bufferFrame = document.getElementById("continuousFrameB");

let lastBlob = null,
  pdfDirty = true;
let renderedContinuousKey = null;
let busy = false,
  again = false,
  previewTimer = null;
let renderedKey = null;
const keyOf = () => fontSize + "\n" + theme + "\n" + editor.value;

const VIEW_MODES = ["pages", "continuous"];
let viewMode = localStorage.getItem("mdtopdf-view");
if (!VIEW_MODES.includes(viewMode)) viewMode = "continuous";

const CONTINUOUS_STYLE = `<style>
    body { padding: 40px 4px; }
    .markdown-body { max-width: 760px; margin: 0 auto; }
  </style>`;

async function fetchPreviewHtml() {
  const res = await fetch("/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown: editor.value, fontSize, theme }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.text();
}

function showContinuousEmpty(msg) {
  if (msg) {
    fillEmpty(emptyContinuous, msg);
    emptyContinuous.classList.add("show");
  } else {
    emptyContinuous.classList.remove("show");
  }
}

function captureContinuousAnchor(win) {
  if (!win) return null;
  let els;
  try {
    els = win.document.querySelectorAll("[data-source-line]");
  } catch (_) {
    return null;
  }
  let best = null,
    bestTop = 0;
  for (const el of els) {
    const top = el.getBoundingClientRect().top;
    if (top <= 1) {
      best = el;
      bestTop = top;
    } else break;
  }
  return best
    ? { line: best.getAttribute("data-source-line"), top: bestTop }
    : null;
}
function restoreContinuousAnchor(win, anchor) {
  if (!anchor || !win) return;
  const el = win.document.querySelector(`[data-source-line="${anchor.line}"]`);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const docTop = rect.top + win.scrollY;
  win.scrollTo(0, docTop - anchor.top);
}
function watchAnchorSettle(win, anchor) {
  if (!win || !win.document || !win.document.body) return;
  let raf = null;
  const observer = new MutationObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => restoreContinuousAnchor(win, anchor));
  });
  observer.observe(win.document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  });
  setTimeout(() => {
    cancelAnimationFrame(raf);
    observer.disconnect();
  }, 3000);
}

function loadIntoFrame(frame, html) {
  return new Promise((resolve) => {
    frame.addEventListener("load", function onLoad() {
      frame.removeEventListener("load", onLoad);
      resolve();
    });
    frame.srcdoc = html;
  });
}

async function renderContinuous() {
  if (!editor.value.trim()) {
    renderedContinuousKey = null;
    activeFrame.removeAttribute("srcdoc");
    bufferFrame.removeAttribute("srcdoc");
    showContinuousEmpty("Empty document — start typing");
    setStatus("Ready");
    return;
  }
  if (keyOf() === renderedContinuousKey) {
    setStatus("Ready");
    return;
  }
  if (busy) {
    again = true;
    return;
  }
  busy = true;
  setStatus("Rendering…", "busy");
  try {
    let html = await fetchPreviewHtml();
    html = html.replace("</head>", CONTINUOUS_STYLE + "</head>");
    renderedContinuousKey = keyOf();
    showContinuousEmpty(null);

    const anchor = captureContinuousAnchor(activeFrame.contentWindow);
    const target = bufferFrame;
    await loadIntoFrame(target, html);
    restoreContinuousAnchor(target.contentWindow, anchor);

    activeFrame.classList.remove("active");
    target.classList.add("active");
    bufferFrame = activeFrame;
    activeFrame = target;

    target.style.display = "none";
    void target.offsetHeight;
    target.style.display = "";

    watchAnchorSettle(activeFrame.contentWindow, anchor);
    setStatus("Ready");
  } catch (err) {
    bufferFrame.removeAttribute("srcdoc");
    renderedContinuousKey = null;
    showContinuousEmpty(
      "Preview unavailable — " + (err.message || "conversion failed"),
    );
    setStatus("Conversion failed", "error");
    console.error(err);
  } finally {
    busy = false;
    if (again) {
      again = false;
      renderPreview();
    }
  }
}

function renderPreview() {
  if (viewMode === "continuous") renderContinuous();
  else renderPdf();
}
function schedulePreview() {
  pdfDirty = true;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 300);
}

function setViewMode(mode) {
  viewMode = mode;
  localStorage.setItem("mdtopdf-view", mode);
  viewPagesBtn.classList.toggle("active", mode === "pages");
  viewContinuousBtn.classList.toggle("active", mode === "continuous");
  viewPagesBtn.setAttribute("aria-pressed", String(mode === "pages"));
  viewContinuousBtn.setAttribute("aria-pressed", String(mode === "continuous"));
  proof.hidden = mode !== "pages";
  proofContinuous.hidden = mode !== "continuous";
  if (mode === "pages") onViewChange();
  renderPreview();
}
viewPagesBtn.addEventListener("click", () => {
  if (viewMode !== "pages") setViewMode("pages");
});
viewContinuousBtn.addEventListener("click", () => {
  if (viewMode !== "continuous") setViewMode("continuous");
});
