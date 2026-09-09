// Set SPREADSHEET_ID in Project Settings > Script properties.
// Guests headers (in this order):
// invitationId,label,greeting,guestId,name,relationship,attending,message,updatedAt
var SCRIPT_VERSION = 'rsvp-9-columns-v2';

function doPost(e) {
  var lock;
  var stage = 'request';
  try {
    if (!e || !e.postData || !e.postData.contents) throw setupError_('No request body. Run checkSetup in the editor instead of doPost.');
    var input;
    try { input = JSON.parse(e.postData.contents); }
    catch (_) { throw setupError_('Request body must be valid JSON.'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw setupError_('Request body must be a JSON object.');
    stage = 'lock';
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    stage = 'spreadsheet';
    var spreadsheetId = (PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '').trim();
    if (!spreadsheetId) throw setupError_('Missing SPREADSHEET_ID in Apps Script Project Settings > Script properties.');
    // Accept either the spreadsheet ID or its copied URL.
    var urlId = spreadsheetId.match(/\/spreadsheets\/d\/([^/]+)/);
    if (urlId) spreadsheetId = urlId[1];
    var spreadsheet;
    try { spreadsheet = SpreadsheetApp.openById(spreadsheetId); }
    catch (error) {
      console.error(error);
      throw setupError_('Cannot open the spreadsheet. Check SPREADSHEET_ID and the deploying account permissions.');
    }
    var sheet = spreadsheet.getSheetByName('Guests');
    if (!sheet) throw setupError_('Missing sheet tab named Guests. Rename the guest list tab to Guests.');
    stage = 'read-sheet';
    var rows = sheet.getDataRange().getDisplayValues();
    var headers = ['invitationId','label','greeting','guestId','name','relationship',
      'attending','message','updatedAt'];
    if (!headers.every(function(h, i) { return (rows[0][i] || '').trim() === h; })) {
      throw setupError_('Guest sheet headers must match the setup guide in cells A1:I1, one header per column.');
    }
    stage = 'build-invitations';
    var invitations = {};
    rows.slice(1).forEach(function(row) {
      if (!row[0]) return;
      var key = '$' + row[0];
      if (!invitations[key]) invitations[key] = {
        id: row[0], label: row[1], greeting: row[2], guests: []
      };
      invitations[key].guests.push({ id: row[3], name: row[4], relationship: row[5] });
    });
    if (input.action === 'search') {
      stage = 'search';
      if (typeof input.name !== 'string' || input.name.length > 150) throw setupError_('Please enter your invitation name.');
      var query = normalize_(input.name);
      if (query.length < 3) throw new Error('Please enter at least 3 letters from your invitation.');
      var tokens = query.split(' ').filter(function(t) { return t !== 'and'; });
      var matches = Object.keys(invitations).map(function(k) { return invitations[k]; })
        .filter(function(inv) {
          var words = normalize_([inv.label].concat(inv.guests.map(function(g) { return g.name; })).join(' ')).split(' ');
          return tokens.length && tokens.every(function(t) {
            return words.some(function(w) { return w.indexOf(t) === 0; });
          });
        }).slice(0, 10);
      return json_({ ok: true, data: matches });
    }
    stage = 'validate-submission';
    if (input.action !== 'submit') throw new Error('Unknown request.');
    var r = input.response;
    var invitation = r && invitations['$' + r.invitationId];
    if (!invitation) throw new Error('Please find your invitation again.');
    if (r.attendance !== 'accepts' && r.attendance !== 'declines') throw new Error('Please choose your attendance.');
    var allowed = invitation.guests.map(function(g) { return g.id; });
    if (!Array.isArray(r.guestIds) || r.guestIds.some(function(id) { return allowed.indexOf(id) < 0; }) ||
        new Set(r.guestIds).size !== r.guestIds.length) throw new Error('Please select only guests on your invitation.');
    if ((r.attendance === 'accepts' && !r.guestIds.length) ||
        (r.attendance === 'declines' && r.guestIds.length)) throw new Error('Please check your guest selection.');
    [['message',1000]].forEach(function(field) {
      if (r[field[0]] !== undefined && (typeof r[field[0]] !== 'string' || r[field[0]].length > field[1])) throw new Error('Please check the length of your notes.');
    });
    stage = 'write-sheet';
    var savedAt = new Date().toISOString();
    rows.slice(1).forEach(function(row, index) {
      if (row[0] !== invitation.id) return;
      sheet.getRange(index + 2, 7, 1, 3).setValues([[
        r.guestIds.indexOf(row[3]) >= 0 ? 'Yes' : 'No',
        literal_(r.message === undefined ? '' : r.message), savedAt
      ]]);
    });
    SpreadsheetApp.flush();
    return json_({ ok: true, data: { id: 'sheets-' + invitation.id, savedAt: savedAt, mode: 'live' } });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, stage: stage, error: error.publicMessage || 'RSVP failed at ' + stage + '. Please ask the couple to check Apps Script Executions.' });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function setupError_(message) {
  var error = new Error(message);
  error.publicMessage = message;
  return error;
}

// Run once from the editor. Existing RSVP answers remain in Guests G:I.
function setupInvitationGroups() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var id = (PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '').trim();
    var match = id.match(/\/spreadsheets\/d\/([^/]+)/);
    var book = SpreadsheetApp.openById(match ? match[1] : id);
    var guests = book.getSheetByName('Guests');
    if (!guests) throw new Error('Create the Guests tab first.');
    var rows = guests.getDataRange().getDisplayValues();
    if (rows[0].slice(0, 6).join(',') !== 'invitationId,label,greeting,guestId,name,relationship') {
      throw new Error('Guests A1:F1 must be invitationId,label,greeting,guestId,name,relationship.');
    }
    var invitations = book.getSheetByName('Invitations');
    // Validate before replacing any existing guest labels.
    var existing = invitations ? invitations.getDataRange().getDisplayValues() : [['invitationId','label','greeting']];
    var groups = invitationGroups_(rows, existing);
    if (!invitations) invitations = book.insertSheet('Invitations');
    if (invitations.getMaxRows() < groups.length + 1) {
      invitations.insertRowsAfter(invitations.getMaxRows(), groups.length + 1 - invitations.getMaxRows());
    }
    invitations.getRange(1, 1, 1, 3).setValues([['invitationId','label','greeting']]);
    if (groups.length) invitations.getRange(2, 1, groups.length, 3).setValues(groups.map(function(row) {
      return row.map(literal_);
    }));
    if (guests.getMaxRows() < 2) guests.insertRowsAfter(1, 1);
    // Array formulas keep labels in sync for existing and newly added guest rows.
    guests.getRange(2, 2, guests.getMaxRows() - 1, 2).clearContent();
    guests.getRange('B2').setFormula('=ARRAYFORMULA(IF(A2:A="","",IFNA(VLOOKUP(A2:A,Invitations!A:C,2,FALSE),"")))');
    guests.getRange('C2').setFormula('=ARRAYFORMULA(IF(A2:A="","",IFNA(VLOOKUP(A2:A,Invitations!A:C,3,FALSE),"")))');
    var rule = SpreadsheetApp.newDataValidation().requireValueInRange(invitations.getRange('A2:A'), true)
      .setAllowInvalid(false).setHelpText('Choose an invitation from the Invitations tab.').build();
    guests.getRange(2, 1, guests.getMaxRows() - 1, 1).setDataValidation(rule);
    SpreadsheetApp.flush();
    console.log('Invitation groups ready. Edit labels and greetings in Invitations; choose the group in Guests column A.');
  } finally {
    lock.releaseLock();
  }
}

