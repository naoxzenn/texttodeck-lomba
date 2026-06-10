/**
 * TextDeck Reusable Navbar Script
 * Handles dynamic fetching, active link highlights, mobile drawers, dark theme toggling, and authentication logic.
 */

function loadNavbar() {
  const container = document.getElementById("navbar-container");
  if (!container) return;

  fetch("components/navbar.html")
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch navbar HTML: " + response.statusText);
      }
      return response.text();
    })
    .then(html => {
      container.innerHTML = html;
      initNavbar();
    })
    .catch(err => {
      console.error("Navbar loading error:", err);
    });
}

function initNavbar() {
  // 1. Detect current page and apply active class
  const path = window.location.pathname;
  const filename = path.substring(path.lastIndexOf("/") + 1) || "LandingPage.html";
  
  let currentPage = "home";
  if (filename.includes("Dashboard.html")) {
    currentPage = "dashboard";
  } else if (filename.includes("TemplatesGallerry.html")) {
    currentPage = "templates";
  }

  // Highlight active links on desktop and mobile drawer
  document.querySelectorAll(`.nav-item[data-page="${currentPage}"], .drawer-item[data-page="${currentPage}"]`)
    .forEach(el => el.classList.add("active-nav"));

  // 2. Populate user session areas based on current page
  const userSection = document.getElementById("navbarUserSection");
  const mobileUserSection = document.getElementById("mobileDrawerUserSection");

  const loginBtnHtml = `<a href="login.html" class="login-btn">Login</a>`;
  const loggedInHtml = `
    <div class="user-profile">
      <span class="plan-badge">Free Plan</span>
      <div class="avatar">JD</div>
    </div>
    <button class="logout-btn" id="navLogoutBtn">
      <span class="material-symbols-outlined">logout</span>
      <span class="logout-text">Logout</span>
    </button>
  `;

  const mobileLoggedInHtml = `
    <div class="user-profile">
      <span class="plan-badge">Free Plan</span>
      <div class="avatar">JD</div>
    </div>
    <button class="theme-toggle-btn" id="mobileThemeToggleBtn" aria-label="Toggle Theme">
      <span class="material-symbols-outlined" id="mobileThemeToggleIcon">light_mode</span>
    </button>
    <button class="logout-btn" id="mobileNavLogoutBtn">
      <span class="material-symbols-outlined">logout</span>
      <span class="logout-text">Logout</span>
    </button>
  `;

  const mobileLoggedOutHtml = `
    <button class="theme-toggle-btn" id="mobileThemeToggleBtn" aria-label="Toggle Theme">
      <span class="material-symbols-outlined" id="mobileThemeToggleIcon">light_mode</span>
    </button>
    <a href="login.html" class="login-btn">Login</a>
  `;

  if (currentPage === "home") {
    if (userSection) userSection.innerHTML = loginBtnHtml;
    if (mobileUserSection) mobileUserSection.innerHTML = mobileLoggedOutHtml;
  } else {
    if (userSection) userSection.innerHTML = loggedInHtml;
    if (mobileUserSection) mobileUserSection.innerHTML = mobileLoggedInHtml;
  }

  // 3. Set up mobile drawer toggles
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const drawerCloseBtn = document.getElementById("drawerCloseBtn");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const mobileDrawer = document.getElementById("mobileDrawer");

  function openDrawer() {
    if (mobileDrawer) mobileDrawer.classList.add("open");
    if (drawerOverlay) drawerOverlay.classList.add("open");
  }

  function closeDrawer() {
    if (mobileDrawer) mobileDrawer.classList.remove("open");
    if (drawerOverlay) drawerOverlay.classList.remove("open");
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

  // Close drawer if layout drawer-items are clicked
  document.querySelectorAll(".drawer-item").forEach(item => {
    item.addEventListener("click", closeDrawer);
  });

  // 4. Sync Theme and togglers
  const htmlEl = document.documentElement;

  function syncThemeUI(theme) {
    const desktopThemeIcon = document.getElementById("themeToggleIcon");
    const mobileThemeIcon = document.getElementById("mobileThemeToggleIcon");

    if (theme === "dark") {
      htmlEl.classList.add("dark");
      htmlEl.classList.remove("light");
      if (desktopThemeIcon) desktopThemeIcon.textContent = "dark_mode";
      if (mobileThemeIcon) mobileThemeIcon.textContent = "dark_mode";
    } else {
      htmlEl.classList.add("light");
      htmlEl.classList.remove("dark");
      if (desktopThemeIcon) desktopThemeIcon.textContent = "light_mode";
      if (mobileThemeIcon) mobileThemeIcon.textContent = "light_mode";
    }
  }

  // Load and apply the saved theme
  let savedTheme = localStorage.getItem("theme");
  if (!savedTheme) {
    savedTheme = htmlEl.classList.contains("dark") ? "dark" : "light";
  }
  syncThemeUI(savedTheme);

  // Theme toggle click handlers
  function toggleTheme() {
    const currentTheme = htmlEl.classList.contains("dark") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    syncThemeUI(newTheme);
  }

  const desktopThemeBtn = document.getElementById("themeToggleBtn");
  if (desktopThemeBtn) {
    desktopThemeBtn.addEventListener("click", toggleTheme);
  }

  // Check mobile theme toggle after it might have been dynamically inserted
  const mobileThemeBtn = document.getElementById("mobileThemeToggleBtn");
  if (mobileThemeBtn) {
    mobileThemeBtn.addEventListener("click", toggleTheme);
  }

  // 5. Handle Logout
  function handleLogout() {
    if (confirm("Yakin logout?")) {
      window.location.href = "login.html";
    }
  }

  const logoutBtn = document.getElementById("navLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  const mobileLogoutBtn = document.getElementById("mobileNavLogoutBtn");
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", handleLogout);
  }
}

// Kickstart loading navbar on window/DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadNavbar);
} else {
  loadNavbar();
}
