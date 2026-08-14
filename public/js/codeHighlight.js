// public/js/codeHighlight.js

const KEYWORDS =
	'function|export|import|from|const|let|var|return|if|else|for|while|break|continue|' +
	'new|yield|of|in|typeof|null|true|false|with|try|catch|abstract|boolean|do|final|' +
	'abstract|finally|enum|instanceof|switch';

const TOKEN_REGEX = new RegExp(
	`(\\/\\/.*$|\\/\\*[\\s\\S]*?\\*\\/)|` + 
	`(\`(?:\\\\.|[^\`\\\\])*\`|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')|` + 
	`\\b(${KEYWORDS})\\b|` + 
	`\\b(\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?n?)\\b|` +
	`\\b([A-Za-z_$][\\w$]*)(?=\\s*\\()`,
	'gm'
);

function escapeHtml(code) {
	return code
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

// highlights @ tags in js doc comments
function highlightJsDoc(comment) {
	comment = comment.replace(
		/@(\w+)(\s+)(\{)([^}]+)(\})(\s+)(\w+)?/g,
		(match, tag, space1, openBrace, type, closeBrace, space2, name) => {
			return (
				`<span class="tok-jsdoc-tag">@${tag}</span>` +
				space1 + 
				`<span class="tok-jsdoc-brace">${openBrace}</span>` +
				`<span class="tok-jsdoc-type">${type}</span>` +
				`<span class="tok-jsdoc-brace">${closeBrace}</span>` +
				space2 +
				// only highlight name if it is the parameter
				(tag === 'param' && name ? `<span class="tok-jsdoc-name">${name}</span>` : name || '')
			);
		}
	);

	// highlight @tags that dont have a {type} structure
	comment = comment.replace(
		/@(\w+)/g,
		(match) => `<span class="tok-jsdoc-tag">${match}</span>`
	);

	return comment;
}

/**
 * turns raw JS source text into HTML with basic syntax highlighting spans
 * @param {string} code - raw source, typically from someFunction.toString()
 * @returns {string} HTML string (safe to assign via innerHTML)
 */
export function highlightJs(code) {
	const escaped = escapeHtml(code);

	return escaped.replace(
		TOKEN_REGEX, 
		(match, comment, string, keyword, number, functionName) => {
			if (comment) return `<span class="tok-comment">${highlightJsDoc(comment)}</span>`;
			if (string) return `<span class="tok-string">${string}</span>`;
			if (keyword) return `<span class="tok-keyword">${match}</span>`;
			if (number) return `<span class="tok-number">${number}</span>`;
			if (functionName) return `<span class="tok-function">${functionName}</span>`;
			return match;
		}
	);
}
