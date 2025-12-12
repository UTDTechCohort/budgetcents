import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

interface BudgetData {
  dueSummary: {
    brotherDues: number;
    pledgeDues: number;
    nationalFeesBrothers: number;
    nationalFeesPledges: number;
    difference: number;
    previousBudget: number;
    availableFunds: number;
    remainder: number;
  };
  expenses: {
    [key: string]: number;
  };
  expenseLabels: string[];
  expenseValues: number[];
  totalExpenses: number;
  expensesWithoutNationals: number;
}

// Parse the service account and create auth client
function getSheetClient() {
  // Parse the JSON stored in the environment variable
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  // debug: confirm service account email used (do not log private_key)
  try {
    console.log('[sheets] Created Google Sheets client for:', serviceAccount.client_email);
  } catch (e) {
    console.log('[sheets] Created Google Sheets client (client_email not available)');
  }
  return sheets;
}

// Parse the spreadsheet data into structured format
function parseSheetData(rows: any[][]): BudgetData {
  const expenses: { [key: string]: number } = {};
  const expenseLabels: string[] = [];
  const expenseValues: number[] = [];

  // Find the "Expense Breakdown" section and parse expenses
  let parsingExpenses = false;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // Support rows that may have empty cells; amount may be in column B (index 1)
    const firstCell = String(row[0] || '').trim();
    const secondCell = String(row[1] || '').trim();

    if (!parsingExpenses && firstCell.toLowerCase().includes('expense breakdown')) {
      parsingExpenses = true;
      console.log('[parse] Found Expense Breakdown at row', i + 1);
      continue;
    }

    if (!parsingExpenses) continue;

    // Stop when encountering Grand Total (case-insensitive)
    if (firstCell.toLowerCase() === 'grand total' || firstCell.toLowerCase().includes('grand total')) {
      console.log('[parse] Reached Grand Total at row', i + 1);
      break;
    }

    if (firstCell && secondCell) {
      const expenseName = firstCell;
      const expenseAmount = parseFloat(secondCell.replace(/[$,]/g, '')) || 0;
      if (expenseAmount > 0) {
        expenses[expenseName] = expenseAmount;
        expenseLabels.push(expenseName);
        expenseValues.push(expenseAmount);
        console.log(`[parse] Parsed expense: ${expenseName} = ${expenseAmount}`);
      } else {
        // log non-numeric or zero amounts for debugging
        console.log(`[parse] Skipped row (nonpositive amount): "${firstCell}" -> "${secondCell}"`);
      }
    }
  }

  // Calculate totals
  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
  const expensesWithoutNationals = totalExpenses - (expenses['Nationals'] || 0);
  console.log('[parse] Finished parsing expenses. count=', expenseLabels.length, 'totalExpenses=', totalExpenses);

  // Only return expense breakdown (per user request). Provide a minimal dueSummary
  // where availableFunds equals totalExpenses so frontend percentages remain safe.
  const budgetData: BudgetData = {
    dueSummary: {
      brotherDues: 0,
      pledgeDues: 0,
      nationalFeesBrothers: 0,
      nationalFeesPledges: 0,
      difference: 0,
      previousBudget: 0,
      availableFunds: Math.round(totalExpenses),
      remainder: 0,
    },
    expenses,
    expenseLabels,
    expenseValues,
    totalExpenses: Math.round(totalExpenses),
    expensesWithoutNationals: Math.round(expensesWithoutNationals),
  };

  return budgetData;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BudgetData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID;
    if (!sheetId) {
      return res.status(500).json({ error: 'Google Sheets ID not configured in environment' });
    }

    const sheets = getSheetClient();

    // --- replace current sheets.spreadsheets.values.get call with this ---
    console.log('[api] Fetching entire spreadsheet (includeGridData: true) for first sheet');
    let response;
    try {
    response = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        includeGridData: true,
    });
    } catch (err) {
    console.error('[api] sheets.spreadsheets.get failed:', err);
    }

    if (!response?.data?.sheets || response.data.sheets.length === 0) {
    console.log('[api] No sheets found in spreadsheet');
    return res.status(500).json({ error: 'No sheets in spreadsheet' });
    }

    // take the 0th sheet
    const sheet0 = response.data.sheets[0];
    console.log('[api] Using sheet:', sheet0.properties?.title);

    // grid data is nested under data[0].rowData
    const gridData = sheet0.data && sheet0.data[0] ? sheet0.data[0].rowData || [] : [];
    // convert rowData to rows: string[][]
    const rows: string[][] = gridData.map((row: any) => {
    const values = (row.values || []).map((cell: any) => {
        // prefer formattedValue; fall back to effectiveValue / userEnteredValue if needed
        if (cell && typeof cell.formattedValue !== 'undefined') return String(cell.formattedValue);
        if (cell && cell.effectiveValue) {
        // numeric / string / formula handling
        if (cell.effectiveValue.stringValue) return cell.effectiveValue.stringValue;
        if (cell.effectiveValue.numberValue !== undefined) return String(cell.effectiveValue.numberValue);
        if (cell.effectiveValue.boolValue !== undefined) return String(cell.effectiveValue.boolValue);
        }
        return '';
    });
    return values;
    });

    console.log('[api] Fetched rows count (from sheet0):', rows.length);
    if (rows.length > 0) {
    console.log('[api] Sample row 0..5:', rows.slice(0, 6));
    }
    console.log('[api] Fetched rows count:', rows.length);
    if (rows.length > 0) console.log('[api] Sample rows (first 20):', JSON.stringify(rows.slice(0, 20)));

    const budgetData = parseSheetData(rows);
    console.log('[api] Parsed expenseLabels:', budgetData.expenseLabels);
    console.log('[api] Parsed expenseValues:', budgetData.expenseValues);

    res.status(200).json(budgetData);
  } catch (error) {
    console.error('Error fetching budget data from Google Sheets:', error);
    res.status(500).json({ error: 'Failed to fetch budget data from Google Sheets' });
  }
}
