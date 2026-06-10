/**
 * TextDeck AI — Dashboard Logic
 * Parsing engine, slide renderer, edit modal, export, route guard.
 */

// ── 1. ROUTE GUARD ──────────────────────────────────────────────
(function guard() {
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  if (!token) window.location.replace("login.html");
})();

// ── 2. STATE ─────────────────────────────────────────────────────
const state = {
  slidesData: [],
  currentSlideIndex: 0,
  selectedTemplate: "futuristic",
  selectedAspectRatio: "16/9",
  totalSlides: 3
};

// ── 3. DOM REFS ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const sourceText   = $("sourceText");
const fileInput    = $("fileInput");
const charCount    = $("charCount");
const slideCount   = $("slideCount");
const slideCountVal= $("slideCountVal");
const generateBtn  = $("generateBtn");
const genText      = $("genText");
const genIcon      = $("genIcon");
const slideCanvas  = $("slideCanvas");
const thumbRow     = $("thumbRow");
const streamBox    = $("streamBox");
const streamText   = $("streamText");
const prevBtn      = $("prevBtn");
const nextBtn      = $("nextBtn");
const fullscreenBtn= $("fullscreenBtn");
const editBtn      = $("editBtn");
const downloadBtn  = $("downloadBtn");
const slideLabel   = $("slideLabel");
const editModal    = $("editModal");
const editBadge    = $("editBadge");
const editTitle    = $("editTitle");
const editBody     = $("editBody");
const editBulletsWrap = $("editBullets");
const editBulletsInput= $("editBulletsInput");
const applyEdit    = $("applyEdit");
const cancelEdit   = $("cancelEdit");
const closeModal   = $("closeModal");

// ── 4. STOPWORDS & KEYWORD EXTRACTOR ─────────────────────────────
const STOPWORDS = new Set([
  "yang","di","ke","dari","dan","atau","itu","ini","untuk","adalah",
  "merupakan","pada","dengan","dalam","tidak","juga","oleh","sebagai",
  "ada","akan","dapat","bisa","sudah","telah","saat","jika","karena",
  "lebih","sangat","bahwa","sehingga","namun","tetapi","ketika","setelah",
  "antara","atas","bawah","satu","dua","tiga","the","a","an","is","are",
  "of","in","to","and","or","for","it","this","that","be","with"
]);

function extractKeywords(text, topN = 3) {
  const freq = {};
  text.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .forEach(w => {
        if (w.length > 2 && !STOPWORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
      });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w);
}

// ── 5. PARSING ENGINE ─────────────────────────────────────────────
function parseContent(rawText, maxSlides) {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  const items = [];   // { type, front?, back?, text?, bullets? }

  const bulletRE  = /^[-*•]\s+|^\d+\.\s+|^[a-z]\.\s+/i;
  const definitionRE = /\badalah\b|\bmerupakan\b/i;

  let currentSlide = null;

  lines.forEach(line => {
    if (definitionRE.test(line)) {
      // Flashcard rule
      const splitIdx = line.search(definitionRE);
      const match    = line.match(definitionRE);
      const front    = line.substring(0, splitIdx).trim();
      const back     = line.substring(splitIdx + match[0].length).trim();
      if (currentSlide) items.push(currentSlide);
      currentSlide = null;
      items.push({ type: "flashcard", front, back });
    } else if (bulletRE.test(line)) {
      // Bullet rule
      const cleaned = line.replace(bulletRE, "").trim();
      if (!currentSlide || currentSlide.type !== "bullets") {
        if (currentSlide) items.push(currentSlide);
        currentSlide = { type: "bullets", text: "", bullets: [] };
      }
      currentSlide.bullets.push(cleaned);
    } else {
      // Heading / body text
      if (currentSlide) {
        items.push(currentSlide);
        currentSlide = null;
      }
      items.push({ type: "text", text: line, bullets: [] });
    }
  });
  if (currentSlide) items.push(currentSlide);

  // Group items into slide pages
  const slides     = [];
  const perSlide   = Math.max(1, Math.ceil(items.length / maxSlides));
  const keywords   = extractKeywords(rawText);
  const badge      = keywords.length ? "#" + keywords[0] : "TextDeck";

  for (let i = 0; i < items.length; i += perSlide) {
    const chunk  = items.slice(i, i + perSlide);
    const first  = chunk[0];

    if (chunk.length === 1 && first.type === "flashcard") {
      slides.push({
        type: "flashcard",
        badge,
        title: first.front,
        body: first.back,
        bullets: [],
        keywords
      });
    } else {
      const allBullets = chunk.flatMap(c => c.bullets || []);
      const titleItem  = chunk.find(c => c.type === "text") || chunk[0];
      slides.push({
        type: "bullets",
        badge,
        title: titleItem.text || titleItem.front || "Slide",
        body: "",
        bullets: allBullets,
        keywords
      });
    }

    if (slides.length >= maxSlides) break;
  }

  // Pad slides if we got fewer than requested
  while (slides.length < maxSlides && slides.length > 0) {
    const ref = slides[slides.length - 1];
    slides.push({ ...ref, title: "Continued…", bullets: [], body: "" });
  }

  return slides;
}

