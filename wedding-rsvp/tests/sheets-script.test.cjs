const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture(options = {}) {
  const rows = [
    ['invitationId','label','greeting','guestId','name','relationship','attending','message','updatedAt'],
    ['house','Juan & Maria','Juan & Maria','juan','Juan','Primary guest',''],
    ['house','Juan & Maria','Juan & Maria','maria','Maria','Spouse',''],
    ['other','Sofia','Sofia','sofia','Sofia','Primary guest',''],
  ];
  const sheet = {
    getDataRange: () => ({ getDisplayValues: () => rows.map(r => [...r]) }),
    getRange: (row, column) => ({ setValues: values => values[0].forEach((v, i) => { rows[row - 1][column - 1 + i] = v; }) }),
  };
  const context = vm.createContext({
    console: { error() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => options.missingId ? null : 'sheet' }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => options.missingTab ? null : sheet }), flush() {} },
    LockService: { getScriptLock: () => ({ waitLock() {}, hasLock: () => true, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => text }) },
  });
  vm.runInContext(fs.readFileSync('google-apps-script/Code.gs', 'utf8'), context);
  return { rows, groups: existing => context.invitationGroups_(rows, existing), request: body => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(body) } })) };
}

test('group migration deduplicates households and preserves existing invitation edits', () => {
  const f = fixture();
  const header = ['invitationId', 'label', 'greeting'];
  assert.equal(f.groups([header]).length, 2);
  const groups = f.groups([header, ['house', 'New household label', 'Hello family']]);
  assert.equal(groups[0][1], 'New household label');
  assert.equal(groups[0][2], 'Hello family');
  assert.equal(groups.length, 2);
  assert.throws(() => f.groups([header, ['house', 'A', 'A'], ['HOUSE', 'B', 'B']]), /Duplicate/);
  f.rows[2][1] = 'Conflicting label';
  assert.throws(() => f.groups([header]), /different labels/);
});

test('setup errors identify missing ID, missing tab, and malformed headers', () => {
  const lookup = { action: 'search', name: 'Juan' };
  assert.match(fixture({ missingId: true }).request(lookup).error, /Missing SPREADSHEET_ID/);
  assert.match(fixture({ missingTab: true }).request(lookup).error, /Missing sheet tab/);
  const f = fixture();
  f.rows[0][0] = 'wrong';
  assert.match(f.request(lookup).error, /A1:I1/);
});

test('search groups household guests and excludes saved notes', () => {
  const f = fixture();
  f.rows[1][7] = 'private note';
  const result = f.request({ action: 'search', name: 'Maria' });
  assert.equal(result.ok, true);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].guests.length, 2);
  assert.equal(JSON.stringify(result).includes('private note'), false);
});

test('message may be omitted or empty but must respect type and length', () => {
  const f = fixture();
  const response = { invitationId: 'house', attendance: 'accepts', guestIds: ['juan'] };
  for (const extra of [{}, { message: '' }]) {
    assert.equal(f.request({ action: 'submit', response: { ...response, ...extra } }).ok, true);
    assert.equal(f.rows[1][7], '');
    assert.match(f.rows[1][8], /^\d{4}-/);
  }
  for (const message of [null, 123, 'a'.repeat(1001)]) {
    assert.equal(f.request({ action: 'submit', response: { ...response, message } }).ok, false);
  }
});

test('updates checked and unchecked guests, supports decline, rejects foreign guests', () => {
  const f = fixture();
  const response = { invitationId: 'house', attendance: 'accepts', guestIds: ['maria'], message: '=1+1' };
  assert.equal(f.request({ action: 'submit', response }).ok, true);
  assert.equal(f.rows[1][6], 'No');
  assert.equal(f.rows[2][6], 'Yes');
  assert.equal(f.rows[2][7], "'=1+1");
  assert.equal(f.rows[3][6], '');
  assert.equal(f.request({ action: 'submit', response: { ...response, guestIds: ['sofia'] } }).ok, false);
  assert.equal(f.rows[2][6], 'Yes');
  assert.equal(f.request({ action: 'submit', response: { ...response, attendance: 'declines', guestIds: [] } }).ok, true);
  assert.equal(f.rows[2][6], 'No');
});
