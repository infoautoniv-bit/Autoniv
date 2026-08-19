/**
 * Template Engine for Voice Orchestrator Prompts and Messages
 * Supports {{variable}}, {{nested.path}}, and {{variable | "fallback default"}}
 */

function getNestedValue(obj, path) {
  if (!obj || typeof obj !== 'object' || !path) return undefined;
  const keys = path.trim().split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Interpolates variables within a string template.
 * @param {string} template - Text with placeholders like {{customer_name}} or {{user.company | "Our Clinic"}}
 * @param {object} context - Key-value map of available variables
 * @returns {string} Interpolated text
 */
export function renderTemplate(template, context = {}) {
  if (!template || typeof template !== 'string') return '';
  if (!context || typeof context !== 'object') return template;

  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
    const parts = expression.split('|').map((s) => s.trim());
    const varPath = parts[0];
    let fallback = parts[1] || '';

    // Strip quotes from fallback literal if provided: 'default' or "default"
    if ((fallback.startsWith('"') && fallback.endsWith('"')) || (fallback.startsWith("'") && fallback.endsWith("'"))) {
      fallback = fallback.slice(1, -1);
    }

    const val = getNestedValue(context, varPath);
    if (val !== undefined && val !== null && val !== '') {
      return String(val);
    }
    return fallback;
  });
}

/**
 * Extracts list of variable names required/used in a template.
 * @param {string} template
 * @returns {string[]}
 */
export function extractTemplateVariables(template) {
  if (!template || typeof template !== 'string') return [];
  const matches = [];
  const regex = /\{\{\s*([^|}]+)(?:\|[^}]+)?\s*\}\}/g;
  let m;
  while ((m = regex.exec(template)) !== null) {
    if (m[1]) matches.push(m[1].trim());
  }
  return [...new Set(matches)];
}
