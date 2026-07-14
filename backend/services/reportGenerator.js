import PDFDocument from 'pdfkit';

// ─── Design System ────────────────────────────────────────────────────────────

const BRAND = {
  primary:    '#0077ff',
  primaryDk:  '#005ecc',
  secondary:  '#00c8b4',
  dark:       '#0a0f1c',
  text:       '#1e293b',
  muted:      '#64748b',
  light:      '#94a3b8',
  success:    '#10b981',
  successBg:  '#ecfdf5',
  warning:    '#f59e0b',
  warningBg:  '#fffbeb',
  danger:     '#ef4444',
  dangerBg:   '#fef2f2',
  infoBg:     '#eff6ff',
  bg:         '#f8fafc',
  bgAlt:      '#f1f5f9',
  border:     '#e2e8f0',
  white:      '#ffffff',
  headerGrad: '#003d99',   // darkened end of gradient sim
};

const BENCHMARKS = {
  answerRate:           85,
  avgDuration:         180,
  conversionRate:       12,
  missedCallThreshold:  0.15, // 15% missed is bad
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function pct(num, den, digits = 1) {
  return den > 0 ? ((num / den) * 100).toFixed(digits) + '%' : '0%';
}
function fmtDuration(seconds) {
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)}h`;
  if (seconds >= 60)   return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds)}s`;
}
function hex2rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Grade an actual value against a benchmark */
function grade(actual, benchmark) {
  const ratio = benchmark > 0 ? actual / benchmark : 0;
  if (ratio >= 1.2)  return { label: 'A+', color: BRAND.success };
  if (ratio >= 1.0)  return { label: 'A',  color: BRAND.success };
  if (ratio >= 0.85) return { label: 'B',  color: BRAND.primary };
  if (ratio >= 0.70) return { label: 'C',  color: BRAND.warning };
  return               { label: 'D',  color: BRAND.danger  };
}

/** Score 0–100 overall health */
function overallScore(answerRate, conversionRate, avgDuration) {
  const a = clamp(answerRate / BENCHMARKS.answerRate, 0, 1.2) / 1.2;
  const c = clamp(conversionRate / BENCHMARKS.conversionRate, 0, 1.2) / 1.2;
  const d = clamp(avgDuration / BENCHMARKS.avgDuration, 0, 1.2) / 1.2;
  return Math.round(((a + c + d) / 3) * 100);
}

// ─── Low-level drawing helpers ────────────────────────────────────────────────

/** Simulated gradient bar using multiple thin rectangles */
function drawGradientBar(doc, x, y, w, h, colorA, colorB) {
  const steps = 30;
  const [r1, g1, b1] = hex2rgb(colorA);
  const [r2, g2, b2] = hex2rgb(colorB);
  const sw = w / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    doc.rect(x + i * sw, y, sw + 1, h).fill(`rgb(${r},${g},${b})`);
  }
}

/** Thin horizontal rule */
function rule(doc, x, y, w, color = BRAND.border, thickness = 0.5) {
  doc.rect(x, y, w, thickness).fill(color);
}

/** Shadow-like effect: a slightly offset darker rounded rect */
function cardShadow(doc, x, y, w, h, radius = 8) {
  doc
    .roundedRect(x + 2, y + 3, w, h, radius)
    .fill('#00000010');
}

/** Rounded card with optional top-color accent */
function drawCard(doc, x, y, w, h, { accentColor, bgColor, radius = 8 } = {}) {
  cardShadow(doc, x, y, w, h, radius);
  doc.roundedRect(x, y, w, h, radius).fill(bgColor || BRAND.white);
  if (accentColor) {
    // top accent band
    doc.save();
    doc.roundedRect(x, y, w, 4, radius).fill(accentColor);
    // fill bottom corners of accent so it looks like top-only
    doc.rect(x, y + 2, w, 4).fill(accentColor);
    doc.restore();
  }
}

