const editor = document.getElementById("editor");
const highlight = document.getElementById("highlight");
const proof = document.getElementById("proof");
const emptyMsg = document.getElementById("empty");
const statusEl = document.getElementById("status");
const downloadBtn = document.getElementById("download");
const filename = document.getElementById("filename");

const pdfjsLib = globalThis.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

let statusTimer = null;
function setStatus(t, k) {
  clearTimeout(statusTimer);
  statusEl.textContent = t;
  statusEl.className = "status" + (k ? " " + k : "");
}
function flashStatus(t, k) {
  setStatus(t, k);
  statusTimer = setTimeout(() => setStatus("Ready"), 1800);
}
function fillEmpty(root, msg) {
  const [title, ...rest] = msg.split(" — ");
  root.querySelector(".empty-title").textContent = title;
  root.querySelector(".empty-sub").textContent = rest.join(" — ");
}
function showEmpty(msg) {
  if (msg) {
    fillEmpty(emptyMsg, msg);
    emptyMsg.classList.add("show");
  } else {
    emptyMsg.classList.remove("show");
  }
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