// ── 6. TEMPLATE STYLES ────────────────────────────────────────────
const TEMPLATES = {
  futuristic: {
    wrapper: "background:linear-gradient(135deg,#0a1628 0%,#0d2040 60%,#0a2550 100%);min-height:320px;padding:40px;position:relative;overflow:hidden;",
    badge:   "display:inline-block;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.08em;background:rgba(0,209,255,.15);color:#00d1ff;border:1px solid rgba(0,209,255,.3);margin-bottom:18px;",
    title:   "font-size:clamp(20px,3vw,32px);font-weight:800;color:#fff;line-height:1.2;margin-bottom:14px;",
    body:    "font-size:14px;color:rgba(255,255,255,.7);line-height:1.7;margin-bottom:16px;",
    bullet:  "display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;",
    dot:     "display:inline-block;width:7px;height:7px;border-radius:50%;background:#00d1ff;flex-shrink:0;margin-top:6px;",
    bulletTxt:"font-size:14px;color:rgba(255,255,255,.82);line-height:1.6;",
    tag:     "display:inline-block;margin-right:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:rgba(0,209,255,.1);color:#64d5f4;border:1px solid rgba(0,209,255,.2);",
    flashFront:"background:linear-gradient(135deg,#0d2040,#0a2550);border:1px solid rgba(0,209,255,.25);color:#fff;",
    flashBack: "background:rgba(0,209,255,.1);border:1px solid rgba(0,209,255,.3);color:#fff;"
  },
  corporate: {
    wrapper: "background:#fff;min-height:320px;padding:40px;border-left:5px solid #0061a3;",
    badge:   "display:inline-block;padding:4px 14px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:.06em;background:#e8f0fe;color:#0061a3;margin-bottom:18px;",
    title:   "font-size:clamp(20px,3vw,30px);font-weight:700;color:#131b2e;line-height:1.25;margin-bottom:14px;",
    body:    "font-size:14px;color:#404752;line-height:1.7;margin-bottom:16px;",
    bullet:  "display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;",
    dot:     "display:inline-block;width:8px;height:8px;background:#0061a3;flex-shrink:0;margin-top:6px;",
    bulletTxt:"font-size:14px;color:#283044;line-height:1.6;",
    tag:     "display:inline-block;margin-right:6px;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;background:#f0f4f8;color:#0061a3;border:1px solid #c0c7d3;",
    flashFront:"background:#f8fafc;border:2px solid #0061a3;color:#131b2e;",
    flashBack: "background:#e8f0fe;border:2px solid #0061a3;color:#131b2e;"
  },
  creative: {
    wrapper: "background:linear-gradient(135deg,#7c3aed 0%,#db2777 50%,#f59e0b 100%);min-height:320px;padding:40px;",
    badge:   "display:inline-block;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.08em;background:rgba(255,255,255,.25);color:#fff;margin-bottom:18px;",
    title:   "font-size:clamp(22px,3.5vw,36px);font-weight:900;color:#fff;line-height:1.15;margin-bottom:14px;text-shadow:0 2px 8px rgba(0,0,0,.2);",
    body:    "font-size:14px;color:rgba(255,255,255,.9);line-height:1.7;margin-bottom:16px;",
    bullet:  "display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;",
    dot:     "display:inline-block;width:10px;height:10px;border-radius:2px;background:#fff;flex-shrink:0;margin-top:5px;transform:rotate(45deg);",
    bulletTxt:"font-size:14px;color:#fff;line-height:1.6;font-weight:500;",
    tag:     "display:inline-block;margin-right:6px;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(255,255,255,.2);color:#fff;",
    flashFront:"background:rgba(124,58,237,.8);border:1px solid rgba(255,255,255,.3);color:#fff;",
    flashBack: "background:rgba(219,39,119,.7);border:1px solid rgba(255,255,255,.3);color:#fff;"
  },
  dark: {
    wrapper: "background:linear-gradient(160deg,#0f1117 0%,#1a1f2e 100%);min-height:320px;padding:40px;",
    badge:   "display:inline-block;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.08em;background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25);margin-bottom:18px;",
    title:   "font-size:clamp(20px,3vw,32px);font-weight:800;color:#e2e8f0;line-height:1.2;margin-bottom:14px;",
    body:    "font-size:14px;color:#94a3b8;line-height:1.7;margin-bottom:16px;",
    bullet:  "display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;",
    dot:     "display:inline-block;width:7px;height:7px;border-radius:50%;background:#d4a017;flex-shrink:0;margin-top:6px;",
    bulletTxt:"font-size:14px;color:#cbd5e1;line-height:1.6;",
    tag:     "display:inline-block;margin-right:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:rgba(212,160,23,.12);color:#d4a017;border:1px solid rgba(212,160,23,.2);",
    flashFront:"background:#1e2336;border:1px solid rgba(52,211,153,.2);color:#e2e8f0;",
    flashBack: "background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.25);color:#e2e8f0;"
  }
};