/** Progress bar with rounded ends; returns bar right-edge x */
function drawBar(doc, x, y, w, h, ratio, color = BRAND.primary, bgColor = BRAND.bgAlt) {
  ratio = clamp(ratio, 0, 1);
  doc.roundedRect(x, y, w, h, h / 2).fill(bgColor);
  if (ratio > 0) {
    const fillW = Math.max(w * ratio, h); // min fill = pill radius
    doc.roundedRect(x, y, fillW, h, h / 2).fill(color);
  }
  return x + w;
}

/** Donut-style score circle */
function drawScoreCircle(doc, cx, cy, r, score, color) {
  // Background ring
  doc.circle(cx, cy, r).lineWidth(8).strokeColor(BRAND.bgAlt).stroke();
  // Score arc (approximated with opacity overlay)
  doc.circle(cx, cy, r).lineWidth(8).strokeColor(color).stroke();
  // Inner white
  doc.circle(cx, cy, r - 12).fill(BRAND.white);
  // Score text
  doc.fontSize(18).fill(BRAND.text).font('Helvetica-Bold');
  const label = String(score);
  const tw = doc.widthOfString(label);
  doc.text(label, cx - tw / 2, cy - 13);
  doc.fontSize(7).fill(BRAND.muted).font('Helvetica');
  const sub = 'OUT OF 100';
  const sw = doc.widthOfString(sub);
  doc.text(sub, cx - sw / 2, cy + 4);
}

// ─── Structural components ────────────────────────────────────────────────────

function drawPageHeader(doc, { userName, month, year, pageTitle, pageWidth }) {
  // Dark background
  doc.rect(0, 0, pageWidth, 72).fill(BRAND.dark);
  // Right-side gradient accent
  drawGradientBar(doc, pageWidth - 200, 0, 200, 72, BRAND.headerGrad, BRAND.primary);
  // Thin secondary stripe at bottom of header
  doc.rect(0, 68, pageWidth, 4).fill(BRAND.secondary);

  // Brand
  doc.fontSize(20).fill(BRAND.white).font('Helvetica-Bold');
  doc.text('AUTONIV', 40, 22);
  doc.fontSize(7).fill(BRAND.secondary).font('Helvetica-Bold');
  doc.text('AI CALL INTELLIGENCE', 40, 46);

  // Page title (right-aligned)
  doc.fontSize(9).fill('rgba(255,255,255,0.6)').font('Helvetica');
  doc.text(pageTitle.toUpperCase(), 0, 20, { width: pageWidth - 40, align: 'right' });
  doc.fontSize(8).fill(BRAND.white).font('Helvetica-Bold');
  doc.text(`${month} ${year}`, 0, 35, { width: pageWidth - 40, align: 'right' });
  doc.fontSize(7).fill('rgba(255,255,255,0.5)').font('Helvetica');
  doc.text(userName, 0, 49, { width: pageWidth - 40, align: 'right' });
}

function drawPageFooter(doc, { pageNum, totalPages, pageWidth }) {
  const y = doc.page.height - 28;
  rule(doc, 0, y, pageWidth, BRAND.border);
  doc.fontSize(6.5).fill(BRAND.light).font('Helvetica');
  doc.text('Powered by Autoniv AI  •  Confidential & Proprietary', 40, y + 8);
  doc.text(`Page ${pageNum} of ${totalPages}`, 40, y + 8, {
    width: pageWidth - 80, align: 'right',
  });
}

function sectionHeading(doc, title, { x = 40, pageWidth } = {}) {
  const y = doc.y + 6;
  doc.fontSize(11).fill(BRAND.text).font('Helvetica-Bold');
  doc.text(title, x, y);
  const tw = doc.widthOfString(title);
  // Underline accent
  doc.rect(x, y + 14, tw, 2).fill(BRAND.primary);
  doc.rect(x + tw + 4, y + 14, (pageWidth - x * 2) - tw - 4, 1).fill(BRAND.border);
  doc.y = y + 22;
}

