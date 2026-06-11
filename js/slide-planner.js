/**
 * TextDeck — slide-planner.js
 * ═══════════════════════════════════════════════════════
 * PHASE 3: Slide Planning Engine
 *
 * Responsibilities:
 *   - Decide number of slides
 *   - Group related content
 *   - Split oversized sections
 *   - Merge tiny sections
 *   - Determine slide type
 *
 * Slide types:
 *   - title       — Title/Cover Slide
 *   - overview    — Overview Slide
 *   - content     — Content Slide (title + body)
 *   - bullets     — Bullet Slide
 *   - timeline    — Timeline Slide
 *   - comparison  — Comparison Slide
 *   - summary     — Summary Slide
 *   - conclusion  — Conclusion Slide
 *
 * The planner decides structure BEFORE rendering.
 *
 * Exports: SlidePlanner.plan(outline)
 * ═══════════════════════════════════════════════════════
 */

const SlidePlanner = (() => {

  const MAX_BULLETS_PER_SLIDE = 5;
  const MAX_WORDS_PER_SLIDE = 60;
  const MIN_SECTIONS_FOR_OVERVIEW = 3;

  /**
   * Plan a slide deck from an outline.
   *
   * @param {{ deckTitle: string, sections: Array, metadata: Object }} outline
   * @returns {Array<{ slideType: string, title: string, body?: string,
   *                    bullets?: string[], items?: Array, meta?: Object }>}
   */
  function plan(outline) {
    if (!outline || !outline.sections) {
      return [createTitleSlide('Untitled', '')];
    }

    const slides = [];
    const sections = outline.sections || [];
    const meta = outline.metadata || {};

    // ── 1. Cover Slide (always first) ──────────────────────────
    slides.push(createTitleSlide(
      outline.deckTitle,
      buildSubtitle(sections)
    ));

    // ── 2. Overview Slide (if enough content) ──────────────────
    if (sections.length >= MIN_SECTIONS_FOR_OVERVIEW) {
      slides.push(createOverviewSlide(sections));
    }

    // ── 3. Content Slides — process each section ───────────────
    for (const section of sections) {
      const sectionSlides = planSection(section);
      slides.push(...sectionSlides);
    }

    // ── 4. Summary Slide (if enough slides) ────────────────────
    if (slides.length >= 4) {
      slides.push(createSummarySlide(outline.deckTitle, sections));
    }

    // ── 5. Conclusion Slide ────────────────────────────────────
    // Only add if there isn't already a conclusion section
    const hasConclusion = sections.some(s =>
      s.contentType === 'conclusion' || /conclusi|kesimpulan/i.test(s.title)
    );
    if (!hasConclusion && slides.length >= 3) {
      slides.push(createConclusionSlide(outline.deckTitle));
    }

    // ── 6. Validation pass ─────────────────────────────────────
    return validate(slides);
  }

  // ── SECTION PLANNING ────────────────────────────────────────────

  function planSection(section) {
    const slides = [];
    const { title, content, contentType } = section;

    if (!content || content.length === 0) return slides;

    switch (contentType) {
      case 'definition':
        slides.push(...planDefinitions(title, content));
        break;

      case 'bullets':
        slides.push(...planBullets(title, content));
        break;

      case 'timeline':
        slides.push(...planTimeline(title, content));
        break;

      case 'conclusion':
        slides.push(...planConclusion(title, content));
        break;

      case 'paragraph':
      case 'mixed':
      default:
        slides.push(...planMixed(title, content));
        break;
    }

    return slides;
  }

  // ── PLAN: Definitions → Content slides ──────────────────────────

  function planDefinitions(sectionTitle, content) {
    const slides = [];
    const definitions = content.filter(c => c.type === 'definition');
    const others = content.filter(c => c.type !== 'definition');

    // Each definition (or pair of definitions) → one slide
    for (let i = 0; i < definitions.length; i += 2) {
      const batch = definitions.slice(i, i + 2);
      if (batch.length === 1) {
        slides.push({
          slideType: 'content',
          title: batch[0].term,
          body: batch[0].meaning,
        });
      } else {
        // Two definitions on one slide
        slides.push({
          slideType: 'content',
          title: sectionTitle || batch[0].term,
          body: batch.map(d => `${d.term}: ${d.meaning}`).join('. '),
        });
      }
    }

    // Plan other content items
    if (others.length) {
      slides.push(...planMixed(sectionTitle, others));
    }

    return slides;
  }

  // ── PLAN: Bullets → Split into pages if needed ──────────────────

  function planBullets(sectionTitle, content) {
    const slides = [];

    for (const item of content) {
      if (item.type !== 'bullets' || !item.items || !item.items.length) continue;

      const bullets = item.items;

      if (bullets.length <= MAX_BULLETS_PER_SLIDE) {
        slides.push({
          slideType: 'bullets',
          title: sectionTitle,
          bullets: [...bullets],
        });
      } else {
        // Split into chunks
        const chunks = chunkArray(bullets, MAX_BULLETS_PER_SLIDE);
        chunks.forEach((chunk, i) => {
          slides.push({
            slideType: 'bullets',
            title: chunks.length > 1
              ? `${sectionTitle} (${i + 1}/${chunks.length})`
              : sectionTitle,
            bullets: chunk,
          });
        });
      }
    }

    return slides;
  }

  // ── PLAN: Timeline items ────────────────────────────────────────

  function planTimeline(sectionTitle, content) {
    const timelineItems = content.filter(c => c.type === 'timeline');
    if (!timelineItems.length) return [];

    const items = timelineItems.map(t => t.text);

    if (items.length <= MAX_BULLETS_PER_SLIDE) {
      return [{
        slideType: 'timeline',
        title: sectionTitle || 'Timeline',
        items: items,
      }];
    }

    // Split into chunks
    const chunks = chunkArray(items, MAX_BULLETS_PER_SLIDE);
    return chunks.map((chunk, i) => ({
      slideType: 'timeline',
      title: chunks.length > 1
        ? `${sectionTitle} (${i + 1}/${chunks.length})`
        : (sectionTitle || 'Timeline'),
      items: chunk,
    }));
  }

  // ── PLAN: Conclusion content ────────────────────────────────────

  function planConclusion(sectionTitle, content) {
    const text = content
      .filter(c => c.type === 'paragraph')
      .map(c => c.text)
      .join(' ')
      .trim();

    if (!text) return [];

    return [{
      slideType: 'conclusion',
      title: sectionTitle || 'Conclusion',
      body: Summarizer.summarize(text, 50),
    }];
  }

  // ── PLAN: Mixed content → paragraphs + lists ────────────────────

  function planMixed(sectionTitle, content) {
    const slides = [];

    let pendingBody = [];

    function flushBody() {
      if (!pendingBody.length) return;
      const fullText = pendingBody.join(' ').trim();
      const wordCount = fullText.split(/\s+/).length;

      if (wordCount > MAX_WORDS_PER_SLIDE) {
        // Convert to bullets via summarization
        const bullets = Summarizer.toBullets(fullText, MAX_BULLETS_PER_SLIDE);
        slides.push({
          slideType: 'bullets',
          title: sectionTitle,
          bullets: bullets,
        });
      } else {
        slides.push({
          slideType: 'content',
          title: sectionTitle,
          body: fullText,
        });
      }
      pendingBody = [];
    }

    for (const item of content) {
      switch (item.type) {
        case 'bullets':
          flushBody();
          if (item.items && item.items.length) {
            const chunks = chunkArray(item.items, MAX_BULLETS_PER_SLIDE);
            for (const chunk of chunks) {
              slides.push({
                slideType: 'bullets',
                title: sectionTitle,
                bullets: chunk,
              });
            }
          }
          break;

        case 'definition':
          flushBody();
          slides.push({
            slideType: 'content',
            title: item.term,
            body: item.meaning,
          });
          break;

        case 'paragraph':
          pendingBody.push(item.text);
          break;

        case 'timeline':
          flushBody();
          slides.push({
            slideType: 'timeline',
            title: sectionTitle || 'Timeline',
            items: [item.text],
          });
          break;

        default:
          if (item.text) pendingBody.push(item.text);
          break;
      }
    }

    flushBody();
    return slides;
  }

  // ── SLIDE CREATORS ──────────────────────────────────────────────

  function createTitleSlide(title, subtitle) {
    return {
      slideType: 'title',
      title: title || 'Untitled',
      body: subtitle || '',
    };
  }

  function createOverviewSlide(sections) {
    const topics = sections
      .filter(s => s.contentType !== 'conclusion')
      .map(s => s.title)
      .slice(0, 6);

    return {
      slideType: 'overview',
      title: 'Overview',
      bullets: topics,
    };
  }

  function createSummarySlide(deckTitle, sections) {
    const keyTopics = sections
      .filter(s => s.contentType !== 'conclusion')
      .map(s => s.title)
      .slice(0, 5);

    return {
      slideType: 'summary',
      title: 'Summary',
      bullets: keyTopics,
    };
  }

  function createConclusionSlide(deckTitle) {
    return {
      slideType: 'conclusion',
      title: 'Thank You',
      body: deckTitle,
    };
  }

  // ── BUILD SUBTITLE ──────────────────────────────────────────────

  function buildSubtitle(sections) {
    if (!sections.length) return '';
    const count = sections.filter(s => s.contentType !== 'conclusion').length;
    return `${count} topic${count !== 1 ? 's' : ''} covered`;
  }

  // ── VALIDATION ──────────────────────────────────────────────────

  function validate(slides) {
    const cleaned = slides.map(slide => {
      if (!slide) return null;

      // Step 8: Never generate slides containing only one bullet. Convert to content slide.
      if (slide.slideType === 'bullets' && slide.bullets && slide.bullets.length === 1) {
        return {
          slideType: 'content',
          title: slide.title,
          body: slide.bullets[0]
        };
      }
      return slide;
    });

    return cleaned.filter(slide => {
      if (!slide) return false;
      if (!slide.slideType) return false;

      // Step 8: Never generate empty or placeholder slides, or slides containing only section titles.
      if (slide.slideType === 'content' && (!slide.body || !slide.body.trim()) && (!slide.bullets || !slide.bullets.length)) {
        return false;
      }
      if (slide.slideType === 'bullets' && (!slide.bullets || !slide.bullets.length)) {
        return false;
      }
      if (slide.slideType === 'timeline' && (!slide.items || !slide.items.length)) {
        return false;
      }

      return true;
    });
  }

  // ── UTIL ────────────────────────────────────────────────────────

  function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  // ── PUBLIC API ──────────────────────────────────────────────────

  return { plan };

})();