// ── 7. RENDER ENGINE ──────────────────────────────────────────────
function getAspectStyle(ratio) {
  if (ratio === "16/9") return "aspect-ratio:16/9;";
  if (ratio === "4/3")  return "aspect-ratio:4/3;";
  if (ratio === "1/1")  return "aspect-ratio:1/1;";
  return "aspect-ratio:16/9;";
}

function buildSlideHTML(slide, tmpl) {
  const s = TEMPLATES[tmpl] || TEMPLATES.futuristic;
  const aspectStyle = getAspectStyle(state.selectedAspectRatio);

  if (slide.type === "flashcard") {
    return `
      <div style="${s.wrapper}${aspectStyle}display:flex;align-items:center;justify-content:center;">
        <div class="td-flashcard" onclick="this.classList.toggle('flipped')"
             style="width:80%;max-width:480px;min-height:180px;cursor:pointer;perspective:1000px;position:relative;">
          <div style="position:relative;width:100%;min-height:180px;transform-style:preserve-3d;transition:transform .6s;transform:var(--flip,rotateY(0deg));">
            <div style="position:absolute;inset:0;backface-visibility:hidden;border-radius:16px;padding:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;${s.flashFront}">
              <div style="${s.badge}">TERM</div>
              <div style="${s.title}margin-bottom:0;">${slide.title}</div>
              <p style="font-size:12px;color:rgba(150,150,150,.7);margin-top:12px;">Click to reveal →</p>
            </div>
            <div style="position:absolute;inset:0;backface-visibility:hidden;border-radius:16px;padding:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;transform:rotateY(180deg);${s.flashBack}">
              <div style="${s.badge}">DEFINITION</div>
              <div style="${s.body}margin-bottom:0;">${slide.body}</div>
            </div>
          </div>
        </div>
        <style>.td-flashcard.flipped > div { transform: rotateY(180deg) !important; }</style>
      </div>`;
  }

  const bulletsHTML = slide.bullets && slide.bullets.length
    ? slide.bullets.map(b => `
        <div style="${s.bullet}">
          <span style="${s.dot}"></span>
          <span style="${s.bulletTxt}">${b}</span>
        </div>`).join("")
    : "";

  const tagsHTML = slide.keywords && slide.keywords.length
    ? `<div style="margin-top:20px;">${slide.keywords.map(k =>
        `<span style="${s.tag}">${k}</span>`).join("")}</div>`
    : "";

  return `
    <div style="${s.wrapper}${aspectStyle}">
      <div style="${s.badge}">${slide.badge || "TextDeck"}</div>
      <div style="${s.title}">${slide.title}</div>
      ${slide.body ? `<div style="${s.body}">${slide.body}</div>` : ""}
      ${bulletsHTML}
      ${tagsHTML}
    </div>`;
}

