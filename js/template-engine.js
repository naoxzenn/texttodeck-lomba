/**
 * TextDeck — template-engine.js
 * Architecture: Parser → Output Generator → Renderer → Theme
 *
 * Exports (global):
 *   parseToBlocks(rawText)             — Neutral content blocks
 *   TEMPLATE_REGISTRY                  — Presentation template definitions
 *   generatePresentation(raw, tplId)   — Blocks → presentation slides
 *   generateFlashcards(raw)            — Blocks → flashcards
 */

// ── LAYER 1: NEUTRAL PARSER ──────────────────────────────────────
// Block types: "definition", "section" (bullets), "paragraph"
// Parser is fully independent — no HTML, no slide awareness.

const BULLET_RE = /^([-*•]|\d+\.|[a-z]\.)\s+/i;
const DEF_RE    = /\b(adalah|merupakan|ialah|yaitu)\b/i;

function parseToBlocks(rawText) {
  const lines  = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  const blocks = [];
  let pendingTitle = "";
  let bullets      = [];

  function flushBullets() {
    if (!bullets.length) return;
    blocks.push({
      type: "section",
      title: pendingTitle || "Key Points",
      bullets: [...bullets]
    });
    bullets      = [];
    pendingTitle = "";
  }

  function isLongParagraph(line) {
    return line.length > 60 && !DEF_RE.test(line) && !BULLET_RE.test(line);
  }

  lines.forEach(line => {
    if (DEF_RE.test(line)) {
      flushBullets();
      const m     = line.match(DEF_RE);
      const idx   = line.search(DEF_RE);
      const title = line.slice(0, idx).trim();
      const content = line.slice(idx + m[0].length).trim();
      if (title) {
        blocks.push({ type: "definition", title, content });
      } else {
        blocks.push({ type: "paragraph", title: line.slice(0, 50), content: line });
      }
      pendingTitle = "";
    } else if (BULLET_RE.test(line)) {
      const clean = line.replace(BULLET_RE, "").trim();
      if (clean) bullets.push(clean);
    } else if (isLongParagraph(line)) {
      flushBullets();
      const firstWords = line.split(/\s+/).slice(0, 5).join(" ");
      blocks.push({
        type: "paragraph",
        title: pendingTitle || (firstWords + "\u2026"),
        content: line
      });
      pendingTitle = "";
    } else {
      flushBullets();
      pendingTitle = line;
    }
  });

  flushBullets();

  if (!blocks.length && pendingTitle) {
    blocks.push({ type: "paragraph", title: pendingTitle, content: pendingTitle });
  }

  return blocks;
}


// ── LAYER 2: PRESENTATION TEMPLATES ──────────────────────────────
// Each template controls slide STRUCTURE and LAYOUT.
// Templates know nothing about visual themes (colors, fonts).

const corporateTemplate = {
  id: "corporate",
  label: "◼ Corporate",
  desc: "Professional structure with title, subtitle, bullet list",
  transform(block) {
    switch (block.type) {
      case "definition":
        return [{ type: "slide", layout: "title-body", title: block.title, body: block.content, bullets: [] }];
      case "section":
        return [{ type: "slide", layout: "title-bullets", title: block.title, body: "", bullets: block.bullets }];
      case "paragraph":
        return [{ type: "slide", layout: "title-body", title: block.title, body: block.content, bullets: [] }];
      default: return [];
    }
  }
};

const educationTemplate = {
  id: "education",
  label: "✎ Education",
  desc: "Clear learning format with concept + explanation",
  transform(block) {
    switch (block.type) {
      case "definition":
        return [{ type: "slide", layout: "concept", title: block.title, body: block.content, bullets: [] }];
      case "section":
        return [{ type: "slide", layout: "title-bullets", title: block.title, body: "", bullets: block.bullets }];
      case "paragraph":
        return [{ type: "slide", layout: "title-body", title: block.title, body: block.content, bullets: [] }];
      default: return [];
    }
  }
};

const startupTemplate = {
  id: "startup",
  label: "◈ Startup",
  desc: "Large headlines, short descriptions, key message",
  transform(block) {
    switch (block.type) {
      case "definition":
        return [{ type: "slide", layout: "hero", title: block.title, body: block.content, bullets: [] }];
      case "section":
        return [{ type: "slide", layout: "hero-bullets", title: block.title, body: "", bullets: block.bullets }];
      case "paragraph": {
        const short = block.content.split(/[.!?]/)[0].trim();
        return [{ type: "slide", layout: "hero", title: block.title, body: short, bullets: [] }];
      }
      default: return [];
    }
  }
};

const timelineTemplate = {
  id: "timeline",
  label: "⟡ Timeline",
  desc: "Chronological layout, step-by-step flow",
  transform(block) {
    switch (block.type) {
      case "definition":
        return [{ type: "slide", layout: "timeline-item", title: block.title, body: block.content, bullets: [] }];
      case "section":
        return [{ type: "slide", layout: "timeline-list", title: block.title, body: "", bullets: block.bullets }];
      case "paragraph":
        return [{ type: "slide", layout: "timeline-item", title: block.title, body: block.content, bullets: [] }];
      default: return [];
    }
  }
};

const comparisonTemplate = {
  id: "comparison",
  label: "⬡ Comparison",
  desc: "Two-column comparison layout",
  transform(block) {
    switch (block.type) {
      case "definition":
        return [{ type: "slide", layout: "split", title: block.title, body: block.content, bullets: [] }];
      case "section": {
        const mid = Math.ceil(block.bullets.length / 2);
        const left  = block.bullets.slice(0, mid);
        const right = block.bullets.slice(mid);
        return [{ type: "slide", layout: "two-column", title: block.title, body: "", bullets: left, bulletsRight: right }];
      }
      case "paragraph":
        return [{ type: "slide", layout: "split", title: block.title, body: block.content, bullets: [] }];
      default: return [];
    }
  }
};


// ── TEMPLATE REGISTRY ────────────────────────────────────────────

const TEMPLATE_REGISTRY = {
  corporate:  corporateTemplate,
  education:  educationTemplate,
  startup:    startupTemplate,
  timeline:   timelineTemplate,
  comparison: comparisonTemplate
};


// ── OUTPUT GENERATORS ────────────────────────────────────────────

/**
 * Generate a presentation deck from raw text using a given template.
 * @param {string} rawText
 * @param {string} templateId — key in TEMPLATE_REGISTRY
 * @returns {Array} slides — each { type:"slide", layout, title, body, bullets }
 */
function generatePresentation(rawText, templateId) {
  const blocks   = parseToBlocks(rawText);
  const template = TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY.corporate;
  return blocks.flatMap(block => template.transform(block));
}

/**
 * Generate flashcards from raw text.
 * Every parseable block becomes a card — definitions become front/back,
 * sections become title/bullets, paragraphs become title/content.
 * @param {string} rawText
 * @returns {Array} cards — each { type:"flashcard", front, back }
 */
function generateFlashcards(rawText) {
  const blocks = parseToBlocks(rawText);
  return blocks.map(block => {
    switch (block.type) {
      case "definition":
        return { type: "flashcard", front: block.title, back: block.content };
      case "section":
        return { type: "flashcard", front: block.title, back: block.bullets.join(" • ") };
      case "paragraph":
        return { type: "flashcard", front: block.title, back: block.content };
      default:
        return null;
    }
  }).filter(Boolean);
}
