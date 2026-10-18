# Follow Up Sheet Card Scanner setup

## Included
- `index.html`: website for selecting a service, uploading a card photo, reviewing extracted fields, and submitting.
- `Code.gs`: Google Apps Script backend that calls Gemini for OCR and appends records to the existing spreadsheet.

## Important sheet detail
The script targets spreadsheet ID `1kVxecOID9bUXfhtyh4FlQu84A96PxY37idxgiHJKIuk` and tab gid `329798123` from the supplied link. It uses columns A-L shown in the screenshot and column M for `Service`. The script sets M1 to `Service` if that header is missing.

## Setup
1. Open the target Google Sheet.
2. Open **Extensions → Apps Script**.
3. Replace the starter code in `Code.gs` with the included `Code.gs` and save.
4. In Apps Script, open **Project Settings → Script Properties → Add script property**:
   - Property: `GEMINI_API_KEY`
   - Value: your Gemini API key.
   Keep this key in Script Properties, never in the HTML file. Google AI usage may be subject to quotas or charges.
5. In Apps Script, choose **Deploy → New deployment → Web app**.
6. Set **Execute as** to **Me**. For access, choose the most restrictive option that works for your team. If only Google-account users in your organization should access it, select that option where available. Avoid public access if your church's data policy does not permit it.
7. Authorize the script when prompted. Copy the deployed web app URL ending in `/exec`.
8. Open `index.html` in a text editor and replace `PASTE_YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE` with that URL.
9. Host `index.html` on an HTTPS host. If you open the file locally, browser cross-origin restrictions may prevent requests to Apps Script. A static HTTPS host is recommended.
10. Test using a fake/test card first. Confirm that a new row appears in the intended tab and service is written to column M.

## Notes / limitations
- The OCR uses the Gemini `gemini-2.5-flash` model endpoint. If that model is unavailable to your API key, update the model name in `Code.gs` to a supported vision model.
- OCR is not guaranteed to read handwriting perfectly. Review and correct every field before submitting.
- The image is sent to the Gemini API for processing. Follow your church's privacy policy and obtain appropriate permission before processing personal data.
- Google Apps Script web apps and browser CORS behavior can vary by deployment/account settings. If the browser cannot read the response, host the frontend and use a deployment/authentication pattern supported by your account, or we can adapt it to a Google Apps Script HTML-service interface.
- For the first version, this writes a new row with the fields available in the screenshot. It does not automatically decide card type or invent follow-up details.
