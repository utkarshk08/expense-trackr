const TRANSACTIONS_RANGE = 'Transactions!A2:H';
const SPREADSHEET_ID_PROPERTY = 'SPREADSHEET_ID';

/** Serves the read-only expense dashboard. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('expense-trackr')
    .setTitle('Expense Analytics & Slicer')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .addMetaTag('apple-mobile-web-app-capable', 'yes');
}

/** Reads the existing Transactions tab through the Sheets API using read-only access. */
function getDashboardData() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(SPREADSHEET_ID_PROPERTY);
  if (!spreadsheetId) {
    throw new Error('Set the SPREADSHEET_ID script property before using the dashboard.');
  }
  const response = Sheets.Spreadsheets.Values.get(
    spreadsheetId,
    TRANSACTIONS_RANGE,
    { valueRenderOption: 'UNFORMATTED_VALUE' }
  );
  const rows = response.values || [];
  const expenses = [];
  rows.forEach(row => {
    if (row[0] === '' || row[0] == null || row[4] === '' || row[4] == null) return;
    const dateSerial = Number(row[0]);
    const amount = Number(row[4]);
    const category = String(row[3] || '').trim();
    if (!Number.isFinite(dateSerial) || !category || !Number.isFinite(amount)) return;
    const day = new Date(Date.UTC(1899, 11, 30) + Math.floor(dateSerial) * 86400000);
    expenses.push({
      isoDate: Utilities.formatDate(day, 'UTC', 'yyyy-MM-dd'),
      displayDate: Utilities.formatDate(day, 'UTC', 'MM/dd/yyyy'),
      time: formatSheetTime(row[2]),
      category,
      amount,
      payment: String(row[5] || 'Not specified').trim(),
      remarks: String(row[6] || '').trim(),
      device: String(row[7] || 'Not specified').trim()
    });
  });
  return { expenses };
}

function formatSheetTime(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value || '');
  const seconds = Math.round((value % 1) * 86400);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map(part => String(part).padStart(2, '0')).join(':');
}
