/**
 * TextDeck — template-engine.js (REBUILT)
 * Phase 7: Real Template Engine
 * Templates affect layout, composition, content structure.
 */

const TEMPLATE_REGISTRY = {
  corporate: {
    id: 'corporate', label: '◼ Corporate', desc: 'Formal business layout.',
    transforms: {
      title:      s => ({ ...s, layout: 'title-center', subtitle: s.body || '' }),
      overview:   s => ({ ...s, layout: 'title-bullets', body: 'Topics covered in this presentation:' }),
      content:    s => ({ ...s, layout: 'title-body' }),
      bullets:    s => ({ ...s, layout: 'title-bullets' }),
      timeline:   s => ({ ...s, layout: 'numbered-list', bullets: s.items || [] }),
      comparison: s => ({ ...s, layout: 'two-column' }),
      summary:    s => ({ ...s, layout: 'title-bullets', body: 'Key topics reviewed:' }),
      conclusion: s => ({ ...s, layout: 'title-center' }),
    },
  },
  education: {
    id: 'education', label: '✎ Education', desc: 'Topic, explanation, key takeaways.',
    transforms: {
      title:      s => ({ ...s, layout: 'title-center', subtitle: s.body || '', badge: 'LESSON' }),
      overview:   s => ({ ...s, layout: 'title-bullets', body: 'What you will learn:', badge: 'LEARNING OBJECTIVES' }),
      content:    s => ({ ...s, layout: 'concept', badge: 'CORE CONCEPT' }),
      bullets:    s => ({ ...s, layout: 'title-bullets', badge: 'KEY POINTS' }),
      timeline:   s => ({ ...s, layout: 'timeline-visual', bullets: s.items || [], badge: 'TIMELINE' }),
      comparison: s => ({ ...s, layout: 'two-column', badge: 'COMPARE' }),
      summary:    s => ({ ...s, layout: 'title-bullets', body: 'Key takeaways:', badge: 'REVIEW' }),
      conclusion: s => ({ ...s, layout: 'title-center', badge: 'SUMMARY' }),
    },
  },
  startup: {
    id: 'startup', label: '◈ Startup', desc: 'Big headline, key message.',
    transforms: {
      title:      s => ({ ...s, layout: 'hero', subtitle: s.body || '' }),
      overview:   s => ({ ...s, layout: 'card-grid' }),
      content:    s => ({ ...s, layout: 'hero-body' }),
      bullets:    s => ({ ...s, layout: 'card-grid' }),
      timeline:   s => ({ ...s, layout: 'numbered-list', bullets: s.items || [] }),
      comparison: s => ({ ...s, layout: 'two-column' }),
      summary:    s => ({ ...s, layout: 'card-grid' }),
      conclusion: s => ({ ...s, layout: 'hero' }),
    },
  },
  timeline: {
    id: 'timeline', label: '⟡ Timeline', desc: 'Chronological sequence.',
    transforms: {
      title:      s => ({ ...s, layout: 'title-center' }),
      overview:   s => ({ ...s, layout: 'numbered-list' }),
      content:    s => ({ ...s, layout: 'timeline-item' }),
      bullets:    s => ({ ...s, layout: 'timeline-visual' }),
      timeline:   s => ({ ...s, layout: 'timeline-visual', bullets: s.items || [] }),
      comparison: s => ({ ...s, layout: 'two-column' }),
      summary:    s => ({ ...s, layout: 'numbered-list' }),
      conclusion: s => ({ ...s, layout: 'title-center' }),
    },
  },
  comparison: {
    id: 'comparison', label: '⬡ Comparison', desc: 'Side-by-side comparison.',
    transforms: {
      title:      s => ({ ...s, layout: 'title-center' }),
      overview:   s => ({ ...s, layout: 'two-column' }),
      content:    s => ({ ...s, layout: 'split' }),
      bullets:    s => {
        const items = s.bullets || [];
        const mid = Math.ceil(items.length / 2);
        return { ...s, layout: 'two-column', bulletsLeft: items.slice(0, mid), bulletsRight: items.slice(mid) };
      },
      timeline:   s => ({ ...s, layout: 'numbered-list', bullets: s.items || [] }),
      comparison: s => ({ ...s, layout: 'two-column' }),
      summary:    s => ({ ...s, layout: 'two-column' }),
      conclusion: s => ({ ...s, layout: 'title-center' }),
    },
  },
};

const TemplateEngine = (() => {
  function apply(slides, templateId) {
    const tpl = TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY.corporate;
    return slides.map(slide => {
      const transform = tpl.transforms[slide.slideType];
      if (transform) {
        const r = transform(slide);
        r.templateId = tpl.id;
        return r;
      }
      return { ...slide, layout: 'title-body', templateId: tpl.id };
    });
  }
  return { apply };
})();
