// src/js/codeHighlight.js

const KEYWORDS =
  'function|export|import|from|const|let|var|return|if|else|for|while|break|continue|new|yield|of|in|typeof|null|true|false';

const TOKEN_REGEX = new RegExp(
  `(\\/\\/.*$)|(\`(?:\\\\.|[^\`\\\\])*\`|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')|\\b(${KEYWORDS})\\*?\\b`,
  'gm'
);

function escapeHtml(code) {
  return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * turns raw JS source text into HTML with basic syntax highlighting spans
 * @param {string} code - raw source, typically from someFunction.toString()
 * @returns {string} HTML string (safe to assign via innerHTML)
 */
export function highlightJs(code) {
  const escaped = escapeHtml(code);

  return escaped.replace(TOKEN_REGEX, (match, comment, string, keyword) => {
    if (comment) return `<span class="tok-comment">${comment}</span>`;
    if (string) return `<span class="tok-string">${string}</span>`;
    if (keyword) return `<span class="tok-keyword">${match}</span>`;
    return match;
  });
}
