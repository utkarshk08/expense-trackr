# Expense Trackr

A read-only Google Apps Script web dashboard for an existing Google Sheets expense tracker. The spreadsheet dashboard and iPhone expense-entry Shortcut are separate, pre-existing parts of the workflow. This project provides a mobile-friendly browser view; it does not add, update, or delete transactions.

## Features

- Responsive dashboard designed for desktop and iPhone Safari.
- Larger touch targets, readable summary cards, and compact transaction cards on iPhone; the desktop ledger remains a table.
- Date-range filtering with Today, Last 7 days, This month (through today), All time, custom dates, and a one-tap filter reset.
- Average daily expense: filtered spending divided by all calendar days in the selected date range, including both endpoints and days with ₹0 spending. For example, ₹900 across 3 days is ₹300/day even when all expenses occurred on one day.
- Spending summaries, category donut/rank view, and daily timeline.
- Tap a timeline bar to inspect that day's expenses, then tap an expense for its full details.
- Payment-method and device summaries.
- Searchable transaction ledger with category and payment filters.
- Refresh data without reloading the page; the last-update indicator shows freshness, and refresh preserves filters and the chart view.
- Short press/fade/panel animations that respect the device's Reduce Motion setting.
- Read-only Google Sheets integration. Continue using the existing Shortcut to add expenses.

## Performance and interaction

The frontend uses plain HTML, CSS, and JavaScript with no external scripts, fonts, or UI libraries. One Apps Script read loads the data initially, and each manual refresh performs one more read. Date filters, category switching, day/expense details, and showing additional ledger entries all use the already-loaded data. There is no automatic polling or persistent browser storage of expense data.

Only the current screen layout is rendered for the ledger. Entries appear in batches of 30; **Show more expenses** reveals the next batch without another server call. All summaries and filters still include every matching expense, including entries not yet shown in the ledger. If a refresh fails, the last successfully loaded data stays visible with a retry message.

The donut renderer and its colours are retained from the live dashboard. Both Donut and Rank List remain available. The app stays in light mode.

## Files

- `Code.gs` — Apps Script web entry point and read-only Sheets data function.
- `expense-trackr.html` — responsive dashboard UI and client-side filtering/rendering.
- `appsscript.json` — Apps Script V8 runtime, Sheets Advanced Service, and read-only scope.
- `tests/dashboard.cjs` — dependency-free checks for date arithmetic, filters, refresh failures, details, reduced motion, and ledger batching.
- `SHARING-GUIDE.md` — step-by-step setup for another person's private tracker or a shared view, including iPhone Home Screen installation.

For sharing instructions, see [the small sharing guide](SHARING-GUIDE.md).

## Run checks

With Node.js installed, run `node tests/dashboard.cjs`. To check timezone-sensitive cases, also run `TZ=UTC node tests/dashboard.cjs` and `TZ=America/New_York node tests/dashboard.cjs`.

These checks exercise the actual inline script with a small mock DOM and a mocked Apps Script bridge. They verify behaviour and request counts, not Safari layout or real network load time. Use Safari's Responsive Design Mode for visual and touch-layout checks before deploying.

## Configure in Google Apps Script

1. Create or open the Apps Script project associated with your spreadsheet.
2. Add `Code.gs` and an HTML file named `expense-trackr`; copy the matching source from this repository.
3. In **Services**, add the Google Sheets API Advanced Service (v4), or keep the service enabled through the manifest.
4. In **Project Settings → Script Properties**, add `SPREADSHEET_ID` with the ID of your own spreadsheet. The ID is intentionally not stored in this repository.
5. Confirm your `Transactions` tab has the columns expected by `Code.gs` in `Transactions!A2:H` (date, month, time, category, amount, payment mode, remarks, device). Adjust the range/mapping if your sheet layout differs.
6. Save and deploy as a web app with access settings appropriate for your account. Open the deployed URL in Safari; on iPhone use **Share → Add to Home Screen**.

The manifest requests `spreadsheets.readonly`. The server code uses the Sheets API `Values.get` operation and includes no write endpoint. Keep the spreadsheet's own sharing permissions restricted to the intended viewers.

## Source control

This repository intentionally contains no spreadsheet ID, deployment URL, expense rows, OAuth token, or clasp project credentials. `.clasp.json` and `.clasprc.json` are ignored. Store the spreadsheet ID in Apps Script Script Properties; do not commit personal transaction data or credentials.