// ─── Page 1: Executive Summary ────────────────────────────────────────────────

function buildPage1(doc, data) {
  const { pageWidth, userName, monthName, year,
    totalCalls, completedCalls, missedCalls, failedCalls,
    totalMinutes, avgDuration, totalLeads, conversionRate, answerRate,
  } = data;

  const score = overallScore(answerRate, conversionRate, avgDuration);
  const scoreColor =
    score >= 80 ? BRAND.success :
    score >= 60 ? BRAND.primary :
    score >= 40 ? BRAND.warning : BRAND.danger;

  drawPageHeader(doc, {
    userName, month: monthName, year,
    pageTitle: 'Executive Summary', pageWidth,
  });

  // ── Hero banner below header ──────────────────────────────────────────────
  doc.rect(0, 72, pageWidth, 90).fill(BRAND.bg);
  rule(doc, 0, 162, pageWidth, BRAND.border);

  // Left: greeting
  doc.fontSize(16).fill(BRAND.text).font('Helvetica-Bold');
  doc.text(`Monthly Performance Report`, 40, 88);
  doc.fontSize(9).fill(BRAND.muted).font('Helvetica');
  doc.text(`A comprehensive review of your AI call operations for ${monthName} ${year}.`, 40, 110, {
    width: pageWidth - 200,
  });

  // Right: score circle
  drawScoreCircle(doc, pageWidth - 80, 117, 36, score, scoreColor);
  doc.fontSize(7).fill(BRAND.muted).font('Helvetica');
  const slabel = 'PERFORMANCE SCORE';
  const sw2 = doc.widthOfString(slabel);
  doc.text(slabel, pageWidth - 80 - sw2 / 2, 158);

  doc.y = 178;

  // ── 4-stat row ───────────────────────────────────────────────────────────
  const statW = (pageWidth - 80 - 15) / 4;
  const statY = doc.y;
  const stats = [
    { label: 'Total Calls',    value: totalCalls,   sub: 'this period',           color: BRAND.primary   },
    { label: 'Completed',      value: completedCalls, sub: pct(completedCalls, totalCalls) + ' answer rate', color: BRAND.success   },
    { label: 'Leads Captured', value: totalLeads,   sub: pct(totalLeads, totalCalls) + ' conversion',  color: BRAND.secondary },
    { label: 'Talk Time',      value: `${totalMinutes}m`, sub: `avg ${fmtDuration(avgDuration)}/call`,  color: BRAND.warning  },
  ];

  stats.forEach((s, i) => {
    const cx = 40 + i * (statW + 5);
    drawCard(doc, cx, statY, statW, 70, { accentColor: s.color });
    doc.fontSize(24).fill(s.color).font('Helvetica-Bold');
    doc.text(String(s.value), cx + 12, statY + 14, { width: statW - 24 });
    doc.fontSize(8).fill(BRAND.text).font('Helvetica-Bold');
    doc.text(s.label.toUpperCase(), cx + 12, statY + 42, { width: statW - 24 });
    doc.fontSize(7).fill(BRAND.muted).font('Helvetica');
    doc.text(s.sub, cx + 12, statY + 55, { width: statW - 24 });
  });

  doc.y = statY + 84;

  // ── KPI progress section ──────────────────────────────────────────────────
  sectionHeading(doc, 'Key Performance Indicators', { pageWidth });

  const kpis = [
    {
      label:     'Answer Rate',
      raw:       answerRate,
      value:     `${answerRate.toFixed(1)}%`,
      benchmark: BENCHMARKS.answerRate,
      max:       100,
    },
    {
      label:     'Avg Call Duration',
      raw:       avgDuration,
      value:     fmtDuration(avgDuration),
      benchmark: BENCHMARKS.avgDuration,
      max:       BENCHMARKS.avgDuration * 1.5,
    },
    {
      label:     'Lead Conversion Rate',
      raw:       conversionRate,
      value:     `${conversionRate.toFixed(1)}%`,
      benchmark: BENCHMARKS.conversionRate,
      max:       BENCHMARKS.conversionRate * 1.5,
    },
  ];

  const kpiRowH = 36;
  kpis.forEach((k, i) => {
    const ry = doc.y + i * (kpiRowH + 6);
    const g = grade(k.raw, k.benchmark);

    // Row bg (alternating)
    if (i % 2 === 0) doc.rect(40, ry, pageWidth - 80, kpiRowH).fill(BRAND.bg);

    // Grade badge
    doc.roundedRect(40, ry + 8, 28, 18, 4).fill(g.color);
    doc.fontSize(9).fill(BRAND.white).font('Helvetica-Bold');
    const gl = g.label;
    const gw = doc.widthOfString(gl);
    doc.text(gl, 40 + (28 - gw) / 2, ry + 12);

    // Label + value
    doc.fontSize(9).fill(BRAND.text).font('Helvetica-Bold');
    doc.text(k.label, 78, ry + 8, { width: 130 });
    doc.fontSize(11).fill(g.color).font('Helvetica-Bold');
    doc.text(k.value, 78, ry + 20, { width: 130 });

    // Progress bar
    const barX = 220, barW = pageWidth - 80 - 220 - 100;
    const ratio = clamp(k.raw / k.max, 0, 1);
    drawBar(doc, barX, ry + 14, barW, 8, ratio, g.color);
    // Benchmark tick
    const tickX = barX + barW * clamp(k.benchmark / k.max, 0, 1);
    doc.rect(tickX - 0.5, ry + 10, 1, 16).fill(BRAND.muted);
    doc.fontSize(6).fill(BRAND.muted).font('Helvetica');
    doc.text('target', tickX - 8, ry + 28, { width: 30 });

    // Industry figure
    doc.fontSize(8).fill(BRAND.muted).font('Helvetica');
    doc.text(`Industry avg: ${k.benchmark}${k.label.includes('Duration') ? 's' : '%'}`,
      pageWidth - 120, ry + 14, { width: 80, align: 'right' });
  });

  doc.y += kpis.length * (kpiRowH + 6) + 16;

  // ── Call outcome mini-breakdown ───────────────────────────────────────────
  sectionHeading(doc, 'Call Outcomes', { pageWidth });

  const outY = doc.y;
  const outcomes = [
    { label: 'Completed', n: completedCalls, color: BRAND.success },
    { label: 'Missed',    n: missedCalls,    color: BRAND.warning },
    { label: 'Failed',    n: failedCalls,    color: BRAND.danger  },
  ];
  const outW = (pageWidth - 80 - 10) / 3;

  outcomes.forEach((o, i) => {
    const ox = 40 + i * (outW + 5);
    drawCard(doc, ox, outY, outW, 50, {});
    drawBar(doc, ox + 8, outY + 38, outW - 16, 6,
      totalCalls > 0 ? o.n / totalCalls : 0, o.color);

    doc.fontSize(18).fill(BRAND.text).font('Helvetica-Bold');
    doc.text(String(o.n), ox + 12, outY + 8, { width: outW - 24 });
    doc.fontSize(7).fill(o.color).font('Helvetica-Bold');
    doc.text(o.label.toUpperCase(), ox + 12, outY + 28, { width: outW - 24 });
  });

  doc.y = outY + 64;
}

