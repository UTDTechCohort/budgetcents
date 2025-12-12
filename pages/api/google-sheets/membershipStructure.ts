import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

interface MembershipResponse {
  labels: string[];
  values: number[];
  total: number;
}

function getSheetClient() {
  // Parse the JSON stored in the environment variable
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    console.log('[sheets] Created Google Sheets client for:', serviceAccount.client_email);
  } catch (e) {
    console.log('[sheets] Created Google Sheets client');
  }
  return sheets;
}

function parseMembership(rows: string[][]): MembershipResponse {
  const labels: string[] = [];
  const values: number[] = [];

  let parsing = false;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const first = String(row[0] || '').trim();
    const second = String(row[1] || '').trim();

    if (!parsing && first.toLowerCase().includes('akpsi membership structure')) {
      parsing = true;
      console.log('[parse] Found AKPsi Membership Structure at row', i + 1);
      continue;
    }
    if (!parsing) continue;

    // stop if we hit a blank row or another section header
    if (!first) {
      console.log('[parse] Stopping parse at blank row', i + 1);
      break;
    }

    // Try to extract name and number robustly
    let name = first;
    let numStr = second || '';

    // If second cell is empty but first cell ends with a number, split it
    if (!numStr) {
      const match = first.match(/^(.*?)[\s\(\-]*\$?([0-9,]+)\)?$/);
      if (match) {
        name = match[1].trim();
        numStr = match[2];
      }
    }

    // final cleanup on name (remove trailing colons etc)
    name = name.replace(/[:\u2014\-]+$/g, '').trim();

    // parse the number
    const amount = parseInt((numStr || '').replace(/[^0-9]/g, ''), 10) || 0;
    if (amount > 0) {
      labels.push(name);
      values.push(amount);
      console.log(`[parse] Parsed membership: ${name} = ${amount}`);
    } else {
      console.log(`[parse] Skipped row (no numeric value): "${first}" -> "${second}"`);
    }
  }

  const total = values.reduce((s, v) => s + v, 0);
  return { labels, values, total };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MembershipResponse | { error: string }>) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID;
    if (!sheetId) return res.status(500).json({ error: 'Google Sheets ID not configured' });

    const sheets = getSheetClient();
    console.log('[api] Fetching spreadsheet (includeGridData: true) for membership structure');
    const response = await sheets.spreadsheets.get({ spreadsheetId: sheetId, includeGridData: true });
    if (!response?.data?.sheets || response.data.sheets.length === 0) {
      return res.status(500).json({ error: 'No sheets found' });
    }

    const sheet0 = response.data.sheets[0];
    const gridData = sheet0.data && sheet0.data[0] ? sheet0.data[0].rowData || [] : [];
    const rows: string[][] = gridData.map((row: any) => (row.values || []).map((cell: any) => {
      if (cell && typeof cell.formattedValue !== 'undefined') return String(cell.formattedValue);
      if (cell && cell.effectiveValue) {
        if (cell.effectiveValue.stringValue) return cell.effectiveValue.stringValue;
        if (cell.effectiveValue.numberValue !== undefined) return String(cell.effectiveValue.numberValue);
        if (cell.effectiveValue.boolValue !== undefined) return String(cell.effectiveValue.boolValue);
      }
      return '';
    }));

    console.log('[api] membership rows count:', rows.length);
    const parsed = parseMembership(rows);
    console.log('[api] membership parsed labels:', parsed.labels);
    res.status(200).json(parsed);
  } catch (err) {
    console.error('Error fetching membership structure:', err);
    res.status(500).json({ error: 'Failed to fetch membership structure' });
  }
}
