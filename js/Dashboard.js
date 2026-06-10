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
        DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem",
        "2xl": "1rem", "3xl": "1.5rem", full: "9999px"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    }
  }
}

// ======== STATE ========
let slides = [];
let currentSlide = 0;
let selectedTemplate = 'futuristic';

// ======== HELPERS ========
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ======== CHAR COUNT ========
const sourceText = document.getElementById('sourceText');
const charCount = document.getElementById('charCount');
sourceText.addEventListener('input', () => {
  charCount.textContent = sourceText.value.length + ' characters';
});

// ======== FILE UPLOAD ========
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  sourceText.value = text;
  charCount.textContent = text.length + ' characters';
  showToast('File loaded: ' + file.name);
});

// Drag & Drop
const textarea = sourceText;
textarea.addEventListener('dragover', e => { e.preventDefault(); textarea.classList.add('ring-2', 'ring-primary'); });
textarea.addEventListener('dragleave', () => textarea.classList.remove('ring-2', 'ring-primary'));
textarea.addEventListener('drop', async e => {
  e.preventDefault();
  textarea.classList.remove('ring-2', 'ring-primary');
  const file = e.dataTransfer.files[0];
  if (file) {
    const text = await file.text();
    sourceText.value = text;
    charCount.textContent = text.length + ' characters';
    showToast('File loaded: ' + file.name);
  }
});

// ======== TEMPLATE SELECT ========
document.querySelectorAll('.template-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTemplate = btn.dataset.template;
    if (slides.length > 0) renderSlide(currentSlide);
  });
});

// ======== SLIDE COUNT ========
const slideCountInput = document.getElementById('slideCount');
const slideCountVal = document.getElementById('slideCountVal');
slideCountInput.addEventListener('input', () => {
  slideCountVal.textContent = slideCountInput.value;
});

// ======== ASPECT RATIO ========
document.getElementById('aspectRatio').addEventListener('change', function() {
  document.getElementById('slideCanvas').style.aspectRatio = this.value;
});


// ======== NAV ========
document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentSlide > 0) { currentSlide--; renderSlide(currentSlide); updateThumbs(); }
});
document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentSlide < slides.length - 1) { currentSlide++; renderSlide(currentSlide); updateThumbs(); }
});

// ======== FULLSCREEN ========
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  const el = document.getElementById('slideCanvas');
  if (el.requestFullscreen) el.requestFullscreen();
});

// ======== GENERATE ========
document.getElementById('generateBtn').addEventListener('click', async () => {
  const text = sourceText.value.trim();
  if (!text) { showToast('⚠️ Please enter some content first'); return; }

  const btn = document.getElementById('generateBtn');
  const icon = document.getElementById('genIcon');
  const genText = document.getElementById('genText');
  const streamBox = document.getElementById('streamBox');
  const streamText = document.getElementById('streamText');
  const aiStatus = document.getElementById('aiStatus');

  // Loading state
  btn.disabled = true;
  btn.classList.add('opacity-80', 'cursor-not-allowed');
  icon.innerHTML = '<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>';
  genText.textContent = 'Generating…';
  streamBox.classList.remove('hidden');
  streamText.textContent = '';
  aiStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-tertiary ai-pulse"></span><span>Generating with Claude…</span>';

  const n = parseInt(slideCountInput.value);

  const systemPrompt = `You are a professional presentation designer. Generate exactly ${n} slide(s) as a JSON array. Each slide object must have:
- "badge": short label (2-4 words, uppercase)
- "title": compelling headline (5-12 words)
- "body": 1-2 sentences of supporting text
- "bullets": array of 3-4 concise bullet points (optional, include for content slides)
- "type": one of "title", "content", "data", "quote", "conclusion"

Return ONLY valid JSON array, nothing else. No markdown fences.`;

  const userPrompt = `Create ${n} slide(s) for a presentation about this content:\n\n${text}`;

  let rawJson = '';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const evt = JSON.parse(data);
            if (evt.type === 'content_block_delta' && evt.delta?.text) {
              rawJson += evt.delta.text;
              streamText.textContent = rawJson.slice(-120);
              streamBox.scrollTop = streamBox.scrollHeight;
            }
          } catch {}
        }
      }
    }

    // Parse JSON
    let parsed;
    try {
      const clean = rawJson.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
      if (!Array.isArray(parsed)) parsed = [parsed];
    } catch {
      showToast('⚠️ Could not parse response. Showing demo slides.');
      parsed = getDemoSlides(n, text);
    }

    slides = parsed;
    currentSlide = 0;
    renderSlide(0);
    buildThumbs();
    document.getElementById('thumbRow').classList.remove('hidden');
    document.getElementById('slideLabel').textContent = `Slide 1 of ${slides.length}`;
    showToast(`✓ ${slides.length} slide(s) generated!`);

  } catch (err) {
    console.error(err);
    showToast('⚠️ API error. Using demo slides.');
    slides = getDemoSlides(n, text);
    currentSlide = 0;
    renderSlide(0);
    buildThumbs();
    document.getElementById('thumbRow').classList.remove('hidden');
    document.getElementById('slideLabel').textContent = `Slide 1 of ${slides.length}`;
  } finally {
    btn.disabled = false;
    btn.classList.remove('opacity-80', 'cursor-not-allowed');
    icon.className = 'material-symbols-outlined group-hover:rotate-12 transition-transform';
    icon.textContent = 'bolt';
    genText.textContent = 'Generate Slides';
    streamBox.classList.add('hidden');
    aiStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-primary ai-pulse"></span><span>AI ready to generate</span>';
  }
});

