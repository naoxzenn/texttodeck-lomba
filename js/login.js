/**
 * TextDeck AI — Login Page Logic
 * Handles: reverse route guard, input validation, mock JWT auth,
 * remember-me storage, and redirect to dashboard.
 */

// ─────────────────────────────────────────────────
// 1. REVERSE ROUTE GUARD
// If a valid auth token already exists, skip login and redirect.
// ─────────────────────────────────────────────────
(function reverseGuard() {
  const token =
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken");
  if (token) {
    window.location.replace("Dashboard.html");
  }
})();

// ─────────────────────────────────────────────────
// 2. TAILWIND CONFIG (preserving existing design tokens)
// ─────────────────────────────────────────────────
if (typeof tailwind !== "undefined") {
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          "surface-dim": "#d2d9f4",
          "on-primary-fixed-variant": "#00497d",
          "surface-container-lowest": "#ffffff",
          "on-error": "#ffffff",
          "surface-bright": "#faf8ff",
          "on-background": "#131b2e",
          "tertiary": "#00687c",
          "primary": "#0061a3",
          "surface-container-low": "#f2f3ff",
          "error-container": "#ffdad6",
          "on-secondary-container": "#fefcff",
          "primary-fixed-dim": "#9ecaff",
          "inverse-primary": "#9ecaff",
          "on-secondary-fixed-variant": "#003ea8",
          "tertiary-container": "#37b1cf",
          "surface-variant": "#dae2fd",
          "surface-tint": "#0061a3",
          "on-primary": "#ffffff",
          "on-tertiary-fixed": "#001f27",
          "secondary-fixed-dim": "#b4c5ff",
          "secondary-container": "#316bf3",
          "on-tertiary": "#ffffff",
          "surface-container-high": "#e2e7ff",
          "on-tertiary-fixed-variant": "#004e5e",
          "on-tertiary-container": "#00404d",
          "tertiary-fixed-dim": "#64d5f4",
          "outline": "#707883",
          "surface-container-highest": "#dae2fd",
          "inverse-on-surface": "#eef0ff",
          "on-secondary": "#ffffff",
          "background": "#faf8ff",
          "surface": "#faf8ff",
          "secondary": "#0051d5",
          "on-error-container": "#93000a",
          "on-surface-variant": "#404752",
          "outline-variant": "#c0c7d3",
          "inverse-surface": "#283044",
          "primary-fixed": "#d1e4ff",
          "error": "#ba1a1a",
          "on-surface": "#131b2e",
          "on-primary-fixed": "#001d36",
          "secondary-fixed": "#dbe1ff",
          "primary-container": "#4da8ff",
          "on-secondary-fixed": "#00174b",
          "surface-container": "#eaedff",
          "on-primary-container": "#003c67",
          "tertiary-fixed": "#b0ecff"
        },
        borderRadius: {
          DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px"
        },
        spacing: {
          sm: "16px", xl: "80px", base: "4px", md: "24px",
          xs: "8px", lg: "48px", gutter: "24px", "container-max": "1280px"
        },
        fontFamily: {
          "label-sm": ["Inter"], "headline-lg": ["Inter"],
          "headline-md": ["Inter"], "display-lg-mobile": ["Inter"],
          "body-lg": ["Inter"], "headline-lg-mobile": ["Inter"],
          "body-md": ["Inter"], "label-md": ["Inter"], "display-lg": ["Inter"]
        },
        fontSize: {
          "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
          "headline-lg": ["40px", { lineHeight: "48px", letterSpacing: "-0.01em", fontWeight: "700" }],
          "headline-md": ["32px", { lineHeight: "40px", fontWeight: "600" }],
          "display-lg-mobile": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "800" }],
          "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
          "headline-lg-mobile": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" }],
          "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
          "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
          "display-lg": ["64px", { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "800" }]
        }
      }
    }
  };
}

// ─────────────────────────────────────────────────
// 3. HELPERS
// ─────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function showError(message) {
  // Try to find an existing error element; if not, create one inside the form
  let errEl = document.getElementById("loginError");
  if (!errEl) {
    errEl = document.createElement("p");
    errEl.id = "loginError";
    errEl.style.cssText =
      "color:#ba1a1a;font-size:13px;font-weight:600;padding:10px 14px;" +
      "background:#ffdad6;border-radius:10px;margin-top:-8px;";
    const form = document.getElementById("loginForm");
    form.insertBefore(errEl, form.firstChild);
  }
  errEl.textContent = message;
  errEl.style.display = "block";
}

function clearError() {
  const errEl = document.getElementById("loginError");
  if (errEl) errEl.style.display = "none";
}

// ─────────────────────────────────────────────────
// 4. INPUT ANIMATION (focus scale effect)
// ─────────────────────────────────────────────────
document.querySelectorAll("input").forEach(function (input) {
  input.addEventListener("focus", function () {
    const wrapper = input.closest(".flex.flex-col.gap-xs");
    if (wrapper) wrapper.style.transform = "scale(1.01)";
  });
  input.addEventListener("blur", function () {
    const wrapper = input.closest(".flex.flex-col.gap-xs");
    if (wrapper) wrapper.style.transform = "";
  });
});

// ─────────────────────────────────────────────────
// 5. TOGGLE PASSWORD VISIBILITY
// ─────────────────────────────────────────────────
(function initPasswordToggle() {
  const toggleBtn = document.querySelector('#password ~ button[type="button"]');
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", function () {
    const passInput = document.getElementById("password");
    const icon = this.querySelector(".material-symbols-outlined");
    if (!passInput || !icon) return;

    if (passInput.type === "password") {
      passInput.type = "text";
      icon.textContent = "visibility_off";
    } else {
      passInput.type = "password";
      icon.textContent = "visibility";
    }
  });
})();

// ─────────────────────────────────────────────────
// 6. LOGIN FORM SUBMISSION WITH VALIDATION
// ─────────────────────────────────────────────────
(function initLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearError();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const rememberInput = document.getElementById("remember");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const remember = rememberInput ? rememberInput.checked : false;

    // --- Basic Validation ---
    if (!email) {
      showError("Email tidak boleh kosong.");
      if (emailInput) emailInput.focus();
      return;
    }
    if (!isValidEmail(email)) {
      showError("Format email tidak valid. Contoh: nama@email.com");
      if (emailInput) emailInput.focus();
      return;
    }
    if (!password) {
      showError("Password tidak boleh kosong.");
      if (passwordInput) passwordInput.focus();
      return;
    }
    if (password.length < 6) {
      showError("Password minimal 6 karakter.");
      if (passwordInput) passwordInput.focus();
      return;
    }

    // --- Mock Authentication ---
    const mockToken = "mock-jwt-token-12345";
    const userSession = JSON.stringify({
      fullName: "John Doe",
      email: email,
      profilePhoto:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
    });

    // Store token based on remember-me preference
    if (remember) {
      localStorage.setItem("authToken", mockToken);
      localStorage.setItem("userSession", userSession);
    } else {
      sessionStorage.setItem("authToken", mockToken);
      sessionStorage.setItem("userSession", userSession);
    }

    // --- Redirect to dashboard ---
    window.location.href = "Dashboard.html";
  });
})();