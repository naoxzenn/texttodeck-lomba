/**
 * TextDeck — summarizer.js
 * ═══════════════════════════════════════════════════════
 * PHASE 6: Smart Summarization
 *
 * Long paragraphs must never appear directly on slides.
 *
 * Rules:
 *   Paragraph → Extract key ideas → Convert to concise slide content
 *   Target: 3–5 bullets per slide
 *   Maximum: 40–60 words per slide
 *
 * Exports: Summarizer.summarize(text, maxWords)
 *          Summarizer.toBullets(text, maxBullets)
 *          Summarizer.truncate(text, maxWords)
 * ═══════════════════════════════════════════════════════
 */

const Summarizer = (() => {

  const MAX_SLIDE_WORDS = 55;
  const MAX_BULLETS = 5;
  const MIN_BULLETS = 2;
  const MAX_BULLET_WORDS = 18;

  // ── Sentence splitter ───────────────────────────────────────────

  function splitSentences(text) {
    // Split on sentence-ending punctuation, keeping the punctuation
    return text
      .split(/(?<=[.!?;])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 2);
  }

  // ── Score a sentence by information density ─────────────────────

  function scoreSentence(sentence, index, total) {
    let score = 0;
    const words = sentence.split(/\s+/).length;

    // Prefer medium-length sentences
    if (words >= 5 && words <= 20) score += 3;
    else if (words >= 3) score += 1;

    // Boost first and last sentences (often key ideas)
    if (index === 0) score += 4;
    if (index === total - 1) score += 2;

    // Boost sentences with numbers/statistics/years/rankings
    if (/\d+/.test(sentence)) score += 4;

    // Boost sentences with strong keywords
    const keyMarkers = /\b(penting|paling|utama|penting|pernah|terbesar|terkenal|terbaik|pertama|akhir|puncak|important|key|major|significant|first|primary|main|crucial|essential|notable|famous|largest|biggest|best|worst|top|leading|critical|breakthrough|revolutionary)\b/i;
    if (keyMarkers.test(sentence)) score += 3;

    // Boost sentences with proper nouns (capitalized words like names of clubs/companies/products)
    const properNouns = sentence.match(/[A-Z\u00C0-\u024F][a-z\u00E0-\u00FF]+/g);
    if (properNouns && properNouns.length > 0) {
      score += 3;
    }

    // Penalize very short or very long
    if (words < 3) score -= 3;
    if (words > 30) score -= 1;

    return score;
  }

  // ── Compress a sentence into a concise bullet ───────────────────

  function compressToBullet(sentence) {
    let text = sentence.trim();

    // Remove filler words
    const fillers = /\b(yang|dan|serta|juga|di mana|dimana|bahwa|untuk|the|that|which|who|whom|and|also|therefore|thus|hence|moreover|furthermore|additionally|however|but|although|nevertheless|a|an|in order to)\b/gi;

    // Only compress if sentence is too long
    const words = text.split(/\s+/);
    if (words.length > MAX_BULLET_WORDS) {
      // Take key parts: Try to preserve the core meaning
      text = text.replace(fillers, ' ').replace(/\s{2,}/g, ' ').trim();

      // If still too long, take first MAX_BULLET_WORDS words
      const remaining = text.split(/\s+/);
      if (remaining.length > MAX_BULLET_WORDS) {
        text = remaining.slice(0, MAX_BULLET_WORDS).join(' ');
        // Remove trailing incomplete word fragments
        text = text.replace(/\s+\S{1,3}$/, '');
        if (!text.endsWith('.')) text += '…';
      }
    }

    // Clean up
    text = text.replace(/^[-–—•*]\s*/, '').trim();
    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);

    return text;
  }

  // ── PUBLIC: Summarize text to fit slide word budget ──────────────

  /**
   * Summarize a paragraph to fit within a word budget.
   * @param {string} text — The paragraph text
   * @param {number} [maxWords=55] — Maximum words for the output
   * @returns {string} — Summarized text
   */
  function summarize(text, maxWords = MAX_SLIDE_WORDS) {
    if (!text) return '';

    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;

    // Extract key sentences
    const sentences = splitSentences(text);
    if (sentences.length <= 1) {
      // Single sentence: truncate intelligently
      return truncate(text, maxWords);
    }

    // Score and rank sentences
    const scored = sentences.map((sent, i) => ({
      text: sent,
      score: scoreSentence(sent, i, sentences.length),
      originalIndex: i,
    }));

    // Sort by score (highest first), then take until word budget
    scored.sort((a, b) => b.score - a.score);

    let result = [];
    let wordCount = 0;

    for (const item of scored) {
      const sentWords = item.text.split(/\s+/).length;
      if (wordCount + sentWords <= maxWords) {
        result.push(item);
        wordCount += sentWords;
      }
    }

    // Re-sort by original order to maintain coherence
    result.sort((a, b) => a.originalIndex - b.originalIndex);

    return result.map(r => r.text).join(' ');
  }

  // ── PUBLIC: Convert text to bullet points ───────────────────────

  /**
   * Convert text into concise bullet points.
   * @param {string} text — Source text
   * @param {number} [maxBullets=5] — Maximum number of bullets
   * @returns {string[]} — Array of bullet strings
   */
  function toBullets(text, maxBullets = MAX_BULLETS) {
    if (!text) return [];

    const sentences = splitSentences(text);
    if (sentences.length === 0) return [text.trim()].filter(Boolean);

    // Score sentences
    const scored = sentences.map((sent, i) => ({
      text: sent,
      score: scoreSentence(sent, i, sentences.length),
      originalIndex: i,
    }));

    // Sort by score, take top N
    scored.sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, Math.max(MIN_BULLETS, Math.min(maxBullets, sentences.length)));

    // Re-sort by original position
    selected.sort((a, b) => a.originalIndex - b.originalIndex);

    // Compress each into a bullet
    return selected.map(s => compressToBullet(s.text));
  }

  // ── PUBLIC: Smart truncation ────────────────────────────────────

  /**
   * Truncate text to a word count, breaking at sentence boundaries when possible.
   * @param {string} text — Source text
   * @param {number} [maxWords=55] — Max words
   * @returns {string}
   */
  function truncate(text, maxWords = MAX_SLIDE_WORDS) {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;

    // Try to break at sentence boundary
    const sentences = splitSentences(text);
    let result = '';
    let count = 0;

    for (const sent of sentences) {
      const sentWords = sent.split(/\s+/).length;
      if (count + sentWords <= maxWords) {
        result += (result ? ' ' : '') + sent;
        count += sentWords;
      } else {
        break;
      }
    }

    if (!result) {
      // Fallback: hard truncate
      result = words.slice(0, maxWords).join(' ') + '…';
    }

    return result;
  }

  // ── PUBLIC API ──────────────────────────────────────────────────

  return {
    summarize,
    toBullets,
    truncate,
    MAX_SLIDE_WORDS,
    MAX_BULLETS,
  };

})();
