# Expense Trackr — small sharing guide

Updated: 15 November 2026

**Choose what you want to share.** For a friend to track **their own expenses**, follow A. To let someone see **your expenses**, follow B. Your current personal deployment is set to **Only myself**, so forwarding its link alone will not give another Google account access.

## A. Give someone their own private tracker — recommended

Do the one-time setup on a computer, signed in to **their Google account**.

1. **Send the dashboard source.** Send `expense-trackr-share-kit.zip`, or give them access to the GitHub repository. They need `Code.gs`, `expense-trackr.html`, and `appsscript.json`. A private repository does not need to be made public; sending the prepared ZIP is enough. The packaged code contains no personal expense rows or spreadsheet ID.

2. **Prepare their spreadsheet.** Use their existing compatible tracker, or a clean copy of the tracker template. If making a template from your file, first create a separate copy and remove your personal transactions from that copy before sharing it. The dashboard expects a tab named `Transactions`, with headers in row 1 and this column order:

   | Column | A | B | C | D | E | F | G | H |
   | --- | --- | --- | --- | --- | --- | --- | --- | --- |
   | Content | Date | Month | Time | Category | Amount | Payment mode | Remarks | Device |

   Dates/times must be real Sheets date/time values; amounts must be numeric. Column B is retained for compatibility but is not used by this dashboard.

3. **Create a separate Apps Script project.** Open [Google Apps Script](https://script.google.com/home) → **New project**. Name it `Expense Trackr Dashboard`. Keep the original expense-entry script separate.

4. **Copy the three files.** Replace the default `Code.gs` with the packaged file. Click **+ → HTML**, name it `expense-trackr`, and paste the HTML. In **Project Settings**, enable **Show “appsscript.json” manifest file in editor**; replace that manifest with the packaged JSON. Save.

5. **Connect their sheet.** Copy the ID between `/d/` and `/edit` in their spreadsheet URL. Under **Project Settings → Script Properties**, add `SPREADSHEET_ID` with that ID as its value, then save. [Google’s property-setting instructions](https://developers.google.com/apps-script/guides/properties)

6. **Check the Sheets service.** The supplied manifest enables Google Sheets API v4 with identifier `Sheets`. If it is missing from **Services**, add **Google Sheets API** there. Default Cloud projects enable the corresponding API automatically; a separately configured standard Cloud project needs that API enabled manually. [Google’s advanced-service guide](https://developers.google.com/apps-script/guides/services/advanced)

7. **Deploy privately.** Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Only myself**. Deploy and complete Google’s authorization flow for their account. Copy the web app URL ending in `/exec`. The `/dev` link is for development, not installation. [Google’s web-app guide](https://developers.google.com/apps-script/guides/web)

8. **Verify it.** Open that `/exec` URL while signed in to their account. Confirm that the totals match their sheet. Try a date shortcut and **Refresh data**. An empty sheet will show no expenses until they add some.

9. **Install on their iPhone.** Follow the phone steps below using **their new URL**.

The dashboard is a viewer. The original spreadsheet dashboard and expense-entry Shortcut are separate components and are not included in this repository. If the friend also wants Shortcut/Back Tap entry, set up that original Shortcut and its writer endpoint for **their sheet**. The read-only dashboard URL cannot replace the Shortcut’s expense-writing URL.

## B. Let selected people view your current expenses

This gives them access to your transaction data, rather than a separate tracker. Filters do not restrict which records they are allowed to see.

1. In your spreadsheet, use **Share** to invite only the intended Google accounts as **Viewer**, keeping general access **Restricted**. Viewers can see the spreadsheet’s contents. [Google’s sharing instructions](https://support.google.com/drive/answer/2494822)
2. In your dashboard’s Apps Script project, create a **New deployment → Web app**, keeping your personal deployment separate.
3. Set **Execute as: User accessing the web app**. Choose **Anyone with a Google account** for access if available, or the appropriate permitted organization audience. Because the app runs as the viewer, their Sheets permissions control access to the data. Avoid an owner-executed, broadly accessible deployment for private expenses. [Execution identities and permissions](https://developers.google.com/apps-script/guides/web)
4. Deploy, then send the **new `/exec` URL** to the invited people. Each person signs in with the account you invited and authorizes the dashboard when prompted.
5. Check it with an invited account before wider sharing. Organization restrictions or Google authorization requirements may need to be resolved first. Then use the phone steps below.

This shared-view setup is a guide; it has not been enabled on your personal deployment.

## Add the dashboard to an iPhone

1. Open the correct `/exec` URL in **Safari**, signed in to the Google account used above.
2. Wait until the expense data loads successfully.
3. Open **Share**; depending on Safari’s layout, it may be under the page menu.
4. Choose **Add to Home Screen**. Enable **Open as Web App** if that option appears.
5. Name it **Expense Trackr**, tap **Add**, and open the new icon. [Apple’s instructions](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/27/ios/27)

After adding an expense through the Shortcut, tap **Refresh data** inside the dashboard. Initial loading and refresh need an internet connection.

## If it does not work

- **Access denied:** check the signed-in Google account, deployment audience, and—in setup B—the spreadsheet invitation.
- **Cannot load expenses:** check `SPREADSHEET_ID`, the `Transactions` tab, Sheets API service, and authorization. With multiple Google accounts, use the intended account consistently.
- **Google blocks authorization:** resolve the stated account/admin or app-verification requirement; setup A may be simpler for personal use. Do not disable browser security protections.
- **HTML opens but has no data:** open the deployed Apps Script URL. A downloaded HTML file or GitHub Pages does not provide the Apps Script connection.

For later code updates, save the changed files and use **Deploy → Manage deployments → Edit → New version → Deploy** on that person's existing deployment. This keeps their Home Screen URL stable. Independent copies need their own updates. [Google’s deployment guide](https://developers.google.com/apps-script/concepts/deployments)
