async function convert() {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown: editor.value, fontSize, theme }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

function clearPages() {
  proof.querySelectorAll(".page img").forEach((img) => {
    if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  });
  proof.querySelectorAll(".page").forEach((p) => p.remove());
}

async function displayPdf(blob) {
  const buf = await blob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const scrollTop = proof.scrollTop;

  const containerWidth = proof.clientWidth;
  const targetCssWidth = containerWidth * 0.86;
  const outputScale = window.devicePixelRatio || 1;

  const fragment = document.createDocumentFragment();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const unscaledVp = page.getViewport({ scale: 1 });
    const baseScale = targetCssWidth / unscaledVp.width;
    const physW = Math.round(unscaledVp.width * baseScale * outputScale);
    const physH = Math.round(unscaledVp.height * baseScale * outputScale);
    const cssW = physW / outputScale;
    const cssH = physH / outputScale;

    const offscreen = document.createElement("canvas");
    offscreen.width = physW;
    offscreen.height = physH;

    const exactScale = physW / unscaledVp.width;
    const viewport = page.getViewport({ scale: exactScale });

    await page.render({
      canvasContext: offscreen.getContext("2d", { alpha: false }),
      viewport,
    }).promise;

    const img = document.createElement("img");
    img.style.width = cssW + "px";
    img.style.height = cssH + "px";
    img.style.display = "block";
    img.addEventListener("load", () => img.classList.add("loaded"), {
      once: true,
    });

    const pageBlob = await new Promise((res) =>
      offscreen.toBlob(res, "image/png"),
    );
    img.src = URL.createObjectURL(pageBlob);

    const wrapper = document.createElement("div");
    wrapper.className = "page";
    wrapper.appendChild(img);
    fragment.appendChild(wrapper);
  }

  clearPages();
  proof.insertBefore(fragment, emptyMsg);
  proof.scrollTop = scrollTop;
}

let resizeTimer = null,
  lastWidth = 0,
  lastRenderDpr = 0;
function onViewChange() {
  if (!lastBlob || proof.hidden) return;
  const w = proof.clientWidth;
  if (!w) return;
  const d = window.devicePixelRatio || 1;
  if (w === lastWidth && d === lastRenderDpr) return;
  lastWidth = w;
  lastRenderDpr = d;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => displayPdf(lastBlob), 250);
}
window.addEventListener("resize", onViewChange);
(function watchDpr() {
  const mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  mq.addEventListener("change", function once() {
    mq.removeEventListener("change", once);
    onViewChange();
    watchDpr();
  });
})();

async function renderPdf() {
  if (!editor.value.trim()) {
    lastBlob = null;
    pdfDirty = false;
    renderedKey = null;
    clearPages();
    showEmpty("Empty document — start typing");
    setStatus("Ready");
    return;
  }
  if (keyOf() === renderedKey) {
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
    const blob = await convert();
    lastBlob = blob;
    pdfDirty = false;
    renderedKey = keyOf();
    showEmpty(null);
    await displayPdf(blob);
    setStatus("Ready");
  } catch (err) {
    clearPages();
    lastBlob = null;
    pdfDirty = true;
    renderedKey = null;
    showEmpty(
      "Couldn't generate PDF preview — try again, or simplify the document if it has large diagrams",
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

function outName() {
  let n = (filename.value || "document")
    .trim()
    .replace(/[\/\\:*?"<>|]+/g, "")
    .replace(/\.pdf$/i, "");
  return (n || "document") + ".pdf";
}
function save(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = outName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
async function download() {
  if (!editor.value.trim()) {
    flashStatus("Nothing to download");
    return;
  }
  downloadBtn.disabled = true;
  const needsConvert = pdfDirty || !lastBlob;
  if (needsConvert) downloadBtn.classList.add("loading");
  try {
    let blob = lastBlob;
    if (needsConvert) {
      setStatus("Preparing PDF…", "busy");
      blob = await convert();
      lastBlob = blob;
      pdfDirty = false;
    }
    save(blob);
    flashStatus("Saved " + outName());
    downloadBtn.classList.remove("loading");
    downloadBtn.classList.add("success");
    setTimeout(() => downloadBtn.classList.remove("success"), 1100);
  } catch (err) {
    setStatus("Conversion failed", "error");
    console.error(err);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.classList.remove("loading");
  }
}
downloadBtn.addEventListener("click", download);
window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    download();
  }
});
