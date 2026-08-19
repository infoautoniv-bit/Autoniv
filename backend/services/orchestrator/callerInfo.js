const NAME_PATTERNS = [
  /(?:my name is|i'm|i am|this is|name's|name:)\s+([A-Za-z][A-Za-z\s]{1,30})/i,
];

const PHONE_PATTERNS = [
  /(?:my (?:phone |number |cell |mobile )?(?:number|is|:))\s*([\d\s\-+()]{7,20})/i,
  /(?:call me at|reach me at|number is)\s*([\d\s\-+()]{7,20})/i,
  /\b(\+?\d{10,15})\b/,
];

const EMAIL_PATTERNS = [
  /(?:my email is|email is|reach me at|send to|email:)\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i,
];

const SPOKEN_EMAIL_PATTERN = /\b([a-zA-Z0-9._%+-]+)\s+at\s+([a-zA-Z0-9.-]+)\s+dot\s+([a-zA-Z]{2,})\b/i;

const NAME_NOISE = /unknown|none|test|hello|hi|hey/i;

export function extractCallerInfo(text, callerInfo = {}) {
  if (!text || typeof text !== 'string') return callerInfo;

  // 1. Extract Name
  if (!callerInfo.name) {
    for (const pat of NAME_PATTERNS) {
      const m = text.match(pat);
      if (m && m[1] && !NAME_NOISE.test(m[1].trim())) {
        callerInfo.name = m[1].trim();
        break;
      }
    }
  }

  // 2. Extract Phone Number
  if (!callerInfo.phone) {
    for (const pat of PHONE_PATTERNS) {
      const m = text.match(pat);
      if (m && m[1]) {
        const digits = m[1].replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          callerInfo.phone = m[1].trim();
          break;
        }
      }
    }

    // Check for spoken word numbers ("nine eight seven six five four three two one zero")
    if (!callerInfo.phone) {
      const WORD_MAP = { zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9' };
      const words = text.toLowerCase().split(/\s+/);
      let digitSeq = '';
      for (const w of words) {
        if (WORD_MAP[w]) {
          digitSeq += WORD_MAP[w];
        } else if (/^\d+$/.test(w)) {
          digitSeq += w;
        } else if (digitSeq.length >= 7) {
          break;
        } else {
          digitSeq = '';
        }
      }
      if (digitSeq.length >= 7 && digitSeq.length <= 15) {
        callerInfo.phone = digitSeq;
      }
    }
  }

  // 3. Extract Email Address
  if (!callerInfo.email) {
    for (const pat of EMAIL_PATTERNS) {
      const m = text.match(pat);
      if (m && m[1]) {
        callerInfo.email = m[1].trim().toLowerCase();
        break;
      }
    }

    // Check for spoken email format ("john at gmail dot com")
    if (!callerInfo.email) {
      const spokenMatch = text.match(SPOKEN_EMAIL_PATTERN);
      if (spokenMatch) {
        callerInfo.email = `${spokenMatch[1]}@${spokenMatch[2]}.${spokenMatch[3]}`.toLowerCase();
      }
    }
  }

  return callerInfo;
}

export function injectCallerContext(conversationHistory, callerInfo = {}) {
  if (!callerInfo.name && !callerInfo.phone && !callerInfo.email) return;
  const sysIdx = conversationHistory.findIndex(m => m.role === 'system');
  if (sysIdx === -1) return;

  let ctx = '\n\n### CRITICAL CALLER MEMORY (ALREADY PROVIDED - NEVER ASK AGAIN):';
  if (callerInfo.name) ctx += `\n- Caller Full Name: ${callerInfo.name}`;
  if (callerInfo.phone) ctx += `\n- Caller Phone Number: ${callerInfo.phone}`;
  if (callerInfo.email) ctx += `\n- Caller Email Address: ${callerInfo.email}`;
  ctx += '\nDO NOT ask the caller for any of the above details again. Use them directly when booking or saving leads.';

  const base = conversationHistory[sysIdx].content.replace(/\n\n### CRITICAL CALLER MEMORY \(ALREADY PROVIDED[\s\S]*$/, '');
  conversationHistory[sysIdx] = { role: 'system', content: base + ctx };
}
