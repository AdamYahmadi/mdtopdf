const themePicker = document.getElementById("themePicker");
const themeTrigger = document.getElementById("themeTrigger");
const themeMenu = document.getElementById("themeMenu");
const themeCurrent = document.getElementById("themeCurrent");
const themeOptions = Array.from(themeMenu.querySelectorAll(".theme-option"));

const THEME_NAMES = [
  "light",
  "github",
  "github-dark",
  "one-dark",
  "tokyo-night",
];
let theme = localStorage.getItem("mdtopdf-theme");
if (!THEME_NAMES.includes(theme)) theme = "light";

function reflectTheme() {
  const opt =
    themeOptions.find((o) => o.dataset.theme === theme) || themeOptions[0];
  themeCurrent.textContent = opt.dataset.label;
  themeOptions.forEach((o) => {
    const on = o.dataset.theme === theme;
    o.classList.toggle("selected", on);
    o.setAttribute("aria-selected", on ? "true" : "false");
  });
}
function openThemeMenu() {
  const rect = themeTrigger.getBoundingClientRect();
  themeMenu.style.top = `${rect.bottom + 6}px`;
  themeMenu.style.right = `${window.innerWidth - rect.right}px`;
  themeMenu.hidden = false;
  themePicker.classList.add("open");
  themeTrigger.setAttribute("aria-expanded", "true");
}
function closeThemeMenu() {
  themeMenu.hidden = true;
  themePicker.classList.remove("open");
  themeTrigger.setAttribute("aria-expanded", "false");
}
themeTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  themeMenu.hidden ? openThemeMenu() : closeThemeMenu();
});
themeOptions.forEach((o) => {
  o.addEventListener("click", () => {
    theme = o.dataset.theme;
    localStorage.setItem("mdtopdf-theme", theme);
    reflectTheme();
    closeThemeMenu();
    renderPreview();
  });
});
document.addEventListener("click", (e) => {
  if (!themePicker.contains(e.target)) closeThemeMenu();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !themeMenu.hidden) closeThemeMenu();
});
reflectTheme();

const sizeVal = document.getElementById("sizeVal");
const sizeUp = document.getElementById("sizeUp");
const sizeDown = document.getElementById("sizeDown");

const SIZE_MIN = 9,
  SIZE_MAX = 22;
let fontSize = parseInt(localStorage.getItem("mdtopdf-size"), 10);
if (!fontSize || fontSize < SIZE_MIN || fontSize > SIZE_MAX) fontSize = 14;
function applySize() {
  sizeVal.textContent = fontSize;
  sizeDown.disabled = fontSize <= SIZE_MIN;
  sizeUp.disabled = fontSize >= SIZE_MAX;
  localStorage.setItem("mdtopdf-size", fontSize);
}
function changeSize(d) {
  const n = Math.min(SIZE_MAX, Math.max(SIZE_MIN, fontSize + d));
  if (n === fontSize) return;
  fontSize = n;
  applySize();
  renderPreview();
}
sizeUp.addEventListener("click", () => changeSize(1));
sizeDown.addEventListener("click", () => changeSize(-1));

const confirmOverlay = document.getElementById("confirmOverlay");
const confirmTitle = document.getElementById("confirmTitle");
const confirmBody = document.getElementById("confirmBody");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");
const confirmActionBtn = document.getElementById("confirmActionBtn");
let confirmPendingAction = null;

function openConfirm({ title, body, actionLabel, danger = true, onConfirm }) {
  confirmTitle.textContent = title;
  confirmBody.textContent = body;
  confirmActionBtn.textContent = actionLabel;
  confirmActionBtn.className =
    "confirm-btn" + (danger ? " danger" : " primary");
  confirmPendingAction = onConfirm;
  confirmOverlay.classList.add("show");
}
function closeConfirmModal() {
  confirmOverlay.classList.remove("show");
  confirmPendingAction = null;
}
confirmCancelBtn.addEventListener("click", closeConfirmModal);
confirmOverlay.addEventListener("mousedown", (e) => {
  if (e.target === confirmOverlay) closeConfirmModal();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && confirmOverlay.classList.contains("show"))
    closeConfirmModal();
});
confirmActionBtn.addEventListener("click", async () => {
  const action = confirmPendingAction;
  if (!action) return;
  confirmActionBtn.disabled = true;
  try {
    await action();
    closeConfirmModal();
  } catch (_) {
  } finally {
    confirmActionBtn.disabled = false;
  }
});

(function () {
  const g = document.getElementById("guide");
  const btn = document.getElementById("guideDismiss");
  g.classList.add("show");
  function close() {
    g.classList.add("fade");
    setTimeout(() => g.classList.remove("show", "fade"), 250);
  }
  btn.addEventListener("click", close);
  g.addEventListener("mousedown", (e) => {
    if (e.target === g) close();
  });
  window.addEventListener("keydown", function onKey(e) {
    if (e.key === "Escape") {
      close();
      window.removeEventListener("keydown", onKey);
    }
  });
})();

const wordmarkHome = document.getElementById("wordmarkHome");
const backToEditorBtn = document.getElementById("backToEditorBtn");

const docsNavBtn = document.getElementById("docsNavBtn");

const appBody = document.querySelector(".app-body");

function showEditorView() {
  currentView = "editor";
  documentsPage.hidden = true;
  appBody.hidden = false;
  backToEditorBtn.hidden = true;
  docsNavBtn.classList.remove("active");
  closeRowMenu();
}
function showDocumentsView() {
  currentView = "documents";
  appBody.hidden = true;
  documentsPage.hidden = false;
  backToEditorBtn.hidden = false;
  docsNavBtn.classList.add("active");
  closeAccountMenu();
  loadDocumentsIfNeeded(false);
  renderDocumentsPage();
}
backToEditorBtn.addEventListener("click", () => {
  if (currentView !== "editor") showEditorView();
});
wordmarkHome.addEventListener("click", () => {
  if (currentView !== "editor") showEditorView();
});
wordmarkHome.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && currentView !== "editor") {
    e.preventDefault();
    showEditorView();
  }
});
docsNavBtn.addEventListener("click", () => {
  if (currentView !== "documents") showDocumentsView();
  else loadDocumentsIfNeeded(true);
});

applySize();
renderHighlight();
setViewMode(viewMode);
