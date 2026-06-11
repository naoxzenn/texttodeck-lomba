/**
 * TextDeck — renderer.js
 * Phase 9: Pure Renderers — No business logic inside.
 *
 * Renders:
 *   renderTitleSlide(), renderContentSlide(), renderBulletSlide(),
 *   renderTimelineSlide(), renderComparisonSlide(), renderSummarySlide(),
 *   renderConclusionSlide(), renderFlashcard()
 */

const SlideRenderer = (() => {

  /* ── THEME PALETTES ──────────────────────────────────────────── */
  const THEMES = {
    futuristic: {
      bg: 'linear-gradient(135deg,#0a1628,#0d2040 60%,#0a2550)',
      color: '#fff',
      accent: '#00d1ff',
      accentBg: 'rgba(0,209,255,.12)',
      accentBorder: 'rgba(0,209,255,.3)',
      muted: 'rgba(255,255,255,.75)',
      cardBg: 'rgba(0,209,255,.06)',
      cardBorder: 'rgba(0,209,255,.18)',
      dotColor: '#00d1ff',
      ff: 'background:linear-gradient(135deg,#0d2040,#0a2550);border:1px solid rgba(0,209,255,.25);color:#fff;',
      fb: 'background:rgba(0,209,255,.1);border:1px solid rgba(0,209,255,.3);color:#fff;',
    },
    corporate: {
      bg: '#ffffff',
      color: '#131b2e',
      accent: '#0061a3',
      accentBg: '#e8f0fe',
      accentBorder: '#0061a3',
      muted: '#283044',
      cardBg: '#f0f4fa',
      cardBorder: 'rgba(0,97,163,.2)',
      dotColor: '#0061a3',
      ff: 'background:#f8fafc;border:2px solid #0061a3;color:#131b2e;',
      fb: 'background:#e8f0fe;border:2px solid #0061a3;color:#131b2e;',
    },
    creative: {
      bg: 'linear-gradient(135deg,#7c3aed,#db2777 50%,#f59e0b)',
      color: '#fff',
      accent: '#fbbf24',
      accentBg: 'rgba(255,255,255,.15)',
      accentBorder: 'rgba(255,255,255,.3)',
      muted: 'rgba(255,255,255,.85)',
      cardBg: 'rgba(255,255,255,.08)',
      cardBorder: 'rgba(255,255,255,.15)',
      dotColor: '#fff',
      ff: 'background:rgba(124,58,237,.8);border:1px solid rgba(255,255,255,.3);color:#fff;',
      fb: 'background:rgba(219,39,119,.7);border:1px solid rgba(255,255,255,.3);color:#fff;',
    },
    dark: {
      bg: 'linear-gradient(160deg,#0f1117,#1a1f2e)',
      color: '#e2e8f0',
      accent: '#34d399',
      accentBg: 'rgba(52,211,153,.1)',
      accentBorder: 'rgba(52,211,153,.25)',
      muted: '#94a3b8',
      cardBg: 'rgba(52,211,153,.05)',
      cardBorder: 'rgba(52,211,153,.15)',
      dotColor: '#34d399',
      ff: 'background:#1e2336;border:1px solid rgba(52,211,153,.2);color:#e2e8f0;',
      fb: 'background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.25);color:#e2e8f0;',
    },
  };

  function t(themeId) { return THEMES[themeId] || THEMES.futuristic; }

  /* ── COMMON HELPERS ──────────────────────────────────────────── */

  function wrap(themeId, ratio, inner) {
    const th = t(themeId);
    const bgStyle = th.bg.includes('gradient') ? `background:${th.bg};` : `background:${th.bg};`;
    return `<div style="${bgStyle}color:${th.color};font-family:'Inter',sans-serif;aspect-ratio:${ratio || '16/9'};width:100%;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;padding:clamp(24px,5%,48px);position:relative;">${inner}</div>`;
  }

  function badge(themeId, text) {
    if (!text) return '';
    const th = t(themeId);
    return `<div style="display:inline-block;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:700;background:${th.accentBg};color:${th.accent};border:1px solid ${th.accentBorder};margin-bottom:16px;width:fit-content;letter-spacing:0.05em;">${text}</div>`;
  }

  function titleEl(themeId, text, size) {
    const th = t(themeId);
    const fs = size || 'clamp(18px,2.5vw,28px)';
    return `<div style="font-size:${fs};font-weight:800;color:${th.color};line-height:1.2;margin-bottom:10px;word-break:break-word;">${text || ''}</div>`;
  }

  function bodyEl(themeId, text) {
    if (!text) return '';
    const th = t(themeId);
    return `<p style="font-size:clamp(12px,1.4vw,15px);color:${th.muted};line-height:1.7;margin-bottom:14px;">${text}</p>`;
  }

  function bulletList(themeId, items) {
    if (!items || !items.length) return '';
    const th = t(themeId);
    return items.map(b => `
      <div style="display:flex;gap:10px;margin-bottom:8px;align-items:flex-start;">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${th.dotColor};flex-shrink:0;margin-top:7px;"></span>
        <span style="font-size:14px;color:${th.muted};line-height:1.6;">${b}</span>
      </div>
    `).join('');
  }

  function numberedList(themeId, items) {
    if (!items || !items.length) return '';
    const th = t(themeId);
    return items.map((b, i) => `
      <div style="display:flex;gap:14px;margin-bottom:10px;align-items:flex-start;">
        <span style="font-weight:800;color:${th.accent};font-size:15px;min-width:24px;flex-shrink:0;">${String(i+1).padStart(2,'0')}</span>
        <span style="font-size:14px;color:${th.muted};line-height:1.6;">${b}</span>
      </div>
    `).join('');
  }

  /* ── LAYOUT RENDERERS ────────────────────────────────────────── */

  function renderTitleCenter(slide, themeId, ratio) {
    const th = t(themeId);
    return wrap(themeId, ratio, `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        ${badge(themeId, slide.badge || slide.templateId?.toUpperCase())}
        <h1 style="font-size:clamp(24px,4vw,42px);font-weight:900;color:${th.color};line-height:1.15;margin-bottom:14px;max-width:85%;">${slide.title || ''}</h1>
        ${slide.subtitle ? `<p style="font-size:clamp(13px,1.6vw,17px);color:${th.muted};max-width:70%;line-height:1.55;">${slide.subtitle}</p>` : ''}
        ${slide.body && !slide.subtitle ? `<p style="font-size:clamp(13px,1.6vw,17px);color:${th.muted};max-width:70%;line-height:1.55;">${slide.body}</p>` : ''}
      </div>
    `);
  }

  function renderTitleBody(slide, themeId, ratio) {
    return wrap(themeId, ratio, `
      ${badge(themeId, slide.badge || slide.templateId?.toUpperCase())}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
        ${titleEl(themeId, slide.title)}
        ${bodyEl(themeId, slide.body)}
      </div>
    `);
  }

  function renderTitleBullets(slide, themeId, ratio) {
    return wrap(themeId, ratio, `
      ${badge(themeId, slide.badge || slide.templateId?.toUpperCase())}
      ${titleEl(themeId, slide.title)}
      ${slide.body ? bodyEl(themeId, slide.body) : ''}
      <div style="flex:1;overflow:hidden;margin-top:4px;">
        ${bulletList(themeId, slide.bullets)}
      </div>
    `);
  }

  function renderConcept(slide, themeId, ratio) {
    const th = t(themeId);
    return wrap(themeId, ratio, `
      ${badge(themeId, slide.badge || 'CORE CONCEPT')}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:${th.accent};opacity:0.7;margin-bottom:6px;">Core Concept</div>
        ${titleEl(themeId, slide.title)}
        <div style="border-left:3px solid ${th.accent};padding-left:18px;margin-top:12px;">
          ${bodyEl(themeId, slide.body)}
        </div>
      </div>
    `);
  }

  function renderHero(slide, themeId, ratio) {
    const th = t(themeId);
    return wrap(themeId, ratio, `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        <h1 style="font-size:clamp(22px,3.8vw,40px);font-weight:900;color:${th.color};line-height:1.12;margin-bottom:16px;max-width:90%;">${slide.title || ''}</h1>
        ${slide.body ? `<p style="font-size:clamp(13px,1.8vw,18px);max-width:80%;color:${th.muted};line-height:1.55;">${slide.body}</p>` : ''}
        ${slide.subtitle ? `<p style="font-size:clamp(13px,1.6vw,16px);max-width:80%;color:${th.muted};line-height:1.5;margin-top:8px;">${slide.subtitle}</p>` : ''}
      </div>
    `);
  }

  function renderHeroBody(slide, themeId, ratio) {
    const th = t(themeId);
    return wrap(themeId, ratio, `
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
        <h2 style="font-size:clamp(20px,3vw,32px);font-weight:900;margin-bottom:16px;color:${th.color};">${slide.title || ''}</h2>
        ${bodyEl(themeId, slide.body)}
      </div>
    `);
  }

  function renderCardGrid(slide, themeId, ratio) {
    const th = t(themeId);
    const items = slide.bullets || [];
    return wrap(themeId, ratio, `
      ${badge(themeId, slide.badge)}
      ${titleEl(themeId, slide.title, 'clamp(16px,2.2vw,24px)')}
      <div style="flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:8px;align-content:start;">
        ${items.map(b => `
          <div style="background:${th.cardBg};padding:14px 16px;border-radius:12px;border:1px solid ${th.cardBorder};">
            <div style="font-weight:700;margin-bottom:3px;color:${th.accent};font-size:12px;">💡 Key Point</div>
            <div style="font-size:13px;color:${th.muted};line-height:1.5;">${b}</div>
          </div>
        `).join('')}
      </div>
    `);
  }

  function renderNumberedList(slide, themeId, ratio) {
    return wrap(themeId, ratio, `
      ${badge(themeId, slide.badge)}
      ${titleEl(themeId, slide.title)}
      <div style="flex:1;overflow:hidden;margin-top:8px;">
        ${numberedList(themeId, slide.bullets)}
      </div>
    `);
  }

  function renderTimelineVisual(slide, themeId, ratio) {
    const th = t(themeId);
    const items = slide.bullets || slide.items || [];
    return wrap(themeId, ratio, `
      ${badge(themeId, slide.badge || 'TIMELINE')}
      ${titleEl(themeId, slide.title)}
      <div style="flex:1;display:flex;flex-direction:column;gap:10px;margin-top:8px;padding-left:12px;border-left:2px dashed ${th.accentBorder};position:relative;">
        ${items.map(item => `
          <div style="display:flex;gap:12px;align-items:flex-start;position:relative;">
            <div style="position:absolute;left:-18px;top:5px;width:10px;height:10px;border-radius:50%;background:${th.accent};"></div>
            <span style="font-size:13px;color:${th.muted};line-height:1.6;padding-left:6px;">${item}</span>
          </div>
        `).join('')}
      </div>
    `);
  }

  function renderTimelineItem(slide, themeId, ratio) {
    const th = t(themeId);
    return wrap(themeId, ratio, `
      ${badge(themeId, slide.badge)}
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
        ${titleEl(themeId, '📍 ' + (slide.title || ''))}
        <div style="margin-top:12px;padding-left:20px;border-left:2px dashed ${th.accentBorder};position:relative;">
          <div style="position:absolute;left:-6px;top:6px;width:10px;height:10px;border-radius:50%;background:${th.accent};"></div>
          ${bodyEl(themeId, slide.body)}
        </div>
      </div>
    `);
  }

  function renderTwoColumn(slide, themeId, ratio) {
    const th = t(themeId);
    const left = slide.bulletsLeft || (slide.bullets || []).slice(0, Math.ceil((slide.bullets||[]).length/2));
    const right = slide.bulletsRight || (slide.bullets || []).slice(Math.ceil((slide.bullets||[]).length/2));
    return wrap(themeId, ratio, `
      ${badge(themeId, slide.badge)}
      ${titleEl(themeId, slide.title)}
      <div style="flex:1;display:flex;gap:24px;margin-top:8px;">
        <div style="flex:1;">
          <div style="font-size:10px;font-weight:700;opacity:0.5;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Group A</div>
          ${bulletList(themeId, left)}
        </div>
        <div style="width:1px;background:${th.accentBorder};"></div>
        <div style="flex:1;">
          <div style="font-size:10px;font-weight:700;opacity:0.5;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Group B</div>
          ${bulletList(themeId, right)}
        </div>
      </div>
    `);
  }

  function renderSplit(slide, themeId, ratio) {
    const th = t(themeId);
    return wrap(themeId, ratio, `
      ${badge(themeId, slide.badge)}
      <div style="flex:1;display:flex;gap:20px;align-items:stretch;">
        <div style="flex:1;background:${th.cardBg};padding:20px;border-radius:14px;border:1px solid ${th.cardBorder};display:flex;flex-direction:column;justify-content:center;">
          <h3 style="font-weight:800;font-size:clamp(16px,2vw,20px);color:${th.accent};margin-bottom:6px;">${slide.title || ''}</h3>
        </div>
        <div style="flex:1.5;display:flex;align-items:center;padding:12px;">
          ${bodyEl(themeId, slide.body)}
        </div>
      </div>
    `);
  }

  /* ── FLASHCARD RENDERER (Reveal System) ────────────────────── */
  /*
   * Modern reveal-based flashcard. No 3D flip.
   * - Question view and answer view swap via opacity + scale.
   * - Only one view visible at a time (display toggle).
   * - Keyboard accessible (Enter/Space).
   * - Long answers get internal scrolling.
   * - Template-independent interaction logic.
   */

  function renderFlashcard(card, themeId, ratio) {
    const th = t(themeId);
    const bgStyle = th.bg.includes('gradient') ? `background:${th.bg};` : `background:${th.bg};`;
    const fcId = 'fc_' + Math.random().toString(36).slice(2, 7);

    // Sanitize answer text — replace \n with <br/> for display
    const answerText = (card.answer || card.back || '').replace(/\n/g, '<br/>');
    const questionText = card.question || card.front || '';
    const categoryLabel = (card.category || 'question').toUpperCase();

    // Determine if answer is long (needs scroll region)
    const answerWordCount = (card.answer || card.back || '').split(/\s+/).length;
    const isLongAnswer = answerWordCount > 35;
    const answerFontSize = answerWordCount > 50
      ? 'clamp(11px,1.2vw,13px)'
      : answerWordCount > 30
        ? 'clamp(12px,1.3vw,14px)'
        : 'clamp(13px,1.5vw,16px)';

    return `
      <div style="${bgStyle}color:${th.color};font-family:'Inter',sans-serif;aspect-ratio:${ratio || '16/9'};width:100%;box-sizing:border-box;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:clamp(16px,4%,32px);">
        <style>
          #${fcId} {
            width:88%; max-width:520px; height:78%; min-height:200px;
            cursor:pointer; border-radius:20px; position:relative;
            outline:none; user-select:none; -webkit-user-select:none;
          }
          #${fcId}:focus-visible {
            box-shadow:0 0 0 3px ${th.accent}, 0 12px 32px rgba(0,0,0,0.25);
          }
          #${fcId} .fc-view {
            position:absolute; inset:0; border-radius:20px;
            padding:clamp(20px,4%,36px); display:flex; flex-direction:column;
            align-items:center; justify-content:center; text-align:center;
            box-shadow:0 8px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
            transition: opacity 250ms ease, transform 250ms ease;
            overflow:hidden;
          }
          #${fcId} .fc-question {
            ${th.ff}
            opacity:1; transform:scale(1);
          }
          #${fcId} .fc-answer {
            ${th.fb}
            opacity:0; transform:scale(0.97);
            pointer-events:none;
          }
          #${fcId}.revealed .fc-question {
            opacity:0; transform:scale(0.97);
            pointer-events:none;
          }
          #${fcId}.revealed .fc-answer {
            opacity:1; transform:scale(1);
            pointer-events:auto;
          }
          #${fcId} .fc-answer-body {
            width:100%; max-height:${isLongAnswer ? '55%' : 'none'};
            overflow-y:${isLongAnswer ? 'auto' : 'visible'};
            scrollbar-width:thin;
            scrollbar-color:${th.accent} transparent;
          }
          #${fcId} .fc-answer-body::-webkit-scrollbar { width:4px; }
          #${fcId} .fc-answer-body::-webkit-scrollbar-thumb { background:${th.accent}; border-radius:4px; }
          #${fcId} .fc-hint {
            font-size:11px; opacity:0.5; margin-top:auto; padding-top:12px;
            letter-spacing:0.02em;
          }
          #${fcId} .fc-category {
            display:inline-block; padding:4px 14px; border-radius:999px;
            font-size:11px; font-weight:700; background:${th.accentBg};
            color:${th.accent}; border:1px solid ${th.accentBorder};
            margin-bottom:16px; width:fit-content; letter-spacing:0.05em;
          }
          #${fcId} .fc-q-text {
            font-size:clamp(16px,2.2vw,24px); font-weight:800;
            line-height:1.3; word-break:break-word;
            overflow-wrap:break-word; max-width:95%;
          }
          #${fcId} .fc-a-text {
            font-size:${answerFontSize}; line-height:1.65; font-weight:500;
            word-break:break-word; overflow-wrap:break-word; max-width:95%;
          }
        </style>
        <div id="${fcId}" tabindex="0" role="button"
             aria-label="Flashcard. Press Enter or click to reveal answer."
             onclick="(function(el){el.classList.toggle('revealed')})(document.getElementById('${fcId}'))"
             onkeydown="(function(e,el){if(e.key==='Enter'||e.key===' '){e.preventDefault();el.classList.toggle('revealed')}})(event,document.getElementById('${fcId}'))">
          <div class="fc-view fc-question">
            <div class="fc-category">${categoryLabel}</div>
            <div class="fc-q-text">${questionText}</div>
            <div class="fc-hint">Tap to reveal answer →</div>
          </div>
          <div class="fc-view fc-answer">
            <div class="fc-category">ANSWER</div>
            <div class="fc-answer-body">
              <div class="fc-a-text">${answerText}</div>
            </div>
            <div class="fc-hint">Tap to show question ←</div>
          </div>
        </div>
      </div>
    `;
  }

  /* ── MAIN DISPATCH ───────────────────────────────────────────── */

  const LAYOUT_MAP = {
    'title-center':     renderTitleCenter,
    'title-body':       renderTitleBody,
    'title-bullets':    renderTitleBullets,
    'concept':          renderConcept,
    'hero':             renderHero,
    'hero-body':        renderHeroBody,
    'card-grid':        renderCardGrid,
    'numbered-list':    renderNumberedList,
    'timeline-visual':  renderTimelineVisual,
    'timeline-item':    renderTimelineItem,
    'two-column':       renderTwoColumn,
    'split':            renderSplit,
  };

  function render(slide, themeId, ratio) {
    if (slide.type === 'flashcard') return renderFlashcard(slide, themeId, ratio);
    const fn = LAYOUT_MAP[slide.layout] || renderTitleBody;
    return fn(slide, themeId, ratio);
  }

  return { render, renderFlashcard };
})();
