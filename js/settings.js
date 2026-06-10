// Settings Page Logic

document.addEventListener("DOMContentLoaded", () => {
  // Ensure user is logged in
  if (!localStorage.getItem("authToken")) {
    window.location.href = "login.html";
    return;
  }

  initTabs();
  loadUserInfo();
  initPhotoUpload();
  initFormSubmissions();
  initSessionManagement();
});

// Toast Helper
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// 1. Navigation Tabs Logic
function initTabs() {
  const tabButtons = document.querySelectorAll(".settings-tab-btn");
  const tabPanels = document.querySelectorAll(".settings-panel");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPanelId = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.add("hidden"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.classList.remove("hidden");
      }
    });
  });
}

// 2. Load User Info from localStorage
function loadUserInfo() {
  const session = JSON.parse(localStorage.getItem("userSession") || "{}");
  
  const defaultName = "John Doe";
  const defaultEmail = "john@example.com";
  const defaultPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";

  const fullName = session.fullName || defaultName;
  const email = session.email || defaultEmail;
  const photo = session.profilePhoto || defaultPhoto;

  // Set Inputs
  const nameInput = document.getElementById("accName");
  const emailInput = document.getElementById("accEmail");
  const photoPreview = document.getElementById("profilePreview");

  if (nameInput) nameInput.value = fullName;
  if (emailInput) emailInput.value = email;
  if (photoPreview) photoPreview.src = photo;
}

// 3. Profile Photo Base64 upload & persistence
function initPhotoUpload() {
  const uploadBtn = document.getElementById("uploadPhotoBtn");
  const photoInput = document.getElementById("photoInput");
  const preview = document.getElementById("profilePreview");

  if (uploadBtn && photoInput) {
    uploadBtn.addEventListener("click", () => photoInput.click());

    photoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("⚠️ Silakan pilih file gambar saja.");
        return;
      }

      const reader = new FileReader();
      reader.onload = function(evt) {
        const base64 = evt.target.result;
        if (preview) preview.src = base64;

        // Save immediately in local storage session
        const session = JSON.parse(localStorage.getItem("userSession") || "{}");
        session.profilePhoto = base64;
        localStorage.setItem("userSession", JSON.stringify(session));

        // Sync with navbar if exists
        const navImg = document.getElementById("navAvatarImg");
        const dropdownImg = document.getElementById("dropdownAvatar");
        if (navImg) navImg.src = base64;
        if (dropdownImg) dropdownImg.src = base64;

        showToast("✓ Foto profil diperbarui!");
      };
      reader.readAsDataURL(file);
    });
  }
}

// 4. Form Submissions
function initFormSubmissions() {
  // Account Form
  const accForm = document.getElementById("accountForm");
  if (accForm) {
    accForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("accName").value.trim();
      const email = document.getElementById("accEmail").value.trim();

      if (!name || !email) {
        showToast("⚠️ Nama dan Email tidak boleh kosong.");
        return;
      }

      // Save Session
      const session = JSON.parse(localStorage.getItem("userSession") || "{}");
      session.fullName = name;
      session.email = email;
      localStorage.setItem("userSession", JSON.stringify(session));

      // Sync user dropdown
      const dName = document.getElementById("dropdownUserName");
      const dEmail = document.getElementById("dropdownUserEmail");
      if (dName) dName.textContent = name;
      if (dEmail) dEmail.textContent = email;

      showToast("✓ Pengaturan akun disimpan!");
    });
  }

  // Password Change
  const securityForm = document.getElementById("securityForm");
  if (securityForm) {
    securityForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const currentPass = document.getElementById("currentPassword").value;
      const newPass = document.getElementById("newPassword").value;
      const confirmPass = document.getElementById("confirmPassword").value;

      if (!currentPass || !newPass || !confirmPass) {
        showToast("⚠️ Semua field sandi harus diisi.");
        return;
      }

      if (newPass !== confirmPass) {
        showToast("⚠️ Konfirmasi sandi tidak sesuai.");
        return;
      }

      // Dummy confirmation
      showToast("✓ Sandi berhasil diubah!");
      securityForm.reset();
    });
  }

  // Preferences Change
  const prefForm = document.getElementById("preferencesForm");
  if (prefForm) {
    prefForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("✓ Preferensi disimpan!");
    });
  }
}

// 5. Session Management
function initSessionManagement() {
  const revokeBtns = document.querySelectorAll(".revoke-session-btn");
  revokeBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const sessionItem = btn.closest(".session-item");
      if (confirm("Revoke sesi ini?")) {
        sessionItem.style.transition = "opacity 0.2s, transform 0.2s";
        sessionItem.style.opacity = "0";
        sessionItem.style.transform = "scale(0.9)";
        setTimeout(() => {
          sessionItem.remove();
          showToast("✓ Sesi berhasil direvoke.");
        }, 200);
      }
    });
  });
}
