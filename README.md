# Expense Trackr

A read-only Google Apps Script web dashboard for an existing Google Sheets expense tracker. The spreadsheet dashboard and iPhone expense-entry Shortcut are separate, pre-existing parts of the workflow. This project provides a mobile-friendly browser view; it does not add, update, or delete transactions.

## Features

- Responsive dashboard designed for desktop and iPhone Safari.
- Date-range filtering across the dashboard.
- Spending summaries, category donut/rank view, and daily timeline.
- Payment-method and device summaries.
- Searchable transaction ledger with category and payment filters.
- Read-only Google Sheets integration. Continue using the existing Shortcut to add expenses.

## Files

- `Code.gs` — Apps Script web entry point and read-only Sheets data function.
- `expense-trackr.html` — responsive dashboard UI and client-side filtering/rendering.
- `appsscript.json` — Apps Script V8 runtime, Sheets Advanced Service, and read-only scope.

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
