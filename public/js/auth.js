const authOverlay = document.getElementById("authOverlay");
const authCardClose = document.getElementById("authCardClose");
const authHead = document.getElementById("authHead");
const authSub = document.getElementById("authSub");
const authOauth = document.getElementById("authOauth");
const authDivider = document.getElementById("authDivider");
const oauthGithubBtn = document.getElementById("oauthGithubBtn");
const oauthGoogleBtn = document.getElementById("oauthGoogleBtn");
const loginForm = document.getElementById("accountLoginForm");
const emailField = document.getElementById("emailField");
const emailInput = document.getElementById("accountEmail");
const passwordField = document.getElementById("passwordField");
const passwordInput = document.getElementById("accountPassword");
const accountForgotBtn = document.getElementById("accountForgotBtn");
const accountSubmitBtn = document.getElementById("accountSubmitBtn");
const accountToggleBtn = document.getElementById("accountToggleBtn");
const accountHint = document.getElementById("accountHint");

const accountSkeleton = document.getElementById("accountSkeleton");
const signinTrigger = document.getElementById("signinTrigger");
const accountControl = document.getElementById("accountControl");
const accountTrigger = document.getElementById("accountTrigger");
const accountMenu = document.getElementById("accountMenu");
const accountMenuEmail = document.getElementById("accountMenuEmail");
const accountAvatar = document.getElementById("accountAvatar");
const signOutBtn = document.getElementById("accountSignOut");

let session = null;
let sessionLoading = true;

let authMode = "signin";
let pendingSaveIntent = false;

const AUTH_MODE = {
  signin: {
    head: "Sign in",
    sub: "Save your documents to the cloud.",
    submit: "Sign in",
    loading: "Signing in…",
    showEmail: true,
    showPassword: true,
    showForgot: true,
    showOauth: true,
    toggle: "Don't have an account? Create one",
    toggleTarget: "signup",
  },
  signup: {
    head: "Create account",
    sub: "Save your documents to the cloud.",
    submit: "Create account",
    loading: "Creating account…",
    showEmail: true,
    showPassword: true,
    showForgot: false,
    showOauth: true,
    toggle: "Already have an account? Sign in",
    toggleTarget: "signin",
  },
  reset: {
    head: "Reset password",
    sub: "We'll email you a link to reset your password.",
    submit: "Send reset link",
    loading: "Sending…",
    showEmail: true,
    showPassword: false,
    showForgot: false,
    showOauth: false,
    toggle: "Back to sign in",
    toggleTarget: "signin",
  },
  recovery: {
    head: "Set a new password",
    sub: "Choose a new password to finish resetting your account.",
    submit: "Set new password",
    loading: "Updating…",
    showEmail: false,
    showPassword: true,
    showForgot: false,
    showOauth: false,
    toggle: null,
    toggleTarget: null,
  },
};

function applyAuthModeConfig() {
  const cfg = AUTH_MODE[authMode];
  authHead.textContent = cfg.head;
  authSub.textContent = cfg.sub;
  authOauth.hidden = !cfg.showOauth;
  authDivider.hidden = !cfg.showOauth;
  emailField.hidden = !cfg.showEmail;
  emailInput.required = cfg.showEmail;
  passwordField.hidden = !cfg.showPassword;
  passwordInput.required = cfg.showPassword;
  passwordInput.placeholder =
    authMode === "recovery" ? "New password" : "••••••••";
  accountForgotBtn.hidden = !cfg.showForgot;
  accountSubmitBtn.textContent = cfg.submit;
  accountToggleBtn.hidden = !cfg.toggle;
  if (cfg.toggle) accountToggleBtn.textContent = cfg.toggle;
  accountHint.textContent = "";
  accountHint.className = "auth-hint";
}
function setAuthMode(mode) {
  authMode = mode;
  applyAuthModeConfig();
}
function setSubmitLoading(loading) {
  const cfg = AUTH_MODE[authMode];
  accountSubmitBtn.disabled = loading;
  accountSubmitBtn.innerHTML = loading
    ? '<span class="spinner"></span>' + cfg.loading
    : cfg.submit;
  emailInput.disabled = loading;
  passwordInput.disabled = loading;
}

function mapAuthError(err) {
  const msg = (err && err.message) || "";
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Incorrect email or password.";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "An account with that email already exists.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email before signing in.";
  if (m.includes("password should be at least") || m.includes("at least 6"))
    return "Password must be at least 6 characters.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Try again in a moment.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Network error — check your connection and try again.";
  if (m.includes("valid email")) return "Enter a valid email address.";
  return "Something went wrong. Please try again.";
}