function getDemoSlides(n, text) {
  const topic = text.split(' ').slice(0, 5).join(' ');
  const arr = [];
  const types = ['title','content','data','quote','conclusion'];
  for (let i = 0; i < n; i++) {
    arr.push({
      badge: i === 0 ? 'INTRODUCTION' : i === n-1 ? 'CONCLUSION' : 'KEY POINTS',
      title: i === 0 ? `Overview: ${topic}` : i === n-1 ? 'Conclusion & Next Steps' : `Key Insight ${i}`,
      body: 'This presentation explores the core concepts and provides actionable insights for stakeholders.',
      bullets: i > 0 && i < n-1 ? ['Critical finding number one', 'Data-driven recommendation', 'Strategic opportunity identified'] : undefined,
      type: types[i % types.length]
    });
  }
  return arr;
}

// ======== TEMPLATES ========
const templates = {
  futuristic: {
    bg: 'linear-gradient(135deg, #0f1b2e 0%, #1a2a4a 60%, #0d2137 100%)',
    glow: 'rgba(77,168,255,0.2)',
    badgeBg: 'rgba(77,168,255,0.2)',
    badgeColor: '#9ecaff',
    titleColor: '#ffffff',
    bodyColor: 'rgba(255,255,255,0.7)',
    bulletColor: 'rgba(255,255,255,0.6)',
    bulletDot: '#4da8ff',
    footerColor: 'rgba(255,255,255,0.35)',
    accentLine: '#4da8ff'
  },
  corporate: {
    bg: 'linear-gradient(160deg, #f8faff 0%, #eef2ff 100%)',
    glow: 'rgba(0,97,163,0.06)',
    badgeBg: 'rgba(0,97,163,0.1)',
    badgeColor: '#0061a3',
    titleColor: '#131b2e',
    bodyColor: '#404752',
    bulletColor: '#404752',
    bulletDot: '#0061a3',
    footerColor: '#a0a8b8',
    accentLine: '#0061a3'
  },
  creative: {
    bg: 'linear-gradient(135deg, #1a0533 0%, #2d1057 50%, #0a1f40 100%)',
    glow: 'rgba(180,100,255,0.2)',
    badgeBg: 'rgba(180,100,255,0.25)',
    badgeColor: '#d4a8ff',
    titleColor: '#ffffff',
    bodyColor: 'rgba(255,255,255,0.72)',
    bulletColor: 'rgba(255,255,255,0.65)',
    bulletDot: '#c084fc',
    footerColor: 'rgba(255,255,255,0.3)',
    accentLine: '#c084fc'
  },
  dark: {
    bg: 'linear-gradient(150deg, #0a0a0f 0%, #111827 100%)',
    glow: 'rgba(99,102,241,0.15)',
    badgeBg: 'rgba(99,102,241,0.2)',
    badgeColor: '#a5b4fc',
    titleColor: '#f1f5f9',
    bodyColor: 'rgba(241,245,249,0.65)',
    bulletColor: 'rgba(241,245,249,0.55)',
    bulletDot: '#818cf8',
    footerColor: 'rgba(241,245,249,0.25)',
    accentLine: '#818cf8'
  }
};