function renderSlide() {
  if (!state.slidesData.length) {
    slideCanvas.innerHTML = `
      <div class="slide-card-content flex flex-col items-center justify-center h-full min-h-[240px] p-8 text-center">
        <span class="material-symbols-outlined text-white/20 text-[64px] mb-4">auto_awesome</span>
        <p class="text-white/40 text-sm font-medium">Your generated slides will appear here</p>
        <p class="text-white/25 text-xs mt-1">Enter content on the left and click Generate Slides</p>
      </div>`;
    slideLabel.textContent = "No slides yet";
    return;
  }

  const slide = state.slidesData[state.currentSlideIndex];
  slideCanvas.innerHTML = buildSlideHTML(slide, state.selectedTemplate);
  slideLabel.textContent = `Slide ${state.currentSlideIndex + 1} of ${state.slidesData.length}`;
  renderThumbs();
  updateNavBtns();
}

function renderThumbs() {
  thumbRow.innerHTML = "";
  thumbRow.classList.remove("hidden");
  thumbRow.style.display = "flex";

  state.slidesData.forEach((slide, i) => {
    const thumb = document.createElement("div");
    thumb.style.cssText = `
      flex: 0 0 auto; width: 100px; height: 60px; border-radius: 8px;
      overflow: hidden; cursor: pointer; border: 2px solid ${i === state.currentSlideIndex ? "#4da8ff" : "transparent"};
      transition: border-color .15s;`;

    const mini = document.createElement("div");
    mini.style.cssText = "transform: scale(0.2); transform-origin: top left; width: 500px; height: 300px; pointer-events: none;";
    mini.innerHTML = buildSlideHTML(slide, state.selectedTemplate);
    thumb.appendChild(mini);

    thumb.addEventListener("click", () => {
      state.currentSlideIndex = i;
      renderSlide();
    });
    thumbRow.appendChild(thumb);
  });
}

function updateNavBtns() {
  prevBtn.disabled = state.currentSlideIndex === 0;
  nextBtn.disabled = state.currentSlideIndex >= state.slidesData.length - 1;
  prevBtn.style.opacity = prevBtn.disabled ? "0.3" : "1";
  nextBtn.style.opacity = nextBtn.disabled ? "0.3" : "1";
}

// ── 8. STREAMING SIMULATION ───────────────────────────────────────
function simulateStream(text, onDone) {
  streamBox.classList.remove("hidden");
  if (streamText) streamText.textContent = "";
  const words = text.split(" ");
  let i = 0;
  const ticker = setInterval(() => {
    if (i < words.length) {
      if (streamText) streamText.textContent += (i > 0 ? " " : "") + words[i++];
      streamBox.scrollTop = streamBox.scrollHeight;
    } else {
      clearInterval(ticker);
      if (onDone) onDone();
    }
  }, 40);
}

// ── 9. EVENT LISTENERS ───────────────────────────────────────────

// Char counter
if (sourceText) {
  sourceText.addEventListener("input", () => {
    const len = sourceText.value.length;
    if (charCount) charCount.textContent = len.toLocaleString() + " characters";
  });
}

// File upload
if (fileInput) {
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "md"].includes(ext)) {
      alert("Hanya file .txt dan .md yang didukung untuk ekstraksi teks.");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      if (sourceText) {
        sourceText.value = ev.target.result;
        sourceText.dispatchEvent(new Event("input"));
      }
    };
    reader.readAsText(file);
  });
}

// Slide count slider
if (slideCount) {
  slideCount.addEventListener("input", () => {
    state.totalSlides = parseInt(slideCount.value);
    if (slideCountVal) slideCountVal.textContent = state.totalSlides;
  });
}

// Template selector
document.querySelectorAll(".template-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".template-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.selectedTemplate = btn.dataset.template || "futuristic";
    renderSlide();
  });
});

// Aspect ratio
const aspectRatioEl = $("aspectRatio");
if (aspectRatioEl) {
  aspectRatioEl.addEventListener("change", () => {
    state.selectedAspectRatio = aspectRatioEl.value;
    renderSlide();
  });
}

