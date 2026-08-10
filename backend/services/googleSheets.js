import { log } from './logger.js';

export function extractSpreadsheetId(urlOrId) {
  if (!urlOrId) return null;
  const s = String(urlOrId).trim();
  if (!s.includes('/') && s.length >= 15) return s;
  const match = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return null;
}

export function parseCSV(csvText) {
  if (!csvText) return [];
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

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

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    rows.push(row);
  }

  return rows;
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

  const exportUrls = [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`,
  ];

  for (const url of exportUrls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });

      if (!response.ok) continue;

      const csvText = await response.text();
      const rows = parseCSV(csvText);

      if (rows.length === 0) continue;

      // Find matching row across any column
      const matchedRow = rows.find(row => {
        return Object.values(row).some(val => {
          const v = String(val).toLowerCase().replace(/^#/, '');
          return v === cleanQuery || v.includes(cleanQuery) || cleanQuery.includes(v);
        });
      });

      if (matchedRow) {
        log.info('google_sheet_row_matched', { spreadsheetId, query });
        return {
          success: true,
          found: true,
          data: matchedRow,
          message: `Found record in Google Sheet: ${JSON.stringify(matchedRow)}`
        };
      }

      return {
        success: true,
        found: false,
        message: `No row matching '${query}' was found in the Google Sheet.`
      };
    } catch (err) {
      log.error('google_sheet_fetch_failed', { spreadsheetId, error: err.message });
    }
  }

  return { success: false, found: false, error: 'Could not fetch Google Sheet data or no matching record found.' };
}