function renderSlide(idx) {
  const slide = slides[idx];
  const t = templates[selectedTemplate];
  const canvas = document.getElementById('slideCanvas');
  canvas.style.aspectRatio = document.getElementById('aspectRatio').value;

  const bullets = slide.bullets && slide.bullets.length
    ? slide.bullets.map(b => `
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
          <div style="width:6px;height:6px;border-radius:50%;background:${t.bulletDot};margin-top:7px;flex-shrink:0;"></div>
          <span style="color:${t.bulletColor};font-size:clamp(11px,1.5vw,15px);line-height:1.5;">${b}</span>
        </div>`).join('')
    : '';

  canvas.innerHTML = `
    <div style="
      width:100%; height:100%; min-height:220px;
      background:${t.bg};
      position:relative; overflow:hidden;
      display:flex; align-items:center; justify-content:center;
    ">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 75% 25%, ${t.glow} 0%, transparent 55%),radial-gradient(ellipse at 20% 80%, ${t.glow} 0%, transparent 50%);pointer-events:none;"></div>
      <div style="position:relative;z-index:2;padding:clamp(20px,5%,60px);width:100%;max-width:860px;">
        ${slide.badge ? `<div style="display:inline-block;padding:4px 14px;background:${t.badgeBg};color:${t.badgeColor};border-radius:999px;font-size:clamp(9px,1.1vw,11px);font-weight:700;letter-spacing:0.08em;margin-bottom:clamp(10px,2vw,20px);text-transform:uppercase;">${slide.badge}</div>` : ''}
        <div style="height:3px;width:40px;background:${t.accentLine};border-radius:2px;margin-bottom:clamp(10px,1.5vw,16px);opacity:0.7;display:none;" id="accentBar_${idx}"></div>
        <h3 style="color:${t.titleColor};font-size:clamp(16px,2.8vw,36px);font-weight:700;line-height:1.2;margin-bottom:clamp(8px,1.5vw,18px);letter-spacing:-0.02em;">${slide.title}</h3>
        <p style="color:${t.bodyColor};font-size:clamp(11px,1.5vw,16px);line-height:1.65;max-width:600px;margin-bottom:${bullets ? 'clamp(10px,1.5vw,18px)' : '0'};">${slide.body}</p>
        ${bullets ? `<div style="margin-top:4px;">${bullets}</div>` : ''}
        <div style="position:absolute;bottom:clamp(12px,2vw,24px);right:clamp(16px,3vw,32px);font-size:clamp(9px,1vw,11px);color:${t.footerColor};font-weight:500;">
          TextDeck AI · Slide ${idx + 1}/${slides.length}
        </div>
      </div>
    </div>`;

  document.getElementById('slideLabel').textContent = `Slide ${idx + 1} of ${slides.length}`;
  canvas.classList.add('ring-4','ring-primary/30');
  setTimeout(() => canvas.classList.remove('ring-4','ring-primary/30'), 800);
}

// ======== THUMBNAILS ========
function buildThumbs() {
  const row = document.getElementById('thumbRow');
  row.innerHTML = '';
  slides.forEach((s, i) => {
    const t = templates[selectedTemplate];
    const div = document.createElement('div');
    div.className = `slide-thumb ${i === currentSlide ? 'active' : ''}`;
    div.style.minWidth = '120px';
    div.style.flex = '0 0 120px';
    div.innerHTML = `
      <div style="width:100%;height:100%;background:${t.bg};display:flex;align-items:center;justify-content:center;position:relative;min-height:68px;">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 70% 30%, ${t.glow} 0%, transparent 60%);"></div>
        <div style="z-index:2;text-align:center;padding:8px;position:relative;">
          <div style="font-size:9px;color:${t.badgeColor};font-weight:700;letter-spacing:0.06em;margin-bottom:3px;opacity:0.8;">${s.badge || ''}</div>
          <div style="font-size:10px;color:${t.titleColor};font-weight:600;line-height:1.3;opacity:0.9;">${(s.title||'').substring(0,32)}${s.title && s.title.length > 32 ? '…' : ''}</div>
        </div>
        <div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);font-size:9px;color:${t.footerColor};">${i+1}</div>
      </div>`;
    div.addEventListener('click', () => {
      currentSlide = i;
      renderSlide(i);
      updateThumbs();
    });
    row.appendChild(div);
  });
}

