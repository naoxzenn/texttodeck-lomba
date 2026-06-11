/**
 * TextDeck — content-analyzer.js (Redesigned)
 * ═══════════════════════════════════════════════════════
 * Redesigned Content Analysis Engine
 *
 * Implements:
 *   Input Sanitizer → Markdown Cleaner → Structure Detector → Content Classifier
 *
 * Possible Types:
 *   - TITLE
 *   - SECTION
 *   - PARAGRAPH
 *   - BULLET_LIST
 *   - NUMBERED_LIST
 *   - TIMELINE
 *   - DEFINITION
 *   - STATISTIC
 *   - QUOTE
 *   - CONCLUSION
 *
 * Outputs a highly-structured representation for downstream outline building.
 * Keeps console debug logs for parsing audit.
 * ═══════════════════════════════════════════════════════
 */

const ContentAnalyzer = (() => {

  // ── CLASSIFIER PATTERNS ──────────────────────────────────────────

  const PATTERNS = {
    // Definition verbs
    definition: /\b(adalah|merupakan|ialah|yaitu|didefinisikan sebagai|refers to|is defined as|is a|is an|is the|was a|was an|was the|are the|were the)\b/i,

    // Bullet list symbols
    bullet: /^[\s]*([-*•+▸▹◦‣⁃]|\d+[.):]|[a-z][.):]|[ivxlcdm]+[.)])\s+/i,

    // Year/timeline at the start of a line
    timelineStart: /^[\s]*(1[5-9]\d{2}|20[0-2]\d)\s*([-–—:]|\b)/,

    // Statistics and percentages
    statistic: /(\d+[.,]?\d*\s*(%|persen|percent|juta|miliar|billion|million|trillion|ribu|thousand|USD|EUR|IDR|\$|€|Rp)|\b\d{2,}[.,]\d+\b)/i,

    // Conclusion markers
    conclusion: /^[\s]*(kesimpulan|conclusion|summary|ringkasan|in conclusion|to summarize|sebagai kesimpulan|secara keseluruhan|overall|in summary|to sum up)\s*[:：]?\s*/i,
  };

  /**
   * Cleans Markdown formatting from a text string.
   */
  function cleanMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
  }

  /**
   * Cleans section header markers.
   */
  function cleanSectionTitle(text) {
    return cleanMarkdown(text)
      .replace(/^#{1,6}\s+/, '')
      .replace(/[:：]\s*$/, '')
      .trim();
  }

  /**
   * Classifies a raw sanitized line.
   */
  function classifyLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return 'EMPTY';

    // 1. Conclusion check
    if (PATTERNS.conclusion.test(trimmed)) {
      return 'CONCLUSION';
    }

    // 2. Markdown Headings
    if (/^#{1,6}\s+/.test(trimmed)) {
      return 'SECTION';
    }

    // 3. Bullet list item check
    if (/^[-*•+▸▹◦‣⁃]\s*/.test(trimmed)) {
      return 'BULLET_LIST';
    }

    // 4. Numbered list check (e.g. 1. or a) or (1) or [1])
    if (/^(\d+|[a-zA-Z]|[ivxlcdmIVXLCDM]+)[.)]\s+/.test(trimmed) || /^\[\d+\]\s+/.test(trimmed)) {
      return 'NUMBERED_LIST';
    }

    // 5. Blockquote / Quote
    if (/^>\s*/.test(trimmed) || (/^["'“]/.test(trimmed) && /["'”]$/.test(trimmed))) {
      return 'QUOTE';
    }

    // 6. Timeline check
    if (PATTERNS.timelineStart.test(trimmed)) {
      return 'TIMELINE';
    }

    // 7. Definition check
    if (PATTERNS.definition.test(trimmed)) {
      const match = trimmed.match(PATTERNS.definition);
      const idx = trimmed.search(PATTERNS.definition);
      const term = trimmed.slice(0, idx).trim();
      const meaning = trimmed.slice(idx + match[0].length).trim();
      // Ensure definition pattern isn't matching a long narrative
      if (term && term.split(/\s+/).length <= 6 && meaning) {
        return 'DEFINITION';
      }
    }

    // 8. Statistics check
    if (PATTERNS.statistic.test(trimmed)) {
      return 'STATISTIC';
    }

    // 9. Trailing colon section check
    if (trimmed.endsWith(':')) {
      const stripped = trimmed.slice(0, -1).trim();
      if (stripped.split(/\s+/).length <= 6) {
        return 'SECTION';
      }
    }

    // 10. Capitalized short line candidates for section
    if (trimmed.split(/\s+/).length <= 6 && !/[.!?]$/.test(trimmed) && /^[A-Z\u00C0-\u024F]/.test(trimmed)) {
      return 'SECTION';
    }

    return 'PARAGRAPH';
  }

  /**
   * Extracts term and meaning from a definition line.
   */
  function extractDefinition(line) {
    const trimmed = line.trim();
    const match = trimmed.match(PATTERNS.definition);
    if (!match) return null;
    const idx = trimmed.search(PATTERNS.definition);
    const term = trimmed.slice(0, idx).trim();
    const meaning = trimmed.slice(idx + match[0].length).trim().replace(/[.。]$/, '');
    if (!term || !meaning) return null;
    return { term, meaning };
  }

  /**
   * Analyze raw text and classify content blocks.
   *
   * @param {string} rawText
   * @returns {Object} Structured analysis output
   */
  function analyze(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return {
        title: 'Untitled',
        sections: [],
        definitions: [],
        lists: [],
        paragraphs: [],
        facts: [],
        hasTimeline: false,
        hasComparison: false,
        conclusionText: null,
      };
    }

    // Input Sanitizer is run via InputProcessor before this,
    // but we ensure clean line endings and basic trimming here.
    const lines = rawText.split(/\r?\n/);

    const result = {
      title: '',
      sections: [],
      definitions: [],
      lists: [],
      paragraphs: [],
      facts: [],
      hasTimeline: false,
      hasComparison: false,
      conclusionText: null,
    };

    // ── Classify each line ─────────────────────────────────────────
    const classified = lines.map((line, i) => {
      const type = classifyLine(line);
      return {
        index: i,
        raw: line,
        text: line.trim(),
        type: type
      };
    });

    // ── Detect Deck Title ──────────────────────────────────────────
    const titleBlock = classified.find(b => b.type === 'SECTION' || b.type === 'DEFINITION');
    if (titleBlock) {
      if (titleBlock.type === 'SECTION') {
        result.title = cleanSectionTitle(titleBlock.text);
      } else if (titleBlock.type === 'DEFINITION') {
        const def = extractDefinition(titleBlock.text);
        result.title = def ? cleanMarkdown(def.term) : cleanMarkdown(titleBlock.text);
      }
    } else {
      const firstNonEmpty = classified.find(b => b.type !== 'EMPTY');
      result.title = firstNonEmpty ? cleanMarkdown(firstNonEmpty.text) : 'Untitled';
    }

    // ── Build structure grouping blocks under sections ─────────────
    let currentSection = null;
    let activeList = null;

    function startSection(headingText) {
      flushActiveList();
      currentSection = {
        heading: cleanSectionTitle(headingText),
        content: [],
      };
      result.sections.push(currentSection);
    }

    function flushActiveList() {
      if (activeList) {
        if (currentSection) {
          currentSection.content.push(activeList);
        }
        result.lists.push({
          heading: currentSection ? currentSection.heading : 'Key Points',
          items: [...activeList.items]
        });
        activeList = null;
      }
    }

    for (let i = 0; i < classified.length; i++) {
      const block = classified[i];
      if (block.type === 'EMPTY') {
        flushActiveList();
        continue;
      }

      // If no section has started yet, start a default introductory section
      if (!currentSection && block.type !== 'SECTION') {
        startSection(result.title || 'Introduction');
      }

      switch (block.type) {
        case 'SECTION':
          startSection(block.text);
          break;

        case 'BULLET_LIST':
        case 'NUMBERED_LIST': {
          // Strip the list marker (e.g. "- " or "1. ") and clean markdown inside
          const cleanText = cleanMarkdown(
            block.text
              .replace(/^[-*•+▸▹◦‣⁃]\s*/, '')
              .replace(/^(\d+|[a-zA-Z]|[ivxlcdmIVXLCDM]+)[.)]\s*/, '')
              .replace(/^\[\d+\]\s*/, '')
          );
          if (cleanText) {
            if (!activeList) {
              activeList = {
                type: 'list',
                listType: block.type === 'BULLET_LIST' ? 'unordered' : 'ordered',
                items: [cleanText]
              };
            } else {
              activeList.items.push(cleanText);
            }
          }
          break;
        }

        case 'DEFINITION': {
          flushActiveList();
          const def = extractDefinition(block.text);
          if (def) {
            const cleanDef = {
              term: cleanMarkdown(def.term),
              meaning: cleanMarkdown(def.meaning)
            };
            result.definitions.push(cleanDef);
            currentSection.content.push({
              type: 'definition',
              term: cleanDef.term,
              meaning: cleanDef.meaning
            });
          } else {
            const cleanText = cleanMarkdown(block.text);
            currentSection.content.push({ type: 'paragraph', text: cleanText });
            result.paragraphs.push({ text: cleanText, sectionHeading: currentSection.heading });
          }
          break;
        }

        case 'TIMELINE': {
          flushActiveList();
          result.hasTimeline = true;
          const cleanText = cleanMarkdown(block.text);
          currentSection.content.push({
            type: 'timeline-entry',
            text: cleanText
          });
          break;
        }

        case 'CONCLUSION': {
          flushActiveList();
          const cleanText = cleanMarkdown(block.text.replace(PATTERNS.conclusion, ''));
          result.conclusionText = cleanText;
          currentSection.content.push({
            type: 'paragraph',
            text: cleanText
          });
          break;
        }

        case 'STATISTIC': {
          flushActiveList();
          const cleanText = cleanMarkdown(block.text);
          result.facts.push(cleanText);
          currentSection.content.push({
            type: 'paragraph',
            text: cleanText,
            isStatistic: true
          });
          break;
        }

        case 'QUOTE': {
          flushActiveList();
          const cleanText = cleanMarkdown(block.text.replace(/^>\s*/, ''));
          currentSection.content.push({
            type: 'paragraph',
            text: cleanText,
            isQuote: true
          });
          break;
        }

        case 'PARAGRAPH':
        default: {
          flushActiveList();
          const cleanText = cleanMarkdown(block.text);
          currentSection.content.push({
            type: 'paragraph',
            text: cleanText
          });
          result.paragraphs.push({
            text: cleanText,
            sectionHeading: currentSection.heading
          });
          break;
        }
      }
    }

    flushActiveList();

    // ── Audit Console Logs (Debug Mode) ────────────────────────────
    console.log("=== TextDeck Debug Mode ===");
    console.log("Detected Content Type: STRUCTURED");
    console.log("Detected Sections:", result.sections.map(s => s.heading));
    console.log("Detected Bullet Lists:", result.lists.map(l => `${l.heading} (${l.items.length} items)`));
    console.log("Detected Definitions:", result.definitions.map(d => `${d.term} = ${d.meaning}`));
    console.log("===========================");

    return result;
  }

  return { analyze };

})();
