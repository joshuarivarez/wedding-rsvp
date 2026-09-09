# Google Sheets RSVP setup

## Invitation groups

Paste the updated `Code.gs` into Apps Script, save, and run **setupInvitationGroups** once from the editor. It creates and fills an `Invitations` tab from your existing guests, then replaces Guests B:C with automatic lookup formulas and adds an invitation dropdown in Guests A. Existing guest identities and RSVP answers in D:I stay in place. If an Invitations tab already exists, its labels and greetings take priority. Conflicting existing household labels must be resolved before the first migration.

The new tab has one row per invitation:

| invitationId | label | greeting |
| --- | --- | --- |
| demo-dela-cruz | Juan & Maria Dela Cruz | Juan & Maria |
| santos-family | The Santos Family | the Santos family |

Add a group here, then choose its ID in **Guests column A** for each member. Edit guest names and relationships in Guests D:F. Labels and greetings update automatically in Guests B:C and appear on the next website lookup. Adding an invitation does not create people: add one Guests row per person. A group without guests will not appear in website search.

Keep IDs unique (including capitalization), stable, and identical across tabs. To move a guest, change their Guests A value. Do not delete an invitation while guests still reference it. Do not type into Guests B:C or sort those formula columns; use filter views for browsing. The dropdown covers current sheet rows; rerun setup after expanding the sheet if new rows lack it. Formula results update automatically without triggers or an Angular rebuild. Setup may be rerun to restore formulas and dropdowns.

This uses [ARRAYFORMULA](https://support.google.com/docs/answer/3093275) and [VLOOKUP](https://support.google.com/docs/answer/3093318). The existing web endpoint continues reading Guests; no new endpoint is needed.

If migrating from the original 12-column sheet, delete columns H:J (`dietary`, `allergies`, `song`). This moves `message` to H and `updatedAt` to I. Replace the Apps Script code and update its deployment to a new version at the same time. The new header range is A1:I1.

The Angular gateway replaces the fictional invitations when `SHEETS_WEB_APP_URL` is configured. Searches read the Sheet on demand; submissions update every guest in the selected invitation to Yes or No. The message is optional and may be blank or omitted. Existing form steps remain the same. Previous answers are not prefilled.

1. Create a private spreadsheet with a tab named `Guests`. Paste these rows into cell A1 (tab separated):

```text
invitationId	label	greeting	guestId	name	relationship	attending	message	updatedAt
demo-dela-cruz	Juan & Maria Dela Cruz	Juan & Maria	demo-juan-dela-cruz	Juan Dela Cruz	Primary guest
demo-dela-cruz	Juan & Maria Dela Cruz	Juan & Maria	demo-maria-dela-cruz	Maria Dela Cruz	Spouse
```

2. Use one row per guest, unique guest IDs, and the same invitation ID, label, and greeting for guests in a household. Leave attendance blank until they reply. Preserve header order; do not use formulas in the response columns G:I.
3. Open **Extensions > Apps Script**, paste `Code.gs`, and save.
4. In **Project Settings > Script properties**, add `SPREADSHEET_ID`: the ID between `/d/` and `/edit` in the spreadsheet URL.
5. Choose **Deploy > New deployment > Web app**. Execute as **Me**, allow access to **Anyone**, and authorize spreadsheet access. If your Workspace account disallows anonymous web apps, this configuration cannot serve signed-out guests.
6. Copy the deployment URL ending in `/exec` into `src/rsvp/sheets.config.ts`, then rebuild/redeploy Angular. This URL is public configuration, not a secret. Do not publish the spreadsheet or put Google credentials in Angular.
7. Test from the website while signed out: search Juan, select the household, submit only Maria, and verify Juan = No / Maria = Yes in the Sheet. Edit to decline and verify both = No. Verify notes and timestamps. Refresh and search again to verify lookup still works.

The script preserves the existing public name search. Anyone who can find an invitation can submit for it; IDs are not authentication. Results expose matching guest names and relationships (up to 10 households), never saved notes. For invitation-only access, add per-invitation secret tokens and validate them before lookup and submission.

Requests send JSON as `text/plain` to avoid an OPTIONS preflight. Fetch follows Google's Content Service redirect and reads the JSON acknowledgment. Never change this to `no-cors`: an opaque response cannot confirm a save. Test against the actual deployment: Google authorization redirects, account policy, or cross-origin restrictions can prevent reading a response. The UI reports failure rather than claiming confirmation in that case; a write may already have succeeded, so check the Sheet before retrying. Repeated submissions replace the invitation's answers. Multi-row writes are not transactional; retrying the same selection repairs a partial write.

After script edits, update the deployment to a new version. Leave the Angular URL empty to use the fictional local-storage preview.

References: [Web app deployment](https://developers.google.com/apps-script/guides/web), [JSON Content Service and redirects](https://developers.google.com/apps-script/guides/content).