function updateThumbs() {
  document.querySelectorAll('.slide-thumb').forEach((el, i) => {
    el.classList.toggle('active', i === currentSlide);
  });
}

// ======== EDIT MODAL ========
document.getElementById('editBtn').addEventListener('click', () => {
  if (!slides.length) { showToast('⚠️ Generate slides first'); return; }
  const s = slides[currentSlide];
  document.getElementById('editBadge').value = s.badge || '';
  document.getElementById('editTitle').value = s.title || '';
  document.getElementById('editBody').value = s.body || '';
  if (s.bullets) {
    document.getElementById('editBullets').classList.remove('hidden');
    document.getElementById('editBulletsInput').value = s.bullets.join('\n');
  } else {
    document.getElementById('editBullets').classList.add('hidden');
  }
  document.getElementById('editModal').classList.remove('hidden');
});

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('editModal').classList.add('hidden');
});
document.getElementById('cancelEdit').addEventListener('click', () => {
  document.getElementById('editModal').classList.add('hidden');
});
document.getElementById('editModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

document.getElementById('applyEdit').addEventListener('click', () => {
  slides[currentSlide].badge = document.getElementById('editBadge').value;
  slides[currentSlide].title = document.getElementById('editTitle').value;
  slides[currentSlide].body = document.getElementById('editBody').value;
  const bulletsRaw = document.getElementById('editBulletsInput').value.trim();
  if (bulletsRaw) slides[currentSlide].bullets = bulletsRaw.split('\n').filter(b => b.trim());
  renderSlide(currentSlide);
  buildThumbs();
  document.getElementById('editModal').classList.add('hidden');
  showToast('✓ Slide updated');
});

// ======== DOWNLOAD ========
document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!slides.length) { showToast('⚠️ Generate slides first'); return; }
  const t = templates[selectedTemplate];

  const allSlides = slides.map((s, i) => {
    const bullets = s.bullets && s.bullets.length
      ? `<div style="margin-top:16px;">${s.bullets.map(b => `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;"><div style="width:6px;height:6px;border-radius:50%;background:${t.bulletDot};margin-top:7px;flex-shrink:0;"></div><span style="color:${t.bulletColor};font-size:15px;line-height:1.5;">${b}</span></div>`).join('')}</div>`
      : '';
    return `
      <div class="slide" style="width:100%;aspect-ratio:16/9;background:${t.bg};position:relative;overflow:hidden;page-break-after:always;display:flex;align-items:center;justify-content:center;margin-bottom:24px;border-radius:16px;">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 75% 25%, ${t.glow} 0%, transparent 55%);"></div>
        <div style="position:relative;z-index:2;padding:60px;width:100%;max-width:860px;">
          ${s.badge ? `<div style="display:inline-block;padding:5px 16px;background:${t.badgeBg};color:${t.badgeColor};border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.08em;margin-bottom:20px;text-transform:uppercase;">${s.badge}</div>` : ''}
          <h2 style="color:${t.titleColor};font-size:36px;font-weight:700;line-height:1.2;margin:0 0 18px;letter-spacing:-0.02em;">${s.title}</h2>
          <p style="color:${t.bodyColor};font-size:16px;line-height:1.65;max-width:600px;margin:0;">${s.body}</p>
          ${bullets}
          <div style="position:absolute;bottom:24px;right:32px;font-size:11px;color:${t.footerColor};font-weight:500;">TextDeck AI · Slide ${i+1}/${slides.length}</div>
        </div>
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>TextDeck Presentation</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;background:#111;padding:32px;}h2{margin:0;}</style>
</head><body>${allSlides}</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'textdeck-presentation.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Presentation downloaded!');
});