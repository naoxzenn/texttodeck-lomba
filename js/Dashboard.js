/**
 * TextDeck AI — dashboard.js
 * Integrated with the 4-layer template-engine.js.
 */

document.addEventListener("DOMContentLoaded", () => {

  // ── STATE ────────────────────────────────────────────────────────
  const state = {
    mode: "presentation", // "presentation" or "flashcard"
    slides: [],
    index: 0,
    theme: "futuristic",
    currentTemplate: localStorage.getItem('selectedTemplate') || "corporate",
    lastRawText: "",
    ratio: "16/9",
  };

  // ── DOM ELEMENTS ──────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const elSource      = $("sourceText");
  const elFile      = $("fileInput");
  const elCharCount = $("charCount");
  const elSlideCount= $("slideCountVal");
  const elGenBtn    = $("generateBtn");
  const elGenFcBtn  = $("generateFcBtn");
  const elGenText   = $("genText");
  const elGenIcon   = $("genIcon");
  const elCanvas    = $("slideCanvas");
  const elThumbs    = $("thumbRow");
  const elStream    = $("streamBox");
  const elStreamTxt = $("streamText");
  const elPrev      = $("prevBtn");
  const elNext      = $("nextBtn");
  const elFull      = $("fullscreenBtn");
  const elEdit      = $("editBtn");
  const elDownload  = $("downloadBtn");
  const elLabel     = $("slideLabel");
  const elModal     = $("editModal");
  const elBadge     = $("editBadge");
  const elTitle     = $("editTitle");
  const elBody      = $("editBody");
  const elBullWrap  = $("editBullets");
  const elBullInput = $("editBulletsInput");
  const elApply     = $("applyEdit");
  const elCancel    = $("cancelEdit");
  const elClose     = $("closeModal");
  const elSample    = $("sampleTextBtn");

  // Export Modal Elements
  const elExportModal = $("exportModal");
  const elCloseExport = $("closeExportModal");
  const elExportHtml  = $("exportHtmlBtn");
  const elExportPdf   = $("exportPdfBtn");
  const elExportPptx  = $("exportPptxBtn");

  // ── THEME STYLES ──────────────────────────────────────────────────
  const T = {
    futuristic: {
      wrap:  "background:linear-gradient(135deg,#0a1628,#0d2040 60%,#0a2550);padding:clamp(20px,4%,40px);position:relative;width:100%;box-sizing:border-box;overflow:hidden;color:#fff;font-family:'Inter',sans-serif;",
      badge: "display:inline-block;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(0,209,255,.15);color:#00d1ff;border:1px solid rgba(0,209,255,.3);margin-bottom:16px;width:fit-content;",
      title: "font-size:clamp(18px,2.5vw,26px);font-weight:800;color:#fff;line-height:1.25;margin-bottom:12px;word-break:break-word;",
      desc:  "font-size:clamp(12px,1.5vw,15px);color:rgba(255,255,255,.85);line-height:1.6;margin-bottom:16px;",
      bItem: "display:flex;gap:10px;margin-bottom:9px;",
      bDot:  "display:inline-block;width:7px;height:7px;border-radius:50%;background:#00d1ff;flex-shrink:0;margin-top:6px;",
      bTxt:  "font-size:14px;color:rgba(255,255,255,.85);line-height:1.6;",
      ff:    "background:linear-gradient(135deg,#0d2040,#0a2550);border:1px solid rgba(0,209,255,.25);color:#fff;",
      fb:    "background:rgba(0,209,255,.1);border:1px solid rgba(0,209,255,.3);color:#fff;"
    },
    corporate: {
      wrap:  "background:#fff;padding:clamp(20px,4%,40px);border-left:6px solid #0061a3;width:100%;box-sizing:border-box;overflow:hidden;color:#131b2e;font-family:'Inter',sans-serif;box-shadow:inset 0 0 20px rgba(0,0,0,0.02);",
      badge: "display:inline-block;padding:4px 14px;border-radius:4px;font-size:11px;font-weight:700;background:#e8f0fe;color:#0061a3;margin-bottom:16px;width:fit-content;",
      title: "font-size:clamp(18px,2.5vw,24px);font-weight:700;color:#131b2e;line-height:1.25;margin-bottom:12px;word-break:break-word;",
      desc:  "font-size:clamp(12px,1.5vw,14px);color:#283044;line-height:1.6;margin-bottom:16px;",
      bItem: "display:flex;gap:10px;margin-bottom:8px;",
      bDot:  "display:inline-block;width:8px;height:8px;background:#0061a3;flex-shrink:0;margin-top:6px;",
      bTxt:  "font-size:14px;color:#283044;line-height:1.6;",
      ff:    "background:#f8fafc;border:2px solid #0061a3;color:#131b2e;",
      fb:    "background:#e8f0fe;border:2px solid #0061a3;color:#131b2e;"
    },
    creative: {
      wrap:  "background:linear-gradient(135deg,#7c3aed,#db2777 50%,#f59e0b);padding:clamp(20px,4%,40px);width:100%;box-sizing:border-box;overflow:hidden;color:#fff;font-family:'Inter',sans-serif;",
      badge: "display:inline-block;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(255,255,255,.25);color:#fff;margin-bottom:16px;width:fit-content;",
      title: "font-size:clamp(18px,2.8vw,28px);font-weight:900;color:#fff;line-height:1.2;margin-bottom:12px;text-shadow:0 2px 8px rgba(0,0,0,.2);word-break:break-word;",
      desc:  "font-size:clamp(12px,1.5vw,15px);color:#fff;line-height:1.6;font-weight:500;opacity:0.95;",
      bItem: "display:flex;gap:10px;margin-bottom:10px;",
      bDot:  "display:inline-block;width:10px;height:10px;border-radius:2px;background:#fff;flex-shrink:0;margin-top:5px;transform:rotate(45deg);",
      bTxt:  "font-size:14px;color:#fff;line-height:1.6;font-weight:500;",
      ff:    "background:rgba(124,58,237,.8);border:1px solid rgba(255,255,255,.3);color:#fff;",
      fb:    "background:rgba(219,39,119,.7);border:1px solid rgba(255,255,255,.3);color:#fff;"
    },
    dark: {
      wrap:  "background:linear-gradient(160deg,#0f1117,#1a1f2e);padding:clamp(20px,4%,40px);width:100%;box-sizing:border-box;overflow:hidden;color:#cbd5e1;font-family:'Inter',sans-serif;",
      badge: "display:inline-block;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25);margin-bottom:16px;width:fit-content;",
      title: "font-size:clamp(18px,2.5vw,26px);font-weight:800;color:#e2e8f0;line-height:1.25;margin-bottom:12px;word-break:break-word;",
      desc:  "font-size:clamp(12px,1.5vw,14px);color:#cbd5e1;line-height:1.6;opacity:0.9;",
      bItem: "display:flex;gap:10px;margin-bottom:10px;",
      bDot:  "display:inline-block;width:7px;height:7px;border-radius:50%;background:#34d399;flex-shrink:0;margin-top:6px;",
      bTxt:  "font-size:14px;color:#cbd5e1;line-height:1.6;",
      ff:    "background:#1e2336;border:1px solid rgba(52,211,153,.2);color:#e2e8f0;",
      fb:    "background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.25);color:#e2e8f0;"
    }
  };

  function ratioStyle(r) {
    const map = { "16/9": "16/9", "4/3": "4/3", "1/1": "1/1" };
    return `aspect-ratio:${map[r] || "16/9"};`;
  }

  // ── LAYER 3: RENDERERS ──────────────────────────────────────────

  function renderPresentationSlide(slide, themeId) {
    const s = T[themeId] || T.futuristic;
    const asp = ratioStyle(state.ratio);
    const badgeText = state.currentTemplate.toUpperCase();

    // Render bullet layout helpers
    const renderBullets = (bullets) => {
      if (!bullets || !bullets.length) return "";
      return bullets.map(b => `
        <div style="${s.bItem}">
          <span style="${s.bDot}"></span>
          <span style="${s.bTxt}">${b}</span>
        </div>
      `).join("");
    };

    let contentHTML = "";

    // Template specific structure variations
    switch (slide.layout) {
      case "concept": // Education Layout
        contentHTML = `
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.6;margin-bottom:4px;">Core Concept</div>
            <div style="${s.title}">${slide.title}</div>
            <div style="border-left:3px solid #00d1ff;padding-left:15px;margin-top:10px;font-style:italic;opacity:0.9;${s.desc}">
              ${slide.body}
            </div>
          </div>
        `;
        break;

      case "hero": // Startup Layout
        contentHTML = `
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
            <h1 style="font-size:clamp(20px,3.5vw,36px);font-weight:900;margin-bottom:12px;line-height:1.15;">${slide.title}</h1>
            <p style="font-size:clamp(13px,1.8vw,17px);max-width:85%;opacity:0.85;line-height:1.5;">${slide.body}</p>
          </div>
        `;
        break;

      case "hero-bullets": // Startup layout with bullets
        contentHTML = `
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
            <h2 style="font-size:clamp(18px,2.8vw,28px);font-weight:900;margin-bottom:16px;">${slide.title}</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
              ${(slide.bullets || []).map(b => `
                <div style="background:rgba(255,255,255,0.06);padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);">
                  <div style="font-weight:bold;margin-bottom:4px;color:#00d1ff;">💡 Key Point</div>
                  <div style="font-size:13px;opacity:0.9;">${b}</div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
        break;

      case "timeline-item": // Timeline layout
        contentHTML = `
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
            <div style="${s.title}">📍 ${slide.title}</div>
            <div style="margin-top:15px;position:relative;padding-left:20px;border-left:2px dashed rgba(255,255,255,0.3);">
              <div style="position:absolute;left:-6px;top:6px;width:10px;height:10px;border-radius:50%;background:#00d1ff;"></div>
              <p style="${s.desc}">${slide.body}</p>
            </div>
          </div>
        `;
        break;

      case "timeline-list": // Timeline layout list
        contentHTML = `
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
            <div style="${s.title}">📅 ${slide.title}</div>
            <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;position:relative;padding-left:10px;">
              ${(slide.bullets || []).map((b, idx) => `
                <div style="display:flex;gap:15px;align-items:center;">
                  <span style="font-weight:800;color:#00d1ff;font-size:16px;">0${idx+1}</span>
                  <div style="font-size:14px;opacity:0.9;">${b}</div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
        break;

      case "split": // Comparison layouts
        contentHTML = `
          <div style="flex:1;display:flex;gap:20px;align-items:stretch;">
            <div style="flex:1;background:rgba(255,255,255,0.03);padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;justify-content:center;">
              <h3 style="font-weight:bold;margin-bottom:8px;font-size:18px;color:#00d1ff;">${slide.title}</h3>
            </div>
            <div style="flex:1.5;display:flex;align-items:center;padding:12px;">
              <p style="${s.desc}">${slide.body}</p>
            </div>
          </div>
        `;
        break;

      case "two-column": // Two-column list layout
        contentHTML = `
          <div style="flex:1;display:flex;flex-direction:column;">
            <div style="${s.title}">${slide.title}</div>
            <div style="display:flex;gap:24px;flex:1;margin-top:12px;">
              <div style="flex:1;">
                <div style="font-size:11px;font-weight:bold;opacity:0.5;margin-bottom:8px;text-transform:uppercase;">Group A</div>
                ${renderBullets(slide.bullets)}
              </div>
              <div style="flex:1;border-left:1px solid rgba(255,255,255,0.1);padding-left:20px;">
                <div style="font-size:11px;font-weight:bold;opacity:0.5;margin-bottom:8px;text-transform:uppercase;">Group B</div>
                ${renderBullets(slide.bulletsRight)}
              </div>
            </div>
          </div>
        `;
        break;

      case "title-bullets":
      default:
        contentHTML = `
          <div style="${s.title}">${slide.title}</div>
          ${slide.body ? `<p style="${s.desc}">${slide.body}</p>` : ""}
          <div style="flex:1;overflow:hidden;margin-top:10px;">
            ${renderBullets(slide.bullets)}
          </div>
        `;
        break;
    }

    return `
      <div style="${s.wrap}${asp}width:100%;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;height:100%;">
        <div>
          <div style="${s.badge}">${badgeText}</div>
        </div>
        ${contentHTML}
      </div>
    `;
  }

  function renderFlashcard(slide, themeId) {
    const s = T[themeId] || T.futuristic;
    const asp = ratioStyle(state.ratio);
    const fcId = "fc_" + Math.random().toString(36).slice(2, 7);

    return `
      <div style="${s.wrap}${asp}width:100%;box-sizing:border-box;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100%;">
        <style>
          #${fcId} { width:85%;max-width:500px;cursor:pointer;perspective:1200px;height:70%; }
          #${fcId} .fc-inner { position:relative;width:100%;height:100%;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .5s ease;-webkit-transition:-webkit-transform .5s ease; }
          #${fcId}.flipped .fc-inner { transform:rotateY(180deg);-webkit-transform:rotateY(180deg); }
          #${fcId} .fc-front,
          #${fcId} .fc-back  { position:absolute;inset:0;border-radius:16px;padding:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.2); }
          #${fcId} .fc-back  { transform:rotateY(180deg);-webkit-transform:rotateY(180deg); }
        </style>
        <div id="${fcId}" onclick="this.classList.toggle('flipped')">
          <div class="fc-inner">
            <div class="fc-front" style="${s.ff}">
              <div style="${s.badge}">QUESTION</div>
              <div style="${s.title}margin-bottom:8px;word-break:break-word;">${slide.front}</div>
              <p style="font-size:11px;color:rgba(160,160,160,.8);margin-top:12px;">Tap to reveal answer →</p>
            </div>
            <div class="fc-back" style="${s.fb}">
              <div style="${s.badge}">ANSWER</div>
              <div style="font-size:clamp(13px,1.6vw,17px);line-height:1.65;word-break:break-word;font-weight:500;">${slide.back}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getActiveHTML(slide) {
    if (slide.type === "flashcard") {
      return renderFlashcard(slide, state.theme);
    }
    return renderPresentationSlide(slide, state.theme);
  }

  // ── PREVIEW RENDER ───────────────────────────────────────────────
  function renderEmpty() {
    if (elCanvas) elCanvas.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:260px;padding:32px;text-align:center;">
        <span class="material-symbols-outlined" style="font-size:64px;color:rgba(255,255,255,.18);margin-bottom:16px;">auto_awesome</span>
        <p style="color:rgba(255,255,255,.4);font-size:14px;font-weight:600;">Your generated items will appear here</p>
        <p style="color:rgba(255,255,255,.22);font-size:12px;margin-top:6px;">Enter content on the left and select presentation or flashcards</p>
      </div>`;
    if (elLabel) elLabel.textContent = "No items yet";
    if (elThumbs) { elThumbs.innerHTML = ""; elThumbs.classList.add("hidden"); }
  }

  function renderSlide() {
    if (!state.slides.length) { renderEmpty(); return; }
    if (elCanvas) elCanvas.innerHTML = getActiveHTML(state.slides[state.index]);
    if (elLabel) elLabel.textContent = `${state.mode === "flashcard" ? "Card" : "Slide"} ${state.index + 1} of ${state.slides.length}`;
    renderThumbs();
    syncNav();
  }

  function renderThumbs() {
    if (!elThumbs) return;
    elThumbs.innerHTML = "";
    elThumbs.style.display = "flex";
    elThumbs.classList.remove("hidden");

    state.slides.forEach((slide, i) => {
      const wrap = document.createElement("div");
      wrap.style.cssText = `flex:0 0 auto;width:96px;height:58px;border-radius:8px;overflow:hidden;
        cursor:pointer;border:2px solid ${i === state.index ? "#0061a3" : "rgba(100,100,120,.25)"};
        transition:border-color .15s;box-shadow:0 2px 8px rgba(0,0,0,0.15);background:#000;`;

      const inner = document.createElement("div");
      inner.style.cssText = "transform:scale(0.1875);transform-origin:top left;width:512px;height:308px;pointer-events:none;height:100%;";
      inner.innerHTML = getActiveHTML(slide);
      wrap.appendChild(inner);

      wrap.addEventListener("click", () => { state.index = i; renderSlide(); });
      elThumbs.appendChild(wrap);
    });
  }

  function syncNav() {
    const max = state.slides.length - 1;
    if (elPrev) {
      elPrev.disabled = state.index === 0;
      elPrev.style.opacity = elPrev.disabled ? "0.3" : "1";
    }
    if (elNext) {
      elNext.disabled = state.index >= max || max < 0;
      elNext.style.opacity = elNext.disabled ? "0.3" : "1";
    }
  }

  // ── STREAM SIMULATION ─────────────────────────────────────────────
  function stream(msg, onDone) {
    if (!elStream || !elStreamTxt) { onDone && onDone(); return; }
    elStream.classList.remove("hidden");
    elStreamTxt.textContent = "";
    const words = msg.split(" ");
    let i = 0;
    const t = setInterval(() => {
      if (i < words.length) {
        elStreamTxt.textContent += (i > 0 ? " " : "") + words[i++];
        elStream.scrollTop = elStream.scrollHeight;
      } else { clearInterval(t); onDone && onDone(); }
    }, 30);
  }

  // ── CHAR COUNTER ──────────────────────────────────────────────────
  elSource && elSource.addEventListener("input", () => {
    elCharCount.textContent = elSource.value.length.toLocaleString() + " characters";
  });

  // ── FILE UPLOAD ───────────────────────────────────────────────────
  elFile && elFile.addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["txt", "md"].includes(ext)) { alert("Only .txt and .md files supported."); return; }
    const r = new FileReader();
    r.onload = ev => { elSource.value = ev.target.result; elSource.dispatchEvent(new Event("input")); };
    r.readAsText(f);
  });

  // ── ASPECT RATIO ──────────────────────────────────────────────────
  const elRatio = $("aspectRatio");
  elRatio && elRatio.addEventListener("change", () => { state.ratio = elRatio.value; renderSlide(); });

  // ── THEME SWITCHER ────────────────────────────────────────────────
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.theme = btn.dataset.template || btn.dataset.theme || btn.getAttribute("data-template") || "futuristic";
      renderSlide();
    });
  });

  // ── LAYOUT TEMPLATE SWITCHER (Immediate Reactivity) ───────────────
  document.querySelectorAll(".pres-tpl-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pres-tpl-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.currentTemplate = btn.dataset.tpl;
      localStorage.setItem('selectedTemplate', state.currentTemplate);

      if (state.mode === "presentation" && state.lastRawText) {
        state.slides = generatePresentation(state.lastRawText, state.currentTemplate);
        state.index = 0;
        if (elSlideCount) elSlideCount.textContent = state.slides.length;
        renderSlide();
      }
    });
  });

  // ── GENERATION TRIGGERS ───────────────────────────────────────────
  function handleGeneration(mode) {
    const txt = elSource ? elSource.value.trim() : "";
    if (!txt) { alert("Please input source text first."); return; }

    state.mode = mode;
    state.lastRawText = txt;

    const activeBtn = mode === "presentation" ? elGenBtn : elGenFcBtn;
    const originalText = activeBtn.innerText;
    activeBtn.disabled = true;

    const streamMsg = mode === "presentation"
      ? "AI Parsing text blocks... Building outlines... Planning slide layouts... Styling slides..."
      : "AI Extracting concepts... Generating interactive cards... Preparing flip views...";

    stream(streamMsg, () => {
      if (mode === "presentation") {
        state.slides = generatePresentation(txt, state.currentTemplate);
      } else {
        state.slides = generateFlashcards(txt);
      }

      state.index = 0;
      if (elSlideCount) elSlideCount.textContent = state.slides.length;

      activeBtn.disabled = false;
      if (elStream) elStream.classList.add("hidden");
      renderSlide();
    });
  }

  elGenBtn && elGenBtn.addEventListener("click", () => handleGeneration("presentation"));
  elGenFcBtn && elGenFcBtn.addEventListener("click", () => handleGeneration("flashcard"));

  // ── NAVIGATION ────────────────────────────────────────────────────
  elPrev && elPrev.addEventListener("click", () => {
    if (state.index > 0) { state.index--; renderSlide(); }
  });
  elNext && elNext.addEventListener("click", () => {
    if (state.index < state.slides.length - 1) { state.index++; renderSlide(); }
  });

  // ── FULLSCREEN ────────────────────────────────────────────────────
  elFull && elFull.addEventListener("click", () => {
    if (elCanvas.requestFullscreen) elCanvas.requestFullscreen();
    else if (elCanvas.webkitRequestFullscreen) elCanvas.webkitRequestFullscreen();
  });

  // ── SAMPLE TEXT ───────────────────────────────────────────────────
  const SAMPLE = `Cristiano Ronaldo adalah pemain sepak bola profesional Portugal.

Karier:
- Sporting CP
- Manchester United
- Real Madrid
- Juventus
- Al Nassr

Prestasi:
- Ballon d'Or
- Champions League`;

  elSample && elSample.addEventListener("click", () => {
    elSource.value = SAMPLE;
    elSource.dispatchEvent(new Event("input"));
    elSource.focus();
  });

  // ── EDIT MODAL ────────────────────────────────────────────────────
  function openModal() {
    if (!state.slides.length || !elModal) return;
    const s = state.slides[state.index];

    if (s.type === "flashcard") {
      if (elBadge) elBadge.value = "Flashcard";
      if (elTitle) elTitle.value = s.front;
      if (elBody)  elBody.value  = s.back;
      if (elBullWrap) elBullWrap.classList.add("hidden");
    } else {
      if (elBadge) elBadge.value = (s.layout || "slide").toUpperCase();
      if (elTitle) elTitle.value = s.title || "";
      if (elBody)  elBody.value  = s.body || "";
      if (elBullWrap && elBullInput) {
        if (s.bullets && s.bullets.length) {
          elBullWrap.classList.remove("hidden");
          elBullInput.value = s.bullets.join("\n");
        } else {
          elBullWrap.classList.add("hidden");
          elBullInput.value = "";
        }
      }
    }
    elModal.classList.remove("hidden");
  }

  function closeModal() { elModal.classList.add("hidden"); }

  elEdit   && elEdit.addEventListener("click", openModal);
  elClose  && elClose.addEventListener("click", closeModal);
  elCancel && elCancel.addEventListener("click", closeModal);
  elModal  && elModal.addEventListener("click", e => { if (e.target === elModal) closeModal(); });

  elApply && elApply.addEventListener("click", () => {
    if (!state.slides.length) return;
    const s = state.slides[state.index];
    if (s.type === "flashcard") {
      s.front = elTitle ? elTitle.value.trim() : s.front;
      s.back  = elBody  ? elBody.value.trim()  : s.back;
    } else {
      s.title   = elTitle ? elTitle.value.trim() : s.title;
      s.body    = elBody  ? elBody.value.trim()  : s.body;
      if (elBullInput) {
        s.bullets = elBullInput.value.split("\n").map(l => l.trim()).filter(Boolean);
      }
    }
    closeModal();
    renderSlide();
  });

  // ── EXPORT MODAL LOGIC ────────────────────────────────────────────
  if (elDownload) {
    elDownload.addEventListener("click", () => {
      if (!state.slides.length) { alert("Please generate content first."); return; }
      elExportModal.classList.remove("hidden");
    });
  }

  if (elCloseExport) {
    elCloseExport.addEventListener("click", () => {
      elExportModal.classList.add("hidden");
    });
  }

  // HTML Export
  elExportHtml && elExportHtml.addEventListener("click", () => {
    const body = state.slides.map((s, i) => `
      <section>
        <p style="font-size:11px;color:#999;font-family:monospace;margin-bottom:8px;">Item ${i + 1} / ${state.slides.length}</p>
        ${getActiveHTML(s)}
      </section>`).join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>TextDeck Export</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Inter,system-ui,sans-serif;background:#f0f4f8;padding:32px;}
  section{border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.15);max-width:960px;margin:0 auto 40px;}
</style>
</head>
<body>
<header style="text-align:center;margin-bottom:40px;">
  <h1 style="font-size:26px;font-weight:800;color:#0061a3;">TextDeck Export</h1>
  <p style="color:#94a3b8;font-size:12px;margin-top:6px;">Generated on ${new Date().toLocaleString()}</p>
</header>
${body}
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "text-deck-export.html";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    elExportModal.classList.add("hidden");
  });

  // PDF Export
  elExportPdf && elExportPdf.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [960, 540] });

    for (let i = 0; i < state.slides.length; i++) {
      if (i > 0) doc.addPage();
      const slide = state.slides[i];

      // Render slide to a temp container to capture via html2canvas
      const temp = document.createElement("div");
      temp.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:960px;height:540px;";
      temp.innerHTML = getActiveHTML(slide);
      document.body.appendChild(temp);

      const canvas = await html2canvas(temp, { width: 960, height: 540 });
      document.body.removeChild(temp);

      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 0, 0, 960, 540);
    }

    doc.save("text-deck-presentation.pdf");
    elExportModal.classList.add("hidden");
  });

  // PPTX Export
  elExportPptx && elExportPptx.addEventListener("click", () => {
    const pptx = new PptxGenJS();

    state.slides.forEach((slide) => {
      const pSlide = pptx.addSlide();

      // Simple theme colors mapping for PPTX background
      let bgColor = "0A1628";
      let textColor = "FFFFFF";
      if (state.theme === "corporate") { bgColor = "FFFFFF"; textColor = "131B2E"; }
      if (state.theme === "creative") { bgColor = "7C3AED"; textColor = "FFFFFF"; }

      pSlide.background = { fill: bgColor };

      if (slide.type === "flashcard") {
        pSlide.addText(slide.front, { x: 1, y: 1.5, w: 8, h: 1, fontSize: 32, bold: true, color: textColor, align: "center" });
        pSlide.addText(slide.back, { x: 1, y: 2.8, w: 8, h: 2, fontSize: 18, color: textColor, align: "center" });
      } else {
        pSlide.addText(slide.title, { x: 0.8, y: 0.8, w: 8.4, h: 0.8, fontSize: 28, bold: true, color: textColor });
        if (slide.body) {
          pSlide.addText(slide.body, { x: 0.8, y: 1.8, w: 8.4, h: 1.2, fontSize: 16, color: textColor });
        }
        if (slide.bullets && slide.bullets.length) {
          const items = slide.bullets.map(b => ({ text: b, options: { bullet: true } }));
          pSlide.addText(items, { x: 0.8, y: slide.body ? 3.2 : 1.8, w: 8.4, h: 3, fontSize: 14, color: textColor });
        }
      }
    });

    pptx.writeFile({ fileName: "text-deck-presentation.pptx" });
    elExportModal.classList.add("hidden");
  });

  // ── INIT ──────────────────────────────────────────────────────────
  // Restore initial selected template active UI class
  const activeTplBtn = document.querySelector(`.pres-tpl-btn[data-tpl="${state.currentTemplate}"]`);
  if (activeTplBtn) {
    document.querySelectorAll(".pres-tpl-btn").forEach(b => b.classList.remove("selected"));
    activeTplBtn.classList.add("selected");
  }
  renderEmpty();
  syncNav();

}); // end DOMContentLoaded