// ─── Page 2: Agent Breakdown ──────────────────────────────────────────────────

function buildPage2(doc, data) {
  const { pageWidth, userName, monthName, year,
    agentStats, totalCalls,
  } = data;

  drawPageHeader(doc, {
    userName, month: monthName, year,
    pageTitle: 'Agent Performance', pageWidth,
  });
  doc.y = 90;

  sectionHeading(doc, 'Agent Performance Breakdown', { pageWidth });

  if (agentStats.length === 0) {
    doc.rect(40, doc.y, pageWidth - 80, 50).fill(BRAND.bg);
    doc.fontSize(9).fill(BRAND.muted).font('Helvetica');
    doc.text('No agent data available for this reporting period.', 55, doc.y + 18);
    doc.y += 64;
  } else {
    // Column config
    const cols = [
      { label: 'Agent',        w: 140 },
      { label: 'Type',         w: 80  },
      { label: 'Calls',        w: 55  },
      { label: 'Leads',        w: 55  },
      { label: 'Avg Duration', w: 80  },
      { label: 'Conv. Rate',   w: 70  },
      { label: 'Share',        w: 60  },
    ];
    const totalW = pageWidth - 80;
    const scale = totalW / cols.reduce((s, c) => s + c.w, 0);
    const scaledCols = cols.map(c => ({ ...c, w: c.w * scale }));

    const headerY = doc.y;
    doc.rect(40, headerY, totalW, 22).fill(BRAND.dark);
    let cx = 40;
    scaledCols.forEach(col => {
      doc.fontSize(7.5).fill(BRAND.white).font('Helvetica-Bold');
      doc.text(col.label, cx + 6, headerY + 7, { width: col.w - 8 });
      cx += col.w;
    });

    let rowY = headerY + 22;

    agentStats.forEach((a, ri) => {
      if (rowY > doc.page.height - 100) {
        doc.addPage();
        rowY = 60;
      }
      const rowH = 26;
      const bg = ri % 2 === 0 ? BRAND.white : BRAND.bg;
      doc.rect(40, rowY, totalW, rowH).fill(bg);

      const convR = a.calls > 0 ? (a.leads / a.calls) * 100 : 0;
      const share = totalCalls > 0 ? (a.calls / totalCalls) * 100 : 0;

      const cells = [
        a.name,
        a.type || '—',
        String(a.calls),
        String(a.leads),
        fmtDuration(a.avgDuration),
        pct(a.leads, a.calls),
        `${share.toFixed(0)}%`,
      ];

      cx = 40;
      cells.forEach((cell, ci) => {
        const col = scaledCols[ci];
        // Highlight conversion rate column
        if (ci === 5) {
          const g = grade(convR, BENCHMARKS.conversionRate);
          doc.fontSize(8).fill(g.color).font('Helvetica-Bold');
        } else {
          doc.fontSize(8).fill(BRAND.text).font('Helvetica');
        }
        doc.text(cell, cx + 6, rowY + 9, { width: col.w - 10 });

        // Share column gets a mini bar
        if (ci === 6) {
          drawBar(doc, cx + 6, rowY + 18, col.w - 12, 4, share / 100, BRAND.primary);
        }
        cx += col.w;
      });

      // Row border
      rule(doc, 40, rowY + rowH, totalW, BRAND.border, 0.5);
      rowY += rowH;
    });

    doc.y = rowY + 14;
  }

  // ── Agent leaderboard cards (top 3) ───────────────────────────────────────
  if (agentStats.length > 0) {
    sectionHeading(doc, 'Top Performers', { pageWidth });

    const sorted = [...agentStats].sort((a, b) => {
      const cA = a.calls > 0 ? a.leads / a.calls : 0;
      const cB = b.calls > 0 ? b.leads / b.calls : 0;
      return cB - cA;
    }).slice(0, 3);

    const podY = doc.y;
    const podW = (pageWidth - 80 - 10) / 3;
    const medals = ['🥇', '🥈', '🥉'];
    const medalColors = [BRAND.warning, BRAND.light, BRAND.secondary];

    sorted.forEach((a, i) => {
      const px = 40 + i * (podW + 5);
      drawCard(doc, px, podY, podW, 75, { accentColor: medalColors[i] });
      doc.fontSize(18).fill(BRAND.text).font('Helvetica-Bold');
      doc.text(medals[i], px + 10, podY + 12);
      doc.fontSize(9).fill(BRAND.text).font('Helvetica-Bold');
      doc.text(a.name, px + 10, podY + 32, { width: podW - 20 });
      doc.fontSize(7.5).fill(BRAND.muted).font('Helvetica');
      doc.text(`${a.calls} calls  •  ${a.leads} leads  •  ${pct(a.leads, a.calls)} conv.`,
        px + 10, podY + 48, { width: podW - 20 });
    });

    doc.y = podY + 90;
  }
}

