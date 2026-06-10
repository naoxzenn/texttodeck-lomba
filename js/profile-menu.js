// Profile Dropdown Menu Logic

class ProfileMenu {
  constructor() {
    this.trigger = document.getElementById("profileMenuTrigger");
    this.menu = document.getElementById("profileDropdownMenu");
    this.logoutBtn = document.getElementById("dropdownLogoutBtn");
    
    if (this.trigger && this.menu) {
      this.init();
    }
  }

  init() {
    // Click to toggle
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
      if (this.isOpen() && !this.menu.contains(e.target) && !this.trigger.contains(e.target)) {
        this.close();
      }
    });

    // Close on Esc key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) {
        this.close();
        this.trigger.focus();
      }
    });

    // Logout execution
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener("click", () => {
        this.logout();
      });
    }

    // Load initial user details from localStorage
    this.loadUserDetails();
  }

  isOpen() {
    return this.menu.classList.contains("show");
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.menu.classList.add("show");
    this.trigger.setAttribute("aria-expanded", "true");
    this.menu.setAttribute("aria-hidden", "false");
    
    // Focus first link in menu for accessibility
    const firstLink = this.menu.querySelector("a");
    if (firstLink) {
      setTimeout(() => firstLink.focus(), 50);
    }
  }

  close() {
    this.menu.classList.remove("show");
    this.trigger.setAttribute("aria-expanded", "false");
    this.menu.setAttribute("aria-hidden", "true");
  }

  loadUserDetails() {
    const user = JSON.parse(localStorage.getItem("userSession") || "{}");
    const nameEl = document.getElementById("dropdownUserName");
    const emailEl = document.getElementById("dropdownUserEmail");
    const avatarEl = document.getElementById("dropdownAvatar");
    const triggerBtn = document.getElementById("profileMenuTrigger");

    const defaultName = "John Doe";
    const defaultEmail = "john@example.com";
    const defaultPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";

    const userName = user.fullName || defaultName;
    const userEmail = user.email || defaultEmail;
    const userPhoto = user.profilePhoto || defaultPhoto;

    if (nameEl) nameEl.textContent = userName;
    if (emailEl) emailEl.textContent = userEmail;
    if (avatarEl) avatarEl.src = userPhoto;

    // Update trigger avatar image if it exists
    if (triggerBtn) {
      const triggerImg = triggerBtn.querySelector("img");
      if (triggerImg) {
        triggerImg.src = userPhoto;
      }
    }
  }

  logout() {
    console.log("Logging out user...");
    
    // Clear localStorage session keys
    localStorage.removeItem("authToken");
    localStorage.removeItem("userSession");
    
    // Clear cookie (if applicable)
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Redirect to login
    window.location.href = "login.html";
  }
}

// Global initialization helper
function initProfileMenu() {
  window.profileMenuInstance = new ProfileMenu();
}
