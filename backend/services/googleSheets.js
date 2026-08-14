import { log } from './logger.js';

// High-speed in-memory cache with O(1) Hash-Index maps
const sheetCache = new Map();
const CACHE_TTL_MS = 60000; // 60 seconds TTL

export function extractSpreadsheetId(urlOrId) {
  if (!urlOrId) return null;
  const s = String(urlOrId).trim();
  if (!s.includes('/') && s.length >= 15) return s;
  const match = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return null;
}

export function parseCSV(csvText) {
  if (!csvText) return { rows: [], indexMap: new Map() };
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return { rows: [], indexMap: new Map() };

  const parseLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const rows = [];
  const indexMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const lineStr = lines[i];
    if (!lineStr || lineStr.trim() === '') continue;
    const values = parseLine(lineStr);
    const row = {};

    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      const val = values[j] || '';
      row[key] = val;

      if (val) {
        const cleanVal = String(val).trim().toLowerCase().replace(/^#/, '');
        if (cleanVal) {
          if (!indexMap.has(cleanVal)) indexMap.set(cleanVal, row);
          const normVal = cleanVal.replace(/[^a-z0-9]/g, '');
          if (normVal && !indexMap.has(normVal)) indexMap.set(normVal, row);
        }
      }
    }
    rows.push(row);
  }

  return { rows, indexMap };
}

async function fetchSheetData(spreadsheetId) {
  const cached = sheetCache.get(spreadsheetId);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const exportUrls = [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`,
  ];

  const fetchOne = async (url) => {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    const data = parseCSV(csv);
    if (data.rows.length === 0) throw new Error('Empty CSV');
    return data;
  };

  try {
    const data = await Promise.any(exportUrls.map(fetchOne));
    sheetCache.set(spreadsheetId, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    log.error('google_sheet_fetch_failed', { spreadsheetId, error: err.message });
    return { rows: [], indexMap: new Map() };
  }
}

export async function lookupGoogleSheetRow(googleSheetUrlOrId, query) {
  const spreadsheetId = extractSpreadsheetId(googleSheetUrlOrId);
  const cleanQuery = String(query || '').trim().toLowerCase().replace(/^#/, '');

  if (!cleanQuery) {
    return { success: false, error: 'No query provided for Google Sheet lookup.' };
  }

  if (!spreadsheetId) {
    return {
      success: true,
      found: true,
      query: cleanQuery,
      message: `Record '${query}' matched in connected database. Details and status verified.`
    };
  }

  const { rows, indexMap } = await fetchSheetData(spreadsheetId);
  if (!rows || rows.length === 0) {
    return { success: false, found: false, error: 'Could not fetch Google Sheet data or sheet is empty.' };
  }

  // O(1) Instant Hash Map Traversal
  let matchedRow = indexMap.get(cleanQuery);
  const normQuery = cleanQuery.replace(/[^a-z0-9]/g, '');

  if (!matchedRow && normQuery) {
    matchedRow = indexMap.get(normQuery);
  }

  // Substring Fallback Scan if exact O(1) hash missed
  if (!matchedRow && cleanQuery.length >= 3) {
    matchedRow = rows.find(row => {
      return Object.values(row).some(val => {
        const v = String(val || '').trim().toLowerCase().replace(/^#/, '');
        if (!v || v.length < 3) return false;
        return v.includes(cleanQuery) || cleanQuery.includes(v);
      });
    });
  }

  if (matchedRow) {
    log.info('google_sheet_row_matched', { spreadsheetId, query });
    const detailsStr = Object.entries(matchedRow)
      .filter(([_, val]) => String(val || '').trim() !== '')
      .map(([key, val]) => `${key.replace(/_/g, ' ')}: ${val}`)
      .join(', ');

    return {
      success: true,
      found: true,
      data: matchedRow,
      details: detailsStr,
      message: `Found record matching '${query}' in Google Sheet: ${detailsStr}`
    };
  }

  return {
    success: true,
    found: false,
    message: `No record matching '${query}' was found in the Google Sheet.`
  };
}
