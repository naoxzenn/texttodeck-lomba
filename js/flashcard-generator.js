/**
 * TextDeck — flashcard-generator.js
 * ═══════════════════════════════════════════════════════
 * PHASE 5: Independent Flashcard Generation Pipeline
 *
 * Flow:
 *   Text → Analyzer → Definition Extractor → Flashcard Generator → Render
 *
 * Completely independent from presentation pipeline.
 * Does NOT reuse presentation rendering logic.
 *
 * Data model:
 *   { type: "flashcard", category, question, answer, revealed: false }
 *
 * Exports: FlashcardGenerator.generate(rawText)
 * ═══════════════════════════════════════════════════════
 */

const FlashcardGenerator = (() => {

  const MAX_ANSWER_WORDS = 40;

  /**
   * Generate flashcards from raw text.
   * @param {string} rawText
   * @returns {Array<{ type:'flashcard', question:string, answer:string, category:string, revealed:boolean }>}
   */
  function generate(rawText) {
    if (!rawText || typeof rawText !== 'string') return [];

    const analysis = ContentAnalyzer.analyze(rawText);
    const cards = [];

    // ── 1. Definitions → Question/Answer cards
    for (const def of (analysis.definitions || [])) {
      if (def.term && def.meaning) {
        cards.push(makeCard(
          'definition',
          `What is ${def.term}?`,
          capitalize(def.meaning)
        ));
      }
    }

    // ── 2. Sections with bullets → Topic/Details cards
    for (const section of (analysis.sections || [])) {
      const lists = (section.content || []).filter(c => c.type === 'list');
      for (const list of lists) {
        if (list.items && list.items.length > 0) {
          cards.push(makeCard(
            'list',
            section.heading || 'Key Points',
            formatBulletAnswer(list.items)
          ));
        }
      }

      // Paragraphs within sections → Key concept cards
      const paragraphs = (section.content || []).filter(c => c.type === 'paragraph');
      for (const para of paragraphs) {
        if (para.text && para.wordCount > 8) {
          cards.push(makeCard(
            'concept',
            section.heading ? `Explain: ${section.heading}` : 'Key Concept',
            Summarizer.summarize(para.text, MAX_ANSWER_WORDS)
          ));
        }
      }

      // Definitions within sections
      const defs = (section.content || []).filter(c => c.type === 'definition');
      for (const def of defs) {
        const isDuplicate = cards.some(
          c => c.category === 'definition' && c.question.includes(def.term)
        );
        if (!isDuplicate && def.term && def.meaning) {
          cards.push(makeCard(
            'definition',
            `What is ${def.term}?`,
            capitalize(def.meaning)
          ));
        }
      }
    }

    // ── 3. Facts → Fact cards
    for (const fact of (analysis.facts || [])) {
      if (fact.length > 15) {
        const isDuplicate = cards.some(c => c.answer.includes(fact.slice(0, 30)));
        if (!isDuplicate) {
          cards.push(makeCard(
            'fact',
            'Key Fact',
            Summarizer.truncate(fact, MAX_ANSWER_WORDS)
          ));
        }
      }
    }

    // ── 4. Conclusion → Summary card
    if (analysis.conclusionText) {
      cards.push(makeCard(
        'conclusion',
        'Summary / Conclusion',
        Summarizer.summarize(analysis.conclusionText, MAX_ANSWER_WORDS)
      ));
    }

    // ── 5. Fallback
    if (cards.length === 0 && analysis.paragraphs && analysis.paragraphs.length > 0) {
      for (const para of analysis.paragraphs.slice(0, 5)) {
        cards.push(makeCard(
          'concept',
          analysis.title || 'Key Point',
          Summarizer.summarize(para.text, MAX_ANSWER_WORDS)
        ));
      }
    }

    return deduplicateCards(cards);
  }

  // ── Card factory
  function makeCard(category, question, answer) {
    return {
      type: 'flashcard',
      category,
      question,
      answer,
      revealed: false,
    };
  }

  function formatBulletAnswer(items) {
    return items.slice(0, 6).map(item => `• ${item}`).join('\n');
  }

  function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function deduplicateCards(cards) {
    const seen = new Set();
    return cards.filter(card => {
      const key = (card.question + '|' + card.answer).toLowerCase().slice(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return { generate };

})();
