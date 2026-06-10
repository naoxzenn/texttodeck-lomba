tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-container-highest": "#dae2fd", "primary-fixed-dim": "#9ecaff",
        "surface-container-low": "#f2f3ff", "on-secondary": "#ffffff",
        "on-primary-container": "#003c67", "on-background": "#131b2e",
        "on-surface": "#131b2e", "on-primary": "#ffffff",
        "surface-container": "#eaedff", "primary-container": "#4da8ff",
        "on-secondary-container": "#fefcff", "surface": "#faf8ff",
        "on-surface-variant": "#404752", "surface-container-lowest": "#ffffff",
        "surface-container-high": "#e2e7ff", "on-tertiary": "#ffffff",
        "background": "#faf8ff", "secondary-container": "#316bf3",
        "tertiary": "#00687c", "primary": "#0061a3", "secondary": "#0051d5",
        "outline": "#707883", "surface-variant": "#dae2fd",
        "outline-variant": "#c0c7d3", "tertiary-container": "#37b1cf",
        "on-tertiary-container": "#00404d"
      },
      fontFamily: { sans: ["Inter", "sans-serif"] }
    }
  }
}

// ── Data ───────────────────────────────────────────
const TEMPLATES = [
  { id:1,  title:'Executive Report',    cat:'Business',   desc:'Professional structure for data-driven executive summaries and quarterly business reviews.',       tags:['Executive','Report','Data'],       bg:'linear-gradient(135deg,#001d36,#003a6b)', accent:'#4da8ff' },
  { id:2,  title:'Curriculum Guide',    cat:'Education',  desc:'Syllabus and lesson plan templates optimized for clear learning objectives and student engagement.',tags:['Syllabus','Lesson Plan','Learning'], bg:'linear-gradient(135deg,#001f27,#003344)', accent:'#64d5f4' },
  { id:3,  title:'API Documentation',   cat:'Technology', desc:'Structured documentation for software projects, featuring clean code blocks and endpoint descriptions.',tags:['Developer','API','Docs'],           bg:'linear-gradient(135deg,#00174b,#002a7a)', accent:'#b4c5ff' },
  { id:4,  title:'Creative Portfolio',  cat:'Creative',   desc:'Bold layouts designed to showcase visual work and personal branding with maximum impact.',          tags:['Portfolio','Branding','Visual'],    bg:'linear-gradient(135deg,#1a0533,#2d0a5a)', accent:'#c084fc' },
  { id:5,  title:'Pure Document',       cat:'Minimalist', desc:'Distraction-free template for long-form writing, research papers, and clean academic work.',        tags:['Academic','Research','Writing'],    bg:'linear-gradient(160deg,#f0f4f8,#e8edf5)', accent:'#0061a3', light:true },
  { id:6,  title:'Growth Plan',         cat:'Business',   desc:'Dynamic templates for marketing strategies, campaign tracking, and growth projections.',            tags:['Marketing','Growth','Campaign'],    bg:'linear-gradient(135deg,#001836,#002d58)', accent:'#9ecaff' },
  { id:7,  title:'Investor Pitch Deck', cat:'Business',   desc:'High-converting slide structure built for startup funding rounds and venture capital pitches.',     tags:['Startup','Pitch','VC'],             bg:'linear-gradient(135deg,#0a1627,#0f2848)', accent:'#4da8ff' },
  { id:8,  title:'Science Lab Report',  cat:'Education',  desc:'Structured academic format for experiments, hypotheses, and data-backed scientific conclusions.',   tags:['Science','Experiment','Lab'],       bg:'linear-gradient(135deg,#052e16,#0a3d1e)', accent:'#86efac' },
  { id:9,  title:'Cyber Defense Brief', cat:'Technology', desc:'Network security and threat analysis template with dark glassmorphic overlays and data nodes.',     tags:['Security','Network','Threat'],      bg:'linear-gradient(135deg,#000d18,#001830)', accent:'#22d3ee' },
  { id:10, title:'Brand Moodboard',     cat:'Creative',   desc:'Colorful and expressive layouts for brand identity workshops, agency pitches, and mood boards.',    tags:['Brand','Agency','Workshop'],       bg:'linear-gradient(135deg,#2d0808,#4a0f0f)', accent:'#fca5a5' },
  { id:11, title:'Zen Minimal',         cat:'Minimalist', desc:'Ultra-clean layout with vast whitespace and sharp typography for luxury or professional briefs.',    tags:['Clean','Luxury','Brief'],           bg:'linear-gradient(160deg,#f8fafc,#eef2f7)', accent:'#0051d5', light:true },
  { id:12, title:'AI Research Paper',   cat:'Technology', desc:'Modern layout for presenting ML models, neural architectures, and AI research findings visually.',  tags:['AI','Research','ML'],               bg:'linear-gradient(135deg,#050510,#0d1120)', accent:'#818cf8' },
];