// ─── Page 3: Benchmarks & Recommendations ────────────────────────────────────

function buildPage3(doc, data) {
  const {
    pageWidth, userName, monthName, year,
    answerRate, avgDuration, conversionRate,
    completedCalls, missedCalls, failedCalls, totalCalls,
  } = data;

  drawPageHeader(doc, {
    userName, month: monthName, year,
    pageTitle: 'Insights & Recommendations', pageWidth,
  });
  doc.y = 90;

  // ── Benchmark comparison table ────────────────────────────────────────────
  sectionHeading(doc, 'Industry Benchmark Comparison', { pageWidth });

  const rows = [
    {
      metric: 'Answer Rate',
      yours: `${answerRate.toFixed(1)}%`,
      industry: `${BENCHMARKS.answerRate}%`,
      raw: answerRate,
      benchmark: BENCHMARKS.answerRate,
    },
    {
      metric: 'Avg Call Duration',
      yours: fmtDuration(avgDuration),
      industry: fmtDuration(BENCHMARKS.avgDuration),
      raw: avgDuration,
      benchmark: BENCHMARKS.avgDuration,
    },
    {
      metric: 'Lead Conversion Rate',
      yours: `${conversionRate.toFixed(1)}%`,
      industry: `${BENCHMARKS.conversionRate}%`,
      raw: conversionRate,
      benchmark: BENCHMARKS.conversionRate,
    },
  ];

  const bColW = (pageWidth - 80) / 5;

  // Header
  const bHeaderY = doc.y;
  doc.rect(40, bHeaderY, pageWidth - 80, 22).fill(BRAND.dark);
  ['Metric', 'Your Score', 'Industry Avg', 'Difference', 'Status'].forEach((h, i) => {
    doc.fontSize(7.5).fill(BRAND.white).font('Helvetica-Bold');
    doc.text(h, 40 + i * bColW + 6, bHeaderY + 7, { width: bColW - 8 });
  });

  let by = bHeaderY + 22;
  rows.forEach((r, ri) => {
    const g = grade(r.raw, r.benchmark);
    const diff = r.raw - r.benchmark;
    const diffStr = (diff >= 0 ? '+' : '') + (
      r.metric.includes('Duration') ? fmtDuration(Math.abs(diff)) : `${Math.abs(diff).toFixed(1)}%`
    );

    const bg = ri % 2 === 0 ? BRAND.white : BRAND.bg;
    doc.rect(40, by, pageWidth - 80, 24).fill(bg);

    const cells = [r.metric, r.yours, r.industry, diffStr];
    cells.forEach((c, ci) => {
      doc.fontSize(8.5).fill(BRAND.text).font(ci === 0 ? 'Helvetica-Bold' : 'Helvetica');
      doc.text(c, 40 + ci * bColW + 6, by + 8, { width: bColW - 10 });
    });

    // Status badge
    const above = r.raw >= r.benchmark;
    const badgeBg = above ? BRAND.successBg : BRAND.dangerBg;
    const badgeFg = above ? BRAND.success  : BRAND.danger;
    const badgeLabel = above ? '▲ Above Target' : '▼ Below Target';
    doc.roundedRect(40 + 4 * bColW + 4, by + 5, bColW - 10, 14, 3).fill(badgeBg);
    doc.fontSize(7).fill(badgeFg).font('Helvetica-Bold');
    doc.text(badgeLabel, 40 + 4 * bColW + 6, by + 9, { width: bColW - 14 });

    rule(doc, 40, by + 24, pageWidth - 80, BRAND.border);
    by += 24;
  });

  doc.y = by + 20;

  // ── Recommendations ───────────────────────────────────────────────────────
  sectionHeading(doc, 'Actionable Recommendations', { pageWidth });

  const recs = [];

  if (answerRate < BENCHMARKS.answerRate) {
    recs.push({
      type: 'warning',
      icon: '📞',
      title: 'Improve Answer Rate',
      body: `Your answer rate of ${answerRate.toFixed(1)}% is below the industry average of ${BENCHMARKS.answerRate}%. Consider enabling call forwarding, expanding business hours, or adding overflow agents.`,
    });
  }
  if (avgDuration < BENCHMARKS.avgDuration * 0.8) {
    recs.push({
      type: 'warning',
      icon: '⏱️',
      title: 'Review Call Engagement',
      body: `Calls averaging ${fmtDuration(avgDuration)} may indicate early hang-ups or insufficient agent scripting. Revisit conversation flows to improve engagement and time-to-resolution.`,
    });
  }
  if (conversionRate < BENCHMARKS.conversionRate) {
    recs.push({
      type: 'danger',
      icon: '🎯',
      title: 'Boost Lead Conversion',
      body: `A ${conversionRate.toFixed(1)}% conversion rate leaves room for improvement. Refine lead capture scripts, tighten follow-up timing, and A/B test agent prompts for better results.`,
    });
  }
  if (totalCalls > 0 && missedCalls / totalCalls > BENCHMARKS.missedCallThreshold) {
    recs.push({
      type: 'danger',
      icon: '⚠️',
      title: 'Reduce Missed Calls',
      body: `${missedCalls} missed calls (${pct(missedCalls, totalCalls)}) is above threshold. Consider scheduling a callback agent or adding a voicemail-to-lead workflow.`,
    });
  }

  if (recs.length === 0) {
    recs.push({
      type: 'success',
      icon: '🏆',
      title: 'Outstanding Performance',
      body: 'All key metrics are at or above industry averages. Consider unlocking advanced analytics to identify further optimization opportunities.',
    });
    recs.push({
      type: 'info',
      icon: '💡',
      title: "Scale What's Working",
      body: 'High-performing agents and call windows can be identified in your dashboard. Replicate their patterns across the team to compound your results.',
    });
  }

  const recColors = {
    success: { border: BRAND.success, bg: BRAND.successBg, fg: BRAND.success },
    warning: { border: BRAND.warning, bg: BRAND.warningBg, fg: BRAND.warning },
    danger:  { border: BRAND.danger,  bg: BRAND.dangerBg,  fg: BRAND.danger  },
    info:    { border: BRAND.primary, bg: BRAND.infoBg,    fg: BRAND.primary },
  };

  recs.forEach(rec => {
    if (doc.y > doc.page.height - 120) doc.addPage();
    const rc = recColors[rec.type];
    const ry = doc.y;
    const recH = 56;
    drawCard(doc, 40, ry, pageWidth - 80, recH, { bgColor: rc.bg, radius: 6 });
    doc.rect(40, ry, 4, recH).fill(rc.border);

    doc.fontSize(10).fill(BRAND.text).font('Helvetica-Bold');
    doc.text(`${rec.icon}  ${rec.title}`, 52, ry + 10, { width: pageWidth - 110 });
    doc.fontSize(8.5).fill(BRAND.text).font('Helvetica');
    doc.text(rec.body, 52, ry + 26, { width: pageWidth - 110, lineGap: 2 });
    doc.y = ry + recH + 8;
  });

  // ── Summary callout ───────────────────────────────────────────────────────
  if (doc.y < doc.page.height - 100) {
    doc.y += 10;
    const score = overallScore(answerRate, conversionRate, avgDuration);
    const scoreColor =
      score >= 80 ? BRAND.success :
      score >= 60 ? BRAND.primary :
      score >= 40 ? BRAND.warning : BRAND.danger;

    const sumY = doc.y;
    drawCard(doc, 40, sumY, pageWidth - 80, 50, { accentColor: scoreColor });
    doc.fontSize(9).fill(BRAND.muted).font('Helvetica');
    doc.text('OVERALL PERFORMANCE SCORE', 52, sumY + 12);
    doc.fontSize(22).fill(scoreColor).font('Helvetica-Bold');
    doc.text(`${score}/100`, 52, sumY + 24);
    doc.fontSize(8).fill(BRAND.muted).font('Helvetica');
    doc.text(
      score >= 80 ? 'Excellent — keep it up!' :
      score >= 60 ? 'Good — a few areas to improve.' :
      score >= 40 ? 'Fair — focus on the recommendations above.' :
                    'Needs attention — act on recommendations promptly.',
      200, sumY + 32, { width: pageWidth - 260 },
    );
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateMonthlyReport(userId, month, year, {
  // Allow passing mock data directly (no DB needed when mocked)
  mockData = null,
  dbLookup = null,
} = {}) {
  let user, agents, calls, leads;

  if (mockData) {
    ({ user, agents, calls, leads } = mockData);
  } else if (dbLookup) {
    ({ user, agents, calls, leads } = await dbLookup(userId, month, year));
  } else {
    throw new Error('Provide either mockData or a dbLookup function.');
  }

  if (!user) throw new Error('User not found');

  // ── Compute metrics ───────────────────────────────────────────────────────
  const totalCalls     = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const missedCalls    = calls.filter(c => c.status === 'missed').length;
  const failedCalls    = calls.filter(c => c.status === 'failed').length;

  const totalDuration = calls.reduce((sum, c) => {
    if (typeof c.duration === 'number' && c.duration > 0) return sum + c.duration;
    if (c.endedAt && c.startedAt)
      return sum + Math.max(0, (new Date(c.endedAt) - new Date(c.startedAt)) / 1000);
    return sum;
  }, 0);

  const avgDuration    = totalCalls > 0 ? totalDuration / totalCalls : 0;
  const answerRate     = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
  const totalLeads     = leads.length;
  const conversionRate = totalCalls > 0 ? (totalLeads / totalCalls) * 100 : 0;
  const totalMinutes   = Math.round(totalDuration / 60);

  // Agent stats
  const agentStats = agents.map(agent => {
    const id = agent._id?.toString?.() ?? agent.id;
    const agentCalls = calls.filter(c => (c.agentId?.toString?.() ?? c.agentId) === id);
    const agentLeads = leads.filter(l => (l.agentId?.toString?.() ?? l.agentId) === id);
    return {
      name: agent.name,
      type: agent.type || 'Standard',
      calls: agentCalls.length,
      leads: agentLeads.length,
      avgDuration: agentCalls.length > 0
        ? agentCalls.reduce((s, c) => s + (c.duration || 0), 0) / agentCalls.length
        : 0,
    };
  });

  const monthName = MONTH_NAMES[month - 1];

  // ── Shared data bundle ────────────────────────────────────────────────────
  const sharedData = {
    pageWidth: 595,   // A4 points
    userName: user.name || user.email || 'Customer',
    monthName, year,
    totalCalls, completedCalls, missedCalls, failedCalls,
    totalMinutes, avgDuration, totalLeads, conversionRate, answerRate,
    agentStats,
  };

  // ── Build PDF ─────────────────────────────────────────────────────────────
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    bufferPages: true,
    info: {
      Title:   `Autoniv Performance Report — ${monthName} ${year}`,
      Author:  'Autoniv AI',
      Subject: 'Monthly Performance Report',
    },
  });

  buildPage1(doc, sharedData);
  doc.addPage();
  buildPage2(doc, sharedData);
  doc.addPage();
  buildPage3(doc, sharedData);

  // Stamp footers
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    drawPageFooter(doc, { pageNum: i + 1, totalPages: pageCount, pageWidth: sharedData.pageWidth });
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}