/**
 * Lightweight bidirectional Markdown <-> HTML converter for Leeflet WYSIWYG note editing
 * Preserves paragraph breaks, styled inline links, headers, bold, italics, checklists, and code blocks
 */

/**
 * Auto-detect and linkify bare URLs (https://, http://, www., and common domains like google.com, leeflet.dev)
 * in an HTML string without disrupting existing anchor tags or attributes.
 */
export function autoLinkHtml(html: string): string {
  if (!html) return '';

  // Merge split/appended link tags like <a ...>text.co</a>m into text.com before autolinking
  html = html.replace(/<a\b[^>]*>([^<]+)<\/a>([a-zA-Z0-9/._-]+)/gi, '$1$2');

  return html.replace(
    /(<a\b[^>]*>[\s\S]*?<\/a>|<code\b[^>]*>[\s\S]*?<\/code>|<pre\b[^>]*>[\s\S]*?<\/pre>)|((https?:\/\/|www\.)[^\s<)]+|(?:^|(?<=[\s(>]))([a-zA-Z0-9-]+\.(?:com|org|net|io|dev|app|ai|co|me|xyz|tech|info|edu|gov|ca|uk|de|jp|fr|au|us|site|online|space|store)(?:\/[^\s<)]*)?))/gi,
    (match, alreadyTagged, url, _protocol, domainUrl) => {
      if (alreadyTagged) return alreadyTagged;
      const targetUrl = (url || domainUrl || match).trim();
      if (!targetUrl) return match;

      let href = targetUrl;
      if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
        href = 'https://' + href;
      }
      return `<a href="${href}" style="color: #60a5fa; text-decoration: underline;">${targetUrl}</a>`;
    }
  );
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  // If already rich HTML, ensure links are formatted and return
  if (/<\s*(p|div|b|strong|i|em|h[1-6]|ul|ol|li|span|code|pre|a|blockquote)\b/i.test(markdown)) {
    return autoLinkHtml(markdown);
  }

  const lines = markdown.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Escape raw HTML entities
    line = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Inline formatting: Bold, Italic, Code, Links
    line = line
      .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
      .replace(/___(.+?)___/g, '<b><i>$1</i></b>')
      .replace(/__(.+?)__/g, '<b>$1</b>')
      .replace(/_(.+?)_/g, '<i>$1</i>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #60a5fa; text-decoration: underline;">$1</a>');

    // Headers
    if (/^### (.*$)/.test(line)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<h3 style="font-size: 1.05rem; font-weight: 700; margin: 6px 0 3px;">${line.replace(/^### /, '')}</h3>`);
      continue;
    }
    if (/^## (.*$)/.test(line)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<h2 style="font-size: 1.15rem; font-weight: 700; margin: 8px 0 4px;">${line.replace(/^## /, '')}</h2>`);
      continue;
    }
    if (/^# (.*$)/.test(line)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<h1 style="font-size: 1.25rem; font-weight: 700; margin: 10px 0 6px;">${line.replace(/^# /, '')}</h1>`);
      continue;
    }

    // Unordered List (- or *)
    if (/^(\*|-)\s+(.*$)/.test(line)) {
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (!inUl) { result.push('<ul style="list-style-type: disc; padding-left: 18px; margin: 4px 0;">'); inUl = true; }
      result.push(`<li>${line.replace(/^(\*|-)\s+/, '')}</li>`);
      continue;
    }

    // Ordered List (1. )
    if (/^\d+\.\s+(.*$)/.test(line)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (!inOl) { result.push('<ol style="list-style-type: decimal; padding-left: 18px; margin: 4px 0;">'); inOl = true; }
      result.push(`<li>${line.replace(/^\d+\.\s+/, '')}</li>`);
      continue;
    }

    // Close any open lists
    if (inUl) { result.push('</ul>'); inUl = false; }
    if (inOl) { result.push('</ol>'); inOl = false; }

    if (line.trim() === '') {
      result.push('<div><br></div>');
    } else {
      result.push(`<div>${line}</div>`);
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return autoLinkHtml(result.join(''));
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  const div = document.createElement('div');
  div.innerHTML = html;

  function traverse(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const childrenText = Array.from(el.childNodes).map(traverse).join('');

      switch (tag) {
        case 'h1': return `# ${childrenText.trim()}\n\n`;
        case 'h2': return `## ${childrenText.trim()}\n\n`;
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6': return `### ${childrenText.trim()}\n\n`;
        case 'b':
        case 'strong': return `**${childrenText}**`;
        case 'i':
        case 'em': return `*${childrenText}*`;
        case 'code': return `\`${childrenText}\``;
        case 'pre': return `\`\`\`\n${childrenText}\n\`\`\`\n\n`;
        case 'a': {
          const href = el.getAttribute('href') || '';
          if (childrenText.trim() === href || href === `https://${childrenText.trim()}` || href === `http://${childrenText.trim()}`) {
            return childrenText;
          }
          return `[${childrenText}](${href})`;
        }
        case 'li': return `- ${childrenText}\n`;
        case 'ul':
        case 'ol': return `${childrenText}\n`;
        case 'p':
        case 'div':
          if (!childrenText.trim() && el.querySelector('br')) return '\n';
          return childrenText ? `${childrenText}\n` : '';
        case 'br': return '\n';
        default: return childrenText;
      }
    }

    return '';
  }

  const res = traverse(div);
  return res.replace(/\n{3,}/g, '\n\n').trim();
}