const BADGE_COLORS = {
  Business:'badge-business', Education:'badge-education',
  Technology:'badge-technology', Creative:'badge-creative', Minimalist:'badge-minimalist'
};

let currentCat  = 'all';
let currentQ    = '';
let visibleN    = 6;
let starred     = new Set(JSON.parse(localStorage.getItem('td2_fav') || '[]'));
let modalId     = null;

// ── Toast ──────────────────────────────────────────
function showToast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Render ─────────────────────────────────────────
function filtered() {
  return TEMPLATES.filter(t => {
    const catOk = currentCat === 'all' || t.cat === currentCat;
    const qOk   = !currentQ || t.title.toLowerCase().includes(currentQ) || t.cat.toLowerCase().includes(currentQ) || t.tags.some(tg => tg.toLowerCase().includes(currentQ));
    return catOk && qOk;
  });
}

function renderGrid() {
  const list   = filtered();
  const shown  = list.slice(0, visibleN);
  const grid   = document.getElementById('templateGrid');
  const empty  = document.getElementById('emptyState');
  const lmWrap = document.getElementById('loadMoreWrap');
  const count  = document.getElementById('resultCount');

  count.textContent = `Menampilkan ${Math.min(visibleN, list.length)} dari ${list.length} template`;
  empty.classList.toggle('hidden', list.length > 0);
  grid.classList.toggle('hidden', list.length === 0);
  lmWrap.classList.toggle('hidden', visibleN >= list.length);

  grid.innerHTML = '';
  shown.forEach((t, i) => {
    const isStar = starred.has(t.id);
    const div = document.createElement('div');
    div.className = 'tmpl-item tilt-card glass-card rounded-2xl overflow-hidden group cursor-pointer';
    div.style.animationDelay = (i * 0.06) + 's';
    div.dataset.id = t.id;

    const titleColor = t.light ? t.accent : '#ffffff';
    const subColor   = t.light ? 'rgba(19,27,46,0.6)' : 'rgba(255,255,255,0.55)';

    div.innerHTML = `
      <div class="relative overflow-hidden" style="height:220px;">
        <div class="card-img w-full h-full" style="background:${t.bg};position:relative;">
          <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:${t.accent};opacity:0.1;border-radius:50%;filter:blur(40px);"></div>
          <div style="position:absolute;inset:0;padding:24px;display:flex;flex-direction:column;justify-content:flex-end;">
            <div style="font-size:10px;font-weight:700;color:${t.accent};letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;opacity:0.85;">${t.cat}</div>
            <div style="font-size:18px;font-weight:700;color:${titleColor};line-height:1.2;max-width:80%;">${t.title}</div>
            <div style="margin-top:8px;font-size:11px;color:${subColor};line-height:1.5;max-width:75%;" class="line-clamp-2">${t.desc}</div>
          </div>
        </div>
        <div class="card-overlay absolute inset-0 bg-primary/15 opacity-0 flex items-end justify-center pb-4">
          <button class="preview-btn bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-4 py-2 rounded-full shadow hover:bg-white transition-colors flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">visibility</span> Preview
          </button>
        </div>
        <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold ${BADGE_COLORS[t.cat] || 'bg-primary-container text-on-primary-container'}">${t.cat}</div>
        <button class="star-btn absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/80 backdrop-blur-sm transition-all hover:scale-110 ${isStar ? 'text-yellow-400' : 'text-on-surface-variant'}" data-id="${t.id}">
          <span class="material-symbols-outlined text-[18px] ${isStar ? 'fill-icon' : ''}">star</span>
        </button>
      </div>
      <div class="p-5 flex flex-col gap-3">
        <div class="flex justify-between items-start gap-2">
          <h3 class="text-[18px] font-bold text-on-surface leading-tight">${t.title}</h3>
        </div>
        <p class="text-sm text-on-surface-variant leading-relaxed line-clamp-2">${t.desc}</p>
        <div class="flex gap-1 flex-wrap">
          ${t.tags.map(tg => `<span class="px-2 py-0.5 bg-surface-container rounded-full text-[11px] font-medium text-on-surface-variant">${tg}</span>`).join('')}
        </div>
        <button class="use-btn w-full bg-primary text-white text-sm font-bold py-3 rounded-xl hover:bg-secondary transition-colors flex items-center justify-center gap-2" data-id="${t.id}">
          Gunakan <span class="material-symbols-outlined text-[16px] arrow-icon">arrow_forward</span>
        </button>
      </div>`;

    // events
    div.querySelector('.star-btn').addEventListener('click', e => { e.stopPropagation(); toggleStar(t.id); });
    div.querySelector('.use-btn').addEventListener('click', e => { e.stopPropagation(); useTemplate(t.id); });
    div.querySelector('.preview-btn').addEventListener('click', e => { e.stopPropagation(); openModal(t.id); });
    div.addEventListener('click', () => openModal(t.id));

    grid.appendChild(div);
  });

  // Re-apply 3D tilt
  applyTilt();
}

