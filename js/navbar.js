/**
 * TextDeck Reusable Navbar Script
 * Handles dynamic fetching, active link highlights, mobile drawers, and profile dropdown initialization.
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
  const filename = path.substring(path.lastIndexOf("/") + 1) || "index.html";

  let currentPage = "home";
  if (filename.includes("Dashboard.html")) {
    currentPage = "dashboard";
  } else if (filename.includes("Templates.html")) {
    currentPage = "templates";
  } else if (filename.includes("Settings.html")) {
    currentPage = "settings";
  }

  // Highlight active links on desktop and mobile drawer
  document.querySelectorAll(`.nav-item[data-page="${currentPage}"], .drawer-item[data-page="${currentPage}"]`)
    .forEach(el => el.classList.add("active-nav"));

  // 2. Populate user session areas based on localStorage login state
  const userSection = document.getElementById("navbarUserSection");
  const mobileUserSection = document.getElementById("mobileDrawerUserSection");

  const isLoggedIn = !!localStorage.getItem("authToken");

  if (isLoggedIn) {
    // Inject profile trigger wrapper on desktop
    if (userSection) {
      userSection.innerHTML = `
        <div class="profile-dropdown-container">
          <button class="avatar-trigger-btn" id="profileMenuTrigger" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" alt="User Avatar" class="avatar-img" id="navAvatarImg">
          </button>
          <div id="profileMenuDropdownContainer"></div>
        </div>
      `;
    }

    // Fetch and load profile-menu dropdown content
    fetch("components/profile-menu.html")
      .then(res => res.text())
      .then(menuHtml => {
        const desktopDropdownContainer = document.getElementById("profileMenuDropdownContainer");
        if (desktopDropdownContainer) {
          desktopDropdownContainer.innerHTML = menuHtml;
        }

        // Also display on mobile drawer (inside user section)
        if (mobileUserSection) {
          mobileUserSection.innerHTML = menuHtml;
        }

        // Initialize menu controllers
        if (typeof initProfileMenu === "function") {
          initProfileMenu();
        }
      })
      .catch(err => console.error("Error loading profile menu component:", err));

  } else {
    // Logged out structure
    const loginBtnHtml = `<a href="login.html" class="login-btn">Login</a>`;
    if (userSection) {
      userSection.innerHTML = loginBtnHtml;
    }
    if (mobileUserSection) {
      mobileUserSection.innerHTML = loginBtnHtml;
    }
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
}

// Load navbar on window load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadNavbar);
} else {
  loadNavbar();
}
