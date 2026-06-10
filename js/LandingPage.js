tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        "colors": {
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
        "borderRadius": {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px"
        },
        "spacing": {
          "sm": "16px",
          "xl": "80px",
          "base": "4px",
          "md": "24px",
          "xs": "8px",
          "lg": "48px",
          "gutter": "24px",
          "container-max": "1280px"
        },
        "fontFamily": {
          "label-sm": ["Inter"],
          "headline-lg": ["Inter"],
          "headline-md": ["Inter"],
          "display-lg-mobile": ["Inter"],
          "body-lg": ["Inter"],
          "headline-lg-mobile": ["Inter"],
          "body-md": ["Inter"],
          "label-md": ["Inter"],
          "display-lg": ["Inter"]
        },
        "fontSize": {
          "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "500"}],
          "headline-lg": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
          "headline-md": ["32px", {"lineHeight": "40px", "fontWeight": "600"}],
          "display-lg-mobile": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "800"}],
          "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
          "headline-lg-mobile": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
          "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
          "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "600"}],
          "display-lg": ["64px", {"lineHeight": "72px", "letterSpacing": "-0.02em", "fontWeight": "800"}]
        }
      },
    },
  }

  // Smooth scroll for anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        const mobileDrawer = document.getElementById('mobileDrawer');
        const drawerOverlay = document.getElementById('drawerOverlay');
        if (mobileDrawer) mobileDrawer.classList.remove('open');
        if (drawerOverlay) drawerOverlay.classList.remove('open');
      }
    });
  });