// ── 3D Tilt ────────────────────────────────────────
function applyTilt() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const cx = r.width / 2, cy = r.height / 2;
      const rx = ((y - cy) / cy) * 5;
      const ry = ((cx - x) / cx) * 5;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.01)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0) scale(1)';
    });
  });
}

// ── Star ───────────────────────────────────────────
function toggleStar(id) {
  if (starred.has(id)) { starred.delete(id); showToast('Dihapus dari favorit'); }
  else { starred.add(id); showToast('✓ Ditambahkan ke favorit!'); }
  localStorage.setItem('td2_fav', JSON.stringify([...starred]));
  renderGrid();
  if (modalId === id) updateModalFav();
}

// ── Use ────────────────────────────────────────────
function useTemplate(id) {
  const t = TEMPLATES.find(x => x.id === id);
  showToast(`✓ Membuka "${t.title}"…`);
  setTimeout(() => { window.location.href = 'Dashboard.html'; }, 900);
}

// ── Reset filter ───────────────────────────────────
function resetFilter() {
  currentCat = 'all'; currentQ = '';
  document.querySelectorAll('.category-pill').forEach(b => {
    b.classList.remove('active');
    b.classList.add('bg-white/70','border-outline-variant','text-on-surface-variant');
  });
  document.querySelector('[data-cat="all"]').classList.add('active');
  document.getElementById('searchInput').value = '';
  visibleN = 6; renderGrid();
}

