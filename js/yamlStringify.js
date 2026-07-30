/**
 * Serializes a config object back into the YAML subset understood by
 * traitwise/js/yamlParser.js. Mirrors that parser's structural rules
 * exactly (2-space indent, "- key: value" list items with continuation
 * lines), so anything produced here round-trips through it.
 *
 * Every string scalar is quoted, which sidesteps the parser's ambiguity
 * around unquoted ':' and '#' entirely — the trade-off is documented in
 * quoteScalar() below: a value containing both quote characters can't be
 * represented losslessly by this minimal subset.
 */

function pad(n) {
  return ' '.repeat(n);
}

function isEmptyValue(value) {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function quoteScalar(value) {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const s = String(value);
  if (!s.includes('"')) return `"${s}"`;
  if (!s.includes("'")) return `'${s}'`;
  return `"${s.replace(/"/g, "'")}"`;
}

/** True if a string value contains both quote characters — quoteScalar() can't represent it losslessly. */
export function hasUnsafeQuoteMix(value) {
  if (typeof value !== 'string') return false;
  return value.includes('"') && value.includes("'");
}

function serializeMapEntries(obj, indentLevel) {
  const lines = [];
  for (const [key, val] of Object.entries(obj)) {
    if (isEmptyValue(val)) continue;
    if (Array.isArray(val)) {
      lines.push(`${pad(indentLevel)}${key}:`);
      lines.push(...serializeArray(val, indentLevel + 2));
    } else if (typeof val === 'object') {
      lines.push(`${pad(indentLevel)}${key}:`);
      lines.push(...serializeMapEntries(val, indentLevel + 2));
    } else {
      lines.push(`${pad(indentLevel)}${key}: ${quoteScalar(val)}`);
    }
  }
  return lines;
}

function serializeArray(arr, dashIndent) {
  const lines = [];
  for (const item of arr) {
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      const entries = Object.entries(item).filter(([, v]) => !isEmptyValue(v));
      if (entries.length === 0) {
        lines.push(`${pad(dashIndent)}-`);
        continue;
      }
      const [firstKey, firstVal] = entries[0];
      const contentIndent = dashIndent + 2;
      if (Array.isArray(firstVal) || (firstVal !== null && typeof firstVal === 'object')) {
        lines.push(`${pad(dashIndent)}-`);
        lines.push(...serializeMapEntries(Object.fromEntries(entries), contentIndent));
      } else {
        lines.push(`${pad(dashIndent)}- ${firstKey}: ${quoteScalar(firstVal)}`);
        lines.push(...serializeMapEntries(Object.fromEntries(entries.slice(1)), contentIndent));
      }
    } else {
      lines.push(`${pad(dashIndent)}- ${quoteScalar(item)}`);
    }
  }
  return lines;
}

export function stringifyConfig(config) {
  return serializeMapEntries(config, 0).join('\n') + '\n';
}