// Generate slides
if (generateBtn) {
  generateBtn.addEventListener("click", () => {
    const text = sourceText ? sourceText.value.trim() : "";
    if (!text) {
      alert("Masukkan teks terlebih dahulu.");
      return;
    }

    genText.textContent = "Processing...";
    genIcon.textContent = "hourglass_empty";
    generateBtn.disabled = true;

    const preview = "Parsing content… identifying definitions, bullets, and keywords… building slides…";
    simulateStream(preview, () => {
      state.slidesData = parseContent(text, state.totalSlides);
      state.currentSlideIndex = 0;

      setTimeout(() => {
        genText.textContent  = "Generate Slides";
        genIcon.textContent  = "bolt";
        generateBtn.disabled = false;
        streamBox.classList.add("hidden");
        renderSlide();
      }, 600);
    });
  });
}

// Prev / Next
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (state.currentSlideIndex > 0) {
      state.currentSlideIndex--;
      renderSlide();
    }
  });
}
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (state.currentSlideIndex < state.slidesData.length - 1) {
      state.currentSlideIndex++;
      renderSlide();
    }
  });
}

// Fullscreen
if (fullscreenBtn && slideCanvas) {
  fullscreenBtn.addEventListener("click", () => {
    if (slideCanvas.requestFullscreen) slideCanvas.requestFullscreen();
    else if (slideCanvas.webkitRequestFullscreen) slideCanvas.webkitRequestFullscreen();
  });
}

// ── 10. EDIT MODAL ───────────────────────────────────────────────
function openModal() {
  if (!state.slidesData.length) return;
  const slide = state.slidesData[state.currentSlideIndex];
  editBadge.value = slide.badge || "";
  editTitle.value = slide.title || "";
  editBody.value  = slide.body  || "";
  if (slide.bullets && slide.bullets.length) {
    editBulletsWrap.classList.remove("hidden");
    editBulletsInput.value = slide.bullets.join("\n");
  } else {
    editBulletsWrap.classList.add("hidden");
    editBulletsInput.value = "";
  }
  editModal.classList.remove("hidden");
}

function closeModalFn() {
  editModal.classList.add("hidden");
}

if (editBtn)    editBtn.addEventListener("click", openModal);
if (closeModal) closeModal.addEventListener("click", closeModalFn);
if (cancelEdit) cancelEdit.addEventListener("click", closeModalFn);

editModal && editModal.addEventListener("click", e => {
  if (e.target === editModal) closeModalFn();
});

if (applyEdit) {
  applyEdit.addEventListener("click", () => {
    if (!state.slidesData.length) return;
    const slide = state.slidesData[state.currentSlideIndex];
    slide.badge   = editBadge.value.trim();
    slide.title   = editTitle.value.trim();
    slide.body    = editBody.value.trim();
    slide.bullets = editBulletsInput.value
      .split("\n").map(l => l.trim()).filter(Boolean);
    closeModalFn();
    renderSlide();
  });
}

// ── 11. DOWNLOAD HTML ────────────────────────────────────────────
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    if (!state.slidesData.length) {
      alert("Generate slides terlebih dahulu.");
      return;
    }

    const allSlidesHTML = state.slidesData.map((slide, i) => `
      <section id="slide-${i + 1}" style="page-break-after:always;margin-bottom:48px;">
        <div style="font-size:12px;color:#888;margin-bottom:8px;font-family:monospace;">
          Slide ${i + 1} / ${state.slidesData.length}
        </div>
        ${buildSlideHTML(slide, state.selectedTemplate)}
      </section>`).join("\n");

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>TextDeck Presentation</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Inter,system-ui,sans-serif;background:#f0f4f8;padding:32px;}
    section{border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.15);max-width:960px;margin:0 auto 48px;}
    @media print{section{page-break-after:always;margin-bottom:0;}}
    .td-flashcard.flipped>div{transform:rotateY(180deg)!important;}
  </style>
</head>
<body>
  <header style="text-align:center;margin-bottom:40px;">
    <h1 style="font-size:28px;font-weight:800;color:#0061a3;">TextDeck AI — Presentation Export</h1>
    <p style="color:#888;font-size:13px;margin-top:6px;">Generated ${new Date().toLocaleString()}</p>
  </header>
  ${allSlidesHTML}
  <script>
    document.querySelectorAll('.td-flashcard').forEach(fc=>{
      fc.addEventListener('click',()=>fc.classList.toggle('flipped'));
    });
  <\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "textdeck-presentation.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// ── 12. INIT ──────────────────────────────────────────────────────
renderSlide();
updateNavBtns();
