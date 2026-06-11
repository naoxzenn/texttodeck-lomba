/**
 * TextDeck AI — dashboard.js (REBUILT)
 * ═══════════════════════════════════════════════════════
 * Orchestration layer.
 *
 * Pipeline:
 *   Text → ContentAnalyzer → OutlineBuilder → SlidePlanner
 *        → TemplateEngine → SlideRenderer
 *
 * Separate pipeline for flashcards:
 *   Text → ContentAnalyzer → FlashcardGenerator → SlideRenderer
 * ═══════════════════════════════════════════════════════
 */

document.addEventListener("DOMContentLoaded", () => {

  /* ── STATE ─────────────────────────────────────────────────── */
  const state = {
    mode: "presentation",
    slides: [],
    index: 0,
    theme: "futuristic",
    currentTemplate: localStorage.getItem('selectedTemplate') || "corporate",
    lastRawText: "",
    ratio: "16/9",
  };

  /* ── DOM REFS ──────────────────────────────────────────────── */
  const $ = id => document.getElementById(id);
  const elSource     = $("sourceText");
  const elFile       = $("fileInput");
  const elCharCount  = $("charCount");
  const elSlideCount = $("slideCountVal");
  const elGenBtn     = $("generateBtn");
  const elGenFcBtn   = $("generateFcBtn");
  const elCanvas     = $("slideCanvas");
  const elThumbs     = $("thumbRow");
  const elStream     = $("streamBox");
  const elStreamTxt  = $("streamText");
  const elPrev       = $("prevBtn");
  const elNext       = $("nextBtn");
  const elFull       = $("fullscreenBtn");
  const elEdit       = $("editBtn");
  const elDownload   = $("downloadBtn");
  const elLabel      = $("slideLabel");
  const elModal      = $("editModal");
  const elBadge      = $("editBadge");
  const elTitle      = $("editTitle");
  const elBody       = $("editBody");
  const elBullWrap   = $("editBullets");
  const elBullInput  = $("editBulletsInput");
  const elApply      = $("applyEdit");
  const elCancel     = $("cancelEdit");
  const elClose      = $("closeModal");
  const elSample     = $("sampleTextBtn");
  const elExportModal = $("exportModal");
  const elCloseExport = $("closeExportModal");
  const elExportHtml  = $("exportHtmlBtn");
  const elExportPdf   = $("exportPdfBtn");
  const elExportPptx  = $("exportPptxBtn");

  /* ── PIPELINE: Generate Presentation ───────────────────────── */
  function generatePresentation(rawText, templateId) {
    const cleanedText = InputProcessor.process(rawText);
    const analysis = ContentAnalyzer.analyze(cleanedText);
    const outline  = OutlineBuilder.build(analysis);
    const planned  = SlidePlanner.plan(outline);
    const styled   = TemplateEngine.apply(planned, templateId);
    return styled;
  }

  /* ── PIPELINE: Generate Flashcards ─────────────────────────── */
  function generateFlashcards(rawText) {
    const cleanedText = InputProcessor.process(rawText);
    return FlashcardGenerator.generate(cleanedText);
  }

  /* ── RENDER HTML ───────────────────────────────────────────── */
  function getSlideHTML(slide) {
    return SlideRenderer.render(slide, state.theme, state.ratio);
  }

  /* ── PREVIEW ───────────────────────────────────────────────── */
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
    if (elCanvas) elCanvas.innerHTML = getSlideHTML(state.slides[state.index]);
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
      wrap.style.cssText = `flex:0 0 auto;width:96px;height:58px;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid ${i === state.index ? "#0061a3" : "rgba(100,100,120,.25)"};transition:border-color .15s;box-shadow:0 2px 8px rgba(0,0,0,0.15);background:#000;`;
      const inner = document.createElement("div");
      inner.style.cssText = "transform:scale(0.1875);transform-origin:top left;width:512px;height:308px;pointer-events:none;";
      inner.innerHTML = getSlideHTML(slide);
      wrap.appendChild(inner);
      wrap.addEventListener("click", () => { state.index = i; renderSlide(); });
      elThumbs.appendChild(wrap);
    });
  }

  function syncNav() {
    const max = state.slides.length - 1;
    if (elPrev) { elPrev.disabled = state.index === 0; elPrev.style.opacity = elPrev.disabled ? "0.3" : "1"; }
    if (elNext) { elNext.disabled = state.index >= max || max < 0; elNext.style.opacity = elNext.disabled ? "0.3" : "1"; }
  }

  /* ── STREAM SIMULATION ─────────────────────────────────────── */
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

  /* ── CHAR COUNTER ──────────────────────────────────────────── */
  elSource && elSource.addEventListener("input", () => {
    elCharCount.textContent = elSource.value.length.toLocaleString() + " characters";
  });

  /* ── FILE UPLOAD ───────────────────────────────────────────── */
  elFile && elFile.addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["txt","md"].includes(ext)) { alert("Only .txt and .md files supported."); return; }
    const r = new FileReader();
    r.onload = ev => {
      const cleaned = InputProcessor.process(ev.target.result);
      elSource.value = cleaned;
      elSource.dispatchEvent(new Event("input"));
    };
    r.readAsText(f);
  });

  /* ── PASTE SANITIZATION ────────────────────────────────────── */
  elSource && elSource.addEventListener("paste", e => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData("text");
    const cleaned = InputProcessor.process(pastedText);
    const start = elSource.selectionStart;
    const end = elSource.selectionEnd;
    const val = elSource.value;
    elSource.value = val.substring(0, start) + cleaned + val.substring(end);
    elSource.selectionStart = elSource.selectionEnd = start + cleaned.length;
    elSource.dispatchEvent(new Event("input"));
  });

  /* ── ASPECT RATIO ──────────────────────────────────────────── */
  const elRatio = $("aspectRatio");
  elRatio && elRatio.addEventListener("change", () => { state.ratio = elRatio.value; renderSlide(); });

  /* ── THEME SWITCHER ────────────────────────────────────────── */
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.theme = btn.dataset.template || btn.dataset.theme || "futuristic";
      renderSlide();
    });
  });

  /* ── TEMPLATE SWITCHER (instant regeneration) ──────────────── */
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

  /* ── GENERATION TRIGGERS ───────────────────────────────────── */
  function handleGeneration(mode) {
    const txt = elSource ? elSource.value.trim() : "";
    if (!txt) { alert("Please input source text first."); return; }
    state.mode = mode;
    state.lastRawText = txt;
    const activeBtn = mode === "presentation" ? elGenBtn : elGenFcBtn;
    activeBtn.disabled = true;

    const streamMsg = mode === "presentation"
      ? "Analyzing content structure… Building outline… Planning slide layout… Applying template… Rendering slides…"
      : "Analyzing content… Extracting definitions… Generating flashcards… Preparing flip views…";

    stream(streamMsg, () => {
      state.slides = mode === "presentation"
        ? generatePresentation(txt, state.currentTemplate)
        : generateFlashcards(txt);
      state.index = 0;
      if (elSlideCount) elSlideCount.textContent = state.slides.length;
      activeBtn.disabled = false;
      if (elStream) elStream.classList.add("hidden");
      renderSlide();
    });
  }

  elGenBtn  && elGenBtn.addEventListener("click",  () => handleGeneration("presentation"));
  elGenFcBtn && elGenFcBtn.addEventListener("click", () => handleGeneration("flashcard"));

  /* ── NAVIGATION ────────────────────────────────────────────── */
  elPrev && elPrev.addEventListener("click", () => { if (state.index > 0) { state.index--; renderSlide(); } });
  elNext && elNext.addEventListener("click", () => { if (state.index < state.slides.length - 1) { state.index++; renderSlide(); } });

  /* ── FULLSCREEN ────────────────────────────────────────────── */
  elFull && elFull.addEventListener("click", () => {
    if (elCanvas.requestFullscreen) elCanvas.requestFullscreen();
    else if (elCanvas.webkitRequestFullscreen) elCanvas.webkitRequestFullscreen();
  });

  /* ── SAMPLE TEXT ───────────────────────────────────────────── */
  const SAMPLE = `Cristiano Ronaldo

Cristiano Ronaldo dos Santos Aveiro adalah pemain sepak bola profesional Portugal yang widely regarded sebagai salah satu pemain terbaik sepanjang masa. Ia lahir pada 5 Februari 1985 di Funchal, Madeira.

Karier Klub:
- Sporting CP (2002-2003)
- Manchester United (2003-2009)
- Real Madrid (2009-2018)
- Juventus (2018-2021)
- Manchester United (2021-2022)
- Al Nassr (2023-sekarang)

Prestasi Individu:
- 5x Ballon d'Or (2008, 2013, 2014, 2016, 2017)
- 4x European Golden Shoe
- FIFA Best Men's Player
- All-time top scorer di Champions League

Prestasi Tim:
- 5x Champions League
- 7x Liga domestik
- 1x Euro 2016 bersama Portugal
- 1x UEFA Nations League

Rekor dan Statistik:
Ronaldo merupakan pencetak gol terbanyak dalam sejarah sepak bola internasional dengan lebih dari 130 gol untuk timnas Portugal. Ia juga memegang rekor sebagai pemain dengan penampilan terbanyak di Euro.

Kesimpulan:
Cristiano Ronaldo adalah legenda sepak bola yang telah mengubah standar permainan modern dengan dedikasi, atletisisme, dan konsistensi performanya selama lebih dari dua dekade.`;

  elSample && elSample.addEventListener("click", () => {
    elSource.value = SAMPLE;
    elSource.dispatchEvent(new Event("input"));
    elSource.focus();
  });

  /* ── EDIT MODAL ────────────────────────────────────────────── */
  function openModal() {
    if (!state.slides.length || !elModal) return;
    const s = state.slides[state.index];
    if (s.type === "flashcard") {
      if (elBadge) elBadge.value = "Flashcard";
      if (elTitle) elTitle.value = s.question || '';
      if (elBody) elBody.value = s.answer || '';
      if (elBullWrap) elBullWrap.classList.add("hidden");
    } else {
      if (elBadge) elBadge.value = (s.layout || "slide").toUpperCase();
      if (elTitle) elTitle.value = s.title || "";
      if (elBody) elBody.value = s.body || "";
      if (elBullWrap && elBullInput) {
        if (s.bullets && s.bullets.length) {
          elBullWrap.classList.remove("hidden");
          elBullInput.value = s.bullets.join("\n");
        } else { elBullWrap.classList.add("hidden"); elBullInput.value = ""; }
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
      s.question = elTitle ? elTitle.value.trim() : s.question;
      s.answer   = elBody  ? elBody.value.trim()  : s.answer;
    } else {
      s.title = elTitle ? elTitle.value.trim() : s.title;
      s.body  = elBody  ? elBody.value.trim()  : s.body;
      if (elBullInput) s.bullets = elBullInput.value.split("\n").map(l => l.trim()).filter(Boolean);
    }
    closeModal(); renderSlide();
  });

  /* ── EXPORT MODAL ──────────────────────────────────────────── */
  elDownload && elDownload.addEventListener("click", () => {
    if (!state.slides.length) { alert("Please generate content first."); return; }
    elExportModal.classList.remove("hidden");
  });
  elCloseExport && elCloseExport.addEventListener("click", () => { elExportModal.classList.add("hidden"); });

  // HTML Export
  elExportHtml && elExportHtml.addEventListener("click", () => {
    const body = state.slides.map((s, i) => `
      <section>
        <p style="font-size:11px;color:#999;font-family:monospace;margin-bottom:8px;">Item ${i+1} / ${state.slides.length}</p>
        ${getSlideHTML(s)}
      </section>`).join("\n");

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>TextDeck Export</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Inter,system-ui,sans-serif;background:#f0f4f8;padding:32px;}section{border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.15);max-width:960px;margin:0 auto 40px;}</style>
</head><body>
<header style="text-align:center;margin-bottom:40px;">
  <h1 style="font-size:26px;font-weight:800;color:#0061a3;">TextDeck Export</h1>
  <p style="color:#94a3b8;font-size:12px;margin-top:6px;">Generated on ${new Date().toLocaleString()}</p>
</header>
${body}
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "text-deck-export.html";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    elExportModal.classList.add("hidden");
  });

  // PDF Export
  elExportPdf && elExportPdf.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [960, 540] });
    for (let i = 0; i < state.slides.length; i++) {
      if (i > 0) doc.addPage();
      const temp = document.createElement("div");
      temp.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:960px;height:540px;";
      temp.innerHTML = getSlideHTML(state.slides[i]);
      document.body.appendChild(temp);
      const canvas = await html2canvas(temp, { width: 960, height: 540 });
      document.body.removeChild(temp);
      doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 960, 540);
    }
    doc.save("text-deck-presentation.pdf");
    elExportModal.classList.add("hidden");
  });

  // PPTX Export
  elExportPptx && elExportPptx.addEventListener("click", () => {
    const pptx = new PptxGenJS();
    const themeColors = { futuristic: { bg:"0A1628", fg:"FFFFFF" }, corporate: { bg:"FFFFFF", fg:"131B2E" }, creative: { bg:"7C3AED", fg:"FFFFFF" }, dark: { bg:"0F1117", fg:"E2E8F0" } };
    const tc = themeColors[state.theme] || themeColors.futuristic;

    state.slides.forEach(slide => {
      const pSlide = pptx.addSlide();
      pSlide.background = { fill: tc.bg };
      if (slide.type === "flashcard") {
        pSlide.addText(slide.question || '', { x:1,y:1.5,w:8,h:1,fontSize:32,bold:true,color:tc.fg,align:"center" });
        pSlide.addText(slide.answer || '',   { x:1,y:2.8,w:8,h:2,fontSize:18,color:tc.fg,align:"center" });
      } else {
        pSlide.addText(slide.title || '', { x:0.8,y:0.8,w:8.4,h:0.8,fontSize:28,bold:true,color:tc.fg });
        if (slide.body) pSlide.addText(slide.body, { x:0.8,y:1.8,w:8.4,h:1.2,fontSize:16,color:tc.fg });
        if (slide.bullets && slide.bullets.length) {
          const items = slide.bullets.map(b => ({ text: b, options: { bullet: true } }));
          pSlide.addText(items, { x:0.8,y:slide.body?3.2:1.8,w:8.4,h:3,fontSize:14,color:tc.fg });
        }
      }
    });
    pptx.writeFile({ fileName: "text-deck-presentation.pptx" });
    elExportModal.classList.add("hidden");
  });

  /* ── INIT ──────────────────────────────────────────────────── */
  const activeTplBtn = document.querySelector(`.pres-tpl-btn[data-tpl="${state.currentTemplate}"]`);
  if (activeTplBtn) {
    document.querySelectorAll(".pres-tpl-btn").forEach(b => b.classList.remove("selected"));
    activeTplBtn.classList.add("selected");
  }
  renderEmpty();
  syncNav();

}); // end DOMContentLoaded