// ── Modal ──────────────────────────────────────────
function openModal(id) {
  const t = TEMPLATES.find(x => x.id === id);
  modalId = id;
  const modal = document.getElementById('previewModal');

  const badgeEl = document.getElementById('pBadge');
  badgeEl.textContent = t.cat;
  badgeEl.className = `text-[11px] font-bold uppercase px-3 py-0.5 rounded-full ${BADGE_COLORS[t.cat] || 'badge-business'}`;

  document.getElementById('pTitle').textContent = t.title;
  document.getElementById('pDesc').textContent = t.desc;
  document.getElementById('pTags').innerHTML = t.tags.map(tg =>
    `<span class="px-3 py-1 bg-surface-container rounded-full text-xs font-medium text-on-surface-variant">${tg}</span>`
  ).join('');

  const titleC = t.light ? t.accent : '#ffffff';
  const subC   = t.light ? 'rgba(19,27,46,0.55)' : 'rgba(255,255,255,0.55)';
  document.getElementById('pSlide').innerHTML = `
    <div style="width:100%;height:100%;background:${t.bg};position:relative;overflow:hidden;display:flex;align-items:center;font-family:Inter,sans-serif;">
      <div style="position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:${t.accent};opacity:0.1;border-radius:50%;filter:blur(50px);"></div>
      <div style="position:relative;z-index:2;padding:clamp(16px,5%,48px);width:100%;">
        <div style="font-size:10px;font-weight:700;color:${t.accent};letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;opacity:0.85;">${t.cat}</div>
        <div style="font-size:clamp(16px,3vw,26px);font-weight:700;color:${titleC};line-height:1.2;max-width:80%;margin-bottom:10px;">${t.title}</div>
        <div style="font-size:12px;color:${subC};line-height:1.6;max-width:70%;">${t.desc}</div>
        <div style="margin-top:14px;display:flex;gap:8px;">
          ${t.tags.slice(0,2).map(tg=>`<span style="padding:3px 10px;background:${t.accent}22;border:1px solid ${t.accent}44;color:${t.accent};border-radius:999px;font-size:10px;font-weight:600;">${tg}</span>`).join('')}
        </div>
      </div>
    </div>`;

  // Thumbs (3 colour variations)
  const vars = [t.bg, t.bg.replace('135deg', '155deg'), t.bg.replace('135deg','115deg')];
  document.getElementById('pThumbs').innerHTML = vars.map((bg, i) => `
    <div style="flex:0 0 110px;height:62px;border-radius:8px;overflow:hidden;background:${bg};border:2px solid ${i===0?t.accent:'transparent'};cursor:pointer;transition:border-color .15s;position:relative;">
      <div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);font-size:9px;color:rgba(255,255,255,0.45);">Slide ${i+1}</div>
    </div>`).join('');

  updateModalFav();
  modal.classList.remove('hidden');
  requestAnimationFrame(() => { modal.style.opacity = '1'; });
}

function updateModalFav() {
  const icon = document.getElementById('pFavIcon');
  if (starred.has(modalId)) {
    icon.className = 'fill-icon material-symbols-outlined text-[18px]';
    icon.style.color = '#f59e0b';
  } else {
    icon.className = 'material-symbols-outlined text-[18px]';
    icon.style.color = '';
  }
}

function closeModal() {
  const modal = document.getElementById('previewModal');
  modal.style.opacity = '0';
  setTimeout(() => { modal.classList.add('hidden'); modalId = null; }, 220);
}
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('previewModal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
document.getElementById('pFavBtn').addEventListener('click', () => { if (modalId) toggleStar(modalId); });
document.getElementById('pUseBtn').addEventListener('click', () => { if (modalId) useTemplate(modalId); });

// ── Category filter ────────────────────────────────
document.querySelectorAll('.category-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.category-pill').forEach(b => {
      b.classList.remove('active');
      b.classList.add('bg-white/70','border-outline-variant','text-on-surface-variant');
    });
    btn.classList.add('active');
    btn.classList.remove('bg-white/70','border-outline-variant','text-on-surface-variant');
    currentCat = btn.dataset.cat;
    visibleN = 6;
    renderGrid();
  });
});

// ── Search ─────────────────────────────────────────
let searchT;
document.getElementById('searchInput').addEventListener('input', function() {
  clearTimeout(searchT);
  searchT = setTimeout(() => {
    currentQ = this.value.trim().toLowerCase();
    visibleN = 6;
    renderGrid();
  }, 200);
});

// ── Load More ──────────────────────────────────────
document.getElementById('loadMoreBtn').addEventListener('click', () => {
  visibleN += 6; renderGrid();
});

// ── Background parallax ────────────────────────────
document.addEventListener('mousemove', e => {
  const x = (e.clientX / window.innerWidth * 100).toFixed(1);
  const y = (e.clientY / window.innerHeight * 70).toFixed(1);
  document.body.style.background = `radial-gradient(circle at ${x}% ${y}%, #d1e4ff 0%, #faf8ff 70%)`;
});

// ── Init ───────────────────────────────────────────
renderGrid();