function openAuthModal(mode) {
  if (mode) setAuthMode(mode);
  authOverlay.classList.add("show");
  setTimeout(() => emailInput.focus(), 0);
}
function closeAuthModal() {
  if (authMode === "recovery") return;
  authOverlay.classList.remove("show");
  pendingSaveIntent = false;
}
signinTrigger.addEventListener("click", () => openAuthModal("signin"));
authCardClose.addEventListener("click", closeAuthModal);
authOverlay.addEventListener("mousedown", (e) => {
  if (e.target === authOverlay) closeAuthModal();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && authOverlay.classList.contains("show"))
    closeAuthModal();
});

function openAccountMenu() {
  const rect = accountTrigger.getBoundingClientRect();
  accountMenu.style.top = `${rect.bottom + 6}px`;
  accountMenu.style.right = `${window.innerWidth - rect.right}px`;
  accountMenu.hidden = false;
  accountControl.classList.add("open");
  accountTrigger.setAttribute("aria-expanded", "true");
}
function closeAccountMenu() {
  accountMenu.hidden = true;
  accountControl.classList.remove("open");
  accountTrigger.setAttribute("aria-expanded", "false");
}
accountTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  accountMenu.hidden ? openAccountMenu() : closeAccountMenu();
});
document.addEventListener("click", (e) => {
  if (!accountControl.contains(e.target) && !accountMenu.contains(e.target))
    closeAccountMenu();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !accountMenu.hidden) closeAccountMenu();
});

function renderAccountUI() {
  accountSkeleton.hidden = !sessionLoading;
  const signedIn = !!session && !sessionLoading;
  signinTrigger.hidden = sessionLoading || signedIn;
  accountControl.hidden = sessionLoading || !signedIn;
  syncCloudBtnDisabled();
  if (signedIn) {
    const label = session.user.email || "";
    accountAvatar.textContent = label[0] ? label[0].toUpperCase() : "?";
    accountAvatar.title = label;
    accountMenuEmail.textContent = label;
  } else if (!sessionLoading) {
    closeAccountMenu();
    applyAuthModeConfig();
  }
  if (currentView === "documents") renderDocumentsPage();
}

accountForgotBtn.addEventListener("click", () => setAuthMode("reset"));
accountToggleBtn.addEventListener("click", () => {
  const target = AUTH_MODE[authMode].toggleTarget;
  if (target) setAuthMode(target);
});

signOutBtn.addEventListener("click", async () => {
  closeAccountMenu();
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (err) {
    console.error(err);
    showDocumentsNotice("Couldn't sign out. Try again.");
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setSubmitLoading(true);
  accountHint.textContent = "";
  accountHint.className = "auth-hint";
  try {
    if (authMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput.value.trim(),
        password: passwordInput.value,
      });
      if (error) throw error;
    } else if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: emailInput.value.trim(),
        password: passwordInput.value,
      });
      if (error) throw error;
      accountHint.textContent = "Check your email to confirm your account.";
      accountHint.className = "auth-hint success";
    } else if (authMode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(
        emailInput.value.trim(),
        { redirectTo: window.location.origin + window.location.pathname },
      );
      if (error) throw error;
      accountHint.textContent = "Check your email for a reset link.";
      accountHint.className = "auth-hint success";
    } else if (authMode === "recovery") {
      const { error } = await supabase.auth.updateUser({
        password: passwordInput.value,
      });
      if (error) throw error;
      setAuthMode("signin");
      accountHint.textContent = "Password updated.";
      accountHint.className = "auth-hint success";
    }
  } catch (err) {
    accountHint.textContent = mapAuthError(err);
    accountHint.className = "auth-hint error";
  } finally {
    setSubmitLoading(false);
  }
});

async function signInWithOAuth(provider) {
  oauthGithubBtn.disabled = true;
  oauthGoogleBtn.disabled = true;
  accountHint.textContent = "";
  accountHint.className = "auth-hint";
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (error) throw error;
  } catch (err) {
    accountHint.textContent = mapAuthError(err);
    accountHint.className = "auth-hint error";
    oauthGithubBtn.disabled = false;
    oauthGoogleBtn.disabled = false;
  }
}
oauthGithubBtn.addEventListener("click", () => signInWithOAuth("github"));
oauthGoogleBtn.addEventListener("click", () => signInWithOAuth("google"));

supabase.auth.onAuthStateChange((event, sess) => {
  if (event === "PASSWORD_RECOVERY") {
    session = sess;
    sessionLoading = false;
    setAuthMode("recovery");
    renderAccountUI();
    openAuthModal("recovery");
    return;
  }
  const wasSignedIn = !!session;
  session = sess;
  sessionLoading = false;
  renderAccountUI();
  if (session && !wasSignedIn) {
    authOverlay.classList.remove("show");
    if (pendingSaveIntent) {
      pendingSaveIntent = false;
      proceedSave();
    } else {
      restoreLastDocument();
    }
  } else if (!session && wasSignedIn) {
    resetEditorForSignOut();
  }
});

supabase.auth.getSession().then(({ data }) => {
  session = data.session;
  sessionLoading = false;
  renderAccountUI();
  if (session) restoreLastDocument();
});
