/**
 * Minimal YAML parser (controlled subset) for TraitWise.
 *
 * Supported:
 *  - nested mappings (key: value)
 *  - nested lists (- item), including lists of mappings
 *  - quoted strings ("..." or '...') — required if the value contains ':'
 *  - booleans (true/false), null (null/~), integers and floats
 *  - full-line comments starting with '#'
 *
 * NOT supported (by design, to keep the parser small and predictable):
 *  - flow style ([a, b], {a: b})
 *  - multiline block scalars (| or >)
 *  - anchors/aliases, tags, multi-document files
 *  - tabs for indentation (use spaces only, 2 spaces per level)
 *
 * See editing-config.md for the authoring rules non-technical editors must follow.
 */

function stripComment(line) {
  // Only strips a comment if '#' starts a token outside of quotes.
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble) {
      // Treat as comment only if preceded by start-of-line or whitespace.
      if (i === 0 || /\s/.test(line[i - 1])) {
        return line.slice(0, i);
      }
    }
  }
  return line;
}

function tokenize(text) {
  const rawLines = text.split(/\r?\n/);
  const lines = [];
  for (const rawLine of rawLines) {
    if (rawLine.includes('\t')) {
      throw new Error('yamlParser: tab characters are not supported, use spaces only.');
    }
    const withoutComment = stripComment(rawLine);
    const trimmed = withoutComment.trim();
    if (trimmed === '') continue;
    const indent = withoutComment.length - withoutComment.trimStart().length;
    lines.push({ indent, text: trimmed });
  }
  return lines;
}

function isFullyQuoted(text) {
  if (text.length < 2) return false;
  const q = text[0];
  if (q !== '"' && q !== "'") return false;
  return text[text.length - 1] === q;
}

function isMapEntry(text) {
  if (isFullyQuoted(text)) return false;
  return /^[^:#]+:(\s|$)/.test(text);
}

function parseScalar(raw) {
  const s = raw.trim();
  if (isFullyQuoted(s)) return s.slice(1, -1);
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~' || s === '') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  return s;
}

export function parseYAML(text) {
  const lines = tokenize(text);
  let pos = 0;

  function parseBlock(indent) {
    if (pos >= lines.length || lines[pos].indent < indent) {
      return null;
    }
    if (lines[pos].text === '-' || lines[pos].text.startsWith('- ')) {
      return parseList(indent);
    }
    return parseMap(indent);
  }

  function parseList(indent) {
    const arr = [];
    while (
      pos < lines.length &&
      lines[pos].indent === indent &&
      (lines[pos].text === '-' || lines[pos].text.startsWith('- '))
    ) {
      const dashIndent = indent;
      const rest = lines[pos].text.slice(1).trimStart();
      const contentIndent = dashIndent + 2;

      if (rest === '') {
        pos++;
        arr.push(parseBlock(contentIndent));
      } else if (isMapEntry(rest)) {
        lines[pos] = { indent: contentIndent, text: rest };
        arr.push(parseMap(contentIndent));
      } else {
        pos++;
        arr.push(parseScalar(rest));
      }
    }
    return arr;
  }

  function parseMap(indent) {
    const obj = {};
    while (pos < lines.length && lines[pos].indent === indent && isMapEntry(lines[pos].text)) {
      const line = lines[pos].text;
      const colonIdx = line.indexOf(':');
      const key = line.slice(0, colonIdx).trim();
      const valueStr = line.slice(colonIdx + 1).trim();
      pos++;

      if (valueStr === '') {
        if (pos < lines.length && lines[pos].indent > indent) {
          obj[key] = parseBlock(lines[pos].indent);
        } else {
          obj[key] = null;
        }
      } else {
        obj[key] = parseScalar(valueStr);
      }
    }
    return obj;
  }

  if (lines.length === 0) return {};
  pos = 0;
  return parseBlock(lines[0].indent) || {};
}
