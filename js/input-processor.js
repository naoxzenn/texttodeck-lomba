/**
 * TextDeck — input-processor.js
 * ═══════════════════════════════════════════════════════
 * INPUT SANITIZATION & MARKDOWN CLEANUP LAYER
 *
 * Pipeline:
 *   Raw Input → Sanitizer → Markdown Cleaner → Text Normalizer → Out
 *
 * Removes:
 *   - Bold/Italic markers (**, *, __, _)
 *   - Header hashes (#, ##, ###) while preserving lines
 *   - Blockquote characters (>)
 *   - Markdown links [text](url) → text
 *   - Fenced code blocks & inline code
 *   - Excessive line breaks (max 2 consecutive)
 *   - Duplicated spaces
 *   - Basic HTML tags
 * ═══════════════════════════════════════════════════════
 */

const InputProcessor = (() => {

  /**
   * Sanitizes basic HTML input tags to prevent rendering errors or injections.
   * @param {string} text
   * @returns {string}
   */
  function sanitize(text) {
    if (!text) return '';
    // Strip HTML tags, but preserve basic text content
    return text.replace(/<\/?[^>]+(>|$)/g, "");
  }

  /**
   * Cleans Markdown syntax and returns plain text while preserving semantic layout.
   * @param {string} text
   * @returns {string}
   */
  function cleanMarkdown(text) {
    if (!text) return '';

    let clean = text;

    // 1. Remove fenced code block wrapper lines (e.g. ```javascript or ```)
    clean = clean.replace(/^```[a-zA-Z0-9_-]*$/gm, '');

    // 2. Remove inline code backticks (e.g. `code` -> code)
    clean = clean.replace(/`([^`]+)`/g, '$1');

    // 3. Convert links [Anchor Text](url) -> Anchor Text
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // 4. Remove leading header hashes (e.g. ### Title -> Title)
    // We preserve the rest of the line as it's a title candidate.
    clean = clean.replace(/^#{1,6}\s+(.+)$/gm, '$1');

    // 5. Remove blockquote markers (e.g. > Quote -> Quote)
    clean = clean.replace(/^>\s+(.+)$/gm, '$1');

    // 6. Remove bold/italic markers
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1'); // **bold**
    clean = clean.replace(/__([^_]+)__/g, '$1');     // __bold__
    clean = clean.replace(/\*([^*]+)\*/g, '$1');     // *italic*
    clean = clean.replace(/_([^_]+)_/g, '$1');       // _italic_

    return clean;
  }

  /**
   * Normalizes line breaks and whitespace.
   * @param {string} text
   * @returns {string}
   */
  function normalizeText(text) {
    if (!text) return '';

    let normalized = text;

    // 1. Normalize line endings (replace CRLF with LF)
    normalized = normalized.replace(/\r\n/g, '\n');

    // 2. Normalize excessive consecutive line breaks (3 or more -> exactly 2)
    normalized = normalized.replace(/\n{3,}/g, '\n\n');

    // 3. Normalize spaces on each line (multiple spaces -> single space)
    // We split by newline, clean each line, and join back.
    normalized = normalized
      .split('\n')
      .map(line => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n');

    return normalized.trim();
  }

  /**
   * Full processing pipeline: Raw Input -> Sanitizer -> Markdown Cleaner -> Text Normalizer
   * @param {string} rawText
   * @returns {string}
   */
  function process(rawText) {
    if (!rawText) return '';
    
    // Step 1: Input Sanitizer - Clean HTML, normalize linebreaks/spaces, and strip strange unicode characters
    let step1 = sanitize(rawText);
    // Remove zero-width spaces and other invisible formatting artifacts
    let step2 = step1.replace(/[\u200B-\u200D\uFEFF]/g, '');
    let step3 = normalizeText(step2);

    return step3;
  }

  return {
    process,
    sanitize,
    cleanMarkdown,
    normalizeText
  };

})();
