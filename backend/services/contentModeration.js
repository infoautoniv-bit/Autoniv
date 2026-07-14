const ABUSIVE_PATTERNS = [
  /\b(f[u*]ck[u*-]*[e3]*[r]*|sh[i1!]*t|b[i!]*tch|[a@4]ss|d[i1!]*ck|c[o0]*ck|p[u*]ssy|sl[u*]t|wh[o0]*r[e3]|b[a@4][s5][t+][a@4][r*][d+])\b/i,
  /\b(n[i1!]+[gq][gq]*[e3]*r+|f[a@4][gq]+[o0]*t+|k[i1!]+k[e3]|sp[i1!][ck]+|ch[i1!]+nk|g[o0]+[o0]*k)\b/i,
  /\b(r[a@4]+p[e3]+|m[o0]+l[e3]+[s5][t+]+|p[e3]+d[o0]+|ch[i1!]+ld\s*p[o0]+rn?)\b/i,
  /\b(n[i1!]+gg[a@4]|c[o0]+[o0]+n|m[o0]+th[e3]+rf[u*]+[ck]+[e3]*r+|d[i1!]+ld[o0]+|v[a@4]g[i1!]+n[a@4])\b/i,
  /\b(h[e3]+nt[a@4!]+i|t[r7]+[a@4]+nn[y*]+|s[h4]+[i1!]+[t+]*)\b/i,
  /\b(k[i1!]+ll\s*(y[a@4]+|[a@4]+ll\s*y[a@4]+|u|th[e3]+m|y[o0]+u|every[a@4]?[o0]+n[e3]?)|d[i1!]+[e3]+\s*(y[a@4]+|[a@4]+ll|u|th[e3]+m))\b/i,
  /\b(t[e3]+r[r7]+[o0]+r[i1!]+[s5]+[t+]+|b[o0]+mb\s*(th[e3]+|y[a@4]+|[a@4]+ll|u|this|the\s*place))\b/i,
  /\b(n[a@4]+z[i1!]+|h[i1!]+tl[e3]+r|w[h4]+[i1!]+t[e3]\s*s[u*]+pr[e3]+m[a@4]+c[y*]+|k[u*]+kl[u*]+x)\b/i,
  /\b(f[a@4]+gg+[o0]+t|tr[a@4]+nn[y*]\s*b[i1!]+tch|s[h4]+[i1!]+t[e3]*)\b/i,
  /\b(d[a@4]+mn|h[e3]+ll|cr[a@4]+p|s[u*]+ck[s]*)\b/i,
];

export function containsAbuse(text) {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const lower = normalized.toLowerCase();
  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(lower)) return true;
  }
  return false;
}

export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  for (const pattern of ABUSIVE_PATTERNS) {
    result = result.replace(pattern, (match) => {
      if (match.length <= 2) return match;
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  }
  return result;
}

export function validateContent(fields) {
  const errors = [];
  const sanitized = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string' && value.trim()) {
      if (containsAbuse(value)) {
        errors.push(`${key} contains inappropriate language`);
      }
      sanitized[key] = sanitizeText(value);
    } else {
      sanitized[key] = value;
    }
  }
  return { errors, sanitized };
}

export function contentFilter(...fieldNames) {
  return (req, res, next) => {
    if (!req.body) return next();
    const fields = {};
    for (const name of fieldNames) {
      if (req.body[name] !== undefined) {
        fields[name] = req.body[name];
      }
    }
    if (Object.keys(fields).length === 0) return next();
    const { errors, sanitized } = validateContent(fields);
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Content policy violation',
        details: errors,
      });
    }
    for (const [key, value] of Object.entries(sanitized)) {
      req.body[key] = value;
    }
    next();
  };
}
