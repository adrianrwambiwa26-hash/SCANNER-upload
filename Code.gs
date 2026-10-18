/**
 * Church Follow Up Sheet Card Scanner
 * 1) Set GEMINI_API_KEY in Apps Script > Project Settings > Script Properties.
 * 2) Deploy as a Web app: Execute as Me; access restricted to your church/team if possible.
 * 3) Add "Service" to column M (first row) in the target sheet.
 */
const SPREADSHEET_ID = "1kVxecOID9bUXfhtyh4FlQu84A96PxY37idxgiHJKIuk";
const SHEET_GID = 329798123;
const HEADERS = [
  "Date", "Card", "Name", "Date of Birth DD/MM/CCYY", "Gender", "Area",
  "Email", "Telephone Number", "FU1: Date", "FU1: Details of follow-up",
  "FU1: Method of follow-up", "FU1: Who contacted?", "Service"
];

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.action === "ocr") {
      const fields = readCardWithGemini_(body.imageBase64, body.mimeType);
      return json_({ok:true, fields:fields});
    }
    if (body.action === "submit") {
      const result = appendRecord_(body);
      return json_({ok:true, row:result.row});
    }
    return json_({ok:false,error:"Unknown action."});
  } catch (err) {
    return json_({ok:false,error:String(err && err.message || err)});
  }
}

function doGet() {
  return json_({ok:true,message:"Follow Up Sheet endpoint is running."});
}

function readCardWithGemini_(base64, mimeType) {
  if (!base64) throw new Error("No card image received.");
  const key = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!key) throw new Error("Missing GEMINI_API_KEY in Apps Script Script Properties.");
  const prompt = [
    "Read this church visitor / connection information card. Return ONLY valid JSON, no markdown.",
    "Use this schema: {\"date\":\"\",\"card\":\"\",\"name\":\"\",\"dob\":\"\",\"gender\":\"\",\"area\":\"\",\"email\":\"\",\"phone\":\"\",\"followUpDate\":\"\",\"followUpDetails\":\"\",\"followUpMethod\":\"\",\"contactedBy\":\"\"}.",
    "Do not guess unclear handwriting. Use an empty string for unreadable or absent fields.",
    "Keep telephone numbers as strings, preserving leading zeroes. Keep dates as written where possible.",
    "The name field corresponds to the full name column. Do not infer follow-up information not visible on the card."
  ].join(" ");
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(key);
  const payload = {
    contents: [{parts:[
      {text:prompt},
      {inline_data:{mime_type:mimeType || "image/jpeg", data:base64}}
    ]}],
    generationConfig:{responseMimeType:"application/json",temperature:0.1}
  };
  const response = UrlFetchApp.fetch(url,{
    method:"post",contentType:"application/json",payload:JSON.stringify(payload),
    muteHttpExceptions:true
  });
  const code=response.getResponseCode(), raw=response.getContentText();
  if(code<200||code>=300) throw new Error("AI reading service returned HTTP "+code+": "+raw.slice(0,400));
  const outer=JSON.parse(raw);
  const textOut=outer.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("");
  if(!textOut) throw new Error("The AI returned no readable text.");
  return JSON.parse(textOut);
}

function appendRecord_(d) {
  if (!d.name || !String(d.name).trim()) throw new Error("Name is required.");
  const allowed = ["9:00 AM","10:45 AM","6:00 PM"];
  if (allowed.indexOf(d.service) === -1) throw new Error("Please choose one of the three approved services.");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheets().find(s => s.getSheetId() === SHEET_GID);
  if (!sheet) throw new Error("Could not find the sheet tab with gid " + SHEET_GID + ". Check the tab ID.");
  // Preserve the existing sheet layout and add Service in column M if needed.
  if (String(sheet.getRange(1,13).getValue()).trim() !== "Service") {
    sheet.getRange(1,13).setValue("Service");
  }
  const dateValue = d.date ? new Date(d.date + "T12:00:00") : new Date();
  const row = [
    dateValue,
    d.card || "",
    d.name || "",
    d.dob || "",
    d.gender || "",
    d.area || "",
    d.email || "",
    String(d.phone || ""),
    d.followUpDate || "",
    d.followUpDetails || "",
    d.followUpMethod || "",
    d.contactedBy || "",
    d.service
  ];
  const target = Math.max(sheet.getLastRow()+1,2);
  sheet.getRange(target,1,1,row.length).setValues([row]);
  sheet.getRange(target,1).setNumberFormat("dd MMM yyyy");
  sheet.getRange(target,8).setNumberFormat("@");
  return {row:target};
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}