function invitationGroups_(guestRows, existingRows) {
  if (existingRows[0].slice(0, 3).join(',') !== 'invitationId,label,greeting') {
    throw new Error('Invitations A1:C1 must be invitationId,label,greeting.');
  }
  var groups = new Map();
  var existingIds = new Set();
  existingRows.slice(1).forEach(function(row) {
    if (!row[0]) return;
    var key = row[0].toLowerCase();
    if (groups.has(key)) throw new Error('Duplicate invitation ID in Invitations. Keep one row per invitation.');
    groups.set(key, row.slice(0, 3));
    existingIds.add(key);
  });
  guestRows.slice(1).forEach(function(row) {
    if (!row[0]) return;
    var key = row[0].toLowerCase();
    var group = groups.get(key);
    if (group && group[0] !== row[0]) throw new Error('Use the same capitalization for each invitation ID.');
    if (!group) groups.set(key, row.slice(0, 3));
    else if (!existingIds.has(key) && (group[1] !== row[1] || group[2] !== row[2])) {
      throw new Error('Guests in the same invitation have different labels or greetings. Make them consistent before setup.');
    }
  });
  return Array.from(groups.values());
}

// Run from the Apps Script editor to diagnose setup without changing any cells.
function checkSetup() {
  console.log(doPost({ postData: { contents: JSON.stringify({ action: 'search', name: 'zzdiagnosticzz' }) } }).getContent());
}

function normalize_(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function literal_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function json_(value) {
  value.version = SCRIPT_VERSION;
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
