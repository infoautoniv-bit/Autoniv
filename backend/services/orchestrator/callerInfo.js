const NAME_PATTERNS = [
  /(?:my name is|i'm|i am|this is|name's|name:)\s+([A-Za-z][A-Za-z\s]{1,30})/i,
];
const PHONE_PATTERNS = [
  /(?:my (?:phone |number |cell )?(?:number|is|:))\s*([\d\s\-+()]{7,20})/i,
  /(?:call me at|reach me at|number is)\s*([\d\s\-+()]{7,20})/i,
  /\b(\d{10,15})\b/,
];
const NAME_NOISE = /unknown|none|test|hello|hi|hey/i;

export function extractCallerInfo(text, callerInfo) {
  if (!text) return;

  if (!callerInfo.name) {
    for (const pat of NAME_PATTERNS) {
      const m = text.match(pat);
      if (m && m[1] && !NAME_NOISE.test(m[1].trim())) {
        callerInfo.name = m[1].trim();
        break;
      }
    }
  }

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
  }
}

export function injectCallerContext(conversationHistory, callerInfo) {
  if (!callerInfo.name && !callerInfo.phone) return;
  const sysIdx = conversationHistory.findIndex(m => m.role === 'system');
  if (sysIdx === -1) return;

  let ctx = '\n\nCALLER CONTEXT (already provided — do NOT ask again):';
  if (callerInfo.name) ctx += `\n- Name: ${callerInfo.name}`;
  if (callerInfo.phone) ctx += `\n- Phone: ${callerInfo.phone}`;
  ctx += '\nUse this information directly. Never re-ask for details already listed above.';

  const base = conversationHistory[sysIdx].content.replace(/\n\nCALLER CONTEXT \(already provided[^)]*\):[\s\S]*$/, '');
  conversationHistory[sysIdx] = { role: 'system', content: base + ctx };
}
