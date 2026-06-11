/**
 * TextDeck — outline-builder.js
 * ═══════════════════════════════════════════════════════
 * PHASE 2: Outline Builder
 *
 * Converts ContentAnalyzer output into a structured
 * presentation outline organized by topics and sections.
 *
 * Input:  ContentAnalyzer.analyze() result
 * Output: { deckTitle, sections[], metadata }
 *
 * The system thinks in topics and sections.
 * Never thinks in text lines.
 * ═══════════════════════════════════════════════════════
 */

const OutlineBuilder = (() => {

  const MAX_ITEMS_PER_SECTION = 6;
  const MIN_ITEMS_FOR_SECTION = 1;

  /**
   * Build a presentation outline from analyzed content.
   *
   * @param {{ title, sections, definitions, lists, paragraphs, facts,
   *           hasTimeline, hasComparison, conclusionText }} analysis
   * @returns {{ deckTitle: string, sections: Array, metadata: Object }}
   */
  function build(analysis) {
    if (!analysis) {
      return { deckTitle: 'Untitled', sections: [], metadata: {} };
    }

    const outline = {
      deckTitle: analysis.title || 'Untitled',
      sections: [],
      metadata: {
        hasTimeline: analysis.hasTimeline || false,
        hasComparison: analysis.hasComparison || false,
        totalDefinitions: (analysis.definitions || []).length,
        totalParagraphs: (analysis.paragraphs || []).length,
        totalFacts: (analysis.facts || []).length,
        hasConclusionText: !!analysis.conclusionText,
      },
    };

    // ── Strategy: Build outline from analyzed sections ──────────

    // If the analyzer found structured sections, use them directly
    if (analysis.sections && analysis.sections.length > 0) {
      for (const section of analysis.sections) {
        const outlineSection = {
          title: section.heading,
          contentType: 'mixed',
          content: [],
        };

        for (const item of (section.content || [])) {
          switch (item.type) {
            case 'list':
              outlineSection.contentType = 'bullets';
              outlineSection.content.push({
                type: 'bullets',
                items: item.items || [],
              });
              break;

            case 'definition':
              outlineSection.contentType = 'definition';
              outlineSection.content.push({
                type: 'definition',
                term: item.term,
                meaning: item.meaning,
              });
              break;

            case 'paragraph':
              outlineSection.content.push({
                type: 'paragraph',
                text: item.text,
                wordCount: item.wordCount,
              });
              break;

            case 'timeline-entry':
              outlineSection.contentType = 'timeline';
              outlineSection.content.push({
                type: 'timeline',
                text: item.text,
              });
              break;
          }
        }

        if (outlineSection.content.length >= MIN_ITEMS_FOR_SECTION) {
          outline.sections.push(outlineSection);
        }
      }
    }

    // ── Handle orphan definitions not attached to sections ──────

    const orphanDefs = (analysis.definitions || []).filter(def => {
      // Check if this definition is already captured in a section
      return !outline.sections.some(sec =>
        sec.content.some(c => c.type === 'definition' && c.term === def.term)
      );
    });

    if (orphanDefs.length > 0) {
      // Group orphan definitions into a section
      const defSection = {
        title: orphanDefs.length === 1
          ? orphanDefs[0].term
          : 'Definitions',
        contentType: 'definition',
        content: orphanDefs.map(d => ({
          type: 'definition',
          term: d.term,
          meaning: d.meaning,
        })),
      };
      // Insert at the beginning (definitions typically introduce content)
      outline.sections.unshift(defSection);
    }

    // ── Handle orphan paragraphs ───────────────────────────────

    const orphanParagraphs = (analysis.paragraphs || []).filter(p => !p.sectionHeading);

    if (orphanParagraphs.length > 0) {
      // Group by proximity: create sections of 1-3 paragraphs
      let chunk = [];
      for (const para of orphanParagraphs) {
        chunk.push(para);
        if (chunk.length >= 2) {
          outline.sections.push({
            title: extractTopicFromParagraph(chunk[0].text),
            contentType: 'paragraph',
            content: chunk.map(p => ({
              type: 'paragraph',
              text: p.text,
              wordCount: p.wordCount,
            })),
          });
          chunk = [];
        }
      }
      if (chunk.length) {
        outline.sections.push({
          title: extractTopicFromParagraph(chunk[0].text),
          contentType: 'paragraph',
          content: chunk.map(p => ({
            type: 'paragraph',
            text: p.text,
            wordCount: p.wordCount,
          })),
        });
      }
    }

    // ── Handle orphan lists ────────────────────────────────────

    const orphanLists = (analysis.lists || []).filter(l => {
      return !outline.sections.some(sec =>
        sec.content.some(c => c.type === 'bullets' &&
          JSON.stringify(c.items) === JSON.stringify(l.items))
      );
    });

    for (const list of orphanLists) {
      outline.sections.push({
        title: list.heading,
        contentType: 'bullets',
        content: [{
          type: 'bullets',
          items: list.items,
        }],
      });
    }

    // ── Handle facts (add as a section if substantial) ─────────

    if (analysis.facts && analysis.facts.length >= 2) {
      const factsDuplicated = analysis.facts.some(f =>
        outline.sections.some(sec =>
          sec.content.some(c => c.text && c.text.includes(f))
        )
      );
      if (!factsDuplicated) {
        outline.sections.push({
          title: 'Key Facts',
          contentType: 'bullets',
          content: [{
            type: 'bullets',
            items: analysis.facts,
          }],
        });
      }
    }

    // ── Add conclusion if present ──────────────────────────────

    if (analysis.conclusionText) {
      outline.sections.push({
        title: 'Conclusion',
        contentType: 'conclusion',
        content: [{
          type: 'paragraph',
          text: analysis.conclusionText,
          wordCount: analysis.conclusionText.split(/\s+/).length,
        }],
      });
    }

    return outline;
  }

  // ── HELPER: Extract a topic from paragraph text ────────────────

  function extractTopicFromParagraph(text) {
    if (!text) return 'Overview';

    // Try first clause before comma or period
    const firstClause = text.split(/[,.:;]/)[0].trim();
    const words = firstClause.split(/\s+/);

    if (words.length <= 6) return firstClause;

    // Take first 5 meaningful words
    return words.slice(0, 5).join(' ') + '…';
  }

  // ── PUBLIC API ──────────────────────────────────────────────────

  return { build };

})();
